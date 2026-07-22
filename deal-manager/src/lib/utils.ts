import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwindクラスを条件付きで結合し、競合を解決するヘルパー（shadcn/ui標準） */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
