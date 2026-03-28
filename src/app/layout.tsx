import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPL Fagassistent - Boreakademiet",
  description: "Faglig chatbot for kjemiprosess- og laboratoriefag vg2",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body className="bg-[var(--ba-bg)] min-h-screen">{children}</body>
    </html>
  );
}
