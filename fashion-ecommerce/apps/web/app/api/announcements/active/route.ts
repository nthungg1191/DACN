import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getCurrentUser } from '@/lib/auth-server';

// GET /api/announcements/active - get current active announcement for client
export async function GET() {
  try {
    const now = new Date();

    // Optional: use user info later for targeting
    const user = await getCurrentUser().catch(() => null);
    void user;

    const announcement = await prisma.announcement.findFirst({
      where: {
        active: true,
        AND: [
          {
            OR: [{ startAt: null }, { startAt: { lte: now } }],
          },
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch announcement',
      },
      { status: 500 }
    );
  }
}


