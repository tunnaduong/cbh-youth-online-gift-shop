import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ChatWidgetProvider } from "./contexts/ChatWidgetContext";
import { StudentDiscountProvider } from "./contexts/StudentDiscountContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatWidget from "./components/ChatWidget";
import MobileDrawerTrigger from "./components/MobileDrawerTrigger";

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

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-800">
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
                  {children}
                  <MobileDrawerTrigger />
                  <ChatWidget />
                </ChatWidgetProvider>
              </CartProvider>
            </StudentDiscountProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
