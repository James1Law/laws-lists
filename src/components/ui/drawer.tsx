"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const drawerVariants = cva(
  "fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-2xl border bg-background transition-all duration-300 ease-in-out shadow-lg overflow-hidden",
  {
    variants: {
      size: {
        default: "h-[80vh]",
        sm: "h-[40vh]",
        lg: "h-[90vh]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "fixed inset-0 z-40 bg-black/50 opacity-100 transition-opacity duration-300 ease-in-out data-[state=closed]:opacity-0",
      className
    )}
    ref={ref}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

interface DrawerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof drawerVariants> {
  open: boolean
  onClose: () => void
  overlay?: boolean
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, size, open, onClose, overlay = true, children, ...props }, ref) => {
    // Add ESC key listener
    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose()
      }
      if (open) {
        document.addEventListener("keydown", handleEsc)
      }
      return () => {
        document.removeEventListener("keydown", handleEsc)
      }
    }, [open, onClose])

    // Add body scroll lock when drawer is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = ""
      }
      return () => {
        document.body.style.overflow = ""
      }
    }, [open])

    if (!open) return null

    return (
      <>
        {overlay && <DrawerOverlay onClick={onClose} data-state={open ? "open" : "closed"} />}
        <div
          ref={ref}
          className={cn(
            drawerVariants({ size }),
            open ? "translate-y-0" : "translate-y-full",
            className
          )}
          {...props}
        >
          <div className="sticky top-0 z-20 flex w-full items-center justify-center border-b bg-background py-3">
            <div className="h-1 w-10 rounded-full bg-muted/60" />
            <button
              onClick={onClose}
              className="absolute right-4 inline-flex h-8 w-8 items-center justify-center rounded-md border-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none"
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-auto p-4">
            {children}
          </div>
        </div>
      </>
    )
  }
)
Drawer.displayName = "Drawer"

const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-4 flex flex-col space-y-1.5", className)}
    {...props}
  />
))
DrawerHeader.displayName = "DrawerHeader"

const DrawerTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = "DrawerDescription"

const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
))
DrawerFooter.displayName = "DrawerFooter"

export {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} 