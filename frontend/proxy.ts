import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Pages that only make sense for a signed-in student. Visitors are sent to
// the sign-in page and returned here afterwards. The home page stays public
// so people can see what the app does before creating an account.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/library(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
