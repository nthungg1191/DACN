import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@repo/database';
import { AdminAnnouncementsClient } from '@/components/admin/announcements/AdminAnnouncementsClient';

export default async function AdminAnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login?callbackUrl=/admin/announcements');
  }
  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const serialized = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    type: a.type,
    ctaLabel: a.ctaLabel,
    ctaUrl: a.ctaUrl,
    active: a.active,
    startAt: a.startAt ? a.startAt.toISOString() : null,
    endAt: a.endAt ? a.endAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AdminAnnouncementsClient initialAnnouncements={serialized} />;
}


