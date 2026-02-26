// src/components/CountUp.jsx
import React, { useEffect, useRef, useState } from "react";

// Lightweight count-up (no external deps)
export default function CountUp({ end = 0, duration = 1.2, formatter }) {
  const [val, setVal] = useState(0);
  const startTs = useRef(null);
  const lastEnd = useRef(end);

  useEffect(() => {
    if (lastEnd.current === end) return;
    lastEnd.current = end;
    startTs.current = null;
    let raf;
    const start = 0;
    const change = Number(end) - start;
    const total = Math.max(0.2, Number(duration)) * 1000;

    function step(ts) {
      if (!startTs.current) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const t = Math.min(1, elapsed / total);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(start + change * eased);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  const out = formatter ? formatter(val) : Math.round(val).toLocaleString();
  return <span>{out}</span>;
}
