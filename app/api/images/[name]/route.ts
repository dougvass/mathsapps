import { loadImage } from "@/lib/images";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const image = await loadImage(name);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.body as BodyInit, {
    headers: {
      "Content-Type": image.contentType,
      // Each upload gets a new random name, so a given URL never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
