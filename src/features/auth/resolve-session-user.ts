import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/shared/lib/mongodb";
import { User } from "@/features/users/models/User.model";
import type { Role } from "@/shared/constants/roles";

export type ResolvedSessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
  preferredLocale: string;
};

/** Authoritative session user from DB (JWT role alone can be stale). */
export async function resolveSessionUser(
  req: Request | { headers: Headers },
): Promise<ResolvedSessionUser | null> {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.sub) return null;

  await connectMongo();
  const user = await User.findById(token.sub).select(
    "email name role isActive preferredLocale",
  );
  if (!user?.isActive) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId: (token.jti as string) ?? token.sub,
    preferredLocale: user.preferredLocale,
  };
}
