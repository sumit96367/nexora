let cachedAdminEmails;

export function getAdminEmails() {
  if (cachedAdminEmails) {
    return cachedAdminEmails;
  }

  const raw = process.env.ADMIN_EMAILS ?? "";
  cachedAdminEmails = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return cachedAdminEmails;
}

export function isAdminEmail(email) {
  if (!email) {
    return false;
  }
  return getAdminEmails().includes(email.toLowerCase());
}

export function ensureAdminUser(user) {
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Not authorized");
  }
}