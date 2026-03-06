import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const dbMock = {
  user: {
    findUnique: vi.fn(),
  },
  mentorProfile: {
    findFirst: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("../lib/prisma", () => ({
  db: dbMock,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

describe("GET /api/admin/mentors/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReset();
    dbMock.user.findUnique.mockReset();
    dbMock.mentorProfile.findFirst.mockReset();
    dbMock.mentorProfile.count.mockReset();
  });

  it("returns latest event timestamp and pending count for admins", async () => {
    const latestDate = new Date("2024-01-06T12:00:00.000Z");
    authMock.mockResolvedValue({ userId: "admin_user" });
    dbMock.user.findUnique.mockResolvedValue({ email: "admin@example.com" });
    dbMock.mentorProfile.findFirst.mockResolvedValue({ lastEventAt: latestDate });
    dbMock.mentorProfile.count.mockResolvedValue(4);

    const { GET } = await import("../app/api/admin/mentors/events/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toEqual({
      lastEventAt: latestDate.toISOString(),
      pendingCount: 4,
    });
  });

  it("returns 403 for non-admin users", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    dbMock.user.findUnique.mockResolvedValue({ email: "user@example.com" });

    const { GET } = await import("../app/api/admin/mentors/events/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 401 for unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const { GET } = await import("../app/api/admin/mentors/events/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

