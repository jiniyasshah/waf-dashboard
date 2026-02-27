import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Updated Email | Minishield",
  description:
    "ML-powered Web Application Firewall Verify Updated Email Section",
};

export default function VerifyUpdatedEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
