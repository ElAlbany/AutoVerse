import Image from "next/image";
import Link from "next/link";

import { footerLinks } from "@constants";

const Footer = () => (
  <footer className="footer">
    <div className="footer__links-container">
      <div className="footer__rights">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="logo-glow relative w-8 h-8 flex items-center justify-center">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="url(#footerLogoGradient)"
                strokeWidth="2"
                fill="none"
                className="opacity-60"
              />
              <path
                d="M8 28C8 28 10 22 16 22H32C38 22 40 28 40 28V32C40 33.1 39.1 34 38 34H10C8.9 34 8 33.1 8 32V28Z"
                fill="url(#footerLogoGradient)"
                className="opacity-90"
              />
              <path
                d="M14 22L18 16H30L34 22H14Z"
                fill="url(#footerLogoGradient)"
                className="opacity-70"
              />
              <circle
                cx="14"
                cy="34"
                r="4"
                fill="#1e293b"
                className="dark:fill-slate-800"
              />
              <circle cx="14" cy="34" r="2" fill="url(#footerLogoGradient)" />
              <circle
                cx="34"
                cy="34"
                r="4"
                fill="#1e293b"
                className="dark:fill-slate-800"
              />
              <circle cx="34" cy="34" r="2" fill="url(#footerLogoGradient)" />
              <circle
                cx="38"
                cy="26"
                r="2"
                fill="#06b6d4"
                className="opacity-80"
              />
              <defs>
                <linearGradient
                  id="footerLogoGradient"
                  x1="0"
                  y1="0"
                  x2="48"
                  y2="48"
                >
                  <stop offset="0%" stopColor="#2B59FF" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-lg font-extrabold text-gradient">
            AutoVerse
          </span>
        </Link>
        <p className="text-base text-gray-500 dark:text-gray-400 max-w-xs">
          AutoVerse 2024 <br />
          Redefining the way you drive. Premium cars, seamless experience.
        </p>
      </div>

      <div className="footer__links">
        {footerLinks.map((item) => (
          <div key={item.title} className="footer__link">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {item.title}
            </h3>
            <div className="flex flex-col gap-5">
              {item.links.map((link) => (
                <Link
                  key={link.title}
                  href={link.url}
                  className="text-gray-500 dark:text-gray-400 hover:text-primary-blue dark:hover:text-accent-cyan transition-colors duration-300"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="footer__copyrights">
      <p className="text-gray-500 dark:text-gray-400">
        &copy; 2024 AutoVerse. All rights reserved
      </p>

      <div className="footer__copyrights-link">
        <Link
          href="/"
          className="text-gray-500 dark:text-gray-400 hover:text-primary-blue dark:hover:text-accent-cyan transition-colors duration-300"
        >
          Privacy & Policy
        </Link>
        <Link
          href="/"
          className="text-gray-500 dark:text-gray-400 hover:text-primary-blue dark:hover:text-accent-cyan transition-colors duration-300"
        >
          Terms & Condition
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
