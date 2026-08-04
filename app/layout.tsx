import "./globals.css";

import { Footer, NavBar } from "@components";
import { ClerkProvider } from "@clerk/nextjs";

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
        {/* Theme initialization script to prevent flash */}
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
