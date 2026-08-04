"use client";

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { calculateCarRent, generateCarImageUrl } from "@utils";
import { CarProps } from "@types";
import CustomButton from "./CustomButton";

interface CarCardProps {
  car: CarProps;
}

const CarCard = ({ car }: CarCardProps) => {
  const {
    city_mpg,
    year,
    make,
    model,
    transmission,
    drive,
    id,
    available,
    featured,
  } = car;
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const carRent = calculateCarRent(city_mpg, year);

  const handleRent = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
    } else if (id) {
      router.push(`/rent?carId=${id}`);
    }
  };

  return (
    <div
      className={`car-card group relative ${
        featured
          ? "ring-2 ring-amber-400/60 dark:ring-amber-400/40 ring-offset-2 dark:ring-offset-dark-bg"
          : ""
      }`}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute -top-3 left-4 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-amber-400/30 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Featured
        </div>
      )}

      {/* Unavailable Badge */}
      {!available && (
        <div className="absolute bottom-2 right-2 z-10 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
          Unavailable
        </div>
      )}

      <div className="car-card__content">
        <h2 className="car-card__content-title text-gray-900 dark:text-gray-100">
          {make} {model}
        </h2>
      </div>

      <p className="flex mt-6 text-[32px] leading-[38px] font-extrabold text-gray-900 dark:text-gray-100">
        <span className="self-start text-[14px] leading-[17px] font-semibold text-primary-blue dark:text-accent-cyan">
          $
        </span>
        {carRent}
        <span className="self-end text-[14px] leading-[17px] font-medium text-gray-500 dark:text-gray-400">
          /day
        </span>
      </p>

      <div className="relative w-full h-40 my-3 object-contain">
        <Image
          src={generateCarImageUrl(car)}
          alt={`${make} ${model}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="relative flex w-full mt-2">
        <div className="flex group-hover:invisible w-full justify-between text-gray-500 dark:text-gray-400">
          <div className="flex flex-col justify-center items-center gap-2">
            <Image
              src="/steering-wheel.svg"
              width={20}
              height={20}
              alt="steering wheel"
              className="dark:invert dark:opacity-70"
            />
            <p className="text-[14px] leading-[17px]">
              {transmission === "a" ? "Automatic" : "Manual"}
            </p>
          </div>
          <div className="car-card__icon">
            <Image
              src="/tire.svg"
              width={20}
              height={20}
              alt="drive"
              className="dark:invert dark:opacity-70"
            />
            <p className="car-card__icon-text">{drive.toUpperCase()}</p>
          </div>
          <div className="car-card__icon">
            <Image
              src="/gas.svg"
              width={20}
              height={20}
              alt="mpg"
              className="dark:invert dark:opacity-70"
            />
            <p className="car-card__icon-text">{city_mpg} MPG</p>
          </div>
        </div>

        <div className="car-card__btn-container flex gap-2 w-full">
          <CustomButton
            title="View More"
            containerStyles="flex-1 py-[14px] rounded-full bg-gradient-to-r from-primary-blue to-primary-blue-200 hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0"
            textStyles="text-white text-[14px] leading-[17px] font-bold"
            rightIcon="/right-arrow.svg"
            handleClick={() => id && router.push(`/car-details/${id}`)}
          />
          {available ? (
            <CustomButton
              title="Rent"
              containerStyles="flex-1 py-[14px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0"
              textStyles="text-white text-[14px] leading-[17px] font-bold"
              handleClick={handleRent}
            />
          ) : (
            <button
              disabled
              className="flex-1 py-[14px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[14px] leading-[17px] font-bold cursor-not-allowed border border-gray-200 dark:border-gray-600"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;
