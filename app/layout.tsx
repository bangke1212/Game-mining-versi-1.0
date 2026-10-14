import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./r3f.css";

export const metadata: Metadata = {
  title: "OreOps — Mining Operations Control",
  description: "Interactive 3D-style mining operations command center for fleet, production, safety and asset telemetry.",
  applicationName: "OreOps",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OreOps" },
  icons: { icon: "/images/legion-cat-mascot-512.png", apple: "/images/legion-cat-mascot-512.png" },
};

export const viewport: Viewport = {
  themeColor: "#101710",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
