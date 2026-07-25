import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c83f7] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-[#3c83f7] text-white shadow-[0_16px_36px_-24px_rgba(60,131,247,0.85)] hover:bg-[#2f74e6] hover:shadow-[0_20px_42px_-26px_rgba(60,131,247,0.92)] dark:bg-[#98fcc2] dark:text-[#101727] dark:hover:bg-[#b9ffd8] dark:shadow-[0_16px_36px_-24px_rgba(152,252,194,0.55)]",
        destructive:
          "bg-[#ef4444] text-white shadow-[0_16px_36px_-24px_rgba(239,68,68,0.72)] hover:bg-[#dc2626] dark:bg-[#ef4444] dark:hover:bg-[#dc2626]",
        outline:
          "border border-[#d9e6ff] text-gray-50 bg-none  shadow-[0_10px_24px_-18px_rgba(16,23,39,0.25)] hover:bg-[#f5f9ff] hover:text-[#101727] dark:border-gray-50 hover:border-none  ",
        secondary:
          "bg-[#98fcc2] text-[#101727] shadow-[0_16px_36px_-24px_rgba(152,252,194,0.65)] hover:bg-[#7fe8b8] dark:bg-[#3c83f7] dark:text-white dark:hover:bg-[#2f74e6]",
        ghost: "text-[#101727] hover:bg-[#3c83f7]/10 hover:text-[#101727] dark:text-white dark:hover:bg-[#98fcc2]/10 dark:hover:text-[#101727]",
        link: "text-[#3c83f7] underline-offset-4 hover:underline hover:text-[#2f74e6] dark:text-[#98fcc2] dark:hover:text-[#b9ffd8]",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
