"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminMentorPagination({ pagination }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages } = pagination;

  const goToPage = (target) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    router.replace(`/admin/mentors?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
