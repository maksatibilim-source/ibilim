import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мектеп тапсырмаларын басқару платформасы",
  description:
    "Директорға арналған апталық жоспарлау тақтасы — жылдық жоспардан келген тапсырмаларды апта күндеріне бөлу.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  );
}
