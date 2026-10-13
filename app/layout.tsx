import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegionCoin — Tambang Virtual Paw Power",
  description: "Game simulasi mining offline. Bangun rig virtual, mainkan Paw Rush, dan kembangkan markas bersama maskot kucing LegionCoin.",
  applicationName: "LegionCoin",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LegionCoin" },
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
