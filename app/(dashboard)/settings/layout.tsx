import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Minishield",
  description: "Manage your account and security credentials",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
