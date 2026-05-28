import type { AbstractIntlMessages } from "next-intl";

type MessageModule = { default: Record<string, unknown> };

async function importJson(
  locale: string,
  path: string,
): Promise<Record<string, unknown>> {
  const mod = (await import(
    `../../../messages/${locale}/${path}.json`
  )) as MessageModule;
  return mod.default;
}

/** Loads all namespace JSON files into a nested messages object for next-intl. */
export async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  const [
    common,
    meta,
    auth,
    errors,
    roles,
    adminLayout,
    adminDashboard,
    adminStaff,
    adminStudents,
    adminUploads,
    adminHierarchy,
    adminUsers,
    adminUsage,
    studentLayout,
    studentBrowse,
    studentCode,
    studentWatch,
  ] = await Promise.all([
    importJson(locale, "common"),
    importJson(locale, "meta"),
    importJson(locale, "auth"),
    importJson(locale, "errors"),
    importJson(locale, "roles"),
    importJson(locale, "admin/layout"),
    importJson(locale, "admin/dashboard"),
    importJson(locale, "admin/staff"),
    importJson(locale, "admin/students"),
    importJson(locale, "admin/uploads"),
    importJson(locale, "admin/hierarchy"),
    importJson(locale, "admin/users"),
    importJson(locale, "admin/usage"),
    importJson(locale, "student/layout"),
    importJson(locale, "student/browse"),
    importJson(locale, "student/code"),
    importJson(locale, "student/watch"),
  ]);

  return {
    common,
    meta,
    auth,
    errors,
    roles,
    admin: {
      layout: adminLayout,
      dashboard: adminDashboard,
      staff: adminStaff,
      students: adminStudents,
      uploads: adminUploads,
      hierarchy: adminHierarchy,
      users: adminUsers,
      usage: adminUsage,
    },
    student: {
      layout: studentLayout,
      browse: studentBrowse,
      code: studentCode,
      watch: studentWatch,
    },
  } as AbstractIntlMessages;
}
