"use client";
import { ReactNode, useEffect, useState } from "react";
import { AlertProvider } from "@/components/ui/Alert";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Esperamos que React se monte antes de aplicar clases dinámicas
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={
        mounted
          ? `${geistSans.variable} ${geistMono.variable} antialiased`
          : "antialiased"
      }
    >
      <AlertProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </AlertProvider>
    </div>
  );
}
