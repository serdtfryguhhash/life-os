import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, context } = body;

    const systemPrompt = `You are an empathetic, insightful AI Life Coach inside the LifeOS productivity app. You have access to the user's data summary below. Provide personalized, actionable advice. Be encouraging but honest. Keep responses concise (2-3 paragraphs max). Use markdown formatting sparingly.

User's Current Data:
${context || 'No data provided yet.'}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
