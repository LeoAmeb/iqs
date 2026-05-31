import { Layers } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="relative hidden lg:flex flex-col bg-primary overflow-hidden">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Template</span>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <p className="text-4xl font-bold leading-tight tracking-tight">
              Gestiona tu plataforma<br />desde un solo lugar.
            </p>
            <p className="text-lg text-primary-foreground/70">
              Control total sobre usuarios, roles y actividad del sistema.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-primary-foreground/40">
            © {new Date().getFullYear()} Template. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex justify-between items-center p-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-bold">Template</span>
          </div>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
