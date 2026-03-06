/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyForMentorRole } from "@/components/ui/applyformentorrole";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const INDUSTRY_SUGGESTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Product",
  "Design",
  "Operations",
];

const SKILL_SUGGESTIONS = [
  "Leadership",
  "Career Coaching",
  "Interview Prep",
  "Resume Review",
  "Technical Mentorship",
  "Strategy",
  "Networking",
  "Portfolio Review",
];

export default function MentorApplicationForm({ initialData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [documents, setDocuments] = useState(
    initialData?.documents?.length
      ? initialData.documents
      : [{ type: "", url: "", description: "" }],
  );
  const [industries, setIndustries] = useState(initialData?.industries ?? []);
  const [skills, setSkills] = useState(initialData?.skills ?? []);
  const [formState, setFormState] = useState({
    headline: initialData?.headline ?? "",
    bio: initialData?.bio ?? "",
    yearsExperience: initialData?.yearsExperience ?? "",
    hourlyRate: initialData?.hourlyRate ?? "",
    currency: initialData?.currency ?? "USD",
    availability: initialData?.availability ?? "",
  });

  const mentorStatusBadge = useMemo(() => {
    if (!initialData?.status) return null;

    const status = initialData.status;
    const statusText = status.toLowerCase();

    const variant = {
      NONE: "outline",
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      SUSPENDED: "destructive",
    }[status];

    return (
      <Badge variant={variant} className="capitalize">
        {statusText}
      </Badge>
    );
  }, [initialData?.status]);

  const updateDocument = (index, key, value) => {
    setDocuments((prev) =>
      prev.map((doc, docIndex) =>
        docIndex === index ? { ...doc, [key]: value } : doc,
      ),
    );
  };

  const addDocumentRow = () => {
    setDocuments((prev) => [...prev, { type: "", url: "", description: "" }]);
  };

  const removeDocumentRow = (index) => {
    setDocuments((prev) => prev.filter((_, docIndex) => docIndex !== index));
  };

  const toggleTag = (value, setState) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const filteredDocuments = documents.filter(
      (doc) => doc.url && doc.url.trim().length > 0,
    );

    if (filteredDocuments.length === 0) {
      toast.error("Please add at least one proof document.");
      return;
    }

    startTransition(async () => {
      try {
        await applyForMentorRole({
          headline: formState.headline,
          bio: formState.bio,
          yearsExperience: formState.yearsExperience
            ? Number(formState.yearsExperience)
            : null,
          industries,
          skills,
          hourlyRate: formState.hourlyRate
            ? Number(formState.hourlyRate)
            : null,
          currency: formState.currency,
          availability: formState.availability || null,
          documents: filteredDocuments,
        });
        toast.success("Mentor application submitted successfully!");
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Failed to submit mentor application.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Professional Overview</CardTitle>
            {mentorStatusBadge}
          </div>
          {initialData?.status === "REJECTED" && initialData?.rejectionReason ? (
            <p className="text-sm text-destructive">
              Previously rejected: {initialData.rejectionReason}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="Senior Product Manager at Nexora"
                value={formState.headline}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    headline: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of experience</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                placeholder="8"
                value={formState.yearsExperience}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    yearsExperience: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your mentoring approach, achievements, and what topics you are most passionate about."
              className="min-h-[180px]"
              value={formState.bio}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  bio: event.target.value,
                }))
              }
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expertise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Industries</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_SUGGESTIONS.map((industry) => (
                <Button
                  key={industry}
                  type="button"
                  variant={industries.includes(industry) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(industry, setIndustries)}
                >
                  {industry}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Add custom industry and press enter"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const value = event.currentTarget.value.trim();
                  if (value.length && !industries.includes(value)) {
                    setIndustries((prev) => [...prev, value]);
                    event.currentTarget.value = "";
                  }
                }
              }}
            />
            {industries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <Badge key={industry} variant="secondary">
                    <button
                      type="button"
                      onClick={() =>
                        setIndustries((prev) =>
                          prev.filter((item) => item !== industry),
                        )
                      }
                    >
                      {industry} ✕
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <Label>Mentorship skills</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.map((skill) => (
                <Button
                  key={skill}
                  type="button"
                  variant={skills.includes(skill) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(skill, setSkills)}
                >
                  {skill}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Add custom skill and press enter"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const value = event.currentTarget.value.trim();
                  if (value.length && !skills.includes(value)) {
                    setSkills((prev) => [...prev, value]);
                    event.currentTarget.value = "";
                  }
                }
              }}
            />
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    <button
                      type="button"
                      onClick={() =>
                        setSkills((prev) => prev.filter((item) => item !== skill))
                      }
                    >
                      {skill} ✕
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability & Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly rate</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              placeholder="100"
              value={formState.hourlyRate}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  hourlyRate: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              placeholder="USD"
              value={formState.currency}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  currency: event.target.value.toUpperCase(),
                }))
              }
              maxLength={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="availability">Availability notes</Label>
            <Textarea
              id="availability"
              placeholder="e.g. Weekday evenings, 6-9pm CET. Open to weekend sessions with notice."
              value={formState.availability}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  availability: event.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof of Expertise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {documents.map((document, index) => (
            <div
              key={document.id ?? index}
              className="grid gap-4 rounded-lg border border-border/60 p-4 md:grid-cols-12"
            >
              <div className="md:col-span-3">
                <Label className="mb-2 block" htmlFor={`doc-type-${index}`}>
                  Document type
                </Label>
                <Input
                  id={`doc-type-${index}`}
                  placeholder="Certification, Portfolio, LinkedIn"
                  value={document.type}
                  onChange={(event) =>
                    updateDocument(index, "type", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-5">
                <Label className="mb-2 block" htmlFor={`doc-url-${index}`}>
                  URL
                </Label>
                <Input
                  id={`doc-url-${index}`}
                  type="url"
                  placeholder="https://"
                  value={document.url}
                  onChange={(event) =>
                    updateDocument(index, "url", event.target.value)
                  }
                  required={index === 0}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="mb-2 block" htmlFor={`doc-desc-${index}`}>
                  Notes
                </Label>
                <Input
                  id={`doc-desc-${index}`}
                  placeholder="Brief description"
                  value={document.description}
                  onChange={(event) =>
                    updateDocument(index, "description", event.target.value)
                  }
                />
              </div>
              <div className="flex items-end justify-end md:col-span-1">
                {documents.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeDocumentRow(index)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addDocumentRow}
            className="w-full"
          >
            Add another document
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Our team will review your application and respond within 3-5 business
          days. You will receive a notification once a decision is made.
        </p>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit application"}
        </Button>
      </div>
    </form>
  );
}

