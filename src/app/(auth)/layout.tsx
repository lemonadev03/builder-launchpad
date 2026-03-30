import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/feed");
  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/30 px-4 pt-20">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
