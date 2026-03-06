"use client";

import { useState, useTransition } from "react";
import { requestMentorSession } from "@/actions/mentor";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DURATION_OPTIONS = [
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "60 minutes", value: "60" },
  { label: "90 minutes", value: "90" },
];

export default function MentorSessionDialog({ mentor }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState({
    scheduledAt: "",
    durationMinutes: "60",
    notes: "",
  });

  const formattedRate =
    mentor?.hourlyRate !== undefined && mentor?.hourlyRate !== null
      ? Number(
          typeof mentor.hourlyRate === "number"
            ? mentor.hourlyRate
            : Number(mentor.hourlyRate),
        )
      : null;

  const onSubmit = (event) => {
    event.preventDefault();
    if (!mentor?.id) {
      toast.error("Mentor information missing.");
      return;
    }

    if (!formState.scheduledAt) {
      toast.error("Please select a date and time.");
      return;
    }

    startTransition(async () => {
      try {
        await requestMentorSession({
          mentorId: mentor.id,
          scheduledAt: formState.scheduledAt,
          durationMinutes: Number(formState.durationMinutes),
          price: formattedRate ? formattedRate : null,
          currency: mentor.currency ?? "USD",
          notes: formState.notes || null,
        });
        toast.success("Session request sent to the mentor!");
        setOpen(false);
        setFormState({
          scheduledAt: "",
          durationMinutes: "60",
          notes: "",
        });
      } catch (error) {
        toast.error(error.message || "Unable to request session");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Book 1:1 session</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a session</DialogTitle>
          <DialogDescription>
            Select a time that works for you. The mentor will confirm or propose
            an alternative slot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Preferred date & time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formState.scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  scheduledAt: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Session length</Label>
            <Select
              value={formState.durationMinutes}
              onValueChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  durationMinutes: value,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Outline goals (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Help with behavioural interviews, review my resume, improve networking strategy, etc."
              value={formState.notes}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
            />
          </div>

          <DialogFooter className="flex flex-col items-stretch gap-2 text-sm">
            {formattedRate ? (
              <p className="text-muted-foreground">
                Estimated fee:{" "}
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: mentor.currency ?? "USD",
                  }).format(formattedRate)}
                </span>{" "}
                per hour (billed separately).
              </p>
            ) : (
              <p className="text-muted-foreground">
                The mentor will share pricing details after reviewing your
                request.
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

