"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "../lib/prisma";
import { isAdminEmail } from "../lib/admin";
import { buildMentorAdminFilter } from "../lib/mentorFilters";

const MENTOR_STATUS = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
};

const MENTOR_SESSION_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const MENTOR_DOCUMENT_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const NOTIFICATION_TYPE = {
  MENTOR_STATUS: "MENTOR_STATUS",
  SESSION_REQUEST: "SESSION_REQUEST",
  SESSION_STATUS: "SESSION_STATUS",
  MESSAGE: "MESSAGE",
  RECOMMENDATION: "RECOMMENDATION",
};

const RECOMMENDATION_VISIBILITY = {
  PRIVATE: "PRIVATE",
  DASHBOARD: "DASHBOARD",
  PROFILE: "PROFILE",
};

const isAdminUser = (user) => isAdminEmail(user?.email);

async function getAuthenticatedUser(includeMentor = false) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: includeMentor
      ? {
        mentorProfile: {
          include: {
            proofDocuments: true,
          },
        },
      }
      : undefined,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function createNotification({ userId, type, title, body, metadata }) {
  if (!userId || !type) return;

  await db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      metadata,
    },
  });
}

export async function applyForMentorRole(payload) {
  const user = await getAuthenticatedUser(true);

  const {
    headline,
    bio,
    yearsExperience,
    industries = [],
    skills = [],
    hourlyRate,
    currency = "USD",
    availability,
    documents = [],
  } = payload ?? {};

  if (!headline || !bio) {
    throw new Error("Headline and bio are required");
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("At least one proof document is required");
  }

  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const mentorProfile = await tx.mentorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: MENTOR_STATUS.PENDING,
        headline,
        bio,
        yearsExperience: yearsExperience ?? null,
        industries,
        skills,
        hourlyRate: hourlyRate ?? null,
        currency,
        availability: availability ?? null,
        submittedAt: now,
        lastEventAt: now,
      },
      update: {
        status: MENTOR_STATUS.PENDING,
        headline,
        bio,
        yearsExperience: yearsExperience ?? null,
        industries,
        skills,
        hourlyRate: hourlyRate ?? null,
        currency,
        availability: availability ?? null,
        submittedAt: now,
        rejectionReason: null,
        lastEventAt: now,
      },
      include: {
        proofDocuments: true,
      },
    });

    await tx.mentorDocument.deleteMany({
      where: { mentorId: mentorProfile.id },
    });

    await tx.mentorDocument.createMany({
      data: documents.map((doc) => ({
        mentorId: mentorProfile.id,
        type: doc.type || "general",
        url: doc.url,
        description: doc.description ?? null,
        status: MENTOR_DOCUMENT_STATUS.PENDING,
      })),
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        mentorStatus: MENTOR_STATUS.PENDING,
        mentorStatusUpdatedAt: now,
        mentorStatusReason: null,
      },
    });

    await tx.realtimeEvent.create({
      data: {
        type: "mentor.application.submitted",
        mentorId: mentorProfile.id,
        payload: {
          mentorId: mentorProfile.id,
          userId: user.id,
        },
      },
    });

    return mentorProfile;
  });

  revalidatePath("/mentors/apply");

  return result;
}

export async function listMentors(filters = {}) {
  const { industry, minExperience, maxHourlyRate, skills = [] } = filters;

  const mentors = await db.mentorProfile.findMany({
    where: {
      status: MENTOR_STATUS.APPROVED,
      industries: industry ? { has: industry } : undefined,
      yearsExperience: minExperience
        ? { gte: Number(minExperience) }
        : undefined,
      hourlyRate: maxHourlyRate ? { lte: Number(maxHourlyRate) } : undefined,
      skills:
        Array.isArray(skills) && skills.length > 0
          ? { hasSome: skills }
          : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          mentorStatus: true,
        },
      },
      _count: {
        select: {
          sessions: true,
          recommendations: true,
        },
      },
    },
    orderBy: {
      approvedAt: "desc",
    },
  });

  return mentors.map((mentor) => ({
    id: mentor.id,
    userId: mentor.userId,
    status: mentor.status,
    headline: mentor.headline,
    bio: mentor.bio,
    yearsExperience: mentor.yearsExperience,
    industries: mentor.industries,
    skills: mentor.skills,
    hourlyRate: mentor.hourlyRate ? Number(mentor.hourlyRate) : null,
    currency: mentor.currency,
    ratingAverage: mentor.ratingAverage,
    sessionsCount: mentor._count.sessions,
    recommendationsCount: mentor._count.recommendations,
    user: mentor.user,
  }));
}

