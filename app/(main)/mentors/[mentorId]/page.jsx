import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMentorProfile } from "@/actions/mentor";
import MentorSessionDialog from "../_components/mentor-session-dialog";

export default async function MentorProfilePage({ params }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const mentorId = params?.mentorId;

  if (!mentorId) {
    notFound();
  }

  let mentorProfile;

  try {
    mentorProfile = await getMentorProfile(mentorId);
  } catch (error) {
    console.error(error);
    notFound();
  }

  const {
    user,
    headline,
    bio,
    industries,
    skills,
    yearsExperience,
    hourlyRate,
    currency,
    availability,
    recommendations,
    ratingAverage,
    status,
  } = mentorProfile;

  const formattedRate =
    hourlyRate !== null && hourlyRate !== undefined
      ? Number(typeof hourlyRate === "number" ? hourlyRate : Number(hourlyRate))
      : null;

  return (
    <section className="space-y-12">
      <header className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt={user?.name ?? "Mentor avatar"}
              className="h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
              {user?.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2) || "M"}
            </div>
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">
                {user?.name || "Mentor"}
              </h1>
              <Badge variant="secondary" className="uppercase">
                {status.toLowerCase()}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">{headline}</p>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {yearsExperience ? (
                <span>{yearsExperience}+ years experience</span>
              ) : null}
              {ratingAverage ? (
                <span>⭐ {ratingAverage.toFixed(1)} rating</span>
              ) : null}
            </div>
            {formattedRate ? (
              <p className="font-semibold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: currency || "USD",
                }).format(formattedRate)}{" "}
                per hour
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:w-64">
          <MentorSessionDialog
            mentor={{
              id: mentorProfile.id,
              userId: mentorProfile.userId,
              name: user?.name ?? "Mentor",
              hourlyRate: formattedRate,
              currency: currency || "USD",
            }}
          />
          <Button variant="outline">Send a message</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="whitespace-pre-wrap text-muted-foreground">{bio}</p>
          {Array.isArray(industries) && industries.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Industries
              </h3>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <Badge key={industry} variant="outline">
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {Array.isArray(skills) && skills.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Mentorship Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {availability ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Availability Notes
              </h3>
              <p className="text-sm text-muted-foreground">{availability}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations?.length ? (
            recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-lg border border-border/60 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{recommendation.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {recommendation.visibility.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {recommendation.mentee?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={recommendation.mentee.imageUrl}
                        alt={recommendation.mentee?.name ?? "Mentee"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : null}
                    <span>{recommendation.mentee?.name ?? "Mentee"}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {recommendation.body}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No public recommendations yet.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
