import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Firewall Rules | Minishield",
  description: "ML-powered Web Application Firewall Rules Section",
};

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
