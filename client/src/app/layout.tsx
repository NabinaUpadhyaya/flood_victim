import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "अनौपचारिक क्षेत्र सेवा केन्द्र (इन्सेक)",
  description: "व्यक्तिगत घटना तथा प्रभावित व्यक्ति तथ्याङ्क संकलन ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F4F8FA] text-[#1E293B] antialiased" style={{ fontFamily: "'Mukta', 'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
