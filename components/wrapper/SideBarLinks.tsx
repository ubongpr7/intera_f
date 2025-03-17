import { usePathname } from "next/navigation";
import {LucideIcon} from  "lucide-react";
import Link from "next/link";

interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
    isCollapsed: boolean;
  }

 export const SidebarLink = ({
    href,
    icon: Icon,
    label,
    isCollapsed,
  }: SidebarLinkProps) => {
    const pathname = usePathname();
    const isActive =
      pathname === href || (pathname === "/" && href === "/dashboard");
  
    return (
      <Link href={href}>

      <div
          className={`cursor-pointer flex items-center ${
            isCollapsed ? "justify-center py-2" : "justify-start px-8 py-2"
          }
          hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
            isActive ? "bg-blue-200 text-white" : ""
          }
        }`}
        >
          <Icon className="w-4 h-4 !text-gray-700" />
  
          <span
            className={`${
              isCollapsed ? "hidden" : "block"
            } font-normal text-gray-700`}
          >
            {label}
          </span>
        </div>
      </Link>
    );
  };
  
