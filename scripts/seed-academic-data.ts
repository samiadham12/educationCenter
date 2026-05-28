import "dotenv/config";
import { connectMongo } from "../src/shared/lib/mongodb";
import { AcademicYear } from "../src/features/academic-years/models/AcademicYear.model";
import { Term } from "../src/features/terms/models/Term.model";

async function main() {
  await connectMongo();

  const yearNames = [
    "First Year",
    "Second Year",
    "Third Year",
    "Fourth Year",
  ];

  for (let order = 1; order <= 4; order++) {
    let year = await AcademicYear.findOne({ order });
    if (!year) {
      year = await AcademicYear.create({
        name: yearNames[order - 1],
        order,
        isActive: true,
      });
      console.log(`Created year: ${year.name}`);
    }

    for (const termOrder of [1, 2] as const) {
      const exists = await Term.findOne({
        academicYearId: year._id,
        order: termOrder,
      });
      if (!exists) {
        await Term.create({
          name: `Term ${termOrder}`,
          academicYearId: year._id,
          order: termOrder,
          isActive: true,
        });
        console.log(`  Created Term ${termOrder} for ${year.name}`);
      }
    }
  }

  console.log("Academic seed done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
