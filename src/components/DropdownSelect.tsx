"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownOption = { value: string; label: string };

type Props = {
  id?: string;
  label?: string;
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  allowEmpty?: boolean;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

export default function DropdownSelect({
  id,
  label,
  value,
  options,
  placeholder = "— Auswählen —",
  allowEmpty = false,
  onChange,
  className = "",
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? label}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <span className="ml-2 shrink-0 text-zinc-400" aria-hidden>▼</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-[110] mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
        >
          {allowEmpty && (
            <li role="option">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${!value ? "bg-zinc-100 dark:bg-zinc-700" : "text-zinc-700 dark:text-zinc-300"}`}
              >
                {placeholder}
              </button>
            </li>
          )}
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${value === opt.value ? "bg-zinc-100 dark:bg-zinc-700" : "text-zinc-700 dark:text-zinc-300"}`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
