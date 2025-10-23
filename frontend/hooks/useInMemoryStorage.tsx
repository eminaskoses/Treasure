"use client";

import { useMemo } from "react";
import { GenericStringInMemoryStorage } from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage() {
  const storage = useMemo(() => new GenericStringInMemoryStorage(), []);
  return { storage };
}


