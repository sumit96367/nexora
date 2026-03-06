"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { reviewMentorApplication } from "@/actions/mentor";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  UserCircle2,
  XCircle,
} from "lucide-react";

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  SUSPENDED: ShieldAlert,
};

const statusStyles = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-green-100 text-green-900",
  REJECTED: "bg-red-100 text-red-900",
  SUSPENDED: "bg-slate-200 text-slate-800",
};

export default function MentorReviewCard({
  mentor,
  showActions = false,
  selectable = false,
  selected = false,
  onSelectedChange,
}) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  if (!mentor) return null;

  const StatusIcon = statusIcons[mentor.status] ?? statusIcons.PENDING;
  const statusStyle = statusStyles[mentor.status] ?? statusStyles.PENDING;

  const handleDecision = (decision) => {
    startTransition(async () => {
      try {
        await reviewMentorApplication({
          mentorId: mentor.id,
          decision,
          reason: decision === "reject" ? reason : undefined,
        });
        toast.success(
          decision === "approve"
            ? "Mentor application approved"
            : "Mentor application rejected"
        );
        setReason("");
      } catch (error) {
        toast.error(error.message || "Failed to update application");
      }
    });
  };

  return (
    <Card
      className="border border-border/60 shadow-sm"
      data-testid="mentor-card"
    >
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          {mentor.user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.user.imageUrl}
              alt={mentor.user?.name ?? "Mentor"}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
              <UserCircle2 className="h-8 w-8" />
            </div>
          )}
          <div>
            <CardTitle className="text-xl">
              {mentor.user?.name ?? "Mentor applicant"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mentor.user?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied{" "}
              {formatDistanceToNow(new Date(mentor.submittedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`flex items-center gap-2 ${statusStyle}`}>
            <StatusIcon className="h-4 w-4" />
            {mentor.status.toLowerCase()}
          </Badge>
          {selectable ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-border/60"
                checked={selected}
                onChange={(event) => onSelectedChange?.(event.target.checked)}
              />
              Select
            </label>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Headline
            </h3>
            <p className="mt-1 text-sm">{mentor.headline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Experience
            </h3>
            <p className="mt-1 text-sm">
              {mentor.yearsExperience
                ? `${mentor.yearsExperience}+ years`
                : "Not provided"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">Bio</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {mentor.bio}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Industries
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {mentor.industries?.length ? (
                mentor.industries.map((industry) => (
                  <Badge key={industry} variant="outline">
                    {industry}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Not provided</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Skills
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {mentor.skills?.length ? (
                mentor.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Not provided</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            Proof documents
          </h3>
          <div className="mt-2 space-y-2">
            {mentor.proofDocuments?.length ? (
              mentor.proofDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {document.type || "Supporting document"}
                    </span>
                    {document.description ? (
                      <span className="text-xs text-muted-foreground">
                        {document.description}
                      </span>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents attached.
              </p>
            )}
          </div>
        </div>

        {mentor.rejectionReason ? (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              Admin notes
            </h3>
            <p className="mt-1 text-sm text-red-600">
              {mentor.rejectionReason}
            </p>
          </div>
        ) : null}

        {showActions && mentor.status === "PENDING" ? (
          <div className="space-y-3 rounded-md border border-border/60 bg-muted/40 p-4">
            <Textarea
              placeholder="Add optional notes for the applicant (required if rejecting)."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isPending}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleDecision("approve")}
                disabled={isPending}
              >
                {isPending ? "Processing..." : "Approve"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDecision("reject")}
                disabled={isPending || reason.trim().length === 0}
              >
                {isPending ? "Processing..." : "Reject"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
