import { loadImage, resizeImage } from "@/lib/images";

// Sizes pages ask for (?w=), so the CDN only ever caches a few versions.
const WIDTHS = [320, 640, 960];

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const image = await loadImage(name);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  // Each upload gets a new random name, so a given URL never changes.
  const cacheControl = "public, max-age=31536000, s-maxage=31536000, immutable";
  const width = Number(new URL(request.url).searchParams.get("w"));
  if (WIDTHS.includes(width)) {
    const source = Buffer.from(await new Response(image.body as BodyInit).arrayBuffer());
    const resized = await resizeImage(source, width);
    if (resized) {
      return new Response(new Uint8Array(resized), {
        headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl },
      });
    }
    return new Response(new Uint8Array(source), {
      headers: { "Content-Type": image.contentType, "Cache-Control": cacheControl },
    });
  }

  return new Response(image.body as BodyInit, {
    headers: { "Content-Type": image.contentType, "Cache-Control": cacheControl },
  });
}
