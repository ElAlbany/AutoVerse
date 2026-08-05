"use client";

import { useRouter } from "next/navigation";
import { CustomButton } from "@components";

interface ShowMoreProps {
  pageNumber: number;
  isNext: boolean;
}

export default function ShowMore({ pageNumber, isNext }: ShowMoreProps) {
  const router = useRouter();

  const handleNavigation = () => {
    const newLimit = (pageNumber + 1) * 10;
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("limit", String(newLimit));

    // scroll: false prevents jumping to top!
    router.push(`${window.location.pathname}?${searchParams.toString()}`, {
      scroll: false,
    });
  };

  // Don't render if there are no more results
  if (!isNext) return null;

  return (
    <div className="w-full flex-center gap-5 mt-10">
      <CustomButton
        btnType="button"
        title="Show More"
        containerStyles="bg-primary-blue rounded-full text-white min-w-[150px] py-3 px-6 hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/20 dark:hover:shadow-primary-blue/30"
        handleClick={handleNavigation}
      />
    </div>
  );
}
