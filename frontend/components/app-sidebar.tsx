"use client"

import * as React from "react"
import {
  Activity,
  ClipboardList,
  Cog,
  FileText,
  Kanban,
  LayoutDashboard,
  Layers,
  Shield,
  ShoppingCart,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain, type NavGroup } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useHasPermission } from "@/hooks/use-has-permission"
import { PERMISSIONS } from "@/lib/permissions"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const puedeVerPedidos = useHasPermission(PERMISSIONS.PEDIDOS.VIEW)
  const puedeVerProduccion = useHasPermission(PERMISSIONS.PRODUCCION.VIEW)
  const puedeVerClientes = useHasPermission(PERMISSIONS.CLIENTES.VIEW)
  const puedeVerCotizaciones = useHasPermission(PERMISSIONS.COTIZACIONES.VIEW)
  const puedeVerProductos = useHasPermission(PERMISSIONS.PRODUCTOS.VIEW)
  const puedeVerUsers = useHasPermission(PERMISSIONS.USERS.VIEW)
  const puedeVerGrupos = useHasPermission(PERMISSIONS.GRUPOS.VIEW)
  const puedeVerAuditoria = useHasPermission(PERMISSIONS.AUDIT.VIEW)

  const navGroups: NavGroup[] = [
    {
      label: "Ventas",
      defaultOpen: true,
      items: [
        { title: "Cotizador", url: "/cotizador", icon: ShoppingCart, show: puedeVerCotizaciones },
        { title: "Cotizaciones", url: "/cotizaciones", icon: FileText, show: puedeVerCotizaciones },
        { title: "Pedidos", url: "/pedidos", icon: ClipboardList, show: puedeVerPedidos },
      ]
        .filter((i) => i.show)
        .map(({ title, url, icon }) => ({ title, url, icon })),
    },
    {
      label: "Operaciones",
      defaultOpen: true,
      items: [
        { title: "Producción", url: "/produccion", icon: Kanban, show: puedeVerProduccion },
        { title: "Clientes", url: "/clientes", icon: Users, show: puedeVerClientes },
      ]
        .filter((i) => i.show)
        .map(({ title, url, icon }) => ({ title, url, icon })),
    },
    {
      label: "Administración",
      defaultOpen: false,
      items: [
        { title: "Usuarios", url: "/users", icon: Users, show: puedeVerUsers },
        { title: "Grupos", url: "/grupos", icon: Shield, show: puedeVerGrupos },
        { title: "Auditoría", url: "/audit", icon: Activity, show: puedeVerAuditoria },
        { title: "Configuración", url: "/configuracion", icon: Cog, show: puedeVerProductos },
      ]
        .filter((i) => i.show)
        .map(({ title, url, icon }) => ({ title, url, icon })),
    },
  ].filter((g) => g.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">IQS</span>
                  <span className="truncate text-xs text-muted-foreground">Gestión operativa</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard — siempre visible sin sección colapsable */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
