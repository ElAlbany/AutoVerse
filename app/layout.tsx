import "./globals.css";

import { Footer, NavBar } from "@components";
import { ClerkProvider } from "@clerk/nextjs";
import VeroChat from "@/components/VeroChat";

export const metadata = {
  title: "AutoVerse — Find, Book, Drive",
  description:
    "Discover the future of car rental. Premium vehicles, seamless booking, unforgettable drives.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cookie = document.cookie.match(/theme=([^;]+)/);
                  const theme = cookie ? cookie[1] : 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="relative" suppressHydrationWarning>
        <ClerkProvider afterSignOutUrl="/">
          <NavBar />
          {children}
          <Footer />
          <VeroChat />
        </ClerkProvider>
      </body>
    </html>
  );
}
