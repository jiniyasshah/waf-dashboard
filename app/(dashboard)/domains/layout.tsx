import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain Management | Minishield",
  description: "Configure upstream servers and routing",
};

export default function DomainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
