import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, LucideIcon, Lock } from  "lucide-react";
import Link from "next/link";
import { canAccessPath, getPermissionRequirementLabel } from "@/lib/permissionsGuard";

interface SidebarSubLink {
    href: string;
    label: string;
}

interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
    isCollapsed: boolean;
    subLinks?: SidebarSubLink[];
  }

 export const SidebarLink = ({
    href,
    icon: Icon,
    label,
    isCollapsed,
    subLinks = [],
  }: SidebarLinkProps) => {
    const pathname = usePathname();
    const hasSubLinks = subLinks.length > 0;
    const access = canAccessPath(href);
    const accessLabel = getPermissionRequirementLabel(access);
    const isActive =
      pathname === href ||
      (pathname === "/" && href === "/dashboard") ||
      subLinks.some((subLink) => pathname === subLink.href || pathname.startsWith(`${subLink.href}/`));
    const [isOpen, setIsOpen] = useState(isActive);
    const expanded = isActive || isOpen;

    const showSubLinks = useMemo(
      () => hasSubLinks && !isCollapsed && expanded,
      [hasSubLinks, isCollapsed, expanded],
    );

    const linkBody = (
      <div
        className={`flex cursor-pointer items-center gap-3 rounded-2xl transition-colors ${
          isCollapsed ? "justify-center px-2 py-3" : "justify-start px-4 py-3"
        } ${
          isActive
            ? "border border-blue-200 bg-blue-50 text-blue-700"
            : "border border-transparent text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        }`}
      >
        <Icon className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-gray-500"}`} />

        <span
          className={`${isCollapsed ? "hidden" : "block"} text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}
        >
          {label}
        </span>
        {!access.allowed && !isCollapsed ? (
          <div
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700"
            title={`Requires ${accessLabel}`}
          >
            <Lock className="h-3 w-3" />
            Restricted
          </div>
        ) : null}
        {hasSubLinks && !isCollapsed ? (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180 text-blue-700" : "text-gray-400"} ${!access.allowed && !isCollapsed ? "hidden" : "ml-auto"}`}
          />
        ) : null}
      </div>
    );
  
    return (
      <div className="space-y-1">
        {hasSubLinks && !isCollapsed ? (
          <button type="button" className="w-full text-left" onClick={() => setIsOpen((current) => !current)}>
            {linkBody}
          </button>
        ) : (
          <Link href={href}>
            {linkBody}
          </Link>
        )}

        {showSubLinks ? (
          <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
            {subLinks.map((subLink) => {
              const subActive = pathname === subLink.href || pathname.startsWith(`${subLink.href}/`);
              const subAccess = canAccessPath(subLink.href);
              const subAccessLabel = getPermissionRequirementLabel(subAccess);
              return (
                <Link key={subLink.href} href={subLink.href}>
                  <div
                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                      subActive
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{subLink.label}</span>
                      {!subAccess.allowed ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700"
                          title={`Requires ${subAccessLabel}`}
                        >
                          <Lock className="h-3 w-3" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };
  
