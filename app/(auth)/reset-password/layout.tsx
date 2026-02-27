import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Minishield",
  description: "ML-powered Web Application Firewall Reset Password Section",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
