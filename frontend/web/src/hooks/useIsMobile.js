import { useEffect, useState } from "react";

/**
 * True when the environment behaves like a phone/tablet:
 * - Small viewport
 * - Coarse pointer (touch)
 *
 * This avoids "desktop browser resized to 412px" counting as mobile.
 */
export function useIsMobile(breakpointPx = 768) {
  const get = () => {
    if (typeof window === "undefined") return false;

    const mqWidth = window.matchMedia(`(max-width: ${breakpointPx}px)`).matches;
    const mqCoarse = window.matchMedia(`(pointer: coarse)`).matches;

    return mqWidth && mqCoarse;
  };

  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mqlWidth = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const mqlCoarse = window.matchMedia(`(pointer: coarse)`);

    const onChange = () => setIsMobile(get());

    // Modern browsers
    mqlWidth.addEventListener?.("change", onChange);
    mqlCoarse.addEventListener?.("change", onChange);

    // Fallback
    mqlWidth.addListener?.(onChange);
    mqlCoarse.addListener?.(onChange);

    // also catch orientation/resizes
    window.addEventListener("resize", onChange);

    return () => {
      mqlWidth.removeEventListener?.("change", onChange);
      mqlCoarse.removeEventListener?.("change", onChange);

      mqlWidth.removeListener?.(onChange);
      mqlCoarse.removeListener?.(onChange);

      window.removeEventListener("resize", onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}