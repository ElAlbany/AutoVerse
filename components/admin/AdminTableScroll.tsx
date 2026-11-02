"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";

export default function AdminTableScroll({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const viewport = useRef<HTMLDivElement>(null),
    top = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [width, setWidth] = useState(0),
    [canLeft, setLeft] = useState(false),
    [canRight, setRight] = useState(false);
  useEffect(() => {
    const area = viewport.current!;
    const update = () => {
      setWidth(area.scrollWidth);
      setLeft(area.scrollLeft > 1);
      setRight(area.scrollLeft + area.clientWidth < area.scrollWidth - 1);
      if (top.current) top.current.scrollLeft = area.scrollLeft;
    };
    const observer = new ResizeObserver(update);
    observer.observe(area);
    if (area.firstElementChild) observer.observe(area.firstElementChild);
    area.addEventListener("scroll", update);
    update();
    return () => {
      observer.disconnect();
      area.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <div className="av-admin-table hidden lg:block">
      <div className="av-table-toolbar">
        <span>
          <MoveHorizontal size={14} /> Drag rows horizontally or use Shift +
          wheel
        </span>
        <div>
          <button
            aria-label={`Scroll ${label} left`}
            disabled={!canLeft}
            onClick={() =>
              viewport.current?.scrollBy({ left: -360, behavior: "smooth" })
            }
          >
            <ChevronLeft size={17} />
          </button>
          <button
            aria-label={`Scroll ${label} right`}
            disabled={!canRight}
            onClick={() =>
              viewport.current?.scrollBy({ left: 360, behavior: "smooth" })
            }
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div
        ref={top}
        className="av-table-top-scroll"
        aria-label={`${label} horizontal scrollbar`}
        onScroll={(e) => {
          if (viewport.current)
            viewport.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        <div style={{ width, height: 1 }} />
      </div>
      <div
        ref={viewport}
        className="av-table-viewport"
        role="region"
        aria-label={label}
        tabIndex={0}
        onPointerDown={(e) => {
          if (
            e.button !== 0 ||
            (e.target as HTMLElement).closest("button,input,select,textarea,a")
          )
            return;
          drag.current = {
            x: e.clientX,
            left: e.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const state = drag.current;
          if (!state || !(e.buttons & 1)) return;
          if (Math.abs(e.clientX - state.x) > 5) {
            state.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.scrollLeft = state.left - (e.clientX - state.x);
            e.preventDefault();
          }
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {children}
      </div>
    </div>
  );
}
