import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Yatırım Portföyü",
  description: "Kişisel yatırım portföyü takip uygulaması",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-6 max-w-7xl">{children}</main>
      </body>
    </html>
  );
}
