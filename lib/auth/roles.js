// Role-based access control. Permissions are checked server-side only; UI hints may
// read them too, but never as the enforcement point.
export const ROLES = Object.freeze({ USER: "USER", ADMIN: "ADMIN" });

export const PERMISSIONS = Object.freeze({
  contentReadDrafts: "content:read-drafts",
  contentWrite: "content:write",
  contentReview: "content:review",
  contentPublish: "content:publish",
  examConfigure: "exam:configure",
  mediaUpload: "media:upload", // learner recordings (own)
  mediaManage: "media:manage", // curriculum audio/images
  usersManage: "users:manage",
});

const GRANTS = {
  [ROLES.USER]: new Set([PERMISSIONS.mediaUpload]),
  [ROLES.ADMIN]: new Set(Object.values(PERMISSIONS)),
};

export function hasPermission(user, permission) {
  if (!user?.role) return false;
  return GRANTS[user.role]?.has(permission) ?? false;
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}
