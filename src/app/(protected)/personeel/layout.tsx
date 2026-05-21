import { requirePermission } from "@/lib/auth";

export default async function PersoneelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requirePermission("staff.read_basic");
  return children;
}

