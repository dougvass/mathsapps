import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, isValidSessionToken, setAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.currentPassword || !(await checkAdminPassword(body.currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  if (!body.newPassword || body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  await setAdminPassword(body.newPassword);
  return NextResponse.json({ ok: true });
}
