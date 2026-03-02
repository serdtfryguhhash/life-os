import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { todayData } = body;

    const systemPrompt = `You are a warm, energizing AI morning briefing assistant inside LifeOS. Generate a personalized morning briefing. Include:
1. A warm greeting with a motivational thought
2. Quick overview of today's schedule
3. Top priority tasks
4. Habit reminders
5. A relevant motivational quote based on how the user has been feeling

Keep it concise and energizing. Format with markdown. Use a conversational tone.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is my data for today:\n${JSON.stringify(todayData, null, 2)}`,
        },
      ],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    return NextResponse.json({ briefing: text });
  } catch (error) {
    console.error('Briefing API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
