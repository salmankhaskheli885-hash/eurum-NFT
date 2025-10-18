'use server';
import {genkit, type GenkitErrorCode} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const handleError = (e: any) => {
  const err = e as {details?: {error: {code: number}}};
  if (err.details) {
    if (err.details.error.code === 429) {
      return {
        code: 'rate-limit' as GenkitErrorCode,
        message: 'You have made too many requests. Please try again later.',
      };
    }
  }
  return true;
};

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
      maxOutputTokens: 256,
      errorHandler: handleError,
    }),
  ],
});
