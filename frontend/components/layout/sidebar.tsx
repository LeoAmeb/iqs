"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Shield,
  ClipboardList,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Usuarios", href: "/users", icon: Users },
  { label: "Roles", href: "/roles", icon: Shield },
  { label: "Auditoría", href: "/audit", icon: ClipboardList },
]

function getInitials(first?: string, last?: string) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "U"
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onClose, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user
  const firstName = user?.first_name ?? ""
  const lastName = user?.last_name ?? ""
  const fullName = user?.full_name ?? user?.name ?? "Usuario"
  const email = user?.email ?? ""
  const avatar = user?.avatar ?? undefined
  const initials = getInitials(firstName, lastName)

  return (
    <TooltipProvider delayDuration={200}>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300",
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-60 lg:w-60",
          collapsed && "lg:w-[68px]"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 min-w-0",
              collapsed && "lg:hidden"
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <span className="truncate font-semibold text-sm">Template</span>
          </Link>

          {/* Collapsed: just icon */}
          <Link
            href="/dashboard"
            className={cn(
              "hidden items-center justify-center",
              collapsed && "lg:flex"
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </Link>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Mobile close */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              const linkEl = (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors overflow-hidden",
                    collapsed ? "lg:justify-center lg:px-0" : "",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 inset-y-1 w-0.5 rounded-r-full transition-opacity",
                      isActive ? "bg-primary opacity-100" : "opacity-0"
                    )}
                  />
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              )

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )
              }

              return <li key={item.href}>{linkEl}</li>
            })}
          </ul>
        </nav>

        {/* Footer — user */}
        <div className="shrink-0 border-t border-border p-2">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-auto py-2 transition-colors",
                      collapsed
                        ? "lg:justify-center lg:px-1"
                        : "justify-start gap-2.5 px-2"
                    )}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={avatar} alt={fullName} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex min-w-0 flex-col items-start text-left",
                        collapsed && "lg:hidden"
                      )}
                    >
                      <span className="max-w-[140px] truncate text-xs font-medium">
                        {fullName}
                      </span>
                      <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                        {email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{fullName}</TooltipContent>
              )}
            </Tooltip>

            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-56"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="lg:hidden h-8 w-8">
      <LayoutDashboard className="h-4 w-4" />
      <span className="sr-only">Abrir menú</span>
    </Button>
  )
}
