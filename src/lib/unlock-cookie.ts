import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_PREFIX = "conception_unlocked_";
const MAX_AGE_DAYS = 7;

function getSecret(): string {
  const s = process.env.CONCEPTION_UNLOCK_SECRET;
  if (!s || s.length < 16) {
    throw new Error("CONCEPTION_UNLOCK_SECRET must be set and at least 16 characters");
  }
  return s;
}

function sign(projectId: string, exp: number): string {
  const payload = `${projectId}.${exp}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createUnlockCookie(projectId: string): { name: string; value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60;
  const signature = sign(projectId, exp);
  const value = `${exp}.${signature}`;
  return {
    name: COOKIE_PREFIX + projectId,
    value,
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  };
}

export async function isProjectUnlocked(projectId: string): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(COOKIE_PREFIX + projectId);
  if (!cookie?.value) return false;
  const [expStr, sig] = cookie.value.split(".");
  if (!expStr || !sig) return false;
  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Date.now() / 1000) return false;
  const expectedSig = sign(projectId, exp);
  return crypto.timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expectedSig, "base64url"));
}
