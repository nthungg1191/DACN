'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'COUPON' | 'EVENT';
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

const STORAGE_KEY_PREFIX = 'dismissed_announcement_';

export function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/announcements/active', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const ann: Announcement | null = data?.data || null;
        if (!ann || !isMounted) return;

        const dismissedKey = STORAGE_KEY_PREFIX + ann.id;
        if (typeof window !== 'undefined' && localStorage.getItem(dismissedKey) === '1') {
          return;
        }

        setAnnouncement(ann);
      } catch (error) {
        console.error('Failed to load announcement', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnnouncement();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !announcement) return null;

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PREFIX + announcement.id, '1');
    }
    setAnnouncement(null);
  };

  const typeColors: Record<Announcement['type'], string> = {
    INFO: 'bg-blue-600 hover:bg-blue-700',
    COUPON: 'bg-emerald-600 hover:bg-emerald-700',
    EVENT: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 pointer-events-none">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* card */}
      <div className="pointer-events-auto relative max-w-xl w-full rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.45)] overflow-hidden animate-[fadeInUp_0.35s_ease-out]">
        {/* colored accent bar */}
        <div
          className={`h-1 bg-gradient-to-r ${
            announcement.type === 'COUPON'
              ? 'from-emerald-400 via-emerald-500 to-emerald-600'
              : announcement.type === 'EVENT'
              ? 'from-purple-400 via-fuchsia-500 to-purple-700'
              : 'from-sky-400 via-blue-500 to-indigo-600'
          }`}
        />

        <div className="flex items-start gap-4 bg-white px-5 py-4">
          {/* Icon */}
          <div className="mt-1 h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 text-sm font-semibold shadow-inner">
            {announcement.type === 'COUPON'
              ? '%'
              : announcement.type === 'EVENT'
              ? 'EV'
              : 'i'}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-semibold text-gray-900">
              {announcement.title}
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {announcement.message}
            </p>
            {announcement.ctaUrl && announcement.ctaLabel && (
              <div className="pt-2">
                <a
                  href={announcement.ctaUrl}
                  className={`inline-flex items-center px-4 py-1.5 text-xs font-semibold tracking-wide text-white rounded-full shadow-sm ${typeColors[announcement.type]}`}
                >
                  {announcement.ctaLabel}
                </a>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="ml-1 mt-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


