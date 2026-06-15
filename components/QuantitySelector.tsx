"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-11 items-center rounded-lg border-2 border-ink bg-white">
      <button className="grid size-10 place-items-center" onClick={() => onChange(Math.max(0, value - 1))} type="button" aria-label="Restar">
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-sm font-black">{value}</span>
      <button className="grid size-10 place-items-center" onClick={() => onChange(Math.min(max, value + 1))} type="button" aria-label="Sumar">
        <Plus size={16} />
      </button>
    </div>
  );
}
