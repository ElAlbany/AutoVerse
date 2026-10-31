"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Columns2 } from "lucide-react";
import { COMPARE_KEY } from "./CompareButton";

export default function CompareNavLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      try {
        const value = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
        setCount(Array.isArray(value) ? Math.min(value.length, 3) : 0);
      } catch {
        setCount(0);
      }
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
      <span aria-label={`${count} cars selected`}>{count}</span>
    </Link>
  );
}
