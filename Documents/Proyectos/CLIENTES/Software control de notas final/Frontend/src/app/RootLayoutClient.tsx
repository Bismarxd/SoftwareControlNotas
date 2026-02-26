"use client";
import { ReactNode, useEffect, useState } from "react";
import { AlertProvider } from "@/components/ui/Alert";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import AIAssistant from "@/components/ui/AIAssistant";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Esperamos que React se monte antes de aplicar clases dinámicas
  useEffect(() => setMounted(true), []);

  return (
    <ThemeProvider>
      <div
        className={
          mounted
            ? `${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`
            : "antialiased"
        }
      >
        <AlertProvider>
          <ConfirmProvider>
            {children}
            <AIAssistant />
          </ConfirmProvider>
        </AlertProvider>
      </div>
    </ThemeProvider>
  );
}
