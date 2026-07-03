import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

// Permanently redirect the *.workers.dev origin to the canonical custom domain
// so there's a single indexable home for the site (no duplicate content).
export function proxy(req: NextRequest) {
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
