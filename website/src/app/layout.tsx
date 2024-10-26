import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TRPCReactProvider } from "@/trpc/react";
import { Suspense } from "react";

const junicode = localFont({
  src: "../fonts/JunicodeTwoBetaVF-Roman.woff2",
  display: "swap",
  variable: "--font-junicode",
  declarations: [
    {
      prop: "font-stretch",
      value: "75% 125%",
    },
  ],
});

const rethinkSans = localFont({
  // RethinkSans-Italic-VariableFont_wght
  src: [
    { path: "../fonts/RethinkSans-VariableFont_wght.ttf", style: "normal" },
    {
      path: "../fonts/RethinkSans-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-rethink-sans",
});

export const metadata: Metadata = {
  title: "MTA Subway Alert Influence",
  description:
    "Visualizing how many New York City subway riders are potentially influenced by disruptions according to MTA alerts. Daily from Feb 2022 - August 2024",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body
        // style={getOverrideStyle()}
        className={cn(
          `bg-background font-sans text-foreground`,
          junicode.variable,
          rethinkSans.variable,
        )}
      >
        <NuqsAdapter>
          <TRPCReactProvider>
            <Suspense fallback={<div className="h-screen w-screen" />}>
              {children}
            </Suspense>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
