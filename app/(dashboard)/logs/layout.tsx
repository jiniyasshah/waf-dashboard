import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traffic Inspector | Minishield",
  description: "Real-time security events and threat intelligence",
};

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
