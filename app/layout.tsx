import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./r3f.css";
export const metadata: Metadata = { title: "Roller-Mine Simulator — Mining Game (Simulation)", description: "A RollerCoin-like virtual mining game: mini-games earn temporary power, virtual miners earn permanent power, and simulated blocks share rewards. No real crypto.", applicationName: "Roller-Mine Simulator", manifest: "/manifest.webmanifest", icons: { icon: "/images/legion-cat-mascot-512.png" } };
export const viewport: Viewport = { themeColor: "#0d151c", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
