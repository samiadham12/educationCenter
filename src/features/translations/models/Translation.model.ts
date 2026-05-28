import mongoose, { Schema, type Document, type Model } from "mongoose";

export const TRANSLATABLE_ENTITY_TYPES = [
  "AcademicYear",
  "Term",
  "Subject",
  "Section",
  "Lecture",
] as const;

export type TranslatableEntityType =
  (typeof TRANSLATABLE_ENTITY_TYPES)[number];

export const TRANSLATABLE_FIELDS = ["name", "title", "description"] as const;

export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

export interface ITranslation extends Document {
  entityType: TranslatableEntityType;
  entityId: mongoose.Types.ObjectId;
  locale: string;
  field: TranslatableField;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSchema = new Schema<ITranslation>(
  {
    entityType: {
      type: String,
      enum: TRANSLATABLE_ENTITY_TYPES,
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    locale: { type: String, required: true, trim: true, maxlength: 20 },
    field: {
      type: String,
      enum: TRANSLATABLE_FIELDS,
      required: true,
    },
    value: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

TranslationSchema.index(
  { entityType: 1, entityId: 1, locale: 1, field: 1 },
  { unique: true },
);
TranslationSchema.index({ entityType: 1, entityId: 1, locale: 1 });

export const Translation: Model<ITranslation> =
  mongoose.models.Translation ??
  mongoose.model<ITranslation>("Translation", TranslationSchema);
