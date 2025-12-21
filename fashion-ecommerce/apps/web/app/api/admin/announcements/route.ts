import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  message: z.string().min(1, 'Nội dung là bắt buộc'),
  type: z.enum(['INFO', 'COUPON', 'EVENT']).optional().default('INFO'),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/announcements - list all announcements
export async function GET() {
  await requireAdmin();

  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: items,
  });
}

// POST /api/admin/announcements - create new announcement
export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const parsed = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.title,
        message: parsed.message,
        type: parsed.type,
        ctaLabel: parsed.ctaLabel || null,
        ctaUrl: parsed.ctaUrl || null,
        active: parsed.active ?? true,
        startAt: parsed.startAt ? new Date(parsed.startAt) : null,
        endAt: parsed.endAt ? new Date(parsed.endAt) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: announcement,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create announcement',
      },
      { status: 500 }
    );
  }
}


