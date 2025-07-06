export interface MLFeatures {
  typing_duration: number;
  pasted: number; // 0 or 1
  ip_score: number; // Placeholder from frontend, backend will refine
  device_score: number; // Placeholder from frontend, backend will refine
  keystroke_variation: number;
  screen_width: number;
  language_en_US: number; // 0 or 1
  language_fr_FR: number; // 0 or 1
  language_ru_RU: number; // 0 or 1
  language_zh_CN: number; // 0 or 1
}

export interface TrackSessionPayload {
  typingSpeed?: number; // Corresponds to typing_duration
  pasteDetected?: boolean; // Corresponds to pasted
  checkoutDuration?: number; // For checkout flow
  countryMismatch?: boolean; // For checkout/login flow
  keystrokeVariation?: number;
  screenWidth?: number;
  language?: string; // e.g., "en-US"
  // Add other relevant data you might want to send to backend for context
  action: string; // e.g., "login", "add_to_cart", "update_password"
  context?: string; // e.g., "login_form", "product_page"
}