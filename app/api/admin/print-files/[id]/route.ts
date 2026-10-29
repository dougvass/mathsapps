import { isAdminRequest } from "@/lib/auth";
import { getPrintFile, getPrintFileStl } from "@/lib/print-files";

// Lets the admin download a customer's 3D file to print.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [record, stl] = await Promise.all([getPrintFile(id), getPrintFileStl(id)]);
  if (!record || !stl) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(stl), {
    headers: {
      "Content-Type": "model/stl",
      "Content-Disposition": `attachment; filename="${record.name.replace(/"/g, "")}"`,
    },
  });
}