export async function getMentorProfile(mentorId, options = {}) {
  if (!mentorId) {
    throw new Error("Mentor id is required");
  }

  const viewer = await getAuthenticatedUser();

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          mentorStatus: true,
        },
      },
      proofDocuments: true,
      recommendations: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          visibility: true,
          createdAt: true,
          mentee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          sessions: true,
          recommendations: true,
        },
      },
    },
  });

  if (!mentorProfile) {
    throw new Error("Mentor profile not found");
  }

  const isOwner = mentorProfile.userId === viewer.id;

  if (
    mentorProfile.status !== MENTOR_STATUS.APPROVED &&
    !isOwner &&
    !options?.allowPendingView
  ) {
    throw new Error("Mentor profile is not available");
  }

  return {
    ...mentorProfile,
    hourlyRate: mentorProfile.hourlyRate ? Number(mentorProfile.hourlyRate) : null,
    proofDocuments: isOwner ? mentorProfile.proofDocuments : [],
  };
}

export async function requestMentorSession({
  mentorId,
  scheduledAt,
  durationMinutes,
  price,
  currency = "USD",
  notes,
}) {
  if (!mentorId || !scheduledAt || !durationMinutes) {
    throw new Error("Mentor, schedule, and duration are required");
  }

  const mentee = await getAuthenticatedUser();

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    select: { id: true, userId: true, status: true },
  });

  if (!mentorProfile || mentorProfile.status !== MENTOR_STATUS.APPROVED) {
    throw new Error("Mentor is not available");
  }

  if (mentorProfile.userId === mentee.id) {
    throw new Error("You cannot book a session with yourself");
  }

  const session = await db.mentorSession.create({
    data: {
      mentorId: mentorProfile.id,
      menteeId: mentee.id,
      status: MENTOR_SESSION_STATUS.PENDING,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      price: price ?? null,
      currency,
      notes: notes ?? null,
    },
    include: {
      mentor: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  await createNotification({
    userId: mentorProfile.userId,
    type: NOTIFICATION_TYPE.SESSION_REQUEST,
    title: "New session request",
    body: `You have a new 1:1 session request`,
    metadata: {
      sessionId: session.id,
      menteeId: mentee.id,
    },
  });

  revalidatePath("/mentors");

  return session;
}

export async function respondToMentorSession(sessionId, action, details = {}) {
  if (!sessionId || !action) {
    throw new Error("Session id and action are required");
  }

  const user = await getAuthenticatedUser();

  const session = await db.mentorSession.findUnique({
    where: { id: sessionId },
    include: {
      mentor: true,
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const isMentor = session.mentor.userId === user.id;
  const isMentee = session.menteeId === user.id;

  if (!isMentor && !isMentee) {
    throw new Error("You are not part of this session");
  }

  let statusUpdate;
  const now = new Date();

  switch (action) {
    case "confirm":
      if (!isMentor) {
        throw new Error("Only mentors can confirm sessions");
      }
      statusUpdate = {
        status: MENTOR_SESSION_STATUS.CONFIRMED,
        meetingUrl: details.meetingUrl ?? session.meetingUrl,
      };
      break;
    case "complete":
      if (!isMentor) {
        throw new Error("Only mentors can mark sessions as completed");
      }
      statusUpdate = {
        status: MENTOR_SESSION_STATUS.COMPLETED,
      };
      break;
    case "cancel":
      statusUpdate = {
        status: MENTOR_SESSION_STATUS.CANCELLED,
        cancelledAt: now,
        cancellationReason: details.reason ?? null,
      };
      break;
    default:
      throw new Error("Unsupported action");
  }

  const updatedSession = await db.mentorSession.update({
    where: { id: sessionId },
    data: statusUpdate,
  });

  const notifyUserId = isMentor ? session.menteeId : session.mentor.userId;

  await createNotification({
    userId: notifyUserId,
    type: NOTIFICATION_TYPE.SESSION_STATUS,
    title: `Session ${statusUpdate.status?.toLowerCase()}`,
    body: details.reason ?? undefined,
    metadata: {
      sessionId,
      action,
    },
  });

  revalidatePath("/dashboard");

  return updatedSession;
}

export async function sendMentorMessage({
  mentorId,
  menteeId,
  conversationId,
  body,
  attachments,
}) {
  if (!body) {
    throw new Error("Message body is required");
  }

  const sender = await getAuthenticatedUser();

  let conversation;

  if (conversationId) {
    conversation = await db.mentorConversation.findUnique({
      where: { id: conversationId },
    });
  } else if (mentorId && menteeId) {
    conversation = await db.mentorConversation.findUnique({
      where: {
        mentorId_menteeId: {
          mentorId,
          menteeId,
        },
      },
    });

    if (!conversation) {
      conversation = await db.mentorConversation.create({
        data: {
          mentorId,
          menteeId,
        },
      });
    }
  } else {
    throw new Error("Conversation or mentor/mentee identifiers required");
  }

  const isParticipant =
    conversation.menteeId === sender.id ||
    (await db.mentorProfile.findFirst({
      where: { id: conversation.mentorId, userId: sender.id },
      select: { id: true },
    }));

  if (!isParticipant) {
    throw new Error("You are not a participant in this conversation");
  }

  const message = await db.mentorMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: sender.id,
      body,
      attachments: attachments ?? null,
    },
  });

  await db.mentorConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
    },
  });

  const targetUserId =
    conversation.menteeId === sender.id
      ? (
        await db.mentorProfile.findUnique({
          where: { id: conversation.mentorId },
          select: { userId: true },
        })
      )?.userId
      : conversation.menteeId;

  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPE.MESSAGE,
      title: "New message received",
      metadata: {
        conversationId: conversation.id,
        messageId: message.id,
      },
    });
  }

  revalidatePath("/mentors/messages");

  return message;
}

