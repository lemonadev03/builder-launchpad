import {
  Newspaper,
  Users,
  Search,
  Briefcase,
  User,
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
  { label: "Profile", href: "/profile", icon: User },
];
