import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { moodData } = body;

    const systemPrompt = `You are an AI mood analyst. Analyze the user's mood data and journal entries to provide insights about their emotional patterns. Include:
1. Overall mood trend (improving, declining, stable)
2. Patterns you notice (time of week, correlations with activities)
3. Specific actionable suggestions to improve mood
Keep it brief, empathetic, and helpful. Use markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is my mood data:\n${JSON.stringify(moodData, null, 2)}`,
        },
      ],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    return NextResponse.json({ insights: text });
  } catch (error) {
    console.error('Mood insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze mood data' },
      { status: 500 }
    );
  }
}
