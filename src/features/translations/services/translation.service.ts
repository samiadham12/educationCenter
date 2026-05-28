import { connectMongo } from "@/shared/lib/mongodb";
import { getDefaultLocale } from "@/shared/i18n/locales";
import {
  Translation,
  type TranslatableEntityType,
  type TranslatableField,
} from "../models/Translation.model";

export async function getTranslationsForEntity(
  entityType: TranslatableEntityType,
  entityId: string,
  locale?: string,
): Promise<Map<string, string>> {
  await connectMongo();
  const filter: Record<string, unknown> = {
    entityType,
    entityId,
  };
  if (locale) filter.locale = locale;

  const rows = await Translation.find(filter).lean();
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(`${row.locale}.${row.field}`, row.value);
  }
  return map;
}

export async function upsertTranslation(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string,
  field: TranslatableField,
  value: string,
) {
  await connectMongo();
  return Translation.findOneAndUpdate(
    { entityType, entityId, locale, field },
    { value },
    { upsert: true, new: true },
  );
}

export function localizeField(
  rawValue: string,
  translations: Map<string, string>,
  locale: string,
  field: TranslatableField,
  defaultLocale: string = getDefaultLocale(),
): string {
  const requested = translations.get(`${locale}.${field}`);
  if (requested) return requested;
  const fallback = translations.get(`${defaultLocale}.${field}`);
  if (fallback) return fallback;
  return rawValue;
}

export async function getLocalizedField(
  entityType: TranslatableEntityType,
  entityId: string,
  field: TranslatableField,
  rawValue: string,
  locale: string,
): Promise<string> {
  const map = await getTranslationsForEntity(entityType, entityId);
  return localizeField(rawValue, map, locale, field);
}
