import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Mykotech Pharma | Quality Medicines & Clinical Healthcare",
  description: "Certified pharmaceutical store, prescription medications, WHO-GMP compliant drugs, and wellness products.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden w-full max-w-full">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
