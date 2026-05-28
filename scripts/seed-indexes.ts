import "dotenv/config";
import { connectMongo } from "../src/shared/lib/mongodb";
import { User } from "../src/features/users/models/User.model";
import { AcademicYear } from "../src/features/academic-years/models/AcademicYear.model";
import { Term } from "../src/features/terms/models/Term.model";
import { Subject } from "../src/features/subjects/models/Subject.model";
import { Section } from "../src/features/sections/models/Section.model";
import { Lecture } from "../src/features/lectures/models/Lecture.model";
import { Media } from "../src/features/media/models/Media.model";
import { LectureCode } from "../src/features/lecture-codes/models/LectureCode.model";
import { LectureCodeUsage } from "../src/features/lecture-codes/models/LectureCodeUsage.model";
import { Subscription } from "../src/features/subscriptions/models/Subscription.model";
import { Progress } from "../src/features/progress-tracking/models/Progress.model";
import { AuditLog } from "../src/features/auth/models/AuditLog.model";
import { Session } from "../src/features/auth/models/Session.model";
import { Account } from "../src/features/auth/models/Account.model";
import { VerificationToken } from "../src/features/auth/models/VerificationToken.model";

async function main() {
  await connectMongo();

  const models = [
    User,
    AcademicYear,
    Term,
    Subject,
    Section,
    Lecture,
    Media,
    LectureCode,
    LectureCodeUsage,
    Subscription,
    Progress,
    AuditLog,
    Session,
    Account,
    VerificationToken,
  ];

  for (const model of models) {
    await model.syncIndexes();
    console.log(`Synced indexes: ${model.modelName}`);
  }

  console.log("All indexes synced.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
