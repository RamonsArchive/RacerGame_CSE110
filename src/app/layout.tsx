import type { Metadata } from "next";
import LocalFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AudioProvider } from "./contexts/AudioContext";
import BackgroundMusic from "./components/BackgroundMusic";

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
  title: "Type Quest - Supporting Education Through Typing Games",
  description:
    "Supporting education through typing games. Play TypeQuest, Treasure Hunt, and Unscramble to improve your typing skills while learning.",
  keywords: [
    "typing games",
    "educational games",
    "typing practice",
    "TypeQuest",
    "Treasure Hunt",
    "Unscramble",
    "typing skills",
    "educational technology",
  ],
  authors: [
    {
      name: "Ramon Calderon McDargh-Mitchell",
      url: "https://www.linkedin.com/in/ramonmnm100/",
    },
    {
      name: "Zhang Yucheng",
      url: "https://www.linkedin.com/in/yuchengzhang05330/",
    },
    {
      name: "Herman Hundsberger",
      url: "https://www.linkedin.com/in/herman-hundsberger-577600295/",
    },
    { name: "Ali El Lahib", url: "https://www.linkedin.com/in/ali-ellahib/" },
    {
      name: "Srikar Eranky",
      url: "https://www.linkedin.com/in/srikar-eranky/",
    },
    {
      name: "Nicholas Ferry",
      url: "https://www.linkedin.com/in/nicholas--ferry/",
    },
  ],
  creator: "Ramon Calderon McDargh-Mitchell",
  publisher: "Type Quest Team",
  openGraph: {
    title: "Type Quest - Supporting Education Through Typing Games",
    description:
      "Supporting education through typing games. Play TypeQuest, Treasure Hunt, and Unscramble to improve your typing skills while learning.",
    type: "website",
    siteName: "Type Quest",
    images: [
      {
        url: "/favicon.ico",
        width: 512,
        height: 512,
        alt: "Type Quest Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Type Quest - Supporting Education Through Typing Games",
    description:
      "Supporting education through typing games. Play TypeQuest, Treasure Hunt, and Unscramble to improve your typing skills while learning.",
    images: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  other: {
    github: "https://github.com/RamonsArchive",
    clutchstudio: "https://clutchstudio.dev",
    digitalrevolution: "https://digitalrevolution.foundation",
    colorstack: "https://colorstackucsd.org",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/favicon.ico", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  metadataBase: new URL("https://typequest.dev"),
  verification: {
    other: {
      github: "RamonsArchive",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${Nunito.variable} antialiased`}>
        {/* Structured data for SEO - Related projects and creators */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Type Quest",
              description:
                "Supporting education through typing games. Play TypeQuest, Treasure Hunt, and Unscramble to improve your typing skills while learning.",
              url: "https://typequest.dev",
              applicationCategory: "EducationalApplication",
              creator: {
                "@type": "Organization",
                name: "Type Quest Team",
                member: [
                  {
                    "@type": "Person",
                    name: "Ramon Calderon McDargh-Mitchell",
                    url: "https://www.linkedin.com/in/ramonmnm100/",
                    sameAs: ["https://github.com/RamonsArchive"],
                  },
                  {
                    "@type": "Person",
                    name: "Zhang Yucheng",
                    url: "https://www.linkedin.com/in/yuchengzhang05330/",
                  },
                  {
                    "@type": "Person",
                    name: "Herman Hundsberger",
                    url: "https://www.linkedin.com/in/herman-hundsberger-577600295/",
                  },
                  {
                    "@type": "Person",
                    name: "Ali El Lahib",
                    url: "https://www.linkedin.com/in/ali-ellahib/",
                  },
                  {
                    "@type": "Person",
                    name: "Srikar Eranky",
                    url: "https://www.linkedin.com/in/srikar-eranky/",
                  },
                  {
                    "@type": "Person",
                    name: "Nicholas Ferry",
                    url: "https://www.linkedin.com/in/nicholas--ferry/",
                  },
                ],
              },
              relatedLink: [
                "https://clutchstudio.dev",
                "https://digitalrevolution.foundation",
                "https://colorstackucsd.org",
              ],
            }),
          }}
        />
        <AudioProvider>
          <BackgroundMusic />
          {children}
        </AudioProvider>
      </body>
      <Analytics />
    </html>
  );
}
