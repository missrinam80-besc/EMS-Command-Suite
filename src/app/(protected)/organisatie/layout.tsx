import { requireAnyPermission } from "@/lib/auth";

export default async function OrganisatieLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAnyPermission(["meetings.read", "minutes.read"]);
  return children;
}
