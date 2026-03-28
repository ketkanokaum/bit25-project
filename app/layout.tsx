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
  title: "BIT25 - PROJECT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "#e0f2fe" }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#e0f2fe", color: "#0f172a" }}
      >
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        
<footer className="w-full bg-white/60 backdrop-blur-md border-t border-sky-200 py-6 mt-auto">
  <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-center">
    <div className="text-slate-600 font-bold text-sm">
      <span className="text-sky-600">BIT25</span> - PROJECT
    </div>

  </div>
</footer>
      </body>
    </html>
  );
}