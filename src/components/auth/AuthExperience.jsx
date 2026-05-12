"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  Check,
  GraduationCap,
  BookOpen,
  Building2,
  Hash,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Loader2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FloatingLabelInput from "./FloatingLabelInput";
import PasswordChecklist from "./PasswordChecklist";
import AuthButton from "./AuthButton";
import ModeSwitch from "./ModeSwitch";
import SocialAuthDivider from "./SocialAuthDivider";

const panelVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 34 : -34,
    y: 18,
    filter: "blur(12px)",
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
    y: -10,
    filter: "blur(10px)",
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
};

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

const steps = [
  { id: 1, title: "Account", icon: User },
  { id: 2, title: "Role", icon: Shield },
  { id: 3, title: "Details", icon: Building2 },
  { id: 4, title: "Review", icon: Check },
];

const roles = [
  {
    value: "STUDENT",
    label: "Student",
    icon: GraduationCap,
    description:
      "Access your emotion data, engagement scores, and course analytics.",
  },
  {
    value: "LECTURER",
    label: "Lecturer",
    icon: BookOpen,
    description:
      "Monitor classroom engagement, manage lectures, and view analytics.",
  },
  {
    value: "ADMIN",
    label: "Admin",
    icon: Shield,
    description:
      "Full system access — manage users, departments, and system settings.",
  },
];

const departments = [
  { value: "cs", label: "Computer Science" },
  { value: "math", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "eng", label: "Engineering" },
  { value: "bio", label: "Biology" },
  { value: "chem", label: "Chemistry" },
  { value: "bus", label: "Business Administration" },
  { value: "arts", label: "Arts & Humanities" },
];

