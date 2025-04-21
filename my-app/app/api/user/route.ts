import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key"

export async function GET() {
  const cookieStore = await cookies(); 

  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return NextResponse.json({ userId: decoded.userId });
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
