import type { Metadata } from "next";
import { Hanken_Grotesk, Libre_Caslon_Display } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const caslon = Libre_Caslon_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Basicos · Esenciales atemporales",
  description:
    "Ropa básica de calidad premium. Cortes modernos, materiales honestos, piezas que duran. Descubre la colección.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${hanken.variable} ${caslon.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
