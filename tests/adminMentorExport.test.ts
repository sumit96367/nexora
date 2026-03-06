import { describe, expect, it, vi, beforeEach } from "vitest";

const getMentorApplicationsMock = vi.fn();

vi.mock("../actions/mentor", () => ({
  getMentorApplications: getMentorApplicationsMock,
}));

describe("admin mentor export route", () => {
  beforeEach(() => {
    getMentorApplicationsMock.mockReset();
  });

  it("returns a CSV with mentor application data", async () => {
    const data = {
      pending: [
        {
          id: "mentor-1",
          status: "PENDING",
          headline: "Senior Engineer",
          yearsExperience: 8,
          industries: ["Technology"],
          skills: ["Leadership"],
          hourlyRate: 120,
          submittedAt: new Date("2024-01-05"),
          approvedAt: null,
          rejectedAt: null,
          user: { name: "Pending Mentor", email: "pending@example.com" },
        },
      ],
      reviewed: [
        {
          id: "mentor-2",
          status: "APPROVED",
          headline: "Finance Coach",
          yearsExperience: 12,
          industries: ["Finance"],
          skills: ["Coaching"],
          hourlyRate: 150,
          submittedAt: new Date("2024-01-01"),
          approvedAt: new Date("2024-01-03"),
          rejectedAt: null,
          user: { name: "Approved Mentor", email: "approved@example.com" },
        },
      ],
    };

    getMentorApplicationsMock.mockResolvedValue(data);

    const { GET } = await import("../app/api/admin/mentors/export/route");

    const response = await GET(
      new Request("http://localhost/api/admin/mentors/export?status=all"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");

    const csv = await response.text();
    expect(csv).toContain("Name,Email,Status");
    expect(csv).toContain("Pending Mentor,pending@example.com,PENDING");
    expect(csv).toContain("Approved Mentor,approved@example.com,APPROVED");
  });

  it("returns 403 when export fails", async () => {
    getMentorApplicationsMock.mockRejectedValue(new Error("Not authorized"));
    const { GET } = await import("../app/api/admin/mentors/export/route");
    const response = await GET(
      new Request("http://localhost/api/admin/mentors/export"),
    );
    expect(response.status).toBe(403);
  });
});

