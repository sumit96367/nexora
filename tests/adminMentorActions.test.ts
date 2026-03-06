import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
  mentorProfile: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    aggregate: vi.fn(),
  },
  mentorDocument: {
    updateMany: vi.fn(),
  },
  mentorMessage: {
    count: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  realtimeEvent: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const authMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("../lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

let getMentorApplications: typeof import("../actions/mentor").getMentorApplications;
let bulkReviewMentorApplications: typeof import("../actions/mentor").bulkReviewMentorApplications;

beforeAll(async () => {
  const actions = await import("../actions/mentor");
  getMentorApplications = actions.getMentorApplications;
  bulkReviewMentorApplications = actions.bulkReviewMentorApplications;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.user.findUnique.mockReset();
  mockDb.mentorProfile.findMany.mockReset();
  mockDb.mentorProfile.count.mockReset();
  mockDb.mentorProfile.aggregate.mockReset();
  mockDb.mentorProfile.findUnique.mockReset();
  mockDb.mentorDocument.updateMany.mockReset();
  mockDb.mentorMessage.count.mockReset();
  mockDb.notification.create.mockReset();
  mockDb.realtimeEvent.create.mockReset();
  mockDb.$transaction.mockReset();
  authMock.mockReset();
  revalidatePathMock.mockReset();
  mockDb.mentorMessage.count.mockResolvedValue(0);
  mockDb.mentorProfile.aggregate.mockResolvedValue({
    _max: { lastEventAt: null },
  });
});

describe("getMentorApplications", () => {
  it("returns paginated results with counts for admins", async () => {
    authMock.mockResolvedValue({ userId: "admin_user" });
    mockDb.user.findUnique.mockResolvedValue({
      id: "admin_user",
      email: "admin@example.com",
    });

    const pendingProfile = {
      id: "mentor-pending",
      status: "PENDING",
      submittedAt: new Date("2024-01-01"),
      lastEventAt: new Date("2024-01-01"),
      user: { id: "u1", name: "Pending Mentor", email: "pending@example.com" },
      industries: ["Tech"],
      skills: ["Leadership"],
      proofDocuments: [],
    };

    const approvedProfile = {
      id: "mentor-approved",
      status: "APPROVED",
      submittedAt: new Date("2024-01-02"),
      approvedAt: new Date("2024-01-03"),
      lastEventAt: new Date("2024-01-03"),
      user: { id: "u2", name: "Approved Mentor", email: "approved@example.com" },
      industries: ["Finance"],
      skills: ["Coaching"],
      proofDocuments: [],
    };

    const latestEvent = new Date("2024-01-04");

    mockDb.mentorProfile.findMany.mockResolvedValue([pendingProfile, approvedProfile]);
    mockDb.mentorProfile.count
      .mockResolvedValueOnce(2) // matching
      .mockResolvedValueOnce(2) // all
      .mockResolvedValueOnce(1) // pending
      .mockResolvedValueOnce(1) // approved
      .mockResolvedValueOnce(0); // rejected
    mockDb.mentorProfile.aggregate.mockResolvedValue({
      _max: { lastEventAt: latestEvent },
    });

    const result = await getMentorApplications({
      search: "mentor",
      page: 2,
      pageSize: 6,
    });

    expect(mockDb.mentorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 6,
        take: 6,
      }),
    );
    expect(result.pending).toHaveLength(1);
    expect(result.reviewed).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.counts).toMatchObject({
      all: 2,
      PENDING: 1,
      APPROVED: 1,
      REJECTED: 0,
    });
    expect(result.latestEventAt).toEqual(latestEvent);
  });

  it("throws when invoked by a non-admin user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    mockDb.user.findUnique.mockResolvedValue({
      id: "user_123",
      email: "not-admin@example.com",
    });

    await expect(getMentorApplications()).rejects.toThrow("Not authorized");
  });
});

describe("bulkReviewMentorApplications", () => {
  it("approves multiple mentor applications and revalidates pages", async () => {
    authMock.mockResolvedValue({ userId: "admin_user" });
    mockDb.user.findUnique.mockResolvedValue({
      id: "admin_user",
      email: "admin@example.com",
    });

    const pendingProfile = {
      id: "mentor-1",
      status: "PENDING",
      userId: "mentee-1",
      approvedAt: null,
      rejectedAt: null,
    };

    const realtimeCreateFirst = vi.fn().mockResolvedValue(undefined);
    const realtimeCreateSecond = vi.fn().mockResolvedValue(undefined);

    mockDb.mentorProfile.findUnique
      .mockResolvedValueOnce({ ...pendingProfile })
      .mockResolvedValueOnce({ ...pendingProfile, id: "mentor-2", userId: "mentee-2" });

    mockDb.$transaction
      .mockImplementationOnce(async (handler) =>
        handler({
          mentorProfile: {
            update: vi.fn().mockResolvedValue({ ...pendingProfile, status: "APPROVED" }),
          },
          user: {
            update: vi.fn().mockResolvedValue(undefined),
          },
          mentorDocument: {
            updateMany: vi.fn().mockResolvedValue(undefined),
          },
          realtimeEvent: {
            create: realtimeCreateFirst,
          },
        }),
      )
      .mockImplementationOnce(async (handler) =>
        handler({
          mentorProfile: {
            update: vi.fn().mockResolvedValue({
              ...pendingProfile,
              id: "mentor-2",
              userId: "mentee-2",
              status: "APPROVED",
            }),
          },
          user: {
            update: vi.fn().mockResolvedValue(undefined),
          },
          mentorDocument: {
            updateMany: vi.fn().mockResolvedValue(undefined),
          },
          realtimeEvent: {
            create: realtimeCreateSecond,
          },
        }),
      );

    mockDb.notification.create.mockResolvedValue(undefined);

    const result = await bulkReviewMentorApplications({
      mentorIds: ["mentor-1", "mentor-2"],
      decision: "approve",
    });

    expect(result.updated).toBe(2);
    expect(realtimeCreateFirst).toHaveBeenCalledTimes(1);
    expect(realtimeCreateSecond).toHaveBeenCalledTimes(1);
    expect(mockDb.notification.create).toHaveBeenCalledTimes(2);
    expect(revalidatePathMock).toHaveBeenCalledWith("/mentors/apply");
    expect(revalidatePathMock).toHaveBeenCalledWith("/mentors/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/mentors");
  });

  it("requires a rejection note when rejecting", async () => {
    await expect(
      bulkReviewMentorApplications({
        mentorIds: ["mentor-1"],
        decision: "reject",
      }),
    ).rejects.toThrow("Rejection reason is required");
  });

  it("throws when invoked by a non-admin", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    mockDb.user.findUnique.mockResolvedValue({
      id: "user_123",
      email: "not-admin@example.com",
    });

    await expect(
      bulkReviewMentorApplications({
        mentorIds: ["mentor-1"],
        decision: "approve",
      }),
    ).rejects.toThrow("Not authorized");
  });
});

