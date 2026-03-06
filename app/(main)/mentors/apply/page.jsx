import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import MentorApplicationForm from "../_components/mentor-application-form";

export default async function MentorApplyPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      mentorProfile: {
        include: {
          proofDocuments: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const initialData = user.mentorProfile
    ? {
      headline: user.mentorProfile.headline ?? "",
      bio: user.mentorProfile.bio ?? "",
      yearsExperience: user.mentorProfile.yearsExperience ?? "",
      industries: user.mentorProfile.industries ?? [],
      skills: user.mentorProfile.skills ?? [],
      hourlyRate: user.mentorProfile.hourlyRate
        ? Number(user.mentorProfile.hourlyRate)
        : "",
      currency: user.mentorProfile.currency ?? "USD",
      availability: user.mentorProfile.availability ?? null,
      documents: user.mentorProfile.proofDocuments?.map((doc) => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        description: doc.description ?? "",
      })) ?? [],
      status: user.mentorProfile.status,
      rejectionReason: user.mentorProfile.rejectionReason ?? "",
      submittedAt: user.mentorProfile.submittedAt,
      approvedAt: user.mentorProfile.approvedAt,
    }
    : null;

  return (
    <section className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-4 text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight">Become a Mentor</h1>
        <p className="text-muted-foreground">
          Share your expertise with learners, host 1:1 sessions, and provide
          tailored recommendations. Tell us about your experience so we can
          review your application.
        </p>
      </header>
      <MentorApplicationForm initialData={initialData} />
    </section>
  );
}

