import { jwtVerify, SignJWT } from "jose";

const JWT_COOKIE_NAME = "auth_token";
const JWT_EXPIRY = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in environment variables");
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  name: string;
  role: string;
}

/**
 * Sign a JWT token with the user payload.
 */
export async function signJwt(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

/**
 * Verify and decode a JWT token.
 * Returns null if token is invalid or expired.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export { JWT_COOKIE_NAME };
