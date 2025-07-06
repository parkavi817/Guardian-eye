// secureshop-frontend/hooks/useBehaviorTracker.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

interface TrackerProps {
  userId?: string;
  userEmail?: string;
  trigger?: boolean;
}

export function useBehaviorTracker({ userId, userEmail, trigger = true }: TrackerProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [pasteUsed, setPasteUsed] = useState(false);
  const charCountRef = useRef(0);

  const onKeyDown = useCallback(() => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    charCountRef.current += 1;
    setEndTime(Date.now());
  }, [startTime]);

  const onPaste = useCallback(() => setPasteUsed(true), []);

  const calculateTypingSpeed = useCallback(() => {
    if (!startTime || !endTime) return 0;
    const seconds = (endTime - startTime) / 1000;
    return seconds > 0 ? charCountRef.current / seconds : 0;
  }, [startTime, endTime]);

  const sendAnomaly = useCallback(async () => {
    if (!userId || !userEmail) return;

    const typingSpeed = calculateTypingSpeed();
    const focusTime = endTime && startTime ? (endTime - startTime) / 1000 : 0;
    const idleTime = 0;

    // 📍 Country mismatch detection
    let countryMismatch = false;
    try {
       const ipRes = await fetch('https://ipwho.is/'); 
       if (!ipRes.ok) { throw new Error('Failed to fetch IP info'); }
      const ipData = await ipRes.json();
      const ipCountry = ipData.country_code; // ipwho.is uses 'country_code'

      const browserLang = navigator.language || navigator.languages?.[0];
      const browserCountry = browserLang?.slice(-2).toUpperCase(); // e.g., "US"

      if (ipCountry && browserCountry && ipCountry !== browserCountry) {
        countryMismatch = true;
        console.warn("🌍 Country mismatch detected:", ipCountry, browserCountry);
      }
    } catch (error) {
      console.error("🌐 Failed to get country info", error);
    }

    const features = [
      typingSpeed,
      pasteUsed ? 1 : 0,
      focusTime,
      countryMismatch ? 1 : 0,
    ];

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anomaly/behavior`, {
        features,
        userId,
        userEmail,
        source: 'login-signup',
        message: 'Anomaly detected during form submission',
      });
    } catch (err) {
      console.error('🚨 Anomaly detection error:', err);
    }

    // Reset
    setStartTime(null);
    setEndTime(null);
    charCountRef.current = 0;
    setPasteUsed(false);
  }, [userId, userEmail, calculateTypingSpeed, endTime, startTime, pasteUsed]);

  return {
    onKeyDown,
    onPaste,
    sendAnomaly, // THIS WAS MISSING
  };
}

// -------------------- CART/WISHLIST INTERACTION ---------------------

export function useCartInteractionMetrics(userId?: string, userEmail?: string) {
  const interactionTimes = useRef<number[]>([]);
  const [triggered, setTriggered] = useState(false);
  const [startTimeCart] = useState(() => Date.now()); // Renamed to avoid conflict if both hooks are used

  // New states/refs for typing/paste/country
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingEndTime, setTypingEndTime] = useState<number | null>(null);
  const [pasteDetected, setPasteDetected] = useState(false);
  const charCountRef = useRef(0);
  const [countryMismatch, setCountryMismatch] = useState(false);
  const countryMismatchDetectedRef = useRef(false); // New ref for preventing infinite loop

  // Event handlers for typing/paste
  const onKeyDown = useCallback(() => {
    if (!typingStartTime) {
      setTypingStartTime(Date.now());
    }
    charCountRef.current += 1;
    setTypingEndTime(Date.now());
  }, [typingStartTime]);

  const onPaste = useCallback(() => setPasteDetected(true), []);

  // Calculate typing speed
  const calculateTypingSpeed = useCallback(() => {
    if (!typingStartTime || !typingEndTime) return 0;
    const seconds = (typingEndTime - typingStartTime) / 1000;
    return seconds > 0 ? charCountRef.current / seconds : 0;
  }, [typingStartTime, typingEndTime]);

  // Country mismatch detection effect
  useEffect(() => {
    const detectCountryMismatch = async () => {
      // Only run if not already detected and not already tried
      if (countryMismatchDetectedRef.current) {
        return;
      }
      countryMismatchDetectedRef.current = true; // Mark as tried

      try {
       const ipRes = await fetch('https://ipwho.is/'); // Changed from ipapi.co
        if (!ipRes.ok) { throw new Error('Failed to fetch IP info'); }
        const ipData = await ipRes.json();
        const ipCountry = ipData.country_code; // ipwho.is uses 'country_code'

        const browserLang = navigator.language || navigator.languages?.[0];
        const browserCountry = browserLang?.slice(-2).toUpperCase(); // e.g., "US"

        if (ipCountry && browserCountry && ipCountry !== browserCountry) {
          if (!countryMismatch) { // Only update if not already true
            setCountryMismatch(true);
            console.warn("🌍 Country mismatch detected:", ipCountry, browserCountry);
          }
        }
      } catch (error) {
        console.error("🌐 Failed to get country info for cart metrics", error);
        // Optionally, reset countryMismatchDetectedRef.current to false if you want to retry on error
        // countryMismatchDetectedRef.current = false;
      }
    };
    detectCountryMismatch();
  }, [countryMismatch]); // Add countryMismatch to dependency array to re-run if it changes (though it should only change once)

  const sendCartAnomaly = useCallback(async () => {
    if (!userId || !userEmail) return;

    const frequency = interactionTimes.current.length;
    const duration = (Date.now() - startTimeCart) / 1000; // Use startTimeCart

    // Get the newly integrated metrics
    const currentTypingSpeed = calculateTypingSpeed();

    const features = [
      currentTypingSpeed,
      pasteDetected ? 1 : 0,
      duration, // This is checkoutDuration in cartController
      countryMismatch ? 1 : 0,
      frequency, // Additional feature for cart frequency
    ];

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anomaly/behavior`, {
        features,
        userId,
        userEmail,
        source: 'cart-wishlist',
        message: 'High-frequency cart/wishlist activity or other anomaly detected',
      });
      console.warn('⚠️ Cart anomaly reported');
    } catch (err) {
      console.error('🚨 Cart anomaly error:', err);
    }
    // Reset typing/paste metrics after sending anomaly
    setTypingStartTime(null);
    setTypingEndTime(null);
    charCountRef.current = 0;
    setPasteDetected(false);
  }, [userId, userEmail, startTimeCart, calculateTypingSpeed, pasteDetected, countryMismatch]);

  const trackInteraction = useCallback(() => {
    const now = Date.now();
    interactionTimes.current.push(now);

    // Keep only last 10 seconds
    interactionTimes.current = interactionTimes.current.filter(t => now - t <= 10000);

    if (!triggered && interactionTimes.current.length >= 10) {
      sendCartAnomaly();
      setTriggered(true);
    }
  }, [triggered, sendCartAnomaly]);

  const getMetrics = useCallback(() => {
    const duration = (Date.now() - startTimeCart) / 1000;
    const currentTypingSpeed = calculateTypingSpeed();

    return {
      count: interactionTimes.current.length,
      abnormal: interactionTimes.current.length >= 10 || pasteDetected || countryMismatch || currentTypingSpeed > 5,
      speed: currentTypingSpeed,
      pasted: pasteDetected,
      duration,
      countryMismatch: countryMismatch,
    };
  }, [startTimeCart, calculateTypingSpeed, pasteDetected, countryMismatch, interactionTimes]);

  return {
    trackInteraction,
    getMetrics,
    onKeyDown, // Expose event handlers
    onPaste,   // Expose event handlers
  };
}