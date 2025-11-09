import type { Metadata } from "next";
import LocalFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const Nunito = LocalFont({
  src: [
    {
      path: "./fonts/Nunito-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/Nunito-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],

  variable: "--font-nunito",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Type Quest",
  description: "Supporting education through typing games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${Nunito.variable} antialiased`}>{children}</body>
      <Analytics />
    </html>
  );
}
