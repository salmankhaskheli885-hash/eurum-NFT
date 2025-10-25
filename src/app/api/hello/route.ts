
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns a simple hello world message. Requires an API key.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A JSON object with a message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello from AurumNFT API!
 *       401:
 *         description: Unauthorized. API Key is missing or invalid.
 */
export async function GET(request: NextRequest) {
  // 1. Get the secret API key from environment variables
  const SECRET_API_KEY = process.env.API_KEY;

  // 2. Get the API key from the request's Authorization header
  // The header should be in the format: "Authorization: Bearer YOUR_API_KEY"
  const authHeader = request.headers.get('authorization');
  const providedApiKey = authHeader?.split(' ')[1];

  // 3. Check if the keys match
  if (!SECRET_API_KEY || !providedApiKey || providedApiKey !== SECRET_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 4. If keys match, proceed with the original logic
  return NextResponse.json({ message: 'Hello from AurumNFT API!' });
}
