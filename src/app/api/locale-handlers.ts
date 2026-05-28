import type { ApiContext } from "@/shared/types/api";
import { jsonResponse, errorResponse } from "@/shared/utils/response";
import { ErrorCodes } from "@/shared/constants/error-codes";
import { isValidLocale } from "@/shared/i18n/locales";
import { connectMongo } from "@/shared/lib/mongodb";
import { User } from "@/features/users/models/User.model";

export async function handlePatchUserLocale(
  ctx: ApiContext,
): Promise<Response> {
  if (!ctx.user) {
    return errorResponse(
      "Unauthorized",
      401,
      ErrorCodes.AUTH_UNAUTHORIZED,
    );
  }

  const body = ctx.body as { locale?: string };
  const locale = body.locale?.trim();

  if (!locale || !isValidLocale(locale)) {
    return errorResponse(
      "Invalid locale",
      400,
      ErrorCodes.LOCALE_INVALID,
    );
  }

  await connectMongo();
  const user = await User.findByIdAndUpdate(
    ctx.user.id,
    { preferredLocale: locale },
    { new: true },
  ).select("-passwordHash");

  if (!user) {
    return errorResponse("User not found", 404, ErrorCodes.USER_NOT_FOUND);
  }

  return jsonResponse({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      preferredLocale: user.preferredLocale,
    },
  });
}
