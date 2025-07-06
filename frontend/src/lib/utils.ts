// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generic merge function to combine real backend data with mock data
export function mergeWithMock<T extends { id: string }>(realData: T[], mockData: T[]): T[] {
  const realIds = new Set(realData.map(item => item.id));
  const merged = [...realData];

  mockData.forEach(mockItem => {
    if (!realIds.has(mockItem.id)) {
      merged.push({ ...mockItem, isMock: true } as T);
    }
  });

  return merged;
}