import { AcademicYear } from "@/features/academic-years/models/AcademicYear.model";
import { Term } from "@/features/terms/models/Term.model";
import { cacheGet, cacheSet } from "@/shared/lib/redis";

const CACHE_KEY = "hierarchy:years";
const TTL = 3600;

export async function getCachedHierarchyTree(): Promise<unknown> {
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const years = await AcademicYear.find({ isActive: true })
    .sort({ order: 1 })
    .lean();
  const tree = [];

  for (const year of years) {
    const terms = await Term.find({
      academicYearId: year._id,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean();
    tree.push({ ...year, terms });
  }

  await cacheSet(CACHE_KEY, JSON.stringify(tree), TTL);
  return tree;
}

export async function invalidateHierarchyCache(): Promise<void> {
  const { cacheDel } = await import("@/shared/lib/redis");
  await cacheDel(CACHE_KEY);
}
