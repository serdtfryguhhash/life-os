import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weekData } = body;

    const systemPrompt = `You are an AI life analytics assistant. Generate a comprehensive weekly report based on the user's data. Include:
1. A brief highlight of the week (2-3 sentences)
2. Key wins and accomplishments
3. Areas for improvement
4. Specific recommendations for next week
5. A motivational closing thought

Keep it concise, actionable, and supportive. Use markdown formatting.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is my data for the week:\n${JSON.stringify(weekData, null, 2)}`,
        },
      ],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    return NextResponse.json({ report: text });
  } catch (error) {
    console.error('Weekly report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
