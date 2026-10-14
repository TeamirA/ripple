import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { signSessionToken } from '../../utils/tokens.js';
import * as usersRepository from '../users/users.repository.js';

// Low cost in tests keeps the suite fast; production uses a proper work factor.
const BCRYPT_ROUNDS = env.isTest ? 4 : 12;
// Compared against when the user does not exist so response time does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('ripple-timing-equalizer', BCRYPT_ROUNDS);

function createSession(userId, tokenVersion) {
  return signSessionToken({ userId, tokenVersion });
}

async function loadSessionUser(userId, tokenVersion) {
  const user = await usersRepository.findSelfById(userId);
  return { user, token: createSession(userId, tokenVersion) };
}

/**
 * Creates an account and signs the user in.
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser({ email, username, displayName, password }) {
  const { isEmailTaken, isUsernameTaken } = await usersRepository.findTakenIdentityFields({
    email,
    username,
  });
  if (isEmailTaken || isUsernameTaken) {
    const details = [
      isEmailTaken && { field: 'body.email', message: 'An account with this email already exists' },
      isUsernameTaken && { field: 'body.username', message: 'This username is taken' },
    ].filter(Boolean);
    throw AppError.conflict('Account already exists', details);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { tokenVersion, ...user } = await usersRepository.createUser({
    email,
    username,
    displayName,
    passwordHash,
  });
  return { user, token: createSession(user.id, tokenVersion) };
}

/**
 * Verifies credentials given an email or username.
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser({ identifier, password }) {
  const credentials = await usersRepository.findCredentialsByIdentifier(identifier);
  const isPasswordValid = await bcrypt.compare(password, credentials?.passwordHash ?? DUMMY_HASH);

  if (!credentials || !isPasswordValid) {
    throw AppError.unauthorized('Incorrect email/username or password');
  }
  return loadSessionUser(credentials.id, credentials.tokenVersion);
}

/** Signs in as the seeded demo account without a password. */
export async function loginDemoUser() {
  const credentials = await usersRepository.findCredentialsByUsername(env.DEMO_USERNAME);
  if (!credentials) throw AppError.notFound('The demo account is not available right now');
  return loadSessionUser(credentials.id, credentials.tokenVersion);
}

/**
 * Changes the password and returns a fresh session; all other sessions are revoked.
 * @returns {Promise<{ token: string }>}
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const credentials = await usersRepository.findCredentialsById(userId);
  if (!credentials) throw AppError.unauthorized();

  const isPasswordValid = await bcrypt.compare(currentPassword, credentials.passwordHash);
  if (!isPasswordValid) {
    throw AppError.validation([
      { field: 'body.currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const { tokenVersion } = await usersRepository.updatePasswordHash(userId, passwordHash);
  return { token: createSession(userId, tokenVersion) };
}

export async function getCurrentUser(userId) {
  const user = await usersRepository.findSelfById(userId);
  if (!user) throw AppError.unauthorized();
  return user;
}
