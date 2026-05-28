import { AcademicYear } from "@/features/academic-years/models/AcademicYear.model";
import { Term } from "@/features/terms/models/Term.model";

const YEAR_NAMES = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
] as const;

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

/** Idempotent bootstrap when the database has no active academic years yet. */
export async function ensureDefaultAcademicYears(): Promise<void> {
  const activeCount = await AcademicYear.countDocuments({ isActive: true });
  if (activeCount > 0) return;

  for (let order = 1; order <= 4; order++) {
    let year = await AcademicYear.findOne({ order });
    if (!year) {
      try {
        year = await AcademicYear.create({
          name: YEAR_NAMES[order - 1],
          order,
          isActive: true,
        });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
        year = await AcademicYear.findOne({ order });
        if (!year) {
          throw new Error(`Failed to bootstrap academic year ${order}`);
        }
      }
    }

    if (!year.isActive) {
      year.isActive = true;
      await year.save();
    }

    for (const termOrder of [1, 2] as const) {
      const exists = await Term.findOne({
        academicYearId: year._id,
        order: termOrder,
      });
      if (exists) continue;

      try {
        await Term.create({
          name: `Term ${termOrder}`,
          academicYearId: year._id,
          order: termOrder,
          isActive: true,
        });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
  }
}
