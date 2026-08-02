import "./globals.css";

import { Footer, NavBar } from "@components";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Car Hub",
  description: "Discover world's best car showcase application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <ClerkProvider afterSignOutUrl="/">
          <NavBar />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
