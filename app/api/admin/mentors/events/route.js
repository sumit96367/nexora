"use server";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/prisma";
import { isAdminEmail } from "../../../../../lib/admin";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { email: true },
  });

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [latest, pendingCount] = await Promise.all([
    db.mentorProfile.findFirst({
      orderBy: { lastEventAt: "desc" },
      select: { lastEventAt: true },
    }),
    db.mentorProfile.count({
      where: { status: "PENDING" },
    }),
  ]);

  return NextResponse.json({
    lastEventAt: latest?.lastEventAt?.toISOString() ?? null,
    pendingCount,
  });
}

