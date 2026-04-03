// ─────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────
// deals with registering users, checking passwords during login, 
// and minting JWTs so they can access protected routes.
// ─────────────────────────────────────────────────────────────

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// dynamically pulling Prisma so the IDE types don't get confused
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Types ───────────────────────────────────────────────────

/** the roles we care about */
type Role = "VIEWER" | "ANALYST" | "ADMIN";

/** what we expect when someone signs up */
interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

/** what we expect when someone tries to log in */
interface LoginData {
  email: string;
  password: string;
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * packs the user ID and role into a signed token.
 */
const generateToken = (userId: string, role: Role): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  // default to 24 hours if env variable isn't set
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign({ userId, role }, secret, { expiresIn } as jwt.SignOptions);
};

// ── Service Methods ─────────────────────────────────────────

/**
 * signs up a new user if their email isn't taken, 
 * hashes their password, and kicks back a token.
 */
export const register = async (data: RegisterData) => {
  // make sure nobody took this email already
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw Object.assign(new Error("A user with this email already exists"), {
      statusCode: 409,
    });
  }

  // scramble the password before saving
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  // save 'em to the database
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // print their entry pass
  const token = generateToken(user.id, user.role);

  return { user, token };
};

/**
 * checks if the user exists, isn't banned, and gave the right password.
 * if all is good, gives them a fresh token.
 */
export const login = async (data: LoginData) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // user not in the db? bye
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), {
      statusCode: 401,
    });
  }

  // did an admin lock this account?
  if (!user.isActive) {
    throw Object.assign(
      new Error("Your account has been deactivated. Please contact an administrator."),
      { statusCode: 403 }
    );
  }

  // verify the password hash matches what they typed
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password"), {
      statusCode: 401,
    });
  }

  // hand them a new token
  const token = generateToken(user.id, user.role);

  // strip out the password hash before sending the user back to the client
  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
};
