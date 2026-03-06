import Link from "next/link";
import { Suspense } from "react";
import { listMentors } from "@/actions/mentor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MentorList = async () => {
  const mentors = await listMentors();

  if (!mentors || mentors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No mentors are available yet. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {mentors.map((mentor) => {
        const hourlyRate =
          mentor.hourlyRate === null || mentor.hourlyRate === undefined
            ? null
            : Number(
              typeof mentor.hourlyRate === "number"
                ? mentor.hourlyRate
                : mentor.hourlyRate,
            );

        return (
          <Card
            key={mentor.id}
            className="border border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
          >
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-3">
                {mentor.user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.user.imageUrl}
                    alt={mentor.user?.name ?? "Mentor avatar"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {mentor.user?.name
                      ?.split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2) || "M"}
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">
                    {mentor.user?.name || "Mentor"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {mentor.headline || mentor.bio?.slice(0, 64) || "Mentor"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mentor.industries?.slice(0, 3).map((industry) => (
                  <Badge key={industry} variant="secondary">
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {mentor.yearsExperience ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    {mentor.yearsExperience}+ years experience
                  </span>
                ) : null}
                {hourlyRate ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: mentor.currency || "USD",
                      maximumFractionDigits: 0,
                    }).format(hourlyRate)}
                    /hr
                  </span>
                ) : null}
              </div>
              {mentor.skills?.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {mentor.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-muted px-2 py-1 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{mentor.sessionsCount ?? 0} sessions</span>
                <span>{mentor.recommendationsCount ?? 0} recommendations</span>
              </div>
              <Button asChild className="w-full" variant="default">
                <Link href={`/mentors/${mentor.id}`}>View profile</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default function MentorsPage() {
  return (
    <section className="space-y-10">
      <header className="max-w-3xl space-y-4 text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight">
          Find Your Next Mentor
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore experienced professionals who can guide your career growth,
          review your work, and help you prepare for the next opportunity.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <Button asChild variant="default">
            <Link href="/mentors/apply">Become a mentor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse border-border/40">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        {/* @ts-expect-error Async Server Component */}
        <MentorList />
      </Suspense>
    </section>
  );
}

