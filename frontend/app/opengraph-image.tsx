import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "IdeasQSolucionan — Panel de administración"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 56,
            height: 4,
            background: "white",
            marginBottom: 40,
            borderRadius: 2,
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline" }}>
          <span
            style={{
              fontFamily: "Arial",
              fontSize: 88,
              fontWeight: 300,
              color: "white",
              letterSpacing: 5,
            }}
          >
            IDEAS
          </span>
          <span
            style={{
              fontFamily: "Arial",
              fontSize: 88,
              fontWeight: 800,
              color: "white",
              letterSpacing: 2,
            }}
          >
            QSOLUCIONAN
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "Arial",
            fontSize: 22,
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 9,
            marginTop: 6,
          }}
        >
          |CORTE Y GRABADO CNC|
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.12)",
            marginTop: 48,
            marginBottom: 40,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: "Arial",
            fontSize: 30,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 400,
          }}
        >
          Panel de administración
        </div>
      </div>
    ),
    { ...size },
  )
}
