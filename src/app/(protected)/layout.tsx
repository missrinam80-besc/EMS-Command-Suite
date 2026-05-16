import { requireAppSession } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppSession();
  return children;
}
