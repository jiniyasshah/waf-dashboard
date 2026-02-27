import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | Minishield",
  description: "ML-powered Web Application Firewall Verify Email Section",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
