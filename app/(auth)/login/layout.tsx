import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Minishield",
  description: "ML-powered Web Application Firewall Login Section",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
