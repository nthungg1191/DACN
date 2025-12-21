import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { prisma } from '@repo/database';
import { getSafeServerSession } from './auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Try NextAuth session first (for OAuth users like Google)
    const session = await getSafeServerSession();
    
    if (session?.user) {
      const userId = (session.user as any)?.id;
      const userEmail = session.user.email;
      
      if (userId && userEmail) {
        // Get user from database to ensure we have latest data
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            image: true,
          },
        });

        if (user) {
          return user as AuthUser;
        }
      }
    }

    // Fallback to custom JWT token (for email/password auth)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require admin role - throws error if user is not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return user;
}

/**
 * Create unauthorized response with cleared cookies
 * Use this when user is not authenticated
 */
export function createUnauthorizedResponse(): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 }
  );
  // Clear invalid auth token cookie
  response.cookies.delete('auth-token');
  return response;
}

/**
 * Create forbidden response
 * Use this when user is authenticated but doesn't have required permissions
 */
export function createForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden - Admin access required',
    },
    { status: 403 }
  );
}

