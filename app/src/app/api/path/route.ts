import { NextRequest, NextResponse } from 'next/server';
import {
  createPathAttempt,
  createPathStep,
  getLatestPathAttempt,
  getPathAttempt,
  getPathSteps,
  getSession,
} from '@/lib/session';

// POST: Create a new path attempt and optionally the first step
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answerSelected } = body;

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

    // Create new path attempt
    const pathAttempt = createPathAttempt(sessionId);

    // If question and answer provided, create the first step
    let pathStep = null;
    if (questionId && answerSelected) {
      pathStep = createPathStep(pathAttempt.id, questionId, answerSelected);
    }

    return NextResponse.json(
      { pathAttempt, pathStep },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating path attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create path attempt' },
      { status: 500 }
    );
  }
}

// GET: Get the latest path attempt and its steps for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const pathAttemptId = searchParams.get('pathAttemptId');

    if (pathAttemptId) {
      // Get specific path attempt and its steps
      const pathAttempt = getPathAttempt(pathAttemptId);
      if (!pathAttempt) {
        return NextResponse.json(
          { error: 'Path attempt not found' },
          { status: 404 }
        );
      }
      const steps = getPathSteps(pathAttemptId);
      return NextResponse.json({ pathAttempt, steps });
    }

    if (sessionId) {
      // Get latest path attempt for session
      const pathAttempt = getLatestPathAttempt(sessionId);
      if (!pathAttempt) {
        return NextResponse.json({ pathAttempt: null, steps: [] });
      }
      const steps = getPathSteps(pathAttempt.id);
      return NextResponse.json({ pathAttempt, steps });
    }

    return NextResponse.json(
      { error: 'Session ID or Path Attempt ID required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting path attempt:', error);
    return NextResponse.json(
      { error: 'Failed to get path attempt' },
      { status: 500 }
    );
  }
}

// PATCH: Add a new step to an existing path attempt
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathAttemptId, questionId, answerSelected } = body;

    if (!pathAttemptId || !questionId || !answerSelected) {
      return NextResponse.json(
        { error: 'Path attempt ID, question ID, and answer are required' },
        { status: 400 }
      );
    }

    // Verify path attempt exists
    const pathAttempt = getPathAttempt(pathAttemptId);
    if (!pathAttempt) {
      return NextResponse.json(
        { error: 'Path attempt not found' },
        { status: 404 }
      );
    }

    // Create the step
    const pathStep = createPathStep(pathAttemptId, questionId, answerSelected);

    return NextResponse.json({ pathStep });
  } catch (error) {
    console.error('Error adding path step:', error);
    return NextResponse.json(
      { error: 'Failed to add path step' },
      { status: 500 }
    );
  }
}
