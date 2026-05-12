import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const LOGIN_SESSION_MAX_AGE_DAYS = 30;
const LOGIN_SESSION_MAX_AGE_MS = LOGIN_SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function getClientIp(request) {
  if (!request?.headers?.get) return null;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("true-client-ip") ||
    null
  );
}

function getUserAgent(request) {
  if (!request?.headers?.get) return null;
  return request.headers.get("user-agent") || null;
}

function randomUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // RFC 4122 section 4.4 (UUIDv4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${Date.now()}-${Math.random()}`;
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API not available for SHA-256 hashing");
  }

  const data = new TextEncoder().encode(value);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        if (!identifier) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { username: { equals: identifier, mode: "insensitive" } },
            ],
          },
          include: {
            student: true,
            lecturer: true,
            admin: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        let loginSessionId = null;
        try {
          loginSessionId = randomUuid();
          const tokenHash = await sha256Hex(loginSessionId);
          const now = new Date();

          await prisma.$transaction([
            prisma.loginSession.create({
              data: {
                sessionId: loginSessionId,
                userId: user.userId,
                tokenHash,
                ipAddress: getClientIp(request),
                userAgent: getUserAgent(request),
                expiresAt: new Date(now.getTime() + LOGIN_SESSION_MAX_AGE_MS),
              },
            }),
            prisma.user.update({
              where: { userId: user.userId },
              data: { lastLoginAt: now },
            }),
          ]);
        } catch (error) {
          console.error("Failed to record login session:", error);
          loginSessionId = null;
        }

        return {
          id: user.userId,
          email: user.email,
          name: user.username,
          role: user.role,
          loginSessionId,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      try {
        const sessionId = message?.token?.loginSessionId;
        if (!sessionId) return;

        await prisma.loginSession.updateMany({
          where: { sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch (error) {
        console.error("Failed to revoke login session:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.loginSessionId = user.loginSessionId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
});
