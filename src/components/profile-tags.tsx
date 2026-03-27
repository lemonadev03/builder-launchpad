import { Badge } from "@/components/ui/badge";

interface Tag {
  slug: string;
  label: string;
  color?: string | null;
}

interface ProfileTagsProps {
  tags: Tag[];
}

export function ProfileTags({ tags }: ProfileTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag.slug}
          variant="secondary"
          className="text-xs"
          style={
            tag.color
              ? {
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }
              : undefined
          }
        >
          {tag.label}
        </Badge>
      ))}
    </div>
  );
}
