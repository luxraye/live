import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function AnimatedNumber({ value, className, prefix = "", suffix = "", delay = 0 }: AnimatedNumberProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const spring = useSpring(0, { bounce: 0, duration: 2500 });
  const display = useTransform(spring, (current) => {
    return prefix + Math.round(current).toLocaleString() + suffix;
  });

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [spring, value, inView, delay]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
