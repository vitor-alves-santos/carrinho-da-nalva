import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import "./globals.css";

const SETTINGS_ID = new ObjectId("000000000000000000000001");

async function getTema(): Promise<"claro" | "escuro"> {
  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection("configuracoes").findOne({ _id: SETTINGS_ID });
    return doc?.tema === "escuro" ? "escuro" : "claro";
  } catch {
    return "claro";
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carrinho da Nalva",
  description: "Cardápio digital do Carrinho da Nalva. Faça seu pedido online!",
  icons: {
    icon: "/favicon-bg.png",
  },
};

import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tema = await getTema();
  return (
    <html lang="pt-BR" suppressHydrationWarning className={tema === "escuro" ? "dark" : ""}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
