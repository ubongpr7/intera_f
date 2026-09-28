import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-[background-color,color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c83f7] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-100 disabled:!text-white [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-[#3c83f7] text-white shadow-[0_16px_36px_-24px_rgba(60,131,247,0.85)] hover:-translate-y-0.5 hover:bg-[#2f74e6] hover:shadow-[0_20px_42px_-26px_rgba(60,131,247,0.92)] dark:bg-[#98fcc2] dark:text-[#101727] dark:hover:bg-[#b9ffd8] dark:shadow-[0_16px_36px_-24px_rgba(152,252,194,0.55)]",
        destructive:
          "bg-[#ef4444] text-white shadow-[0_16px_36px_-24px_rgba(239,68,68,0.72)] hover:bg-[#dc2626] dark:bg-[#ef4444] dark:hover:bg-[#dc2626]",
        outline:
          "border border-[#cbdaf5] bg-white text-[#1f3963] shadow-[0_10px_24px_-18px_rgba(16,23,39,0.25)] hover:-translate-y-0.5 hover:border-[#8fb7fb] hover:bg-[#f5f9ff] hover:text-[#101727] dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:border-[#98fcc2]/40 dark:hover:bg-[#98fcc2]/10 dark:hover:text-[#98fcc2]",
        secondary:
          "bg-[#e8f0ff] text-[#28549a] shadow-[0_12px_26px_-22px_rgba(39,83,155,.65)] hover:-translate-y-0.5 hover:bg-[#dce9ff] dark:bg-[#98fcc2]/15 dark:text-[#98fcc2] dark:hover:bg-[#98fcc2]/25",
        ghost: "text-[#263b5d] hover:bg-[#3c83f7]/10 hover:text-[#1d4e9e] dark:text-slate-100 dark:hover:bg-[#98fcc2]/10 dark:hover:text-[#98fcc2]",
        link: "text-[#3c83f7] underline-offset-4 hover:underline hover:text-[#2f74e6] dark:text-[#98fcc2] dark:hover:text-[#b9ffd8]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10 rounded-2xl",
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
        data-slot="button"
        data-variant={variant ?? "default"}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
