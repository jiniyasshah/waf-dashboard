import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Minishield",
  description: "ML-powered Web Application Firewall Registration Section",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
