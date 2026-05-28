import { cookies } from "next/headers";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const lang = cookies().get("lang")?.value || "ru";
  return <LoginForm lang={lang} />;
}
