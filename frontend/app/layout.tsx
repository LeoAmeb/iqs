import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://iqs.admin.kinyt.com"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { template: "%s | IQS Admin", default: "IdeasQSolucionan — Panel de administración" },
  description: "Panel de administración de IdeasQSolucionan. Gestión de cotizaciones, pedidos, usuarios y más.",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "IdeasQSolucionan",
    title: "IdeasQSolucionan — Panel de administración",
    description: "Panel de administración de IdeasQSolucionan. Gestión de cotizaciones, pedidos, usuarios y más.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
