import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "./globals.css";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyCoach | Rutinas personalizadas y mesociclos exportables",
  description:
    "Crea rutinas de musculación, pesas, Hyrox y CrossFit con análisis de contexto, formulario dinámico, tablas claras y exportación a Excel editable.",
  metadataBase: new URL("https://mycoach.local"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
