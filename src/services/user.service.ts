// ─────────────────────────────────────────────────────────────
// User Service
// ─────────────────────────────────────────────────────────────
// admin-only stuff right here: listing out everyone, banning
// bad actors, or promoting folks to a new role.
// ─────────────────────────────────────────────────────────────

// dynamically pulling Prisma so the IDE types don't get confused
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** the roles we care about */
type Role = "VIEWER" | "ANALYST" | "ADMIN";

/**
 * grabs a list of everyone in the system.
 * (we make sure to leave their passwords out of this!)
 */
export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" }, // newest folks at the top
  });
};

/**
 * bans or unbans a user by flipping their active status.
 */
export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw Object.assign(new Error("Whoops, that user doesn't exist"), { statusCode: 404 });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

/**
 * hands someone a promotion (or demotion) by changing their role.
 */
export const updateUserRole = async (userId: string, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw Object.assign(new Error("Whoops, that user doesn't exist"), { statusCode: 404 });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};
