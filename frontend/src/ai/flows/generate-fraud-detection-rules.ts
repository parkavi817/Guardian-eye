// src/ai/flows/generate-fraud-detection-rules.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFraudDetectionRulesInputSchema = z.object({
  historicalDataSummary: z.string(),
  currentRules: z.string(),
});
export type GenerateFraudDetectionRulesInput = z.infer<typeof GenerateFraudDetectionRulesInputSchema>;

const SuggestedRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  condition: z.string(),
  action: z.string(),
  category: z.enum(['Typing', 'Device', 'Location', 'Transaction', 'Other']),
  severityImpact: z.number().min(0).max(100),
});
export type SuggestedRule = z.infer<typeof SuggestedRuleSchema>;

const GenerateFraudDetectionRulesOutputSchema = z.object({
  suggestedRules: z.array(SuggestedRuleSchema),
  explanation: z.string(),
});
export type GenerateFraudDetectionRulesOutput = z.infer<typeof GenerateFraudDetectionRulesOutputSchema>;

export async function generateFraudDetectionRules(
  input: GenerateFraudDetectionRulesInput
): Promise<GenerateFraudDetectionRulesOutput> {
  return generateFraudDetectionRulesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFraudDetectionRulesPrompt',
  input: { schema: GenerateFraudDetectionRulesInputSchema },
  output: { schema: GenerateFraudDetectionRulesOutputSchema },
  prompt: `
You are an expert in fraud detection. Based on the historical data and current rules provided, generate 3 structured JSON rules for a fraud detection system.

Return a JSON object exactly matching this format:

{
  "suggestedRules": [
    {
      "name": "...",
      "description": "...",
      "condition": "...",
      "action": "...",
      "category": "Transaction",
      "severityImpact": XX
    },
    { /* rule 2 */ },
    { /* rule 3 */ }
  ],
  "explanation": "..."
}
`,
});

const generateFraudDetectionRulesFlow = ai.defineFlow(
  {
    name: 'generateFraudDetectionRulesFlow',
    inputSchema: GenerateFraudDetectionRulesInputSchema,
    outputSchema: GenerateFraudDetectionRulesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);