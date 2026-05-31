"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AdminError]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div>
        <h2 className="text-xl font-semibold">Ocurrió un error</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message || "Algo salió mal al cargar esta sección."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-1">
            ID: {error.digest}
          </p>
        )}
      </div>
      <Button variant="outline" onClick={reset}>
        Intentar de nuevo
      </Button>
    </div>
  )
}
