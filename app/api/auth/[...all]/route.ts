import { auth } from "@/lib/server/auth";

async function handle(request: Request) {
  try {
    return await auth().handler(request);
  } catch (error) {
    console.error("Authentication request failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ message: "Layanan akun sedang tidak tersedia." }, { status: 503 });
  }
}

export { handle as GET, handle as POST };
