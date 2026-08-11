import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/schema";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";
import type { Provider } from "next-auth/providers";
import type { Adapter } from "@auth/core/adapters";
import { eq } from "drizzle-orm";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials: Record<string, unknown> | undefined) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      const user = await db.select().from(users).where(eq(users.email, email)).get();
      if (!user || !user.active) return null;

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return null;
      }

      if (user.lockedUntil && user.lockedUntil <= new Date()) {
        await db.update(users)
          .set({ failedAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id))
          .run();
        user.failedAttempts = 0;
        user.lockedUntil = null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        const attempts = (user.failedAttempts ?? 0) + 1;
        const updateData: { failedAttempts: number; lockedUntil?: Date | null } = {
          failedAttempts: attempts,
        };
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }
        await db.update(users)
          .set(updateData)
          .where(eq(users.id, user.id))
          .run();
        return null;
      }

      if (user.failedAttempts > 0) {
        await db.update(users)
          .set({ failedAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id))
          .run();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        emailVerified: user.emailVerified?.toISOString() ?? null,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }) as unknown as Adapter,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user: Record<string, unknown> | null }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.emailVerified = (user as { emailVerified?: string | null }).emailVerified ?? null;
      }
      return token;
    },
    async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
      const user = session.user as Record<string, unknown> | undefined;
      if (user) {
        user.id = token.id as string;
        user.role = token.role as Role;
        user.emailVerified = token.emailVerified as string | null;
      }
      return session;
    },
    async signIn({ user: rawUser, account: rawAccount }: { user: Record<string, unknown>; account: Record<string, unknown> | null }) {
      const user = rawUser as { email?: string; name?: string; id?: string; role?: string };
      const account = rawAccount as { provider?: string } | null;
      if (account?.provider && account.provider !== "credentials") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();

        if (existingUser) {
          user.id = existingUser.id;
          user.role = existingUser.role as Role;
          return true;
        }

        const newUser = await db.insert(users).values({
          name: user.name ?? email.split("@")[0],
          email,
          password: "",
          role: "USER",
          emailVerified: new Date(),
        }).returning().get();

        user.id = newUser.id;
        user.role = newUser.role as Role;

        return true;
      }
      return true;
    },
  },
});