export async function createMentorRecommendation({
  mentorId,
  menteeId,
  sessionId,
  title,
  body,
  visibility = RECOMMENDATION_VISIBILITY.DASHBOARD,
}) {
  if (!mentorId || !menteeId || !title || !body) {
    throw new Error("Mentor, mentee, title, and body are required");
  }

  const mentorUser = await getAuthenticatedUser();

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    select: { id: true, userId: true },
  });

  if (!mentorProfile) {
    throw new Error("Mentor profile not found");
  }

  if (mentorProfile.userId !== mentorUser.id) {
    throw new Error("You are not authorized to create this recommendation");
  }

  if (sessionId) {
    const session = await db.mentorSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.mentorId !== mentorProfile.id) {
      throw new Error("Invalid session reference");
    }
  }

  const recommendation = await db.mentorRecommendation.create({
    data: {
      mentorId,
      menteeId,
      sessionId: sessionId ?? null,
      title,
      body,
      visibility,
      publishedAt:
        visibility === RECOMMENDATION_VISIBILITY.PRIVATE ? null : new Date(),
    },
  });

  await createNotification({
    userId: menteeId,
    type: NOTIFICATION_TYPE.RECOMMENDATION,
    title: "You received a new recommendation",
    metadata: {
      recommendationId: recommendation.id,
      mentorId,
    },
  });

  revalidatePath("/dashboard");

  return recommendation;
}

