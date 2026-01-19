import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LayerWiz - AI Background Removal & Image Editor",
  description: "Remove backgrounds with SOTA AI (BiRefNet), add text behind subjects, and create stunning layered compositions. Professional image editing made simple.",
  keywords: ["background removal", "AI image editor", "remove background", "photo editor", "text behind image"],
  authors: [{ name: "LayerWiz" }],
  openGraph: {
    title: "LayerWiz - AI Background Removal & Image Editor",
    description: "Remove backgrounds with state-of-the-art AI. Create stunning layered compositions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
