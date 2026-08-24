import { Kanit, Geist_Mono } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BIT01 - PROJECT",
};

export default function RootLayout({ children }) {
  return (

    <html
      lang="th"
      className={`${kanit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        
        <footer className="w-full bg-white border-t border-slate-200 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-center">
            <div className="text-slate-500 font-bold text-sm">
              <span className="text-sky-700">BIT01</span> - PROJECT
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
