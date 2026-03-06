import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MentorSessionActions from "../_components/mentor-session-actions";
import { getMentorDashboardData } from "@/actions/mentor";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const notificationCopy = {
  MENTOR_STATUS: {
    action: "/mentors/dashboard",
    label: "Application update",
  },
  SESSION_REQUEST: {
    action: "/mentors/dashboard",
    label: "Session request",
  },
  SESSION_STATUS: {
    action: "/mentors/dashboard",
    label: "Session status change",
  },
  MESSAGE: {
    action: "/mentors/messages",
    label: "New message",
  },
  RECOMMENDATION: {
    action: "/dashboard",
    label: "New recommendation",
  },
};

export default async function MentorDashboardPage() {
  let dashboard;

  try {
    dashboard = await getMentorDashboardData();
  } catch (error) {
    console.error("Mentor dashboard access denied:", error);
    redirect("/mentors/apply");
  }

  const { mentorProfile, sessions, recommendations, conversations, notifications } = dashboard;

  const unreadNotifications =
    notifications?.filter((notification) => !notification.readAt)?.length ?? 0;
  const unreadMessages =
    conversations?.reduce(
      (total, conversation) => total + (conversation.unreadCount ?? 0),
      0,
    ) ?? 0;
  const pendingSessions =
    sessions?.filter((session) => session.status === "PENDING")?.length ?? 0;
  const confirmedSessions =
    sessions?.filter((session) => session.status === "CONFIRMED")?.length ?? 0;

  const pendingApproval =
    mentorProfile.status !== "APPROVED" &&
    mentorProfile.status !== "SUSPENDED";

  return (
    <section className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Mentor dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your sessions, conversations, and recommendations in one
            place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/mentors/${mentorProfile.id}`}>View public profile</Link>
          </Button>
          <Button asChild>
            <Link href="/mentors">Find mentees</Link>
          </Button>
        </div>
      </header>

      {pendingApproval ? (
        <Card className="border border-yellow-500/40 bg-yellow-500/10">
          <CardHeader>
            <CardTitle>Application under review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your mentor application is currently{" "}
              <span className="font-semibold lowercase">
                {mentorProfile.status.toLowerCase()}
              </span>
              . You&apos;ll get a notification as soon as a decision is made.
            </p>
            {mentorProfile.rejectionReason ? (
              <p className="font-medium text-destructive">
                Review notes: {mentorProfile.rejectionReason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingSessions}</p>
            <p className="text-xs text-muted-foreground">
              Awaiting your confirmation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {pendingSessions + confirmedSessions}
            </p>
            <p className="text-xs text-muted-foreground">
              Pending or confirmed meetings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unreadMessages}</p>
            <p className="text-xs text-muted-foreground">
              Open mentee conversations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unreadNotifications}</p>
            <p className="text-xs text-muted-foreground">
              Items that need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions?.length ? (
              sessions.map((session) => {
                const price =
                  session.price === null || session.price === undefined
                    ? null
                    : Number(
                        typeof session.price === "number"
                          ? session.price
                          : session.price,
                      );

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {session.status.toLowerCase()}
                      </p>
                      <h3 className="text-lg font-medium">
                        {session.mentee?.name ?? "Client"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dateFormatter.format(new Date(session.scheduledAt))} ·{" "}
                        {session.durationMinutes} minutes
                      </p>
                      {price ? (
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: session.currency ?? "USD",
                          }).format(price)}{" "}
                          estimated fee
                        </p>
                      ) : null}
                      {session.notes ? (
                        <p className="text-sm text-muted-foreground">
                          Notes: {session.notes}
                        </p>
                      ) : null}
                    </div>
                    {mentorProfile.status === "APPROVED" ? (
                      <MentorSessionActions session={session} />
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No sessions scheduled yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications?.length ? (
                notifications.map((notification) => {
                  const metaHref =
                    typeof notification.metadata?.href === "string"
                      ? notification.metadata.href
                      : undefined;
                  const copy = notificationCopy[notification.type] ?? {
                    label: notification.title || "Update",
                    action: metaHref || "/dashboard",
                  };

                  return (
                    <div
                      key={notification.id}
                      className="rounded-lg border border-border/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">
                          {notification.title || copy.label}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(notification.createdAt))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.body ||
                          "Something new needs your attention. View details to respond."}
                      </p>
                      <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
                        <Link href={metaHref || copy.action}>
                          View details
                        </Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  You&apos;re caught up! New alerts will show up here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations?.length ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <p className="font-medium">
                      {conversation.mentee?.name ?? "Mentee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last message{" "}
                      {conversation.lastMessageAt
                        ? dateFormatter.format(new Date(conversation.lastMessageAt))
                        : "—"}
                    </p>
                    {conversation.unreadCount ? (
                      <p className="text-xs font-semibold text-primary">
                        {conversation.unreadCount} unread message
                        {conversation.unreadCount > 1 ? "s" : ""}
                      </p>
                    ) : null}
                    {conversation.messages?.[0]?.body ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {conversation.messages[0].body}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Messages with mentees will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations?.length ? (
            recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-lg border border-border/60 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">
                    {recommendation.title}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {recommendation.visibility.toLowerCase()}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {recommendation.body}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  For {recommendation.mentee?.name ?? "mentee"} on{" "}
                  {dateFormatter.format(new Date(recommendation.createdAt))}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Recommendations you share will be listed here.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

