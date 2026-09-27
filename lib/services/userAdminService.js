import { ROLES, hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { hashPassword } from "@/lib/auth/password";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { objectIdString, parseOrThrow } from "@/lib/validation/common";
import { registerSchema } from "@/lib/validation/auth";
import * as userRepo from "@/lib/repositories/userRepository";
import * as sessionRepo from "@/lib/repositories/sessionRepository";
import { z } from "zod";

// Operator bootstrap (CLI only): creates the admin, or promotes an existing account.
// Existing passwords are only replaced when `resetPassword` is set.
export async function ensureAdmin({ email, password, name }, { resetPassword = false } = {}) {
  const data = parseOrThrow(registerSchema, { email, password, name, uiLanguage: "en" });
  const existing = await userRepo.findUserByEmailWithHash(data.email);
  if (!existing) {
    const user = await userRepo.insertUser({
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
      role: ROLES.ADMIN,
      uiLanguage: "en",
    });
    return { created: true, id: String(user._id) };
  }
  if (existing.role !== ROLES.ADMIN) await userRepo.updateUserRole(existing._id, ROLES.ADMIN);
  if (resetPassword) {
    await userRepo.updatePasswordHash(existing._id, await hashPassword(data.password));
    await sessionRepo.deleteSessionsForUser(existing._id);
  }
  return { created: false, promoted: existing.role !== ROLES.ADMIN, id: String(existing._id) };
}

const roleChangeSchema = z.object({ userId: objectIdString, role: z.enum(Object.values(ROLES)) });

// Role changes revoke the user's sessions so the new role applies on next sign-in.
export async function changeUserRole(actor, input) {
  if (!hasPermission(actor, PERMISSIONS.usersManage)) throw new ForbiddenError();
  const { userId, role } = parseOrThrow(roleChangeSchema, input);
  if (userId === actor.id && role !== ROLES.ADMIN) throw new ForbiddenError("You cannot remove your own admin role.");
  const updated = await userRepo.updateUserRole(userId, role);
  if (!updated) throw new NotFoundError();
  await sessionRepo.deleteSessionsForUser(userId);
  return { id: String(updated._id), role: updated.role };
}
