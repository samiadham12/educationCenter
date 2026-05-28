import "dotenv/config";
import { connectMongo } from "../src/shared/lib/mongodb";
import { User } from "../src/features/users/models/User.model";
import { AcademicYear } from "../src/features/academic-years/models/AcademicYear.model";

async function main() {
  await connectMongo();

  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@example.com";
  const password =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? "change-on-first-login";

  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      email,
      passwordHash: password,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      currentYearOrder: 1,
    });
    console.log(`Created SUPER_ADMIN: ${email}`);
  } else {
    console.log(`SUPER_ADMIN already exists: ${email}`);
  }

  const yearNames = [
    "First Year",
    "Second Year",
    "Third Year",
    "Fourth Year",
  ];
  for (let order = 1; order <= 4; order++) {
    const exists = await AcademicYear.findOne({ order });
    if (!exists) {
      await AcademicYear.create({
        name: yearNames[order - 1],
        order,
        isActive: true,
      });
      console.log(`Created academic year: ${yearNames[order - 1]}`);
    }
  }

  if (admin && !admin.currentAcademicYearId) {
    const firstYear = await AcademicYear.findOne({ order: 1 });
    if (firstYear) {
      admin.currentAcademicYearId = firstYear._id;
      await admin.save();
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
