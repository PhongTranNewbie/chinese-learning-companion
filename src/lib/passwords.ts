import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const saltBytes = 16;
const passwordHashVersion = "scrypt-v1";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Use at least 8 characters.";
  }

  if (password.length > 128) {
    return "Use 128 characters or fewer.";
  }

  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(saltBytes);
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return [
    passwordHashVersion,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string | null,
) {
  if (!storedHash) {
    return false;
  }

  const [version, encodedSalt, encodedHash] = storedHash.split("$");

  if (version !== passwordHashVersion || !encodedSalt || !encodedHash) {
    return false;
  }

  const salt = Buffer.from(encodedSalt, "base64url");
  const storedKey = Buffer.from(encodedHash, "base64url");

  if (storedKey.length !== keyLength) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return timingSafeEqual(storedKey, derivedKey);
}
