"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminMentorFilters from "./admin-mentor-filters";
import AdminMentorBulkActions from "./admin-mentor-bulk-actions";
import AdminMentorPagination from "./admin-mentor-pagination";
import MentorReviewCard from "./mentor-review-card";
import { Card, CardContent } from "@/components/ui/card";

const EmptyState = ({ message }) => (
  <Card className="border border-border/60">
    <CardContent className="py-10 text-center text-muted-foreground">
      {message}
    </CardContent>
  </Card>
);

const POLL_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_ADMIN_POLL_INTERVAL_MS ?? 10000
);

export default function AdminMentorBoard({
  status,
  counts,
  pending,
  reviewed,
  pagination,
  latestEventAt,
}) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);

  const countsWithDefaults = useMemo(
    () => ({
      all: counts?.all ?? 0,
      PENDING: counts?.PENDING ?? 0,
      APPROVED: counts?.APPROVED ?? 0,
      REJECTED: counts?.REJECTED ?? 0,
    }),
    [counts]
  );

  const snapshotRef = useRef({
    lastEventAt: latestEventAt ? new Date(latestEventAt).toISOString() : null,
    pendingCount: countsWithDefaults.PENDING,
  });

  useEffect(() => {
    snapshotRef.current = {
      lastEventAt: latestEventAt ? new Date(latestEventAt).toISOString() : null,
      pendingCount: countsWithDefaults.PENDING,
    };
  }, [latestEventAt, countsWithDefaults.PENDING]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/admin/mentors/events", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        const incoming = {
          lastEventAt: data.lastEventAt ?? null,
          pendingCount: data.pendingCount ?? 0,
        };

        const previous = snapshotRef.current;
        const hasChange = Boolean(
          (incoming.lastEventAt &&
            incoming.lastEventAt !== previous.lastEventAt) ||
            incoming.pendingCount !== previous.pendingCount
        );

        if (hasChange) {
          snapshotRef.current = incoming;
          if (
            typeof document === "undefined" ||
            document.visibilityState === "visible"
          ) {
            router.refresh();
          }
        }
      } catch (error) {
        console.warn("Failed to poll mentor events", error);
      }
    };

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, status]);

  useEffect(() => {
    setSelected([]);
  }, [status, pagination.page]);

  const approvedList = useMemo(
    () => reviewed.filter((mentor) => mentor.status === "APPROVED"),
    [reviewed]
  );

  const rejectedList = useMemo(
    () => reviewed.filter((mentor) => mentor.status === "REJECTED"),
    [reviewed]
  );

  const toggleSelection = (mentorId, isSelected) => {
    setSelected((prev) => {
      if (isSelected) {
        if (prev.includes(mentorId)) {
          return prev;
        }
        return [...prev, mentorId];
      }
      return prev.filter((id) => id !== mentorId);
    });
  };

  const clearSelection = () => setSelected([]);

  const renderMentorList = (
    mentors,
    { title, showActions = false, selectable = false, emptyMessage }
  ) => {
    if (!mentors.length) {
      return <EmptyState message={emptyMessage} />;
    }

    return (
      <div className="space-y-4">
        {title ? (
          <div className="px-1">
            <p className="text-xl font-semibold text-foreground">{title}</p>
          </div>
        ) : null}
        <div className="grid gap-6">
          {mentors.map((mentor) => (
            <MentorReviewCard
              key={mentor.id}
              mentor={mentor}
              showActions={showActions}
              selectable={selectable}
              selected={selected.includes(mentor.id)}
              onSelectedChange={(isChecked) =>
                toggleSelection(mentor.id, isChecked)
              }
            />
          ))}
        </div>
      </div>
    );
  };

  const shouldShowBulk =
    selected.length > 0 && (status === "all" || status === "PENDING");

  return (
    <div className="space-y-6">
      <AdminMentorFilters totalCounts={countsWithDefaults} />

      {shouldShowBulk ? (
        <AdminMentorBulkActions
          selectedIds={selected}
          onClear={clearSelection}
        />
      ) : null}

      {status === "all" ? (
        <div className="space-y-6">
          {renderMentorList(pending, {
            title: "Pending review",
            showActions: true,
            selectable: true,
            emptyMessage: "No pending applications right now.",
          })}
          {renderMentorList(reviewed, {
            title: "Reviewed",
            emptyMessage:
              "Once applications are approved or rejected they will appear here.",
          })}
        </div>
      ) : null}

      {status === "PENDING"
        ? renderMentorList(pending, {
            title: "Pending review",
            showActions: true,
            selectable: true,
            emptyMessage: "No pending applications right now.",
          })
        : null}

      {status === "APPROVED"
        ? renderMentorList(approvedList, {
            title: "Approved mentors",
            emptyMessage:
              "Approved mentors will appear here once you approve them.",
          })
        : null}

      {status === "REJECTED"
        ? renderMentorList(rejectedList, {
            title: "Rejected applications",
            emptyMessage:
              "Rejected applications will appear here with their admin notes.",
          })
        : null}

      {status !== "all" &&
      status !== "PENDING" &&
      status !== "APPROVED" &&
      status !== "REJECTED"
        ? renderMentorList(reviewed, {
            title: "Applications",
            emptyMessage: "No applications match the selected filters.",
          })
        : null}

      <AdminMentorPagination pagination={pagination} />
    </div>
  );
}
