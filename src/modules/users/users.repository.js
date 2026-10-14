import { prisma } from '../../config/database.js';
import { USER_SELF_SELECT } from './users.selects.js';

const CREDENTIALS_SELECT = { id: true, passwordHash: true, tokenVersion: true };

export function findAuthUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, tokenVersion: true },
  });
}

export function findCredentialsByIdentifier(identifier) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: CREDENTIALS_SELECT,
  });
}

export function findCredentialsByUsername(username) {
  return prisma.user.findUnique({ where: { username }, select: CREDENTIALS_SELECT });
}

export function findCredentialsById(id) {
  return prisma.user.findUnique({ where: { id }, select: CREDENTIALS_SELECT });
}

export function findSelfById(id) {
  return prisma.user.findUnique({ where: { id }, select: USER_SELF_SELECT });
}

export async function findTakenIdentityFields({ email, username }) {
  const matches = await prisma.user.findMany({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  return {
    isEmailTaken: matches.some((user) => user.email === email),
    isUsernameTaken: matches.some((user) => user.username === username),
  };
}

export function createUser({ email, username, displayName, passwordHash }) {
  return prisma.user.create({
    data: { email, username, displayName, passwordHash },
    select: { ...USER_SELF_SELECT, tokenVersion: true },
  });
}

/** Replaces the password hash and invalidates every previously issued session. */
export function updatePasswordHash(id, passwordHash) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
}
