import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Light mode styles
          "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500",
          // Dark mode styles
          "dark:bg-gray-900/50 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-500 dark:focus-visible:border-gray-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
