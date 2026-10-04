import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ChatWidgetProvider } from "./contexts/ChatWidgetContext";
import { StudentDiscountProvider } from "./contexts/StudentDiscountContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import ChatWidget from "./components/ChatWidget";
import Footer from "./components/Footer";
import Header from "./components/Header";
import MobileDrawerTrigger from "./components/MobileDrawerTrigger";
import RouteProgress from "./components/ui/RouteProgress";

// Runs before paint so the page never flashes the wrong theme: reads the
// same localStorage key ThemeContext writes to, falling back to the OS
// preference for "auto" (the default).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("giftshop_theme") || "auto";
    var isDark =
      theme === "dark" ||
      (theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

// Inter, the main site's font.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Giftshop Chuyên Biên Hòa",
  description:
    "Quà tặng lưu niệm Chuyên Biên Hòa - Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

// Lay out at the device's width and don't zoom - otherwise iOS zooms in on
// focusing the search/checkout inputs and the page is left wider than the
// screen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-page font-sans text-gray-800">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <AuthProvider>
            <StudentDiscountProvider>
              <CartProvider>
                <ChatWidgetProvider>
                  <ToastProvider>
                    <RouteProgress />
                    {/* The header lives here, outside template.tsx, so it
                        stays put while the page below it animates in on each
                        navigation (it used to be part of every page and
                        faded in again with it). */}
                    <Header />
                    <div className="flex-1">{children}</div>
                    <Footer />
                    <MobileDrawerTrigger />
                    <ChatWidget />
                  </ToastProvider>
                </ChatWidgetProvider>
              </CartProvider>
            </StudentDiscountProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
