import {
  LayoutDashboard,
  Package,
  Archive,
  FolderTree,
  ShoppingCart,
  Tag,
  LayoutTemplate,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Admin sidebar navigation. Order matches the spec. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Archive", href: "/admin/archive", icon: Archive },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Discounts", href: "/admin/discounts", icon: Tag },
  { label: "Homepage", href: "/admin/homepage", icon: LayoutTemplate },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
