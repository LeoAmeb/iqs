"use client"

import { useMemo, useState } from "react"
import { endOfMonth, format, startOfMonth, startOfYear, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarRange } from "lucide-react"
import type { DateRange } from "react-day-picker"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useVentasSerie } from "@/hooks/use-dashboard"
import type { VentaSerieItem } from "@/types"

function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value)
}

function formatMXNCompacto(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

type PresetId = "mes_actual" | "mes_pasado" | "3m" | "6m" | "anio" | "personalizado"

interface Preset {
  id: PresetId
  label: string
  rango: () => { desde: Date; hasta: Date }
}

function presets(): Preset[] {
  const hoy = new Date()
  return [
    { id: "mes_actual", label: "Este mes", rango: () => ({ desde: startOfMonth(hoy), hasta: hoy }) },
    {
      id: "mes_pasado",
      label: "Mes pasado",
      rango: () => ({ desde: startOfMonth(subMonths(hoy, 1)), hasta: endOfMonth(subMonths(hoy, 1)) }),
    },
    { id: "3m", label: "Últimos 3 meses", rango: () => ({ desde: startOfMonth(subMonths(hoy, 2)), hasta: hoy }) },
    { id: "6m", label: "Últimos 6 meses", rango: () => ({ desde: startOfMonth(subMonths(hoy, 5)), hasta: hoy }) },
    { id: "anio", label: "Este año", rango: () => ({ desde: startOfYear(hoy), hasta: hoy }) },
  ]
}

function aISO(fecha: Date): string {
  return format(fecha, "yyyy-MM-dd")
}

function formatPeriodo(periodo: string, agrupacion: "dia" | "mes"): string {
  const fecha = new Date(`${periodo}T00:00:00`)
  return format(fecha, agrupacion === "mes" ? "MMM yyyy" : "d MMM", { locale: es })
}

function TooltipVentas({
  active,
  payload,
  agrupacion,
}: TooltipContentProps & { agrupacion: "dia" | "mes" }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as VentaSerieItem
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground text-xs mb-1">{formatPeriodo(item.periodo, agrupacion)}</p>
      <p className="font-semibold">{formatMXN(item.ventas)}</p>
    </div>
  )
}

export function GraficaVentas() {
  const [preset, setPreset] = useState<PresetId>("6m")
  const [rangoPersonalizado, setRangoPersonalizado] = useState<DateRange | undefined>()
  const [popoverAbierto, setPopoverAbierto] = useState(false)

  const PRESETS = useMemo(() => presets(), [])

  const rango = useMemo(() => {
    if (preset === "personalizado" && rangoPersonalizado?.from) {
      return { desde: rangoPersonalizado.from, hasta: rangoPersonalizado.to ?? rangoPersonalizado.from }
    }
    const activo = PRESETS.find((p) => p.id === preset) ?? PRESETS.find((p) => p.id === "6m")!
    return activo.rango()
  }, [preset, rangoPersonalizado, PRESETS])

  const { data, isLoading } = useVentasSerie({ desde: aISO(rango.desde), hasta: aISO(rango.hasta) })

  function elegirRangoPersonalizado(r: DateRange | undefined) {
    setRangoPersonalizado(r)
    if (r?.from) setPreset("personalizado")
    if (r?.from && r?.to) setPopoverAbierto(false)
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="text-base">Ventas por periodo</CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={preset === p.id ? "default" : "outline"}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
          <Popover open={popoverAbierto} onOpenChange={setPopoverAbierto}>
            <PopoverTrigger asChild>
              <Button size="sm" variant={preset === "personalizado" ? "default" : "outline"} className="gap-1.5">
                <CalendarRange className="h-3.5 w-3.5" />
                {preset === "personalizado" && rangoPersonalizado?.from
                  ? `${format(rangoPersonalizado.from, "d MMM", { locale: es })} – ${
                      rangoPersonalizado.to ? format(rangoPersonalizado.to, "d MMM", { locale: es }) : "…"
                    }`
                  : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={rangoPersonalizado}
                onSelect={elegirRangoPersonalizado}
                numberOfMonths={2}
                defaultMonth={subMonths(new Date(), 1)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !data ? (
          <Skeleton className="h-64 w-full" />
        ) : !data?.serie.length ? (
          <p className="text-sm text-muted-foreground text-center py-16">Sin ventas en este periodo</p>
        ) : (
          <div className="h-64" style={{ opacity: isLoading ? 0.6 : 1, transition: "opacity 150ms" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.serie} barCategoryGap={data.agrupacion === "mes" ? "20%" : "10%"}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="periodo"
                  tickFormatter={(v: string) => formatPeriodo(v, data.agrupacion)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v: number) => formatMXNCompacto(v)}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={(props) => <TooltipVentas {...props} agrupacion={data.agrupacion} />}
                />
                <Bar
                  dataKey={(item: VentaSerieItem) => item.ventas}
                  name="Ventas"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
