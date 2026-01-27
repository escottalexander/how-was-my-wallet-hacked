import { NextRequest, NextResponse } from 'next/server';
import { getSession, getPathAttempt, getPathSteps } from '@/lib/session';
import {
  createInitialProbabilities,
  applyPathSteps,
  rejectDiagnosis,
  getMostLikelyDiagnosis,
  getTopDiagnoses,
  getNormalizedProbabilities,
  suggestPathBranch,
  getLastForkPoint,
  type DiagnosisType,
} from '@/lib/probability';

// POST: Calculate probabilities based on session, path steps, and rejections
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, pathAttemptId, rejectedDiagnoses } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session for wallet type
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Initialize probabilities with wallet type
    let state = createInitialProbabilities(session.wallet_type);

    // Apply path steps if pathAttemptId provided
    let steps: ReturnType<typeof getPathSteps> = [];
    if (pathAttemptId) {
      const pathAttempt = getPathAttempt(pathAttemptId);
      if (pathAttempt) {
        steps = getPathSteps(pathAttemptId);
        state = applyPathSteps(state, steps);
      }
    }

    // Apply rejected diagnoses
    if (rejectedDiagnoses && Array.isArray(rejectedDiagnoses)) {
      for (const diagnosis of rejectedDiagnoses) {
        state = rejectDiagnosis(state, diagnosis as DiagnosisType);
      }
    }

    // Calculate results
    const mostLikely = getMostLikelyDiagnosis(state);
    const topDiagnoses = getTopDiagnoses(state, 5);
    const normalized = getNormalizedProbabilities(state);
    const suggestedPath = suggestPathBranch(state);

    return NextResponse.json({
      mostLikelyDiagnosis: mostLikely,
      topDiagnoses,
      probabilities: normalized,
      suggestedPath,
      rawWeights: state.weights,
      rejectedDiagnoses: state.rejectedDiagnoses,
    });
  } catch (error) {
    console.error('Error calculating probabilities:', error);
    return NextResponse.json(
      { error: 'Failed to calculate probabilities' },
      { status: 500 }
    );
  }
}

// GET: Get the suggested next path or fork point after a rejection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const pathAttemptId = searchParams.get('pathAttemptId');
    const rejectedDiagnosis = searchParams.get('rejectedDiagnosis');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session for wallet type
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get path steps to determine fork point
    let steps: ReturnType<typeof getPathSteps> = [];
    if (pathAttemptId) {
      const pathAttempt = getPathAttempt(pathAttemptId);
      if (pathAttempt) {
        steps = getPathSteps(pathAttemptId);
      }
    }

    // Calculate fork point if a diagnosis was rejected
    let forkPoint = null;
    if (rejectedDiagnosis) {
      forkPoint = getLastForkPoint(rejectedDiagnosis as DiagnosisType, steps);
    }

    // Get initial probabilities with wallet type
    const state = createInitialProbabilities(session.wallet_type);
    const suggestedPath = suggestPathBranch(state);

    return NextResponse.json({
      suggestedPath,
      forkPoint,
      walletType: session.wallet_type,
    });
  } catch (error) {
    console.error('Error getting probability guidance:', error);
    return NextResponse.json(
      { error: 'Failed to get probability guidance' },
      { status: 500 }
    );
  }
}
