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
    <html lang="kk" suppressHydrationWarning>
      <head>
        {/* Тема жарқылын болдырмау: бет жүктелмес бұрын класс орнатылады */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
