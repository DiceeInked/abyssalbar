import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AbyssalBar by me",
  description: "(HELP I'M TRAPPED IN THE CODE)",
//  Ha Ha Jk I love It Here 
//    ╱|、♡
//  (`   -  7
//    |、⁻〵
//    じしˍ,)ノ

//  ░       ░░░        ░░░      ░░░        ░░        ░
//  ▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒
//  ▓  ▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓▓▓▓      ▓▓▓▓      ▓▓▓
//  █  ████  █████  █████  ████  ██  ████████  ███████
//  █       ███        ███      ███        ██        █
                                                  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
