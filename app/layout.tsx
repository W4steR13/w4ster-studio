import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "W4steR MUSIC — студия лейбла",
  description: "Рабочая панель независимого музыкального лейбла W4steR MUSIC.",
  icons: { icon: "/mark.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
