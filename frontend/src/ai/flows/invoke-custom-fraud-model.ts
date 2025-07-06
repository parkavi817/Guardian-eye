'use server';
/**
 * @fileOverview A Genkit flow to invoke an external custom fraud detection model.
 *
 * - invokeCustomFraudModel - A function that calls an external API hosting the ML model.
 * - CustomFraudModelInput - The input type for the invokeCustomFraudModel function.
 * - CustomFraudModelOutput - The return type for the invokeCustomFraudModel function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the expected input schema for your model
// Adjust these fields based on what your Python model expects
export const CustomFraudModelInputSchema = z.object({
  ipReputationScore: z.number().optional().describe('Reputation score of the IP address.'),
  typingSpeedKPS: z.number().describe('Typing speed in keystrokes per second.'),
  deviceAnomalyScore: z.number().optional().describe('Anomaly score based on device fingerprint.'),
  transactionAmount: z.number().describe('The amount of the transaction.'),
  userHistoryScore: z.number().optional().describe('Score based on user past behavior.'),
  // Add other features your model requires
});
export type CustomFraudModelInput = z.infer<typeof CustomFraudModelInputSchema>;

// Define the expected output schema from your model's API
export const CustomFraudModelOutputSchema = z.object({
  fraudProbability: z.number().describe('The predicted probability of fraud (e.g., 0.0 to 1.0).'),
  modelVersion: z.string().optional().describe('Version of the model that made the prediction.'),
});
export type CustomFraudModelOutput = z.infer<typeof CustomFraudModelOutputSchema>;

export async function invokeCustomFraudModel(
  input: CustomFraudModelInput
): Promise<CustomFraudModelOutput> {
  return invokeCustomFraudModelFlow(input);
}

const invokeCustomFraudModelFlow = ai.defineFlow(
  {
    name: 'invokeCustomFraudModelFlow',
    inputSchema: CustomFraudModelInputSchema,
    outputSchema: CustomFraudModelOutputSchema,
  },
  async (payload) => {
    // NOTE: This flow is currently returning MOCK DATA to prevent errors
    // while your backend is under development.
    // The "Unexpected token '<'" error happens when this code expects JSON
    // but the backend (e.g., at http://localhost:5000) returns HTML instead,
    // usually because it's not running or has an error.
    console.log('--- INVOKING CUSTOM FRAUD MODEL (MOCK) ---');
    console.log('Payload:', payload);
    console.log('Returning mock fraud probability to avoid errors.');

    return { fraudProbability: 0.15, modelVersion: 'mock-data-v2' };

    /*
    // --- WHEN YOUR BACKEND IS READY, UNCOMMENT THE CODE BELOW AND DELETE THE MOCK DATA RETURN ---

    const modelApiUrl = process.env.CUSTOM_MODEL_API_URL;

    if (!modelApiUrl) {
      console.warn(
        'CUSTOM_MODEL_API_URL is not set. Please set it in your .env file. Returning placeholder data.'
      );
      // Fallback if the URL is not set in the environment
      return { fraudProbability: 0.1, modelVersion: 'placeholder-no-url' };
    }

    try {
      const response = await fetch(modelApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        // Try to get more details from the response body if possible
        const errorBody = await response.text();
        console.error(`Error from backend API: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`API returned error: ${response.status}`);
      }
      
      const result = await response.json();
      return result;

    } catch (error) {
      console.error(
        `Error invoking custom fraud model at ${modelApiUrl}. This can happen if the backend is not running, returns a non-JSON response (like an HTML error page), or there's a network issue.`,
        error
      );
      // Return a fallback value so the entire application doesn't crash.
      return { fraudProbability: 0.05, modelVersion: 'error-fallback' };
    }
    */
  }
);
