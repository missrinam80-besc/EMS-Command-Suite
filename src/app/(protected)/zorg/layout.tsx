import { requireAnyPermission } from "@/lib/auth";

export default async function ZorgLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAnyPermission(["patients.read", "cases.read", "reports.read"]);
  return children;
}

