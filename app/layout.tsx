import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Справочник сотрудников АО ЦРТР",
  description: "Электронный справочник сотрудников АО ЦРТР",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
