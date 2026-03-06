import { redirect } from "next/navigation";
import { getMentorInbox } from "@/actions/mentor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MentorMessagesPage() {
  let inbox;

  try {
    inbox = await getMentorInbox();
  } catch (error) {
    console.error("Mentor messaging access denied:", error);
    redirect("/mentors/apply");
  }

  const { conversations } = inbox;

  if (conversations && conversations.length > 0) {
    redirect(`/mentors/messages/${conversations[0].id}`);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight">Mentor messages</h1>
        <p className="text-muted-foreground">
          Keep track of conversations with mentees, respond quickly, and build
          long-term relationships.
        </p>
      </header>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>No conversations yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Once mentees reach out or book a session, their messages will appear
            here. Start by exploring mentees who could benefit from your
            expertise.
          </p>
          <Button asChild>
            <Link href="/mentors">Browse mentees</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

