"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSendStudentNotification } from "@/lib/hooks/useStudents";

const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 2000;

function getStudentName(student) {
  return student?.fullName || student?.user?.username || "Student";
}

function getStudentEmail(student) {
  return student?.user?.email || student?.email || "";
}

function buildMailto(email, subject, message) {
  const params = new URLSearchParams();
  if (subject.trim()) params.set("subject", subject.trim());
  if (message.trim()) params.set("body", message.trim());
  return `mailto:${encodeURIComponent(email)}?${params.toString()}`;
}

export default function ContactStudentDialog({
  student,
  buttonLabel = "Contact",
  buttonVariant = "outline",
  buttonSize = "sm",
  iconOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const sendNotification = useSendStudentNotification();

  const studentName = getStudentName(student);
  const studentEmail = getStudentEmail(student);
  const canSubmit =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    !sendNotification.isPending;

  const mailtoHref = useMemo(
    () => buildMailto(studentEmail, subject, message),
    [studentEmail, subject, message]
  );

  function resetForm() {
    setSubject("");
    setMessage("");
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen && !sendNotification.isPending) resetForm();
  }

  function handleSendNotification() {
    if (!canSubmit) {
      toast.error("Enter a subject and message");
      return;
    }

    sendNotification.mutate(
      {
        studentId: student.studentId,
        subject: subject.trim(),
        message: message.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Notification sent");
          setOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to send notification");
        },
      }
    );
  }

  function handleOpenEmail() {
    if (!studentEmail) {
      toast.error("Student email is not available");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error("Enter a subject and message");
      return;
    }

    window.location.href = mailtoHref;
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        title={`Contact ${studentName}`}
      >
        <Mail className="h-4 w-4" />
        {iconOnly ? <span className="sr-only">Contact {studentName}</span> : buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact student</DialogTitle>
            <DialogDescription>
              {studentName}
              {studentEmail ? ` (${studentEmail})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`contact-subject-${student?.studentId}`}>
                Subject
              </Label>
              <Input
                id={`contact-subject-${student?.studentId}`}
                value={subject}
                maxLength={MAX_SUBJECT_LENGTH}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Course follow-up"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`contact-message-${student?.studentId}`}>
                Message
              </Label>
              <Textarea
                id={`contact-message-${student?.studentId}`}
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your message..."
                className="min-h-36 resize-none"
              />
              <p className="text-right text-xs text-muted-foreground">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={sendNotification.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenEmail}
              disabled={!studentEmail || !canSubmit}
            >
              <Mail className="h-4 w-4" />
              Open email
            </Button>
            <Button
              type="button"
              onClick={handleSendNotification}
              disabled={!canSubmit}
            >
              {sendNotification.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Send notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
