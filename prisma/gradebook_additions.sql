DO $$
BEGIN
  CREATE TYPE "weekly_attendance_status" AS ENUM ('Present', 'Absent', 'Excused', 'Late');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "enrollment_status" AS ENUM ('active', 'withdrawn', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "assessment_category" AS ENUM ('quiz', 'midterm', 'coursework', 'project', 'final_exam');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "course_result_status" AS ENUM ('in_progress', 'passed', 'failed', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "group_memberships"
  ADD COLUMN IF NOT EXISTS "status" "enrollment_status" NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "withdrawn_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "withdrawal_reason" TEXT;

CREATE INDEX IF NOT EXISTS "group_memberships_group_id_idx"
  ON "group_memberships"("group_id");

CREATE INDEX IF NOT EXISTS "group_memberships_student_id_idx"
  ON "group_memberships"("student_id");

CREATE TABLE IF NOT EXISTS "course_week_attendance" (
  "attendance_week_id" SERIAL PRIMARY KEY,
  "assignment_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "academic_week" INTEGER NOT NULL,
  "status" "weekly_attendance_status" NOT NULL DEFAULT 'Present',
  "notes" TEXT,
  "recorded_by_user_id" INTEGER,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "course_week_attendance_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "lecturer_course_assignments"("assignment_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "course_week_attendance_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("student_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "course_week_attendance_recorded_by_user_id_fkey"
    FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("user_id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_week_attendance_assignment_id_student_id_academic_week_key"
  ON "course_week_attendance"("assignment_id", "student_id", "academic_week");

CREATE INDEX IF NOT EXISTS "course_week_attendance_assignment_id_idx"
  ON "course_week_attendance"("assignment_id");

CREATE INDEX IF NOT EXISTS "course_week_attendance_student_id_idx"
  ON "course_week_attendance"("student_id");

CREATE TABLE IF NOT EXISTS "course_assessment_items" (
  "assessment_item_id" SERIAL PRIMARY KEY,
  "assignment_id" INTEGER NOT NULL,
  "academic_week" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "category" "assessment_category" NOT NULL,
  "max_marks" DOUBLE PRECISION NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "course_assessment_items_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "lecturer_course_assignments"("assignment_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_assessment_items_assignment_id_academic_week_title_key"
  ON "course_assessment_items"("assignment_id", "academic_week", "title");

CREATE INDEX IF NOT EXISTS "course_assessment_items_assignment_id_idx"
  ON "course_assessment_items"("assignment_id");

CREATE TABLE IF NOT EXISTS "student_assessment_scores" (
  "score_id" SERIAL PRIMARY KEY,
  "assessment_item_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "marks" DOUBLE PRECISION,
  "feedback" TEXT,
  "graded_by_user_id" INTEGER,
  "graded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "student_assessment_scores_assessment_item_id_fkey"
    FOREIGN KEY ("assessment_item_id") REFERENCES "course_assessment_items"("assessment_item_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_assessment_scores_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("student_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_assessment_scores_graded_by_user_id_fkey"
    FOREIGN KEY ("graded_by_user_id") REFERENCES "users"("user_id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_assessment_scores_assessment_item_id_student_id_key"
  ON "student_assessment_scores"("assessment_item_id", "student_id");

CREATE INDEX IF NOT EXISTS "student_assessment_scores_student_id_idx"
  ON "student_assessment_scores"("student_id");

CREATE TABLE IF NOT EXISTS "student_course_results" (
  "result_id" SERIAL PRIMARY KEY,
  "assignment_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "absence_count" INTEGER NOT NULL DEFAULT 0,
  "coursework_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "final_exam_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "grade" TEXT NOT NULL DEFAULT 'IP',
  "status" "course_result_status" NOT NULL DEFAULT 'in_progress',
  "calculated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "student_course_results_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "lecturer_course_assignments"("assignment_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_course_results_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("student_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_course_results_assignment_id_student_id_key"
  ON "student_course_results"("assignment_id", "student_id");

CREATE INDEX IF NOT EXISTS "student_course_results_student_id_idx"
  ON "student_course_results"("student_id");

CREATE TABLE IF NOT EXISTS "grade_scale_rules" (
  "grade_scale_rule_id" SERIAL PRIMARY KEY,
  "grade" TEXT NOT NULL,
  "min_score" DOUBLE PRECISION NOT NULL,
  "max_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "is_passing" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "grade_scale_rules_grade_key"
  ON "grade_scale_rules"("grade");
