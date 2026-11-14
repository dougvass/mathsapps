import { loadImage, loadSmallImage } from "@/lib/images";

// Sizes pages ask for (?w=), so only a few versions of each photo are ever made.
const WIDTHS = [320, 640, 960];

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const width = Number(new URL(request.url).searchParams.get("w"));
  const image = WIDTHS.includes(width) ? await loadSmallImage(name, width) : await loadImage(name);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.body, {
    headers: {
      "Content-Type": image.contentType,
      // Each upload gets a new random name, so a given URL never changes.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
