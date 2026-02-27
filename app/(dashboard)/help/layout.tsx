import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Documentation | Minishield",
  description: "Help guides and API documentation for Minishield WAF",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
