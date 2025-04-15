import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Paths that are accessible to the public
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
  
  // API routes should be handled by their own authentication
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }
  
  // Redirect authenticated users from public pages to dashboard
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Redirect unauthenticated users to login page
  if (!isAuthenticated && !isPublicPath && path !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}

// Specify the paths that the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
