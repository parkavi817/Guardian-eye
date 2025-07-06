'use server';

/**
 * @fileOverview Summarizes the risk factors of a flagged user for the admin panel.
 *
 * - enhanceAdminReport - A function that generates a summary of risk factors for a given user.
 * - EnhanceAdminReportInput - The input type for the enhanceAdminReport function.
 * - EnhanceAdminReportOutput - The return type for the enhanceAdminReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceAdminReportInputSchema = z.object({
  ipAddress: z.string().describe('The IP address of the user.'),
  typingSpeed: z.number().describe('The average typing speed of the user.'),
  deviceReuse: z.number().describe('The number of times the device has been used across different accounts.'),
  ipLocation: z.string().describe('The location of the user based on IP address.'),
  billingCountry: z.string().describe('The billing country of the user.'),
  userAgent: z.string().describe('The user agent of the user.'),
  trustScore: z.number().describe('The calculated trust score of the user.'),
});

export type EnhanceAdminReportInput = z.infer<typeof EnhanceAdminReportInputSchema>;

const EnhanceAdminReportOutputSchema = z.object({
  summary: z.string().describe('A summary of the risk factors for the user.'),
});

export type EnhanceAdminReportOutput = z.infer<typeof EnhanceAdminReportOutputSchema>;

export async function enhanceAdminReport(input: EnhanceAdminReportInput): Promise<EnhanceAdminReportOutput> {
  return enhanceAdminReportFlow(input);
}

const enhanceAdminReportPrompt = ai.definePrompt({
  name: 'enhanceAdminReportPrompt',
  input: {schema: EnhanceAdminReportInputSchema},
  output: {schema: EnhanceAdminReportOutputSchema},
  prompt: `You are an AI assistant that summarizes risk factors for flagged users in an e-commerce platform's admin panel.

  Given the following information about a user, provide a concise summary of the main risk factors that contribute to their risk score. Focus on the most significant factors and explain why they are considered risky.

  IP Address: {{{ipAddress}}}
  Typing Speed: {{{typingSpeed}}}
  Device Reuse: {{{deviceReuse}}}
  IP Location: {{{ipLocation}}}
  Billing Country: {{{billingCountry}}}
  User Agent: {{{userAgent}}}
  Trust Score: {{{trustScore}}}
  `,
});

const enhanceAdminReportFlow = ai.defineFlow(
  {
    name: 'enhanceAdminReportFlow',
    inputSchema: EnhanceAdminReportInputSchema,
    outputSchema: EnhanceAdminReportOutputSchema,
  },
  async input => {
    const {output} = await enhanceAdminReportPrompt(input);
    return output!;
  }
);
