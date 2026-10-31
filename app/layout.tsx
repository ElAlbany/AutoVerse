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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cookie = document.cookie.match(/theme=([^;]+)/);
                  const theme = cookie ? cookie[1] : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
        <ClerkProvider
          afterSignOutUrl="/"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <a href="#main-content" className="av-skip">
            Skip to content
          </a>
          <div id="main-content" tabIndex={-1} />
          <NavBar />
          {children}
          <Footer />
          <VeroChat />
        </ClerkProvider>
      </body>
    </html>
  );
}
