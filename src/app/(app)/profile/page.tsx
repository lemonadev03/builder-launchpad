import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";

export default async function ProfileRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const p = await getProfileByUserId(session.user.id);
  if (!p) {
    redirect("/onboarding");
  }

  redirect(`/profile/${p.username}`);
}
