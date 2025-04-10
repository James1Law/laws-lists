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
    const drawerRef = React.useRef<HTMLDivElement | null>(null)
    const handleRef = React.useRef<HTMLDivElement | null>(null)
    const [dragging, setDragging] = React.useState(false)
    const [dragOffset, setDragOffset] = React.useState(0)
    const [startY, setStartY] = React.useState(0)
    
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

    // Handle drag start
    const handleDragStart = (clientY: number) => {
      setDragging(true)
      setStartY(clientY)
      setDragOffset(0)
      
      // Remove transition during dragging for smoother movement
      if (drawerRef.current) {
        drawerRef.current.style.transition = 'none'
      }
    }
    
    // Handle drag move
    const handleDragMove = (clientY: number) => {
      if (!dragging) return
      
      const deltaY = clientY - startY
      if (deltaY < 0) return // Don't allow dragging up
      
      setDragOffset(deltaY)
      
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${deltaY}px)`
      }
    }
    
    // Handle drag end
    const handleDragEnd = () => {
      setDragging(false)
      
      // Restore transition for smooth animation
      if (drawerRef.current) {
        drawerRef.current.style.transition = 'transform 300ms ease-in-out'
        drawerRef.current.style.transform = '' // Reset inline transform
      }
      
      // If dragged more than 150px or with velocity, close the drawer
      const threshold = drawerRef.current ? drawerRef.current.clientHeight * 0.25 : 150
      
      if (dragOffset > threshold) {
        onClose()
      }
    }
    
    // Mouse events for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
      handleDragStart(e.clientY)
      
      const handleMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientY)
      }
      
      const handleMouseUp = () => {
        handleDragEnd()
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    // Touch events for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY)
    }
    
    const handleTouchMove = (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientY)
    }
    
    const handleTouchEnd = () => {
      handleDragEnd()
    }

    if (!open) return null

    return (
      <>
        {overlay && <DrawerOverlay onClick={onClose} data-state={open ? "open" : "closed"} />}
        <div
          ref={(node) => {
            if (typeof ref === 'function') ref(node) 
            else if (ref) ref.current = node
            drawerRef.current = node
          }}
          className={cn(
            drawerVariants({ size }),
            open ? "translate-y-0" : "translate-y-full",
            className
          )}
          {...props}
        >
          <div 
            className="sticky top-0 z-20 flex w-full items-center justify-center border-b bg-background py-3 cursor-grab active:cursor-grabbing"
            ref={handleRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="h-1 w-10 rounded-full bg-muted/60" 
              aria-label="Drag to close"
            />
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