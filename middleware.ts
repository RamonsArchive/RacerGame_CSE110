import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
// import { auth } from "./auth";

// Middleware functions
const withUserId = (request: NextRequest, response: NextResponse) => {
  if (!request.cookies.get('userId')) {
    response.cookies.set('userId', crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
};

// const withNextAuth = async (request: NextRequest, response: NextResponse) => {
//   // Get session for protected routes
//   const session = await auth();
  
//   // Protect dashboard routes (example)
//   if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
//     return NextResponse.redirect(new URL('/api/auth/signin', request.url));
//   }
  
//   // Protect profile routes (example)
//   if (request.nextUrl.pathname.startsWith('/profile') && !session) {
//     return NextResponse.redirect(new URL('/api/auth/signin', request.url));
//   }
  
//   return response;
// };

const withAdminAuth = async (request: NextRequest, response: NextResponse) => {
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, secret);
      return response;
    } catch {
      const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
      redirectResponse.cookies.delete('admin_session');
      return redirectResponse;
    }
  }
  return response;
};

// Main middleware that orchestrates all middleware functions
export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  
  // Always apply guest userId (runs for all requests)
  response = withUserId(request, response);
  
  // Check for early returns (redirects)
  if (response.headers.get('location')) {
    return response;
  }
  
  // Apply NextAuth protection for specific routes
  // response = await withNextAuth(request, response);

  
  // Apply admin authentication for admin routes
  response = await withAdminAuth(request, response);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes that don't need middleware
     * - Static files
     * - Image optimization files
     * - Favicon
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};