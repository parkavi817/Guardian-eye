// frontend/src/services/trackingService.ts
import axios from 'axios';
import { TrackSessionPayload, MLFeatures } from '../types/ml'; // Adjust path as needed

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Ensure this matches your backend API base URL

export const trackUserBehavior = async (payload: TrackSessionPayload) => {
  try {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage

    // Default/Placeholder values for ML features not directly collected by frontend
    const defaultMLFeatures: MLFeatures = {
      typing_duration: payload.typingSpeed || 0,
      pasted: payload.pasteDetected ? 1 : 0,
      ip_score: 0.5, // Placeholder: Backend should calculate this based on user's IP
      device_score: 0.5, // Placeholder: Backend should calculate this based on user's device fingerprint
      keystroke_variation: payload.keystrokeVariation || 0.0,
      screen_width: payload.screenWidth || window.screen.width || 0, // Use window.screen.width if not provided
      language_en_US: payload.language === 'en-US' ? 1 : 0,
      language_fr_FR: payload.language === 'fr-FR' ? 1 : 0,
      language_ru_RU: payload.language === 'ru-RU' ? 1 : 0,
      language_zh_CN: payload.language === 'zh-CN' ? 1 : 0,
    };

    // Construct the features array in the exact order expected by the ML model
    const featuresArray = [
      defaultMLFeatures.typing_duration,
      defaultMLFeatures.pasted,
      defaultMLFeatures.ip_score,
      defaultMLFeatures.device_score,
      defaultMLFeatures.keystroke_variation,
      defaultMLFeatures.screen_width,
      defaultMLFeatures.language_en_US,
      defaultMLFeatures.language_fr_FR,
      defaultMLFeatures.language_ru_RU,
      defaultMLFeatures.language_zh_CN,
    ];

    // The payload sent to your Node.js backend's trackSession endpoint
    // This should match what trackSession expects in req.body
    const backendPayload = {
      typingSpeed: payload.typingSpeed,
      pasteDetected: payload.pasteDetected,
      checkoutDuration: payload.checkoutDuration,
      countryMismatch: payload.countryMismatch,
      // Send the 10-feature array for the ML model
      features: featuresArray, // This is the array your backend will send to Python
      action: payload.action,
      context: payload.context,
      // You might also want to send raw data for backend processing, e.g.,
      // userIp: '...', // if you can get it from frontend
      // deviceFingerprint: '...', // if you can generate it on frontend
    };

    await axios.post(`${API_URL}/sessions/track`, backendPayload, { // CORRECTED LINE
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Behavior tracked: ${payload.action} - ${payload.context || ''}`);
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    // Handle error (e.g., show a toast, log to an error tracking service)
  }
};