export async function getMentorDashboardData() {
  const user = await getAuthenticatedUser(true);

  if (!user.mentorProfile) {
    throw new Error("Mentor profile not found");
  }

  const [sessions, recommendations, conversations, notifications] =
    await Promise.all([
      db.mentorSession.findMany({
        where: { mentorId: user.mentorProfile.id },
        orderBy: { scheduledAt: "asc" },
        take: 10,
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      }),
      db.mentorRecommendation.findMany({
        where: { mentorId: user.mentorProfile.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      }),
      db.mentorConversation.findMany({
        where: { mentorId: user.mentorProfile.id },
        take: 10,
        orderBy: { lastMessageAt: "desc" },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  return {
    mentorProfile: {
      ...user.mentorProfile,
      hourlyRate: user.mentorProfile.hourlyRate
        ? Number(user.mentorProfile.hourlyRate)
        : null,
    },
    sessions: sessions.map((session) => ({
      ...session,
      price: session.price ? Number(session.price) : null,
    })),
    recommendations,
    conversations,
    notifications,
  };
}

export async function getMenteeSessions() {
  const user = await getAuthenticatedUser();

  const sessions = (await db.mentorSession.findMany({
    where: { menteeId: user.id },
    orderBy: { scheduledAt: "asc" },
    include: {
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  })).map(session => ({
    ...session,
    price: session.price ? Number(session.price) : null,
  }));

  const categorize = sessions.reduce(
    (result, session) => {
      const bucket =
        session.status === MENTOR_SESSION_STATUS.COMPLETED ||
          session.status === MENTOR_SESSION_STATUS.CANCELLED
          ? "past"
          : "upcoming";

      result[bucket].push(session);
      return result;
    },
    { upcoming: [], past: [] }
  );

  return {
    upcoming: categorize.upcoming,
    past: categorize.past.sort(
      (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
    ),
  };
}

export async function getMentorInbox() {
  const user = await getAuthenticatedUser(true);

  if (!user.mentorProfile) {
    throw new Error("Mentor profile not found");
  }

  const conversations = await db.mentorConversation.findMany({
    where: {
      mentorId: user.mentorProfile.id,
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    include: {
      mentee: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
          readAt: true,
        },
      },
    },
    take: 20,
  });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await db.mentorMessage.count({
        where: {
          conversationId: conversation.id,
          readAt: null,
          NOT: {
            senderId: user.id,
          },
        },
      });

      return {
        ...conversation,
        unreadCount,
      };
    })
  );

  return {
    mentorProfile: {
      ...user.mentorProfile,
      hourlyRate: user.mentorProfile.hourlyRate
        ? Number(user.mentorProfile.hourlyRate)
        : null,
    },
    conversations: conversationsWithUnread,
    unreadCount: conversationsWithUnread.reduce(
      (total, convo) => total + convo.unreadCount,
      0
    ),
  };
}

export async function getMentorApplications({
  status,
  search,
  page = 1,
  pageSize = 6,
} = {}) {
  const user = await getAuthenticatedUser(true);

  if (!isAdminUser(user)) {
    throw new Error("Not authorized");
  }

  const baseFilter = buildMentorAdminFilter({ search });
  const dataFilter = buildMentorAdminFilter({ status, search });

  const skip = (Math.max(page, 1) - 1) * pageSize;

  const [
    applications,
    totalMatching,
    totalAll,
    pendingCount,
    approvedCount,
    rejectedCount,
    latestEventAggregate,
  ] = await Promise.all([
    db.mentorProfile.findMany({
      where: dataFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            mentorStatus: true,
            mentorStatusUpdatedAt: true,
          },
        },
        proofDocuments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
      skip,
      take: pageSize,
    }),
    db.mentorProfile.count({ where: dataFilter }),
    db.mentorProfile.count({ where: baseFilter }),
    db.mentorProfile.count({
      where: { ...baseFilter, status: MENTOR_STATUS.PENDING },
    }),
    db.mentorProfile.count({
      where: { ...baseFilter, status: MENTOR_STATUS.APPROVED },
    }),
    db.mentorProfile.count({
      where: { ...baseFilter, status: MENTOR_STATUS.REJECTED },
    }),
    db.mentorProfile.aggregate({
      where: baseFilter,
      _max: { lastEventAt: true },
    }),
  ]);

  const pending = applications.filter(
    (application) => application.status === MENTOR_STATUS.PENDING
  );
  const reviewed = applications.filter(
    (application) => application.status !== MENTOR_STATUS.PENDING
  );

  const serialize = (app) => ({
    ...app,
    hourlyRate: app.hourlyRate ? Number(app.hourlyRate) : null,
  });

  return {
    pending: pending.map(serialize),
    reviewed: reviewed.map(serialize),
    pagination: {
      page,
      pageSize,
      total: totalMatching,
      totalPages: Math.max(1, Math.ceil(totalMatching / pageSize)),
    },
    counts: {
      all: totalAll,
      PENDING: pendingCount,
      APPROVED: approvedCount,
      REJECTED: rejectedCount,
    },
    latestEventAt: latestEventAggregate._max.lastEventAt ?? null,
  };
}

export async function reviewMentorApplication(
  { mentorId, decision, reason },
  { skipRevalidate = false } = {}
) {
  if (!mentorId || !decision) {
    throw new Error("Mentor ID and decision are required");
  }

  const adminUser = await getAuthenticatedUser(true);

  if (!isAdminUser(adminUser)) {
    throw new Error("Not authorized");
  }

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    include: { user: true },
  });

  if (!mentorProfile) {
    throw new Error("Mentor profile not found");
  }

  if (mentorProfile.status !== MENTOR_STATUS.PENDING) {
    throw new Error("Mentor application has already been reviewed");
  }

  const now = new Date();
  const statusUpdate =
    decision === "approve" ? MENTOR_STATUS.APPROVED : MENTOR_STATUS.REJECTED;

  if (statusUpdate === MENTOR_STATUS.REJECTED && (!reason || !reason.trim())) {
    throw new Error("Rejection reason is required");
  }

  const updatedMentorProfile = await db.$transaction(async (tx) => {
    const profile = await tx.mentorProfile.update({
      where: { id: mentorId },
      data: {
        status: statusUpdate,
        approvedAt:
          statusUpdate === MENTOR_STATUS.APPROVED
            ? now
            : mentorProfile.approvedAt,
        rejectedAt:
          statusUpdate === MENTOR_STATUS.REJECTED
            ? now
            : mentorProfile.rejectedAt,
        rejectionReason:
          statusUpdate === MENTOR_STATUS.REJECTED ? reason ?? null : null,
        lastEventAt: now,
      },
    });

    await tx.user.update({
      where: { id: mentorProfile.userId },
      data: {
        mentorStatus: statusUpdate,
        mentorStatusUpdatedAt: now,
        mentorStatusReason:
          statusUpdate === MENTOR_STATUS.REJECTED ? reason ?? null : null,
      },
    });

    await tx.mentorDocument.updateMany({
      where: { mentorId },
      data: {
        status:
          statusUpdate === MENTOR_STATUS.APPROVED
            ? MENTOR_DOCUMENT_STATUS.APPROVED
            : MENTOR_DOCUMENT_STATUS.REJECTED,
        verifiedBy: adminUser.id,
        verifiedAt: now,
      },
    });

    await createNotification({
      userId: mentorProfile.userId,
      type: NOTIFICATION_TYPE.MENTOR_STATUS,
      title:
        statusUpdate === MENTOR_STATUS.APPROVED
          ? "Your mentor application was approved"
          : "Your mentor application was rejected",
      body:
        statusUpdate === MENTOR_STATUS.APPROVED
          ? "You can now access the mentor dashboard and appear in the mentor marketplace."
          : reason || "Please review the notes and apply again when ready.",
      metadata: {
        href:
          statusUpdate === MENTOR_STATUS.APPROVED
            ? "/mentors/dashboard"
            : "/mentors/apply",
      },
    });

    await tx.realtimeEvent.create({
      data: {
        type:
          statusUpdate === MENTOR_STATUS.APPROVED
            ? "mentor.application.approved"
            : "mentor.application.rejected",
        mentorId,
        payload: {
          mentorId,
          decision,
          reason:
            statusUpdate === MENTOR_STATUS.REJECTED ? reason ?? null : null,
        },
      },
    });

    return profile;
  });

  if (!skipRevalidate) {
    revalidatePath("/mentors/apply");
    revalidatePath("/mentors/dashboard");
    revalidatePath("/admin/mentors");
  }

  return updatedMentorProfile;
}

