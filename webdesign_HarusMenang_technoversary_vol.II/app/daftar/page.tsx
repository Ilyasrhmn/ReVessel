import type { Metadata } from "next";
import AuthScreen from "../ui/auth-screen";

export const metadata: Metadata = { title: "Daftar | ReVessel" };

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}
