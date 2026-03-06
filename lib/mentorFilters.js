export function buildMentorAdminFilter({ status, search }) {
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }

  if (search) {
    filter.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { industries: { has: search } },
      { skills: { has: search } },
    ];
  }

  return filter;
}

