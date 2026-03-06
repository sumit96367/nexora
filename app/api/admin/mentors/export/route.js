"use server";

import { NextResponse } from "next/server";
import { getMentorApplications } from "../../../../../actions/mentor";

const MAX_PAGE_SIZE = 1000;

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(",") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q") || undefined;

    const { pending, reviewed } = await getMentorApplications({
      status: statusParam && statusParam !== "all" ? statusParam : undefined,
      search: query,
      page: 1,
      pageSize: MAX_PAGE_SIZE,
    });

    const rows = [...pending, ...reviewed];

    const headers = [
      "Name",
      "Email",
      "Status",
      "Headline",
      "Experience (years)",
      "Industries",
      "Skills",
      "Hourly rate",
      "Submitted at",
      "Approved at",
      "Rejected at",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((mentor) =>
        [
          mentor.user?.name ?? "",
          mentor.user?.email ?? "",
          mentor.status,
          mentor.headline ?? "",
          mentor.yearsExperience ?? "",
          Array.isArray(mentor.industries)
            ? mentor.industries.join("; ")
            : "",
          Array.isArray(mentor.skills) ? mentor.skills.join("; ") : "",
          mentor.hourlyRate ?? "",
          mentor.submittedAt ? new Date(mentor.submittedAt).toISOString() : "",
          mentor.approvedAt ? new Date(mentor.approvedAt).toISOString() : "",
          mentor.rejectedAt ? new Date(mentor.rejectedAt).toISOString() : "",
        ].map(escapeCsv).join(","),
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mentor-applications-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export mentor applications:", error);
    return new NextResponse("Unauthorized", { status: 403 });
  }
}

