from datetime import datetime
from contextlib import asynccontextmanager
import base64
import binascii
import os
import logging
import time
from typing import Any, Dict, List, Literal, Optional
import uuid

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from .attendance_service import AttendanceServiceError, get_attendance
from .attendance_tracker import tracker
from .auth import (
    authenticate,
    change_password_authenticated,
    create_account,
    get_current_user,
    require_roles,
    revoke_token,
    request_password_change,
    verify_and_change_password,
)
from .database import close_db, execute_query, get_connection, init_db
from .face_registry import KNOWN_STUDENTS
from .storage import append_record, append_record_csv, get_lecture_session_start, upsert_lecture_session_start, sync_all_csvs

try:
    from .llm_summarizer import generate_lecture_summary, summarize_context_text
    _summarizer_available = True
except Exception:
    generate_lecture_summary = None
    summarize_context_text = None
    _summarizer_available = False

try:
    from .face_recognition_engine import _decode_image_bgr, opencv_face_boxes_from_bgr, recognize_faces
    from .emotion_engine import analyze_emotion, analyze_emotion_crop
except Exception:
    _decode_image_bgr = None
    opencv_face_boxes_from_bgr = None
    recognize_faces = None
    analyze_emotion = None
    analyze_emotion_crop = None


logger = logging.getLogger(__name__)


def _cors_config():
    raw = os.getenv("EDUPULSE_CORS_ORIGINS", "").strip()
    if not raw:
        # Local dev: allow localhost/127.0.0.1 on any port (Shiny port varies).
        # Use allow_origins=["*"] for development to avoid preflight issues
        return {
            "allow_origins": ["http://localhost:3909", "http://127.0.0.1:3909", "http://localhost:3838", "http://127.0.0.1:3838"],
            "allow_origin_regex": r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
        }
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return {"allow_origins": origins, "allow_origin_regex": None}


