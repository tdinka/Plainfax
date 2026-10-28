import { NextResponse, type NextRequest } from "next/server";

// The /stats page is for the owner only. The browser asks for a password
// (any username) and it must match STATS_PASSWORD. With no password set,
// the page doesn't exist.
export function middleware(req: NextRequest) {
  const password = process.env.STATS_PASSWORD;
  if (!password) return new NextResponse("Not found", { status: 404 });

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    let given = "";
    try {
      const decoded = atob(header.slice(6));
      given = decoded.slice(decoded.indexOf(":") + 1);
    } catch {
      /* malformed header; ask again */
    }
    if (sameText(given, password)) return NextResponse.next();
  }

  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Stats", charset="UTF-8"' },
  });
}

// Compares without stopping at the first difference, so timing doesn't leak the password.
function sameText(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export const config = { matcher: ["/stats"] };
