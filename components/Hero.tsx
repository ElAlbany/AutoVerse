"use client";

import Image from "next/image";
import { CustomButton } from "@components";

const Hero = () => {
  const handleScroll = () => {
    const nextSection = document.getElementById("discover");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg" />

      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Floating Particles */}
      <div className="particles-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Content */}
      <div className="hero relative z-10 w-full">
        <div className="flex-1 pt-36 padding-x">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-blue/10 dark:bg-primary-blue/20 border border-primary-blue/20 dark:border-primary-blue/30 mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-primary-blue animate-pulse" />
            <span className="text-sm font-medium text-primary-blue dark:text-primary-blue-300">
              Premium Car Rental Experience
            </span>
          </div>

          <h1
            className="hero__title animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Find, book, <span className="text-gradient">rent a car</span>
            <br />— quick and super easy!
          </h1>

          <p
            className="hero__subtitle max-w-xl animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Streamline your journey with AutoVerse. Premium vehicles, seamless
            booking, and unforgettable drives — all in one place.
          </p>

          <div
            className="flex items-center gap-4 mt-10 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <CustomButton
              title="Explore Cars"
              containerStyles="bg-gradient-to-r from-primary-blue to-accent-cyan text-white rounded-full hover:shadow-lg hover:shadow-primary-blue/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              handleClick={handleScroll}
            />
            {/* <CustomButton
              title="How it Works"
              containerStyles="bg-white/10 dark:bg-white/5 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              handleClick={() => {
                const el = document.getElementById("discover");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            /> */}
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-8 mt-16 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-gradient">50+</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Premium Cars
              </span>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-gradient">1k+</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Happy Drivers
              </span>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-gradient">99%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Satisfaction
              </span>
            </div>
          </div>
        </div>

        <div className="hero__image-container">
          <div className="hero__image">
            <Image
              src="/hero.png"
              alt="Premium SUV"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="hero__image-overlay" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
