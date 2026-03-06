import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const typeCopy = {
  MENTOR_STATUS: {
    title: "Mentor application updated",
    description:
      "Your mentor application status has changed. View the latest details on your mentor dashboard.",
    action: "/mentors/dashboard",
  },
  SESSION_REQUEST: {
    title: "New session request",
    description:
      "A mentee has requested a new session. Review and respond from your mentor dashboard.",
    action: "/mentors/dashboard",
  },
  SESSION_STATUS: {
    title: "Session status update",
    description:
      "A session you are part of has changed status. Check the details in your session list.",
    action: "/mentors/dashboard",
  },
  MESSAGE: {
    title: "New message received",
    description:
      "A mentee sent you a message. Open your inbox to read and respond.",
    action: "/mentors/messages",
  },
  RECOMMENDATION: {
    title: "New recommendation",
    description:
      "You received a new mentor recommendation. Review it on your dashboard.",
    action: "/dashboard",
  },
};

export default async function NotificationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const unreadIds = user.notifications
    .filter((notification) => notification.readAt === null)
    .map((notification) => notification.id);

  if (unreadIds.length) {
    await db.notification.updateMany({
      where: {
        id: { in: unreadIds },
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay up to date with session requests, mentor approvals, and new
          messages from mentees.
        </p>
      </header>

      {user.notifications.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            You&apos;re all caught up! New notifications will appear here when
            there&apos;s something to review.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {user.notifications.map((notification) => {
            const copy = typeCopy[notification.type] ?? {
              title: notification.title ?? "Notification",
              description: notification.body ?? "",
              action: "/dashboard",
            };

            const targetHref = notification.metadata?.href || copy.action;

            return (
              <Card
                key={notification.id}
                className="border border-border/60 shadow-sm"
              >
                <CardHeader className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">
                      {notification.title || copy.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.body || copy.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href={targetHref}>View details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

