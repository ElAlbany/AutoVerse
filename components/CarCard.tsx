"use client";

import { useState } from "react";
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
  const { city_mpg, year, make, model, transmission, drive, id } = car;
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
    <div className="car-card group">
      <div className="car-card__content">
        <h2 className="car-card__content-title">
          {make} {model}
        </h2>
      </div>

      <p className="flex mt-6 text-[32px] leading-[38px] font-extrabold">
        <span className="self-start text-[14px] leading-[17px] font-semibold">
          $
        </span>
        {carRent}
        <span className="self-end text-[14px] leading-[17px] font-medium">
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
          className="object-contain"
        />
      </div>

      <div className="relative flex w-full mt-2">
        <div className="flex group-hover:invisible w-full justify-between text-grey">
          <div className="flex flex-col justify-center items-center gap-2">
            <Image
              src="/steering-wheel.svg"
              width={20}
              height={20}
              alt="steering wheel"
            />
            <p className="text-[14px] leading-[17px]">
              {transmission === "a" ? "Automatic" : "Manual"}
            </p>
          </div>
          <div className="car-card__icon">
            <Image src="/tire.svg" width={20} height={20} alt="seat" />
            <p className="car-card__icon-text">{drive.toUpperCase()}</p>
          </div>
          <div className="car-card__icon">
            <Image src="/gas.svg" width={20} height={20} alt="seat" />
            <p className="car-card__icon-text">{city_mpg} MPG</p>
          </div>
        </div>

        <div className="car-card__btn-container flex gap-2 w-full">
          <CustomButton
            title="View More"
            containerStyles="flex-1 py-[16px] rounded-full bg-primary-blue hover:bg-blue-700 transition-all duration-300 ease-in-out hover:translate-y-0.5 hover:shadow-lg active:translate-y-1"
            textStyles="text-white text-[14px] leading-[17px] font-bold"
            rightIcon="/right-arrow.svg"
            handleClick={() => id && router.push(`/car-details/${id}`)}
          />
          <CustomButton
            title="Rent"
            containerStyles="flex-1 py-[16px] rounded-full bg-green-600 hover:bg-green-700 transition-all duration-300 ease-in-out hover:translate-y-0.5 hover:shadow-lg active:translate-y-1"
            textStyles="text-white text-[14px] leading-[17px] font-bold"
            handleClick={handleRent}
          />
        </div>
      </div>
    </div>
  );
};

export default CarCard;
