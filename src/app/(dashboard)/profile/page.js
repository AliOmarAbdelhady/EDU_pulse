"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AtSign,
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  GraduationCap,
  Hash,
  History,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useProfile, useUpdateProfile } from "@/lib/hooks/useProfile";

const NO_DEPARTMENT = "NONE";

const EMPTY_FORM = {
  displayName: "",
  phone: "",
  departmentId: NO_DEPARTMENT,
  title: "",
  specialization: "",
};

const roleBadges = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  lecturer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  student: "bg-primary/15 text-primary",
};

function titleCase(value) {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value, fallback = "N/A") {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value, fallback = "Never") {
  if (!value) return fallback;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleProfile(profile) {
  if (!profile) return null;
  if (profile.user.role === "student") return profile.student;
  if (profile.user.role === "lecturer") return profile.lecturer;
  return profile.admin;
}

function getDepartmentId(profile) {
  if (profile?.student) return profile.student.departmentId;
  if (profile?.lecturer) return profile.lecturer.departmentId;
  return null;
}

function metricCards(profile) {
  const role = profile.user.role;
  const metrics = profile.metrics || {};

  if (role === "student") {
    return [
      {
        label: "Avg Engagement",
        value: `${metrics.averageEngagement || 0}%`,
        icon: Sparkles,
        color: "text-primary",
      },
      {
        label: "Emotion Records",
        value: metrics.emotionRecordCount || 0,
        icon: Activity,
        color: "text-purple-600",
      },
      {
        label: "Attendance",
        value: metrics.attendanceCount || 0,
        icon: BadgeCheck,
        color: "text-emerald-600",
      },
      {
        label: "GPA",
        value:
          profile.student?.gpa !== null && profile.student?.gpa !== undefined
            ? Number(profile.student.gpa).toFixed(2)
            : "0.00",
        icon: GraduationCap,
        color: "text-amber-600",
      },
    ];
  }

  if (role === "lecturer") {
    return [
      {
        label: "Assigned Courses",
        value: metrics.assignedCourseCount || 0,
        icon: BookOpen,
        color: "text-primary",
      },
      {
        label: "Students",
        value: metrics.studentCount || 0,
        icon: Users,
        color: "text-emerald-600",
      },
      {
        label: "Lectures",
        value: metrics.lectureCount || 0,
        icon: ClipboardList,
        color: "text-purple-600",
      },
      {
        label: "Assignments",
        value: metrics.assignmentCount || 0,
        icon: Hash,
        color: "text-amber-600",
      },
    ];
  }

  return [
    {
      label: "Reports",
      value: metrics.reportCount || 0,
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      label: "Audit Logs",
      value: metrics.auditLogCount || 0,
      icon: History,
      color: "text-purple-600",
    },
    {
      label: "Login Sessions",
      value: metrics.loginSessionCount || 0,
      icon: Shield,
      color: "text-emerald-600",
    },
    {
      label: "Active Sessions",
      value: metrics.activeSessionCount || 0,
      icon: Activity,
      color: "text-amber-600",
    },
  ];
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="pt-6">
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={mono ? "font-medium font-mono break-all" : "font-medium break-words"}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

function StatGrid({ profile }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards(profile).map((metric) => (
        <Card key={metric.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <metric.icon className={`h-8 w-8 ${metric.color}`} />
              <div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AccountCard({ profile }) {
  const user = profile.user;
  const roleProfile = getRoleProfile(profile);
  const department = roleProfile?.department;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
        <CardDescription>Identity, access, and profile metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={AtSign} label="Username" value={user.username} />
          <InfoItem icon={Mail} label="Email" value={user.email} />
          <InfoItem icon={Shield} label="Role" value={titleCase(user.role)} />
          <InfoItem
            icon={BadgeCheck}
            label="Status"
            value={user.isActive === false ? "Inactive" : "Active"}
          />
          <InfoItem
            icon={Calendar}
            label="Joined"
            value={formatDate(user.createdAt)}
          />
          <InfoItem
            icon={History}
            label="Last Login"
            value={formatDateTime(user.lastLoginAt)}
          />
          <InfoItem
            icon={RefreshCw}
            label="Updated"
            value={formatDateTime(user.updatedAt, "N/A")}
          />
          {department && (
            <InfoItem
              icon={Building2}
              label="Department"
              value={`${department.code} - ${department.name}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EditCard({
  departments,
  departmentsLoading,
  form,
  isEditing,
  onCancel,
  onChange,
  onDepartmentChange,
  onEdit,
  onSubmit,
  profile,
  saving,
}) {
  const role = profile.user.role;
  const canEditDepartment = role === "student" || role === "lecturer";
  const canEditLecturerFields = role === "lecturer";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Editable Basics</CardTitle>
            <CardDescription>
              Keep contact and academic profile details up to date.
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) => onChange("displayName", event.target.value)}
                disabled={!isEditing || saving}
              />
            </div>

            {canEditDepartment && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => onChange("phone", event.target.value)}
                    disabled={!isEditing || saving}
                    placeholder="N/A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={form.departmentId}
                    onValueChange={onDepartmentChange}
                    disabled={!isEditing || saving || departmentsLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          departmentsLoading ? "Loading departments" : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DEPARTMENT}>No Department</SelectItem>
                      {(departments || []).map((department) => (
                        <SelectItem
                          key={department.departmentId}
                          value={String(department.departmentId)}
                        >
                          {department.departmentName} ({department.departmentCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {canEditLecturerFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(event) => onChange("title", event.target.value)}
                    disabled={!isEditing || saving}
                    placeholder="N/A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={form.specialization}
                    onChange={(event) =>
                      onChange("specialization", event.target.value)
                    }
                    disabled={!isEditing || saving}
                    placeholder="N/A"
                  />
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function StudentDetails({ profile }) {
  const student = profile.student;
  if (!student) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Academic identifiers and enrollment details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem icon={Hash} label="Student ID" value={student.code} mono />
            <InfoItem icon={Phone} label="Phone" value={student.phone} />
            <InfoItem
              icon={GraduationCap}
              label="Degree Level"
              value={student.degreeLevel}
            />
            <InfoItem
              icon={Calendar}
              label="Enrollment Year"
              value={student.enrollmentYear}
            />
            <InfoItem
              icon={Sparkles}
              label="GPA"
              value={
                student.gpa !== null && student.gpa !== undefined
                  ? Number(student.gpa).toFixed(2)
                  : "N/A"
              }
            />
            <InfoItem
              icon={BookOpen}
              label="Completed Credits"
              value={student.completedCreditHours}
            />
            <InfoItem
              icon={BadgeCheck}
              label="Academic Standing"
              value={student.academicStanding}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
          <CardDescription>Current course groups linked to this student.</CardDescription>
        </CardHeader>
        <CardContent>
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No course enrollments found.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        <span className="font-mono text-sm mr-2">
                          {enrollment.course.code}
                        </span>
                        {enrollment.course.name}
                      </TableCell>
                      <TableCell>
                        {enrollment.group.name || enrollment.group.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {enrollment.semester?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(enrollment.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LecturerDetails({ profile }) {
  const lecturer = profile.lecturer;
  if (!lecturer) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lecturer Information</CardTitle>
          <CardDescription>Academic staff identifiers and teaching profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem icon={Hash} label="Staff ID" value={lecturer.code} mono />
            <InfoItem icon={Phone} label="Phone" value={lecturer.phone} />
            <InfoItem icon={GraduationCap} label="Title" value={lecturer.title} />
            <InfoItem
              icon={Sparkles}
              label="Specialization"
              value={lecturer.specialization}
            />
            <InfoItem
              icon={BadgeCheck}
              label="Academic Rank"
              value={lecturer.academicRank}
            />
            <InfoItem
              icon={Building2}
              label="Office"
              value={lecturer.officeLocation}
            />
            <InfoItem
              icon={Calendar}
              label="Office Hours"
              value={lecturer.officeHours}
            />
            <InfoItem
              icon={Calendar}
              label="Hire Date"
              value={formatDate(lecturer.hireDate)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Assignments</CardTitle>
          <CardDescription>Courses, groups, and lecture load.</CardDescription>
        </CardHeader>
        <CardContent>
          {lecturer.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No teaching assignments found.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Lectures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturer.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <span className="font-mono text-sm mr-2">
                          {assignment.course.code}
                        </span>
                        {assignment.course.name}
                      </TableCell>
                      <TableCell>{assignment.group.name || assignment.group.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {assignment.semester?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        {assignment.group.studentCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {assignment.lectureCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDetails({ profile }) {
  const admin = profile.admin;
  if (!admin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Information</CardTitle>
        <CardDescription>Administrative account activity and metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoItem icon={UserRound} label="Admin Name" value={admin.fullName} />
          <InfoItem
            icon={Calendar}
            label="Admin Created"
            value={formatDate(admin.createdAt)}
          />
          <InfoItem
            icon={RefreshCw}
            label="Admin Updated"
            value={formatDateTime(admin.updatedAt, "N/A")}
          />
          <InfoItem icon={Shield} label="Access Level" value="System Admin" />
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Role, email, and active status are read-only from this profile page.
        </p>
      </CardContent>
    </Card>
  );
}

function RoleDetails({ profile }) {
  if (profile.user.role === "student") return <StudentDetails profile={profile} />;
  if (profile.user.role === "lecturer") return <LecturerDetails profile={profile} />;
  return <AdminDetails profile={profile} />;
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const formDefaults = useMemo(() => {
    if (!profile) return null;
    const roleProfile = getRoleProfile(profile);
    const departmentId = getDepartmentId(profile);

    return {
      displayName: profile.user.displayName || "",
      phone: roleProfile?.phone || "",
      departmentId: departmentId ? String(departmentId) : NO_DEPARTMENT,
      title: profile.lecturer?.title || "",
      specialization: profile.lecturer?.specialization || "",
    };
  }, [profile]);

  if (isLoading) {
    return (
      <div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            Failed to load profile: {error?.message || "Unknown error"}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  const user = profile.user;
  const roleProfile = getRoleProfile(profile);
  const form = draft || formDefaults || EMPTY_FORM;

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...(current || form), [field]: value }));
  };

  const handleCancel = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      displayName: form.displayName.trim(),
    };

    if (user.role === "student" || user.role === "lecturer") {
      payload.phone = form.phone.trim() || null;
      payload.departmentId =
        form.departmentId === NO_DEPARTMENT ? null : Number(form.departmentId);
    }

    if (user.role === "lecturer") {
      payload.title = form.title.trim() || null;
      payload.specialization = form.specialization.trim() || null;
    }

    try {
      await updateProfile.mutateAsync(payload);
      setDraft(null);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight break-words">
                  {user.displayName}
                </h1>
                <Badge className={roleBadges[user.role] || ""} variant="secondary">
                  {titleCase(user.role)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Signed-in user profile and role-specific details.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {user.isActive === false ? "Inactive" : "Active"}
            </Badge>
            {roleProfile?.code && (
              <Badge variant="outline" className="font-mono">
                {roleProfile.code}
              </Badge>
            )}
          </div>
        </div>

        <StatGrid profile={profile} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AccountCard profile={profile} />
          <EditCard
            departments={departments}
            departmentsLoading={departmentsLoading}
            form={form}
            isEditing={isEditing}
            onCancel={handleCancel}
            onChange={handleChange}
            onDepartmentChange={(value) => handleChange("departmentId", value)}
            onEdit={() => {
              setDraft(formDefaults || EMPTY_FORM);
              setIsEditing(true);
            }}
            onSubmit={handleSubmit}
            profile={profile}
            saving={updateProfile.isPending}
          />
        </div>

        <RoleDetails profile={profile} />
      </div>
    </div>
  );
}
