import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Redirect /dashboard based on role
    if (pathname === "/dashboard") {
      if (!role) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }
      const redirectPath = role === "venue_staff" ? "/venue" : `/${role}`;
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/sign-in") ||
          pathname.startsWith("/sign-up") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/images")
        ) {
          return true;
        }

        // Require auth for everything else
        return !!token;
      },
    },
    pages: {
      signIn: "/sign-in",
    }
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
