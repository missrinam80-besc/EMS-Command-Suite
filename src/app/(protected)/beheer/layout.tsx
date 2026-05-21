import { requirePermission } from "@/lib/auth";

export default async function BeheerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requirePermission("config.panel.read");
  return children;
}