export default function AuthExperience({ initialMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [direction, setDirection] = useState(0);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(0);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    studentId: "",
    staffId: "",
  });

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const switchMode = (newMode) => {
    setDirection(newMode === "signup" ? 1 : -1);
    setMode(newMode);
  };

  // --- Login handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginIdentifier.trim(),
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        setLoginError("Invalid email, username, or password");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- Signup handlers ---
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!form.name.trim()) return "Name is required";
        if (!form.email.trim() || !form.email.includes("@"))
          return "Valid email is required";
        if (form.password.length < 8)
          return "Password must be at least 8 characters";
        if (form.password !== form.confirmPassword)
          return "Passwords do not match";
        return null;
      case 2:
        if (!form.role) return "Please select a role";
        return null;
      case 3:
        if (!form.department) return "Please select a department";
        if (form.role === "STUDENT" && !form.studentId.trim())
          return "Student ID is required";
        if (form.role === "LECTURER" && !form.staffId.trim())
          return "Staff ID is required";
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setSignupError(err);
      return;
    }
    setSignupError("");
    setStepDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const goPrev = () => {
    setSignupError("");
    setStepDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSignup = async () => {
    setSignupLoading(true);
    setSignupError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.error || "Registration failed");
        return;
      }
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/dashboard");
    } catch {
      setSignupError("Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  // --- Error banner ---
  const ErrorBanner = ({ message }) => {
    if (!message) return null;
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-[22px] p-3 border border-danger/30 bg-danger/10 text-sm text-danger"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    );
  };

  // --- Step indicator ---
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              step.id === currentStep
                ? "bg-primary text-primary-foreground"
                : step.id < currentStep
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step.id < currentStep ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              step.id
            )}
          </div>
          {step.id < steps.length && (
            <div
              className={cn(
                "w-6 sm:w-10 h-0.5 mx-0.5",
                step.id < currentStep ? "bg-primary/50" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  // --- Login panel ---
  const LoginPanel = () => (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="text-center space-y-1 mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="h-3 w-3" />
          Secure Login
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-[0.95]">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your EDU Pulse account
        </p>
      </div>

      <ErrorBanner message={loginError} />

      <FloatingLabelInput
        label="Email or username"
        icon={Mail}
        type="text"
        value={loginIdentifier}
        onChange={(e) => setLoginIdentifier(e.target.value)}
        autoComplete="username"
        required
      />

      <FloatingLabelInput
        label="Password"
        icon={Lock}
        type={showLoginPassword ? "text" : "password"}
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        autoComplete="current-password"
        required
        rightAction={
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted transition-colors"
            aria-label={showLoginPassword ? "Hide password" : "Show password"}
          >
            {showLoginPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border accent-primary"
          />
          <span className="text-muted-foreground">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Forgot password?
        </button>
      </div>

      <AuthButton type="submit" loading={loginLoading} loadingText="Signing in...">
        Sign In
      </AuthButton>

      <SocialAuthDivider />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="text-primary hover:text-primary/80 font-semibold"
        >
          Sign up
        </button>
      </p>
    </form>
  );

  // --- Signup panel ---
  const SignupPanel = () => (
    <div className="space-y-5">
      <div className="text-center space-y-1 mb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary border border-primary/20">
          <UserPlus className="h-3 w-3" />
          Create Account
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-[0.95]">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Join EDU Pulse to start analyzing student engagement
        </p>
      </div>

      <StepIndicator />

      <ErrorBanner message={signupError} />

      <AnimatePresence mode="wait" custom={stepDirection}>
        <motion.div
          key={currentStep}
          custom={stepDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Step 1: Account */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <FloatingLabelInput
                label="Full Name"
                icon={User}
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                autoComplete="name"
                required
              />
              <FloatingLabelInput
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                autoComplete="email"
                required
              />
              <FloatingLabelInput
                label="Password"
                icon={Lock}
                type={showSignupPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                autoComplete="new-password"
                required
                rightAction={
                  <button
                    type="button"
                    onClick={() =>
                      setShowSignupPassword(!showSignupPassword)
                    }
                    className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted transition-colors"
                    aria-label={
                      showSignupPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                }
              />

              {form.password.length > 0 && (
                <PasswordChecklist
                  password={form.password}
                  confirmPassword={form.confirmPassword}
                />
              )}

              <FloatingLabelInput
                label="Confirm Password"
                icon={Lock}
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  updateForm("confirmPassword", e.target.value)
                }
                autoComplete="new-password"
                required
                rightAction={
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted transition-colors"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                }
              />
            </div>
          )}

          {/* Step 2: Role */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                Select your role in the system:
              </p>
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => updateForm("role", role.value)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all duration-200",
                    "border-2",
                    form.role === role.value
                      ? "border-primary bg-primary/10 shadow-[0_8px_30px_-16px_rgba(129,170,217,0.3)]"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        form.role === role.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <role.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {role.label}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Department
                </label>
                <Select
                  value={form.department}
                  onValueChange={(v) => updateForm("department", v)}
                >
                  <SelectTrigger className="h-14 rounded-[21px] border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-950/80">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.role === "STUDENT" && (
                <FloatingLabelInput
                  label="Student ID"
                  icon={Hash}
                  value={form.studentId}
                  onChange={(e) => updateForm("studentId", e.target.value)}
                />
              )}

              {form.role === "LECTURER" && (
                <FloatingLabelInput
                  label="Staff ID"
                  icon={Hash}
                  value={form.staffId}
                  onChange={(e) => updateForm("staffId", e.target.value)}
                />
              )}

              {form.role === "ADMIN" && (
                <div className="flex items-start gap-2 rounded-[22px] p-3 border border-warning/30 bg-warning/10 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Admin accounts are created by system administrators. You can
                    request access after signing up as a lecturer.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-3">
              {[
                { label: "Name", value: form.name },
                { label: "Email", value: form.email },
                {
                  label: "Role",
                  value:
                    roles.find((r) => r.value === form.role)?.label ||
                    form.role,
                },
                {
                  label: "Department",
                  value:
                    departments.find((d) => d.value === form.department)
                      ?.label || form.department,
                },
                ...(form.role === "STUDENT"
                  ? [{ label: "Student ID", value: form.studentId }]
                  : []),
                ...(form.role === "LECTURER"
                  ? [{ label: "Staff ID", value: form.staffId }]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-2">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
        <div>
          {currentStep < 4 ? (
            <AuthButton
              type="button"
              onClick={goNext}
              fullWidth={false}
              className="px-6"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </AuthButton>
          ) : (
            <AuthButton
              type="button"
              onClick={handleSignup}
              loading={signupLoading}
              loadingText="Creating..."
              fullWidth={false}
              className="px-6"
            >
              Create Account
            </AuthButton>
          )}
        </div>
      </div>

      <SocialAuthDivider />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-primary hover:text-primary/80 font-semibold"
        >
          Log in
        </button>
      </p>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full transition-[max-width] duration-300 ease-out",
        mode === "login" ? "max-w-[34rem]" : "max-w-[38rem]"
      )}
    >
      {/* Glassmorphic card */}
      <div
        className={cn(
          "relative overflow-hidden",
          "rounded-[28px] sm:rounded-[32px]",
          "bg-white/82 dark:bg-slate-950/80",
          "backdrop-blur-xl",
          "border border-white/70 dark:border-slate-800/70",
          "shadow-[0_26px_80px_-42px_rgba(15,23,42,0.5)]",
          "p-5 sm:p-8"
        )}
      >
        {/* Ambient glow inside card */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/15 blur-[80px] animate-[ambientGlow_16s_ease-in-out_infinite]"
          style={{
            animation: "ambientGlow 16s ease-in-out infinite",
          }}
        />

        {/* Mode switch */}
        <ModeSwitch mode={mode} onModeChange={switchMode} />

        {/* Panel content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={mode}
            custom={direction}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {mode === "login" ? LoginPanel() : SignupPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
