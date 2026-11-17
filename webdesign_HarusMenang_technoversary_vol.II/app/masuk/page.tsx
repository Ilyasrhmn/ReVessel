import type { Metadata } from "next";
import AuthScreen from "../ui/auth-screen";

export const metadata: Metadata = { title: "Masuk | ReVessel" };

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
