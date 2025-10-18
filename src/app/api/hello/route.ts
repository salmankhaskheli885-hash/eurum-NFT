
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns a simple hello world message
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
 *                   example: Hello from Fynix Pro API!
 */
export async function GET(request: Request) {
  // This is a simple example of an API route.
  // It returns a JSON response with a message.
  return NextResponse.json({ message: 'Hello from Fynix Pro API!' });
}
