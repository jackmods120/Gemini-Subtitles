import "./globals.css";

export const metadata = {
  title: "AI JACK",
  description: "Kurdish Subtitle Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ku" dir="rtl">
      <body className="bg-[#0c0c12] text-[#ede8df] min-h-screen">
        {children}
      </body>
    </html>
  );
}
