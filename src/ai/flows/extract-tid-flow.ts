'use server';
/**
 * @fileOverview An AI flow to extract transaction IDs from receipt images and verify recipient.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTidInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  adminWalletNumber: z
    .string()
    .describe(
        "The admin's wallet number that the money should have been sent to."
    ),
});

const ExtractTidOutputSchema = z.object({
  transactionId: z.string().describe('The extracted transaction ID (TID). If no TID is found, or if the recipient account number does not match the admin wallet number, return an empty string.'),
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
  prompt: `You are an expert at reading payment receipts from Pakistani banks and services like JazzCash or Easypaisa.
Your task is to analyze the provided image and perform two checks:
1.  Extract the Transaction ID (TID). The TID might be labeled as 'TID', 'Trx ID', 'Transaction ID', or similar.
2.  Verify that the recipient's account number on the receipt exactly matches the provided admin wallet number: {{{adminWalletNumber}}}.

CRITICAL: If you cannot find a clear Transaction ID, OR if the recipient's account number on the receipt does NOT match the admin's wallet number, you MUST return an empty string for the transactionId field. Otherwise, return the extracted TID.

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
