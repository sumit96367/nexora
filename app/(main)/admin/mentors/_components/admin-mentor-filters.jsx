"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminMentorFilters({ totalCounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const status = searchParams.get("status") || "all";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.replace(`/admin/mentors?${params.toString()}`, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleStatusChange = (newStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    params.delete("page");
    router.replace(`/admin/mentors?${params.toString()}`, { scroll: false });
  };

  const handleExport = async () => {
    try {
      const params = searchParams.toString();
      const response = await fetch(
        `/api/admin/mentors/export${params ? `?${params}` : ""}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to export mentor applications");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mentor-applications-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (error) {
      toast.error(error.message || "Failed to export mentor applications");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {typeof totalCounts?.[tab.value] === "number" ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {totalCounts[tab.value]}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex w-full flex-col gap-2 md:max-w-lg md:flex-row">
          <Input
            placeholder="Search by name, email, industry, or skill"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full"
          />
          <Button
            type="button"
            variant="outline"
            className="whitespace-nowrap"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
