import { ThemeToggle } from "@/components/theme-toggle"

function LogoLight() {
  return (
    <svg viewBox="0 0 210 38" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="2" y="24" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="300" letterSpacing="1" fill="#111">IDEAS</text>
      <text x="72" y="24" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="800" letterSpacing="0.5" fill="#111">QSOLUCIONAN</text>
      <text x="2" y="36" fontFamily="Arial,sans-serif" fontSize="7.5" fontWeight="600" fill="#777" letterSpacing="2.5">|CORTE Y GRABADO CNC|</text>
    </svg>
  )
}

function LogoDark() {
  return (
    <svg viewBox="0 0 210 38" xmlns="http://www.w3.org/2000/svg" className="h-9 w-auto">
      <text x="2" y="24" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="300" letterSpacing="1" fill="white">IDEAS</text>
      <text x="72" y="24" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="800" letterSpacing="0.5" fill="white">QSOLUCIONAN</text>
      <text x="2" y="36" fontFamily="Arial,sans-serif" fontSize="7.5" fontWeight="600" fill="rgba(255,255,255,0.55)" letterSpacing="2.5">|CORTE Y GRABADO CNC|</text>
    </svg>
  )
}

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
          <LogoDark />

          {/* Tagline */}
          <div className="space-y-4">
            <p className="text-4xl font-bold leading-tight tracking-tight">
              Gestiona tu operación<br />desde un solo lugar.
            </p>
            <p className="text-lg text-primary-foreground/70">
              Cotizaciones, pedidos y usuarios bajo control total.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-primary-foreground/40">
            © {new Date().getFullYear()} IdeasQSolucionan. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex justify-between items-center p-6">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <LogoLight />
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
