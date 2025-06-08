import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, limit = 3, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children)
    const visibleAvatars = childrenArray.slice(0, limit)
    const remainingAvatars = childrenArray?.length - limit

    return (
      <div ref={ref} className={cn("flex -space-x-2", className)} {...props}>
        {visibleAvatars}
        {remainingAvatars > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
            +{remainingAvatars}
          </div>
        )}
      </div>
    )
  },
)

AvatarGroup.displayName = "AvatarGroup"

export { AvatarGroup }
