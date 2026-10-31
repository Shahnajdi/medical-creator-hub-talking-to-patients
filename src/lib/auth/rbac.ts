/**
 * Role → permission matrix. Permissions are enforced server-side in every
 * server action / route handler via `requirePermission`. Kept in code (not the
 * DB) so changes are reviewed and versioned; the DB stores the user's role.
 */
export const ROLES = [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_agent",
  "marketing_manager",
  "instructor",
  "student",
  "agency_customer",
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "admin.access",
  "crm.read_all",
  "crm.read_assigned",
  "crm.write",
  "crm.export",
  "crm.import",
  "pipeline.manage",
  "analytics.read",
  "content.manage",
  "courses.manage",
  "students.read",
  "products.manage",
  "payments.read",
  "payments.refund",
  "automations.manage",
  "privacy.manage",
  "settings.manage",
  "team.manage",
  "audit.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: ALL,
  admin: ALL.filter((p) => p !== "team.manage"),
  sales_manager: ["admin.access", "crm.read_all", "crm.write", "crm.export", "pipeline.manage", "analytics.read"],
  sales_agent: ["admin.access", "crm.read_assigned", "crm.write"],
  marketing_manager: ["admin.access", "analytics.read", "content.manage", "crm.read_all"],
  instructor: ["admin.access", "courses.manage", "students.read"],
  student: [],
  agency_customer: [],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
