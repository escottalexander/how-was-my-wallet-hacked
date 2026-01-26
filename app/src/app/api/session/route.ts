import { NextRequest, NextResponse } from 'next/server';
import { createSession, createUserHash, getSession, updateSessionWallet, updateSessionValueRange } from '@/lib/session';
import type { WalletType, ValueRange } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get IP address from headers
    // In production, this might come from x-forwarded-for behind a proxy
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Get User Agent
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Create anonymous user hash - not reversible, not PII
    const userHash = createUserHash(ip, userAgent);

    // Create new session
    const session = createSession(userHash);

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, walletType, walletSpecific, valueRange } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update wallet information if provided
    if (walletType) {
      updateSessionWallet(sessionId, walletType as WalletType, walletSpecific ?? null);
    }

    // Update value range if provided
    if (valueRange) {
      updateSessionValueRange(sessionId, valueRange as ValueRange);
    }

    // Return updated session
    const updatedSession = getSession(sessionId);
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