def _configure_logging():
    level_name = os.getenv("EDUPULSE_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    else:
        root.setLevel(level)


class KnownStudent(BaseModel):
    student_id: str
    student_name: str
    image_count: int
    folder: str


class KnownStudentsResponse(BaseModel):
    students: List[KnownStudent]
    count: int


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["student", "lecturer", "admin"]
    institution_id: str = Field(..., min_length=2)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    email: str
    role: str
    institution_id: str
    is_active: bool
    name: str
    user_code: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserPublic


class LogoutResponse(BaseModel):
    success: bool
    message: str


class PasswordChangeRequest(BaseModel):
    email: EmailStr


class PasswordChangeResponse(BaseModel):
    message: str
    email: str


class PasswordResetRequest(BaseModel):
    email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class PasswordResetResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class AnalyzeRequest(BaseModel):
    image: str
    student_id: Optional[int] = None
    lecture_id: Optional[int] = None


class AnalyzeResponse(BaseModel):
    emotion: Optional[str] = None
    confidence: float = 0.0
    engagement_score: float = 0.0
    focus_score: float = 0.0
    face_detected: bool = False
    raw_emotions: Optional[dict] = None
    processing_time_ms: float = 0.0


class RecognizeRequest(BaseModel):
    image: str


class RecognizedFace(BaseModel):
    student_code: Optional[str] = None
    confidence: float = 0.0
    face_box: List[int]


class RecognizeResponse(BaseModel):
    faces: List[RecognizedFace]
    total_faces_detected: int
    processing_time_ms: float = 0.0


class CombinedAnalyzeRequest(BaseModel):
    image: str
    lecture_id: Optional[int] = None


class CombinedFaceResult(BaseModel):
    student_code: Optional[str] = None
    recognition_confidence: float = 0.0
    emotion: str
    emotion_confidence: float
    engagement_score: float
    focus_score: float
    face_box: List[int]


class CombinedAnalyzeResponse(BaseModel):
    faces: List[CombinedFaceResult]
    total_faces_detected: int
    recognized_count: int
    processing_time_ms: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _configure_logging()
        if os.getenv("SKIP_DB_INIT", "false").lower() not in {"1", "true", "yes"}:
            init_db()
            # Sync all DB tables to CSV files on startup
            try:
                sync_all_csvs()
                logger.info("CSV files synced from database on startup")
            except Exception as exc:
                logger.warning("CSV sync on startup skipped: %s", exc)
        if analyze_emotion is not None:
            try:
                from .emotion_engine import warmup_emotion_model
                warmup_emotion_model()
            except Exception as exc:
                logger.warning("Emotion model warmup skipped: %s", exc)
        yield
    finally:
        close_db()


app = FastAPI(
    title="EduPulse AI Backend",
    description="FastAPI backend for classroom emotion detection, attendance tracking, and analytics.",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # Browsers reject allow_origins=["*"] when allow_credentials=True.
    # Default: allow localhost/127.0.0.1 on any port.
    # Override: set EDUPULSE_CORS_ORIGINS="http://localhost:3838,http://127.0.0.1:3838"
    **_cors_config(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health():
    if os.getenv("SKIP_DB_INIT", "false").lower() in {"1", "true", "yes"}:
        return {"status": "ok", "db": "skipped"}
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"status": "ok", "db": "ok"}
    except Exception as exc:
        # Health should reflect DB availability for real deployments.
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc


@app.post("/auth/signup", response_model=UserPublic, status_code=201, tags=["auth"])
def signup(payload: SignupRequest):
    return create_account(
        email=payload.email,
        password=payload.password,
        role=payload.role,
        institution_id=payload.institution_id,
        full_name=payload.full_name,
    )


@app.post("/auth/login", response_model=AuthResponse, tags=["auth"])
def login(payload: LoginRequest, request: Request):
    return authenticate(
        email=payload.email,
        password=payload.password,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@app.post("/auth/logout", response_model=LogoutResponse, tags=["auth"])
def logout(current_user: Dict = Depends(get_current_user)):
    revoke_token(current_user["token"])
    return {"success": True, "message": "Logged out"}


@app.post("/auth/request-password-change", response_model=PasswordChangeResponse, tags=["auth"])
def request_password_change_endpoint(payload: PasswordChangeRequest):
    return request_password_change(payload.email)


@app.post("/auth/verify-and-change-password", response_model=PasswordResetResponse, tags=["auth"])
def verify_and_change_password_endpoint(payload: PasswordResetRequest):
    return verify_and_change_password(
        email=payload.email,
        verification_code=payload.verification_code,
        new_password=payload.new_password,
    )


@app.post("/auth/change-password", response_model=PasswordResetResponse, tags=["auth"])
def change_password_endpoint(payload: ChangePasswordRequest, current_user: Dict = Depends(get_current_user)):
    return change_password_authenticated(
        user_id=current_user["id"],
        old_password=payload.old_password,
        new_password=payload.new_password,
    )


@app.get("/auth/me", response_model=UserPublic, tags=["auth"])
def me(current_user: Dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "institution_id": current_user["institution_id"],
        "is_active": current_user["is_active"],
        "name": current_user["name"],
        "user_code": current_user["user_code"],
    }


@app.get("/known-students", response_model=KnownStudentsResponse, tags=["faces"])
def get_known_students(current_user: Dict = Depends(get_current_user)):
    return {"students": KNOWN_STUDENTS, "count": len(KNOWN_STUDENTS)}


def _require_ml_engines():
    if recognize_faces is None or analyze_emotion is None:
        raise HTTPException(
            status_code=503,
            detail="Recognition engines are unavailable. Install backend dependencies first.",
        )


def _decode_compat_image(image: str) -> bytes:
    if not image:
        raise HTTPException(status_code=400, detail="Missing image")

    raw_image = image.strip()
    if "," in raw_image and raw_image.lower().startswith("data:"):
        raw_image = raw_image.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(raw_image, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")
    return image_bytes


def _box_list(box: Any) -> List[int]:
    if not box:
        return [0, 0, 0, 0]
    try:
        values = [max(0, int(value)) for value in list(box)[:4]]
    except (TypeError, ValueError):
        return [0, 0, 0, 0]
    return values if len(values) == 4 else [0, 0, 0, 0]


def _percent_score(value: Any) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        numeric = 0.0
    if 0.0 <= numeric <= 1.0:
        numeric *= 100.0
    return round(max(0.0, min(100.0, numeric)), 2)


def _detect_face_count(image_bytes: bytes) -> int:
    if _decode_image_bgr is None or opencv_face_boxes_from_bgr is None:
        return 0
    bgr = _decode_image_bgr(image_bytes)
    if bgr is None:
        return 0
    return len(opencv_face_boxes_from_bgr(bgr))


def _analyze_face_emotion(image_bytes: bytes, bgr: Any = None, box: Any = None) -> dict:
    if box is not None and bgr is not None and analyze_emotion_crop is not None:
        x, y, w, h = _box_list(box)
        face_crop = bgr[y : y + h, x : x + w]
        if getattr(face_crop, "size", 0) > 0:
            return analyze_emotion_crop(face_crop)
    return analyze_emotion(image_bytes)


def _compat_emotion_payload(emotion_data: dict, elapsed_ms: float, face_detected: bool = True) -> dict:
    return {
        "emotion": emotion_data.get("emotion"),
        "confidence": float(emotion_data.get("confidence", 0.0) or 0.0),
        "engagement_score": _percent_score(emotion_data.get("engagement_score", 0.0)),
        "focus_score": _percent_score(emotion_data.get("focus_score", 0.0)),
        "face_detected": face_detected,
        "raw_emotions": emotion_data.get("raw_emotions"),
        "processing_time_ms": round(elapsed_ms, 2),
    }


def _compat_recognized_faces(recognition: dict) -> List[dict]:
    faces = [
        {
            "student_code": face.get("student_id"),
            "confidence": float(face.get("confidence", 0.0) or 0.0),
            "face_box": _box_list(face.get("box")),
        }
        for face in recognition.get("recognized", [])
    ]

    total_faces = int(recognition.get("total_faces", len(faces)) or 0)
    unknown_count = int(recognition.get("unknown_count", max(total_faces - len(faces), 0)) or 0)
    unknown_count = max(unknown_count, total_faces - len(faces))
    for _ in range(max(unknown_count, 0)):
        faces.append({"student_code": None, "confidence": 0.0, "face_box": [0, 0, 0, 0]})

    return faces


@app.post("/analyze", response_model=AnalyzeResponse, tags=["compat"])
def analyze_compat(payload: AnalyzeRequest):
    _require_ml_engines()
    start = time.time()
    image_bytes = _decode_compat_image(payload.image)
    face_count = _detect_face_count(image_bytes)
    if face_count == 0:
        return {
            "emotion": None,
            "confidence": 0.0,
            "engagement_score": 0.0,
            "focus_score": 0.0,
            "face_detected": False,
            "raw_emotions": None,
            "processing_time_ms": round((time.time() - start) * 1000, 2),
        }

    emotion_data = analyze_emotion(image_bytes)
    return _compat_emotion_payload(emotion_data, (time.time() - start) * 1000)


@app.post("/recognize-faces", response_model=RecognizeResponse, tags=["compat"])
def recognize_faces_compat(payload: RecognizeRequest):
    _require_ml_engines()
    start = time.time()
    image_bytes = _decode_compat_image(payload.image)
    recognition = recognize_faces(image_bytes)
    faces = _compat_recognized_faces(recognition)
    return {
        "faces": faces,
        "total_faces_detected": int(recognition.get("total_faces", len(faces)) or 0),
        "processing_time_ms": round((time.time() - start) * 1000, 2),
    }


@app.post("/analyze-combined", response_model=CombinedAnalyzeResponse, tags=["compat"])
def analyze_combined_compat(payload: CombinedAnalyzeRequest):
    _require_ml_engines()
    start = time.time()
    image_bytes = _decode_compat_image(payload.image)
    recognition = recognize_faces(image_bytes)
    bgr = recognition.get("image_bgr")
    faces = []

    for face in recognition.get("recognized", []):
        emotion_data = _analyze_face_emotion(image_bytes, bgr, face.get("box"))
        faces.append({
            "student_code": face.get("student_id"),
            "recognition_confidence": float(face.get("confidence", 0.0) or 0.0),
            "emotion": emotion_data.get("emotion", "Neutral"),
            "emotion_confidence": float(emotion_data.get("confidence", 0.0) or 0.0),
            "engagement_score": _percent_score(emotion_data.get("engagement_score", 0.0)),
            "focus_score": _percent_score(emotion_data.get("focus_score", 0.0)),
            "face_box": _box_list(face.get("box")),
        })

    total_faces = int(recognition.get("total_faces", len(faces)) or 0)
    unknown_count = int(recognition.get("unknown_count", max(total_faces - len(faces), 0)) or 0)
    unknown_count = max(unknown_count, total_faces - len(faces))
    if unknown_count > 0:
        emotion_data = analyze_emotion(image_bytes)
        for _ in range(unknown_count):
            faces.append({
                "student_code": None,
                "recognition_confidence": 0.0,
                "emotion": emotion_data.get("emotion", "Neutral"),
                "emotion_confidence": float(emotion_data.get("confidence", 0.0) or 0.0),
                "engagement_score": _percent_score(emotion_data.get("engagement_score", 0.0)),
                "focus_score": _percent_score(emotion_data.get("focus_score", 0.0)),
                "face_box": [0, 0, 0, 0],
            })

    return {
        "faces": faces,
        "total_faces_detected": total_faces,
        "recognized_count": len(recognition.get("recognized", [])),
        "processing_time_ms": round((time.time() - start) * 1000, 2),
    }


@app.post("/recognize-face", tags=["faces"])
async def recognize_face_endpoint(
    file: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user),
):
    _require_ml_engines()
    image_bytes = await file.read()
    result = recognize_faces(image_bytes)
    if result.get("recognized"):
        first = result["recognized"][0]
        return {
            "student_id": first["student_id"],
            "student_name": first["student_name"],
            "confidence": first["confidence"],
            "recognized": True,
        }
    return {"student_id": "Unknown", "student_name": "", "recognized": False}


@app.post("/analyze-attendance-frame", tags=["analytics"])
async def analyze_frame(
    file: UploadFile = File(...),
    lecture_id: str = Form(...),
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    _require_ml_engines()
    try:
        if not get_lecture_session_start(lecture_id):
            upsert_lecture_session_start(lecture_id)
        tracker.start_session(lecture_id)
    except Exception:
        pass

    image_bytes = await file.read()
    recognition = recognize_faces(image_bytes)
    bgr = recognition.get("image_bgr")

    if not recognition.get("recognized_any"):
        return {
            "message": "No faces recognized",
            "recognized": False,
            "session_active": True,
            "attendance_status": "Absent",
            "is_present": False,
            "left_room": False,
        }

    time_minute = tracker.get_time_minute(lecture_id)
    now = datetime.now()
    records = []

    for face_info in recognition["recognized"]:
        student_id = face_info["student_id"]
        student_name = face_info["student_name"]
        box = face_info.get("box")

        # Per-face emotion analysis
        if box is not None and bgr is not None:
            x, y, w, h = box
            face_crop = bgr[y : y + h, x : x + w]
            if face_crop.size > 0:
                emotion_data = analyze_emotion_crop(face_crop)
            else:
                emotion_data = analyze_emotion(image_bytes)
        else:
            emotion_data = analyze_emotion(image_bytes)

        tracker.update_attendance(lecture_id, student_id)
        attendance_status = tracker.get_attendance_status(lecture_id, student_id)

        record = {
            "record_id": str(uuid.uuid4()),
            "student_id": student_id,
            "student_name": student_name,
            "lecture_id": lecture_id,
            "timestamp": now.isoformat(),
            "time": now.strftime("%H:%M"),
            "time_minute": time_minute,
            "emotion": emotion_data["emotion"],
            "confidence": emotion_data["confidence"],
            "engagement_score": emotion_data["engagement_score"],
            "focus_score": emotion_data["focus_score"],
            "attendance_status": attendance_status,
            "is_present": attendance_status in ["Present", "Returned"],
            "left_room": attendance_status == "Left",
            "absence_duration_minutes": tracker.get_absence_minutes(lecture_id, student_id),
            "recognized": True,
        }

        model_label = f"EduPulse_v1.0-{emotion_data.get('engine', 'unknown')}"

        # Save to PostgreSQL
        db_record_id = append_record({
            "student_id": record["student_id"],
            "lecture_id": record["lecture_id"],
            "recorded_at": now,
            "time_minute": time_minute,
            "emotion": record["emotion"],
            "confidence": record["confidence"],
            "engagement_score": record["engagement_score"],
            "focus_score": record["focus_score"],
            "is_present": record["is_present"],
            "left_room": record["left_room"],
            "absence_duration_minutes": int(record["absence_duration_minutes"] or 0),
            "source_type": "live_camera",
            "model_name": model_label,
        })

        # Save to CSV
        record["source_type"] = "live_camera"
        record["model_name"] = model_label
        append_record_csv(record)

        record["db_record_id"] = db_record_id
        records.append(record)

    # Backward-compatible response: first student at top level + all records array
    first_record = records[0] if records else {}
    return {
        **first_record,
        "records": records,
        "recognized_count": len(records),
        "total_faces": recognition.get("total_faces", len(records)),
        "unknown_count": recognition.get("unknown_count", 0),
    }


@app.post("/sync-csvs", tags=["system"])
def sync_csvs_endpoint(current_user: Dict = Depends(require_roles("admin"))):
    """Manually trigger a full DB→CSV sync for all tables."""
    try:
        sync_all_csvs()
        return {"message": "All CSV files synced from database", "status": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/start-session/{lecture_id}", tags=["sessions"])
def start_session(
    lecture_id: str,
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    upsert_lecture_session_start(lecture_id)
    tracker.start_session(lecture_id)
    return {"message": f"Session started for lecture {lecture_id}", "status": "started"}


@app.post("/stop-session/{lecture_id}", tags=["sessions"])
def stop_session(
    lecture_id: str,
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    # Stop local session timer/caches; DB end tracking can be added later if needed.
    try:
        tracker.stop_session(lecture_id)
    except Exception:
        pass
    return {"message": f"Session stopped for lecture {lecture_id}", "status": "stopped"}


@app.get("/session-status/{lecture_id}", tags=["sessions"])
def get_session_status(
    lecture_id: str,
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    return tracker.get_session_status(lecture_id)


@app.get("/attendance/{lecture_id}", tags=["sessions"])
def attendance_snapshot(
    lecture_id: str,
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    """R Shiny live monitor calls this to refresh roster counts (group + attendance_records)."""
    try:
        return get_attendance(lecture_id)
    except AttendanceServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# LLM Summarization endpoints
# ---------------------------------------------------------------------------

class SummaryResponse(BaseModel):
    lecture_id: str
    summary: str
    insights: List[str]
    metrics: Dict[str, Any]


_INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "edupulse-internal-key")


def _require_summarizer():
    if not _summarizer_available:
        raise HTTPException(
            status_code=503,
            detail="LLM summarizer unavailable. Install transformers and torch first.",
        )


def _verify_internal_key(request: Request):
    key = request.headers.get("X-Internal-Key", "")
    if key != _INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")


@app.post("/summarize/csv/internal", response_model=SummaryResponse, tags=["summarization"])
async def summarize_csv_internal(
    request: Request,
    file: UploadFile = File(...),
    lecture_id: Optional[str] = Form(None),
    max_length: int = Form(150),
    min_length: int = Form(50),
):
    """Internal endpoint — called by Next.js proxy using X-Internal-Key header."""
    _verify_internal_key(request)
    _require_summarizer()
    try:
        contents = await file.read()
        import io as _io
        import pandas as _pd
        df = _pd.read_csv(_io.BytesIO(contents))
        df = df.rename(columns={"emotion": "dominant_emotion", "confidence": "emotion_confidence",
                                  "is_present": "attended"})
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}") from exc

    lid = lecture_id or (file.filename or "unknown").replace(".csv", "")
    try:
        result = generate_lecture_summary(lid, df, max_length=max_length, min_length=min_length)
    except Exception as exc:
        logger.error("LLM summarization error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Summarization failed: {exc}") from exc
    return result


@app.post("/summarize/csv", response_model=SummaryResponse, tags=["summarization"])
async def summarize_csv(
    file: UploadFile = File(...),
    lecture_id: Optional[str] = Form(None),
    max_length: int = Form(150),
    min_length: int = Form(50),
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    """Upload a CSV report file and get an LLM-generated emotion/attendance summary."""
    _require_summarizer()
    try:
        contents = await file.read()
        import io as _io
        import pandas as _pd
        df = _pd.read_csv(_io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}") from exc

    lid = lecture_id or (file.filename or "unknown").replace(".csv", "")
    try:
        result = generate_lecture_summary(lid, df, max_length=max_length, min_length=min_length)
    except Exception as exc:
        logger.error("LLM summarization error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Summarization failed: {exc}") from exc

    return result


@app.get("/summarize/lecture/{lecture_id}", response_model=SummaryResponse, tags=["summarization"])
def summarize_lecture(
    lecture_id: str,
    max_length: int = 150,
    min_length: int = 50,
    current_user: Dict = Depends(require_roles("admin", "lecturer")),
):
    """Fetch emotion records for a lecture from the DB and return an LLM summary."""
    _require_summarizer()
    rows = execute_query(
        """
        SELECT
            s.student_code   AS student_id,
            s.full_name      AS student_name,
            er.emotion       AS dominant_emotion,
            er.confidence    AS emotion_confidence,
            er.engagement_score,
            er.focus_score,
            er.is_present    AS attended,
            er.recorded_at   AS timestamp
        FROM emotion_records er
        JOIN students  s ON s.student_id  = er.student_id
        JOIN lectures  l ON l.lecture_id  = er.lecture_id
        WHERE l.lecture_code = %s
        ORDER BY er.recorded_at
        """,
        (lecture_id,),
    )

    import pandas as _pd
    df = _pd.DataFrame(rows or [])

    try:
        result = generate_lecture_summary(lecture_id, df, max_length=max_length, min_length=min_length)
    except Exception as exc:
        logger.error("LLM summarization error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Summarization failed: {exc}") from exc

    return result
