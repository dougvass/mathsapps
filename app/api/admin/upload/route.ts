import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { MAX_IMAGE_BYTES, saveImage } from "@/lib/images";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image received." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "That image is too large (max 4MB)." }, { status: 400 });
  }

  try {
    const url = await saveImage(new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Couldn't save the image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
