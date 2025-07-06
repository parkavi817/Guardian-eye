import { config } from 'dotenv';
config();

import '@/ai/flows/generate-fraud-detection-rules.ts';
import '@/ai/flows/enhance-admin-report.ts';
import '@/ai/flows/invoke-custom-fraud-model.ts'; // Added new flow
