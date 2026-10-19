import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getReviews, updateReviews } from "@/lib/reviews";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ reviews: await getReviews() });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: unknown;
  try {
    id = (await request.json()).id;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Unknown review." }, { status: 400 });
  }

  try {
    await updateReviews((reviews) => reviews.filter((review) => review.id !== id));
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Couldn't delete the review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
