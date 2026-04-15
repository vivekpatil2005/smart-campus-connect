import type { UserProfile } from "../backend.d";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ParsedProfile {
  username: string; // alphanumeric + underscore, 3-20 chars
  bio: string; // actual display bio
  following: string[]; // array of principal strings this user follows
}

// ─── Encoding ─────────────────────────────────────────────────────────────
// Compact format stored in bio field:
// __u:username|__f:p1,p2|\nActual bio here
//
// IMPORTANT: uses saveCallerUserProfile (no bio length validation)

const U_PREFIX = "__u:";
const F_PREFIX = "|__f:";
const SEP = "|\n";

export function encodeProfile(
  parsed: ParsedProfile,
  displayName: string,
  role: string,
): UserProfile {
  const followStr = parsed.following.join(",");
  const encoded = `${U_PREFIX}${parsed.username}${F_PREFIX}${followStr}${SEP}${parsed.bio}`;
  return {
    displayName,
    bio: encoded,
    role,
  };
}

export function decodeProfile(profile: UserProfile): ParsedProfile {
  const raw = profile.bio ?? "";

  if (!raw.startsWith(U_PREFIX)) {
    // Legacy profile without encoded format
    return { username: "", bio: raw, following: [] };
  }

  try {
    // Extract username
    const afterU = raw.slice(U_PREFIX.length);
    const fIdx = afterU.indexOf(F_PREFIX);
    if (fIdx === -1) {
      return { username: afterU.split(SEP)[0] ?? "", bio: "", following: [] };
    }
    const username = afterU.slice(0, fIdx);

    // Extract following list and actual bio
    const afterF = afterU.slice(fIdx + F_PREFIX.length);
    const sepIdx = afterF.indexOf(SEP);
    const followStr = sepIdx >= 0 ? afterF.slice(0, sepIdx) : "";
    const bio = sepIdx >= 0 ? afterF.slice(sepIdx + SEP.length) : "";

    const following =
      followStr.length > 0 ? followStr.split(",").filter(Boolean) : [];

    return { username, bio, following };
  } catch {
    return { username: "", bio: raw, following: [] };
  }
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function extractUsername(
  profile: UserProfile | null | undefined,
): string {
  if (!profile) return "";
  return decodeProfile(profile).username;
}
