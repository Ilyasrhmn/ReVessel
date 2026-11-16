"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/server/auth";

export async function logout() {
  await auth().api.signOut({ headers: await headers() });
  redirect("/masuk");
}
