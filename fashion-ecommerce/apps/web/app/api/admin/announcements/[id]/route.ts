import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { requireAdmin } from '@/lib/auth-server';
import { z } from 'zod';

const announcementUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  type: z.enum(['INFO', 'COUPON', 'EVENT']).optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/announcements/[id]
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await context.params;

  const item = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!item) {
    return NextResponse.json(
      {
        success: false,
        error: 'Announcement not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: item,
  });
}

// PATCH /api/admin/announcements/[id]
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = announcementUpdateSchema.parse(body);

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.message !== undefined && { message: parsed.message }),
        ...(parsed.type !== undefined && { type: parsed.type }),
        ...(parsed.ctaLabel !== undefined && { ctaLabel: parsed.ctaLabel }),
        ...(parsed.ctaUrl !== undefined && { ctaUrl: parsed.ctaUrl }),
        ...(parsed.active !== undefined && { active: parsed.active }),
        ...(parsed.startAt !== undefined && {
          startAt: parsed.startAt ? new Date(parsed.startAt) : null,
        }),
        ...(parsed.endAt !== undefined && {
          endAt: parsed.endAt ? new Date(parsed.endAt) : null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
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
        error: 'Failed to update announcement',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: true,
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete announcement',
      },
      { status: 500 }
    );
  }
}


