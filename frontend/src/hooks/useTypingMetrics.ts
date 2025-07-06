import { useRef } from 'react';

export function useTypingMetrics(fieldName: string) {
  const startTimeRef = useRef<number | null>(null);
  const charCountRef = useRef(0);
  const pasteUsedRef = useRef(false);

  const handleKeyDown = () => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    charCountRef.current += 1;
  };

  const handlePaste = () => {
    pasteUsedRef.current = true;
  };

  const getMetrics = (expectedLength: number) => {
    const now = Date.now();
    const elapsed = (now - (startTimeRef.current || now)) / 1000;
    const speed = expectedLength && elapsed > 0 ? expectedLength / elapsed : 0;

    return {
      speed: Math.round(speed * 100) / 100,
      pasted: pasteUsedRef.current,
    };
  };

  return {
    handleKeyDown,
    handlePaste,
    getMetrics,
  };
}
