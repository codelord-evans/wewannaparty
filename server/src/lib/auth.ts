import { SignJWT, jwtVerify } from "jose";
import type { Env } from "../config.ts";

export async function hashPassword(password: string) {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 19456,
    timeCost: 2,
  });
}

export async function verifyPassword(hashStr: string, password: string) {
  return Bun.password.verify(password, hashStr);
}

function secretKey(env: Env) {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export type AccessClaims = {
  sub: string;
  email: string;
  role: string;
  typ: "access";
};

export async function signAccessToken(env: Env, claims: Omit<AccessClaims, "typ">) {
  return new SignJWT({ ...claims, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .setIssuer("wewannaparty")
    .setAudience("wwp-api")
    .sign(secretKey(env));
}

export async function signRefreshToken(env: Env, userId: string) {
  return new SignJWT({ sub: userId, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .setIssuer("wewannaparty")
    .setAudience("wwp-api")
    .sign(secretKey(env));
}

export async function verifyAccessToken(env: Env, token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secretKey(env), {
    issuer: "wewannaparty",
    audience: "wwp-api",
  });
  if (payload.typ !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid token");
  }
  return {
    sub: payload.sub,
    email: String(payload.email),
    role: String(payload.role ?? "customer"),
    typ: "access",
  };
}
