import { PlatformTagManager } from "@/components/platform-tag-manager";
import { listPlatformTags } from "@/lib/queries/platform-tag";

export default async function PlatformTagsPage() {
  const tags = await listPlatformTags();

  return <PlatformTagManager initialTags={tags} />;
}
