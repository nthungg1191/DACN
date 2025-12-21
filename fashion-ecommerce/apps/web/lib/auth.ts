import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { sendRegistrationEmail } from './email';

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user from Google account
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || 'User',
                image: user.image,
                role: 'CUSTOMER',
                // No password for OAuth users
                password: null,
              },
            });

            // Send welcome email for new Google sign-ups
            try {
              await sendRegistrationEmail(newUser.email, newUser.name || 'User');
            } catch (emailError) {
              console.error('Failed to send registration email:', emailError);
              // Don't fail sign-in if email fails
            }
          }
        } catch (error) {
          console.error('Error in Google sign-in callback:', error);
          return false; // Prevent sign-in on error
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Handle initial sign-in
      if (user) {
        // For credentials provider, user already has id and role
        if (user.id) {
          token.id = user.id;
          token.role = (user as any).role;
          token.email = user.email;
        }
      }
      
      // If signing in with Google, fetch user from database to get id and role
      // This runs on every JWT callback, but we check if token.id is already set
      if (account?.provider === 'google' && user?.email && !token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = user.email;
            console.log('✅ Google user authenticated:', { id: dbUser.id, email: user.email });
          } else {
            console.error('❌ Google user not found in database:', user.email);
          }
        } catch (error) {
          console.error('❌ Error fetching user in JWT callback:', error);
        }
      }
      
      // If token already has id but no role, fetch role from database
      if (token.id && !token.role && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { role: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('❌ Error fetching role in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).email = token.email as string;
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
    maxAge: 7 * 24 * 60 * 60,   // ví dụ 7 ngày
    updateAge: 24 * 60 * 60,    // thời gian refresh (mặc định 24h)
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

