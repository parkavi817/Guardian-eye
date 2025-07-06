import type { BehavioralData, User } from '@/types';

export function calculateTrustScore(data: BehavioralData): { trustScore: number; riskFactors: string[] } {
  let risk = 0;
  const riskFactors: string[] = [];

  if (data.typingSpeedLogin !== undefined && (data.typingSpeedLogin < 1 || data.typingSpeedLogin > 8)) {
    risk += 10;
    riskFactors.push(`Unusual login typing speed: ${data.typingSpeedLogin.toFixed(2)} kps`);
  }
  if (data.typingSpeedShipping !== undefined && (data.typingSpeedShipping < 1 || data.typingSpeedShipping > 8)) {
    risk += 10;
    riskFactors.push(`Unusual shipping form typing speed: ${data.typingSpeedShipping.toFixed(2)} kps`);
  }
  if (data.typingSpeedPayment !== undefined && (data.typingSpeedPayment < 1 || data.typingSpeedPayment > 8)) {
    risk += 10;
    riskFactors.push(`Unusual payment form typing speed: ${data.typingSpeedPayment.toFixed(2)} kps`);
  }

  if (data.deviceReuseCount !== undefined && data.deviceReuseCount > 3) {
    risk += 15;
    riskFactors.push(`High device reuse: ${data.deviceReuseCount} times`);
  }

  if (data.ipCountry && data.billingCountry && data.ipCountry.toLowerCase() !== data.billingCountry.toLowerCase()) {
    risk += 20;
    riskFactors.push(`IP country (${data.ipCountry}) mismatch with billing country (${data.billingCountry})`);
  }

  if (data.passwordPastedLogin) {
    risk += 5;
    riskFactors.push('Password pasted during login');
  }

  if (data.timeOnPageCheckout !== undefined && data.timeOnPageCheckout < 5) { // 5 seconds
    risk += 10;
    riskFactors.push(`Very short checkout duration: ${data.timeOnPageCheckout}s`);
  }
  
  if (data.proxyVpnDetected) {
    risk += 25;
    riskFactors.push('Proxy/VPN detected');
  }

  // Ensure risk doesn't exceed 100 for trust score calculation
  risk = Math.min(risk, 100); 
  const trustScore = Math.max(0, 100 - risk); // Ensure trust score is not negative

  return { trustScore, riskFactors };
}

export function getStatusFromTrustScore(trustScore: number): User['status'] {
  if (trustScore >= 80) return 'Safe';
  if (trustScore >= 50) return 'Monitor';
  return 'Suspicious'; // Blocked status will be handled manually by admin
}