export async function bulkReviewMentorApplications({
  mentorIds,
  decision,
  reason,
}) {
  if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
    throw new Error("No mentor applications selected");
  }

  if (decision === "reject" && (!reason || !reason.trim())) {
    throw new Error("Rejection reason is required");
  }

  const adminUser = await getAuthenticatedUser(true);

  if (!isAdminUser(adminUser)) {
    throw new Error("Not authorized");
  }

  const results = {
    updated: 0,
    errors: [],
  };

  for (const mentorId of mentorIds) {
    try {
      await reviewMentorApplication(
        { mentorId, decision, reason },
        { skipRevalidate: true }
      );
      results.updated += 1;
    } catch (error) {
      results.errors.push({ mentorId, message: error.message });
    }
  }

  revalidatePath("/mentors/apply");
  revalidatePath("/mentors/dashboard");
  revalidatePath("/admin/mentors");

  if (results.errors.length && results.updated === 0) {
    throw new Error(results.errors[0].message || "Bulk action failed");
  }

  return results;
}

export async function getMentorConversation(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation id is required");
  }

  const user = await getAuthenticatedUser();

  const conversation = await db.mentorConversation.findUnique({
    where: { id: conversationId },
    include: {
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
      mentee: {
        select: { id: true, name: true, imageUrl: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const isParticipant =
    conversation.menteeId === user.id || conversation.mentor.userId === user.id;

  if (!isParticipant) {
    throw new Error("You are not part of this conversation");
  }

  return conversation;
}

export async function markMentorConversationRead(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation id is required");
  }

  const user = await getAuthenticatedUser();

  const conversation = await db.mentorConversation.findUnique({
    where: { id: conversationId },
    select: { mentorId: true, menteeId: true },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const mentorProfile = await db.mentorProfile.findFirst({
    where: { id: conversation.mentorId },
    select: { userId: true },
  });

  const isParticipant =
    conversation.menteeId === user.id || mentorProfile?.userId === user.id;

  if (!isParticipant) {
    throw new Error("You are not part of this conversation");
  }

  await db.mentorMessage.updateMany({
    where: {
      conversationId,
      senderId: {
        not: user.id,
      },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/mentors/messages");
  revalidatePath("/mentors/dashboard");
}
