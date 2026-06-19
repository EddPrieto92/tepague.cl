"use client";

export function SharedItemToggle({ checked, onChange, label = "Yo compartí esto" }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <label className="flex min-h-11 items-center justify-between rounded-lg border-2 border-ink bg-white px-3 text-sm font-black">
      {label}
      <input checked={checked} className="size-5 accent-ink" type="checkbox" onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
