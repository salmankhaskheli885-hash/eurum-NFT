'use server';
/**
 * @fileOverview An AI flow to generate NFT images from a text prompt.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNftInputSchema = z.object({
  prompt: z.string().describe('A text description of the NFT to generate.'),
});

const GenerateNftOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type GenerateNftInput = z.infer<typeof GenerateNftInputSchema>;
export type GenerateNftOutput = z.infer<typeof GenerateNftOutputSchema>;

export async function generateNft(input: GenerateNftInput): Promise<GenerateNftOutput> {
  return generateNftFlow(input);
}

const generateNftFlow = ai.defineFlow(
  {
    name: 'generateNftFlow',
    inputSchema: GenerateNftInputSchema,
    outputSchema: GenerateNftOutputSchema,
  },
  async ({ prompt }) => {
    const fullPrompt = `${prompt}, in a cartoonish, collectable NFT art style.`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: fullPrompt,
    });
    
    if (!media.url) {
      throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);
