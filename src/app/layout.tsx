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
    "Ropa básica de calidad premium en Argentina. Cortes modernos, materiales honestos, piezas que duran. Envíos a todo el país y cambios sin drama.",
};

// Aplica el tema antes del primer paint para evitar parpadeo (FOUC).
// Prioridad: elección guardada del usuario → preferencia del sistema.
// La clave de storage debe coincidir con useTheme.ts.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("basicos-theme");
    var system = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (stored !== "light" && system);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className={`${hanken.variable} ${caslon.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
