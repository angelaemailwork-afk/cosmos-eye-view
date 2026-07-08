import { useEffect, useState } from "react";

/** Returns true after client-side hydration completes. */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}