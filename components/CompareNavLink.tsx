"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Columns2 } from "lucide-react";
import { readComparison } from "@/lib/comparison";

export default function CompareNavLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      setCount(readComparison().length);
    };
    update();
    window.addEventListener("autoverse-compare", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("autoverse-compare", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <Link href="/compare" className="av-compare-nav">
      <Columns2 size={15} /> Compare cars{" "}
      <span aria-label={`${count} ${count === 1 ? "car" : "cars"} selected`}>
        {count}
      </span>
    </Link>
  );
}
