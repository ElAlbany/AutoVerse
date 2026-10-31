"use client";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { signInUrl } from "@/lib/sign-in";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  return (
    <header className="av-nav">
      <nav className="av-shell">
        <Link href="/" className="av-brand" aria-label="AutoVerse home">
          <span className="av-monogram">
            A<span>V</span>
          </span>
          <span>
            AutoVerse<small>THE DRIVE IS YOURS</small>
          </span>
        </Link>
        <div className="av-nav-links">
          <Link href="/#discover">Our collection</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/rental-policy">Rental guide</Link>
        </div>
        <div className="av-nav-actions">
          <button
            className="av-icon-button"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.classList.toggle("dark", next);
              document.cookie = `theme=${next ? "dark" : "light"};path=/;max-age=31536000;SameSite=Lax`;
            }}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link
            className="av-account-link"
            href={isSignedIn ? "/profile/orders" : signInUrl(path)}
            onClick={(e) => {
              if (!isSignedIn) {
                e.preventDefault();
                window.location.assign(
                  signInUrl(window.location.pathname + window.location.search)
                );
              }
            }}
          >
            {isSignedIn ? "My rentals" : "Sign in"}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="av-mobile-menu av-icon-button"
            aria-label="Navigation menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="av-mobile-links">
            <Link href="/#discover" onClick={() => setOpen(false)}>
              Our collection
            </Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/rental-policy">Rental guide</Link>
            <Link href="/profile/favorites">Saved cars</Link>
            <Link href="/compare">Compare cars</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
