import {
  Newspaper,
  Users,
  Search,
  Briefcase,
  Bookmark,
  User,
  Building2,
  UserCog,
  Tag,
  Shield,
  LayoutDashboard,
  Settings,
  LinkIcon,
  UserPlus,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "/feed", icon: Newspaper },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Directory", href: "/directory", icon: Search },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Profile", href: "/profile", icon: User },
];

export const PLATFORM_NAV: NavItem[] = [
  { label: "Communities", href: "/platform/communities", icon: Building2 },
  { label: "Users", href: "/platform/users", icon: Users },
  { label: "Admins", href: "/platform/admins", icon: UserCog },
  { label: "Tags", href: "/platform/settings", icon: Tag },
  { label: "Moderation", href: "/platform/moderation", icon: Shield },
];

export function getAdminCommunityNav(
  slug: string,
  role: "admin" | "moderator",
): NavItem[] {
  const all: NavItem[] = [
    { label: "Dashboard", href: `/admin/${slug}`, icon: LayoutDashboard },
    { label: "Settings", href: `/admin/${slug}/settings`, icon: Settings },
    { label: "Members", href: `/admin/${slug}/members`, icon: Users },
    { label: "Invites", href: `/admin/${slug}/invites`, icon: LinkIcon },
    { label: "Requests", href: `/admin/${slug}/requests`, icon: UserPlus },
    { label: "Posts", href: `/admin/${slug}/posts`, icon: FileText },
    { label: "Moderation", href: `/admin/${slug}/moderation`, icon: Shield },
  ];

  if (role === "moderator") {
    return all.filter((item) =>
      ["Dashboard", "Moderation"].includes(item.label),
    );
  }

  return all;
}
