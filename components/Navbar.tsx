"use client";

import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const cookie = document.cookie.match(/theme=([^;]+)/);
    const savedTheme = cookie ? cookie[1] : "dark";
    setIsDark(savedTheme === "dark");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    document.cookie = `theme=${newTheme};path=/;max-age=31536000`;
  };

  return (
    <header
      className={`w-full fixed top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-gray-200/50 dark:border-dark-border/50"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-[1440px] mx-auto flex justify-between items-center sm:px-16 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="logo-glow relative w-10 h-10 flex items-center justify-center">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
            >
              {/* Outer ring */}
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="url(#logoGradient)"
                strokeWidth="2"
                fill="none"
                className="opacity-60"
              />
              {/* Car body */}
              <path
                d="M8 28C8 28 10 22 16 22H32C38 22 40 28 40 28V32C40 33.1 39.1 34 38 34H10C8.9 34 8 33.1 8 32V28Z"
                fill="url(#logoGradient)"
                className="opacity-90"
              />
              {/* Car roof */}
              <path
                d="M14 22L18 16H30L34 22H14Z"
                fill="url(#logoGradient)"
                className="opacity-70"
              />
              {/* Wheels */}
              <circle
                cx="14"
                cy="34"
                r="4"
                fill="#1e293b"
                className="dark:fill-slate-800"
              />
              <circle cx="14" cy="34" r="2" fill="url(#logoGradient)" />
              <circle
                cx="34"
                cy="34"
                r="4"
                fill="#1e293b"
                className="dark:fill-slate-800"
              />
              <circle cx="34" cy="34" r="2" fill="url(#logoGradient)" />
              {/* Headlight */}
              <circle
                cx="38"
                cy="26"
                r="2"
                fill="#06b6d4"
                className="opacity-80"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#2B59FF" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-gradient leading-none">
              AutoVerse
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 leading-none mt-0.5">
              Drive the Future
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {isSignedIn ? (
            <Link
              href="/profile"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-blue dark:hover:text-accent-cyan font-medium text-sm transition-all duration-300 px-5 py-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10"
            >
              My Profile
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="relative overflow-hidden text-white rounded-full bg-gradient-to-r from-primary-blue to-accent-cyan min-w-[130px] px-6 py-2.5 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary-blue/30 hover:-translate-y-0.5 active:translate-y-0 font-semibold text-sm">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
