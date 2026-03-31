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
