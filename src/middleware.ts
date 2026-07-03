import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

// Permanently redirect the *.workers.dev origin to the canonical custom domain
// so there's a single indexable home for the site (no duplicate content).
//
// NOTE: This stays as `middleware.ts` (not the Next 16 `proxy.ts` convention)
// on purpose: OpenNext/Cloudflare only supports Edge middleware, and the new
// `proxy` convention runs on the Node.js runtime, which fails to deploy with
// "Node.js middleware is not currently supported." The deprecation warning is
// cosmetic; correctness of the deploy takes priority.
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host.endsWith(".workers.dev")) {
    const dest = new URL(
      `${req.nextUrl.pathname}${req.nextUrl.search}`,
      SITE_URL,
    );
    return NextResponse.redirect(dest, 301);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next's internal asset routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
