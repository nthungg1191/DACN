import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email và mật khẩu là bắt buộc');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Safely get server session with JWT decryption error handling
 * Returns null if session is invalid or expired
 */
export async function getSafeServerSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error: any) {
    // Handle JWT decryption errors - session is invalid/expired
    if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
      console.error('JWT decryption failed - session is invalid:', error);
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Create unauthorized response with cleared cookies
 * Use this when session is invalid or missing
 */
export function createUnauthorizedResponse(): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 }
  );
  // Clear invalid session cookies
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  return response;
}

/**
 * Get user ID from session
 * Returns null if session or user ID is missing
 */
export function getUserIdFromSession(session: any): string | null {
  if (!session?.user) return null;
  return (session.user as any)?.id || null;
}

