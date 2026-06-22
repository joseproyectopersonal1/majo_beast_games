import type { Metadata, Viewport } from "next";
import { Anton, Fredoka } from "next/font/google";
import "./globals.css";
import { BootstrapGate } from "@/ui/shared";
import { BeastNav } from "@/ui/nav";
import { AchievementToastProvider } from "@/ui/achievements/AchievementToastProvider";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Majos Games",
  description: "App de matemáticas con escalera de premios",
  applicationName: "Majos Games",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Majos",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0814",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${anton.variable} ${fredoka.variable}`}>
      <body className="min-h-full flex flex-col">
        <BootstrapGate>
          {children}
          {/* T04 §A — global bottom nav; hides itself during active rounds. */}
          <BeastNav />
          {/* T05 §F27 — global achievement toasts. */}
          <AchievementToastProvider />
        </BootstrapGate>
      </body>
    </html>
  );
}
