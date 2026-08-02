"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth, SignInButton } from "@clerk/nextjs";

const Navbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <header className="w-full absolute z-10">
      <nav className="max-w-[1440px] mx-auto flex justify-between items-center sm:px-16 px-6 py-4">
        <Link href="/" className="flex justify-center items-center">
          <Image
            src="/logo.svg"
            alt="Car Hub Logo"
            width={118}
            height={18}
            className="object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Link
              href="/profile"
              className="text-gray-700 hover:text-primary-blue font-medium text-sm transition-colors px-4 py-2 rounded-full hover:bg-gray-50"
            >
              My Profile
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="text-white rounded-full bg-primary-blue min-w-[130px] px-4 py-2 transition-all duration-300 ease-in-out hover:translate-y-0.5 hover:shadow-lg active:translate-y-1">
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
