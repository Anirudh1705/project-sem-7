import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCost, calculateCarbonEmission } from '@/lib/gemini';
import { connectDB, db } from '@/lib/db-simple';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const { message, history, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation history - filter out empty messages and ensure alternation
    const conversationHistory = history
      .filter((msg: any) => msg.content && msg.content.trim())
      .reduce((acc: any[], msg: any) => {
        const role = msg.role === 'user' ? 'user' : 'model';
        // Only add if it doesn't create consecutive same roles
        if (acc.length === 0 || acc[acc.length - 1].role !== role) {
          acc.push({
            role,
            parts: [{ text: msg.content }],
          });
        }
        return acc;
      }, []);

    // Ensure last message in history is from model (not user)
    // If it's from user, remove it so we can send the new message
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
      conversationHistory.pop();
    }

    const chat = model.startChat({
      history: conversationHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Get token count
    const countResult = await model.countTokens({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const promptTokens = countResult.totalTokens;
    const completionTokens = Math.ceil(text.split(' ').length * 1.3);
    const cost = calculateCost(promptTokens, completionTokens);
    const carbonEmission = calculateCarbonEmission(promptTokens, completionTokens);

    // Save to database if sessionId provided
    if (sessionId) {
      const chatSession = await db.sessions.findOne({
        _id: sessionId,
        userId: payload.userId,
      });

      if (chatSession) {
        // Add user message
        chatSession.messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date(),
        });

        // Add assistant message
        chatSession.messages.push({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date(),
        });

        // Update stats
        chatSession.stats.promptTokens += promptTokens;
        chatSession.stats.completionTokens += completionTokens;
        chatSession.stats.totalTokens += promptTokens + completionTokens;
        chatSession.stats.estimatedCost += cost;
        chatSession.stats.carbonEmission += carbonEmission;
        chatSession.updatedAt = new Date();

        // Save the updated session
        await db.sessions.save(chatSession);
      }
    }

    return NextResponse.json({
      text,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      carbonEmission,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
