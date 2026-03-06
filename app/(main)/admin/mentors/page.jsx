import { redirect } from "next/navigation";
import { getMentorApplications } from "@/actions/mentor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminMentorBoard from "./_components/admin-mentor-board";

const DEFAULT_PAGE_SIZE = 6;

export default async function AdminMentorsPage({ searchParams }) {
  const page = Number(searchParams?.page) || 1;
  const statusParam = searchParams?.status || "all";
  const search = searchParams?.q || "";

  let applications;
  try {
    applications = await getMentorApplications({
      status: statusParam === "all" ? undefined : statusParam,
      search,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  } catch (error) {
    console.error("Admin access denied:", error);
    redirect("/");
  }

  const { pending, reviewed, pagination, counts, latestEventAt } = applications;
  const approvedCount = counts?.APPROVED ?? 0;
  const rejectedCount = counts?.REJECTED ?? 0;
  const pendingCount = counts?.PENDING ?? 0;
  const averageApprovalTime = (() => {
    const approvals = reviewed
      .filter((mentor) => mentor.status === "APPROVED" && mentor.approvedAt)
      .map(
        (mentor) =>
          (new Date(mentor.approvedAt).getTime() -
            new Date(mentor.submittedAt).getTime()) /
          (1000 * 60 * 60)
      );
    if (!approvals.length) return null;
    const average =
      approvals.reduce((acc, value) => acc + value, 0) / approvals.length;
    return average;
  })();

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Mentor Applications
        </h1>
        <p className="text-muted-foreground">
          Review new mentor submissions, verify credentials, and approve the
          best experts to join the Sensai mentor network.
        </p>
        <div className="flex flex-wrap gap-4">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending applications
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-2xl font-semibold">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-2xl font-semibold">
                {(counts?.all ?? 0) - pendingCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved mentors
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-2xl font-semibold">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">
              Already live in the marketplace
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-2xl font-semibold">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">
              Sent back to applicants
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending queue
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-2xl font-semibold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg approval time
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-2xl font-semibold">
              {averageApprovalTime ? `${averageApprovalTime.toFixed(1)}h` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              From submission to approval
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminMentorBoard
        status={statusParam}
        counts={counts}
        pending={pending}
        reviewed={reviewed}
        pagination={pagination}
        latestEventAt={latestEventAt}
      />
    </section>
  );
}
