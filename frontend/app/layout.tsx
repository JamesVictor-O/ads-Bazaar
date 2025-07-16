import type { Metadata } from "next";
import Header from "@/components/header/header";
import { Providers } from "@/app/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ads-Bazaar",
  description: "Democratizing Influencer Marketing with Web3",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://ads-bazaar.vercel.app/adsBazaar-heroPage.png",
      button: {
        title: "AdsBazaar",
        action: {
          type: "launch_frame",
          name: "Ads-Bazaar",
          url: "https://ads-bazaar.vercel.app",
          splashImageUrl: "https://ads-bazaar.vercel.app/adsBazaar-logo.png",
          splashBackgroundColor: "#059669",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Header />
          <div>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
