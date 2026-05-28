import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/shared/lib/mongodb";
import clientPromise from "@/shared/lib/mongo-client";
import { User } from "@/features/users/models/User.model";
import { checkAndPromoteStudent } from "@/features/academic-years/services/promotion.service";
import { cacheSet } from "@/shared/lib/redis";
import type { Role } from "@/shared/constants/roles";

declare module "next-auth" {
  interface User {
    role: Role;
    preferredLocale?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      preferredLocale: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    preferredLocale?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: "auth_adapter_users",
      Accounts: "accounts",
      Sessions: "auth_adapter_sessions",
      VerificationTokens: "verification_tokens",
    },
  }),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectMongo();
        const user = await User.findOne({
          email: String(credentials.email).toLowerCase(),
          isActive: true,
        }).select("+passwordHash preferredLocale");

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash,
        );
        if (!valid) return null;

        if (user.role === "STUDENT") {
          await checkAndPromoteStudent(user._id.toString());
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          preferredLocale: user.preferredLocale,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
        token.jti = crypto.randomUUID();
        token.preferredLocale = user.preferredLocale;
      } else if (token.sub) {
        await connectMongo();
        const dbUser = await User.findById(token.sub).select(
          "role isActive preferredLocale",
        );
        if (dbUser?.isActive) {
          token.role = dbUser.role;
          token.preferredLocale = dbUser.preferredLocale;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role) ?? "STUDENT";
        session.user.preferredLocale =
          (token.preferredLocale as string | undefined) ?? "en";
        if (token.sub && token.jti) {
          await cacheSet(
            `user:session:${token.jti}`,
            JSON.stringify({
              id: token.sub,
              role: token.role,
              email: session.user.email,
            }),
            86400,
          );
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/en/login",
    newUser: "/en/signup",
  },
  secret: process.env.AUTH_SECRET,
});
