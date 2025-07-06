// frontend/src/hooks/useTypingBehavior.ts
import { useState, useRef, useEffect, useCallback } from 'react'; // Import useCallback

interface TypingBehavior {
  typingSpeed: number; // characters per second
  keystrokeCount: number;
  keystrokeVariation: number; // Simple variance for now
  pasteDetected: boolean;
  reset: () => void;
}

export const useTypingBehavior = (inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>): TypingBehavior => {
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingEndTime, setTypingEndTime] = useState<number | null>(null);
  const [keystrokeTimings, setKeystrokeTimings] = useState<number[]>([]);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [pasteDetected, setPasteDetected] = useState(false);

  // Wrap event handlers in useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    console.log("useTypingBehavior: Keydown detected:", e.key);
    if (!typingStartTime) { // Use functional update for state that depends on previous state
      setTypingStartTime(Date.now());
    }
    setKeystrokeTimings(prev => [...prev, Date.now()]);
    setKeystrokeCount(prev => prev + 1);
  }, [typingStartTime]); // Dependency: typingStartTime

  const handleBlur = useCallback(() => {
    console.log("useTypingBehavior: Blur detected for input.");
    if (typingStartTime) { // Use functional update for state that depends on previous state
      setTypingEndTime(Date.now());
    }
  }, [typingStartTime]); // Dependency: typingStartTime

  const handlePaste = useCallback(() => {
    console.log("useTypingBehavior: Paste detected.");
    setPasteDetected(true);
  }, []); // No dependencies, as it only sets a boolean

  const reset = useCallback(() => {
    setTypingStartTime(null);
    setTypingEndTime(null);
    setKeystrokeTimings([]);
    setKeystrokeCount(0);
    setPasteDetected(false);
  }, []); // No dependencies

  useEffect(() => {
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keydown', handleKeyDown);
      inputElement.addEventListener('blur', handleBlur);
      inputElement.addEventListener('paste', handlePaste);
    }
    return () => {
      if (inputElement) {
        inputElement.removeEventListener('keydown', handleKeyDown);
        inputElement.removeEventListener('blur', handleBlur);
        inputElement.removeEventListener('paste', handlePaste);
      }
    };
  }, [inputRef, handleKeyDown, handleBlur, handlePaste]); // Add handlers to useEffect dependencies

  const typingDuration = typingStartTime && typingEndTime ? (typingEndTime - typingStartTime) / 1000 : 0;
  const typingSpeed = typingDuration > 0 ? keystrokeCount / typingDuration : 0;

  console.log("useTypingBehavior - Current State:");
  console.log("  typingStartTime:", typingStartTime);
  console.log("  typingEndTime:", typingEndTime);
  console.log("  keystrokeCount:", keystrokeCount);
  console.log("  typingDuration:", typingDuration);
  console.log("  calculated typingSpeed:", typingSpeed);

  // Simple keystroke variation calculation (variance of inter-keystroke times)
  const interKeystrokeTimes = keystrokeTimings.slice(1).map((time, i) => time - keystrokeTimings[i]);
  const meanInterKeystrokeTime = interKeystrokeTimes.length > 0
    ? interKeystrokeTimes.reduce((sum, t) => sum + t, 0) / interKeystrokeTimes.length
    : 0;
  const keystrokeVariation = interKeystrokeTimes.length > 0
    ? interKeystrokeTimes.reduce((sum, t) => sum + Math.pow(t - meanInterKeystrokeTime, 2), 0) / interKeystrokeTimes.length
    : 0;


  return { typingSpeed, keystrokeCount, keystrokeVariation, pasteDetected, reset };
};