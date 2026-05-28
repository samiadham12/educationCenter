import type { ApiContext } from "@/shared/types/api";
import { jsonResponse, errorResponse } from "@/shared/utils/response";
import { ErrorCodes } from "@/shared/constants/error-codes";
import { isValidLocale } from "@/shared/i18n/locales";
import {
  TRANSLATABLE_ENTITY_TYPES,
  TRANSLATABLE_FIELDS,
  type TranslatableEntityType,
  type TranslatableField,
} from "../models/Translation.model";
import {
  getTranslationsForEntity,
  upsertTranslation,
} from "../services/translation.service";

function parseEntityType(value: string): TranslatableEntityType | null {
  return TRANSLATABLE_ENTITY_TYPES.includes(value as TranslatableEntityType)
    ? (value as TranslatableEntityType)
    : null;
}

export async function handleGetTranslations(
  ctx: ApiContext,
): Promise<Response> {
  if (!ctx.user) {
    return errorResponse(
      "Unauthorized",
      401,
      ErrorCodes.AUTH_UNAUTHORIZED,
    );
  }

  const entityType = parseEntityType(ctx.segments[1] ?? "");
  const entityId = ctx.segments[2];
  if (!entityType || !entityId) {
    return errorResponse("Not found", 404, ErrorCodes.NOT_FOUND);
  }

  const locale = ctx.query.get("locale") ?? undefined;
  const map = await getTranslationsForEntity(entityType, entityId, locale);
  const translations: Record<string, string> = {};
  map.forEach((value, key) => {
    translations[key] = value;
  });

  return jsonResponse({ entityType, entityId, translations });
}

export async function handlePutTranslations(
  ctx: ApiContext,
): Promise<Response> {
  if (!ctx.user) {
    return errorResponse(
      "Unauthorized",
      401,
      ErrorCodes.AUTH_UNAUTHORIZED,
    );
  }

  const entityType = parseEntityType(ctx.segments[1] ?? "");
  const entityId = ctx.segments[2];
  if (!entityType || !entityId) {
    return errorResponse("Not found", 404, ErrorCodes.NOT_FOUND);
  }

  const body = ctx.body as {
    locale?: string;
    fields?: Record<string, string>;
  };

  if (!body.locale || !isValidLocale(body.locale)) {
    return errorResponse(
      "Invalid locale",
      400,
      ErrorCodes.LOCALE_INVALID,
    );
  }

  if (!body.fields || typeof body.fields !== "object") {
    return errorResponse(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_FAILED,
    );
  }

  const results = [];
  for (const [field, value] of Object.entries(body.fields)) {
    if (!TRANSLATABLE_FIELDS.includes(field as TranslatableField)) continue;
    if (typeof value !== "string") continue;
    const doc = await upsertTranslation(
      entityType,
      entityId,
      body.locale,
      field as TranslatableField,
      value,
    );
    results.push(doc);
  }

  return jsonResponse({ updated: results.length });
}
