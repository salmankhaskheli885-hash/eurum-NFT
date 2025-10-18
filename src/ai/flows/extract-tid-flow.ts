'use server';
/**
 * @fileOverview An AI flow to extract transaction IDs from receipt images.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTidInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const ExtractTidOutputSchema = z.object({
  transactionId: z.string().describe('The extracted transaction ID (TID). If no TID is found, return an empty string.'),
});

export type ExtractTidInput = z.infer<typeof ExtractTidInputSchema>;
export type ExtractTidOutput = z.infer<typeof ExtractTidOutputSchema>;

export async function extractTid(input: ExtractTidInput): Promise<ExtractTidOutput> {
  return extractTidFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTidPrompt',
  input: {schema: ExtractTidInputSchema},
  output: {schema: ExtractTidOutputSchema},
  prompt: `You are an expert at reading payment receipts. Your task is to analyze the provided image and extract the Transaction ID (TID). The TID might be labeled as 'TID', 'Trx ID', 'Transaction ID', or similar. Extract only the alphanumeric ID.

If you cannot find a clear Transaction ID in the image, return an empty string for the transactionId field.

Receipt Image: {{media url=receiptDataUri}}`,
});

const extractTidFlow = ai.defineFlow(
  {
    name: 'extractTidFlow',
    inputSchema: ExtractTidInputSchema,
    outputSchema: ExtractTidOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
