import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Rutas protegidas (puedes agregar más)
  const protectedPaths = ["/inicio"];

  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url)); // redirige al login
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || "mi_codigo_super_seguro");
    } catch (err) {
      console.error("Token inválido:", err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/inicio/:path*", "/dashboard/:path*"], // rutas donde aplica
};
