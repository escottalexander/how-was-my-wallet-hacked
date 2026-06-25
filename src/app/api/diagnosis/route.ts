import { NextRequest, NextResponse } from 'next/server';
import {
  createDiagnosis,
  getDiagnosis,
  getDiagnosisByPathAttempt,
  getPathAttempt,
  updateDiagnosisAccepted,
  updateDiagnosisClickedLearn,
  updateDiagnosisClickedHwr,
} from '@/lib/session';

// POST: Create a new diagnosis for a path attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathAttemptId, diagnosisType } = body as { pathAttemptId: string; diagnosisType: string };

    if (!pathAttemptId || !diagnosisType) {
      return NextResponse.json(
        { error: 'Path attempt ID and diagnosis type are required' },
        { status: 400 }
      );
    }

    // Verify path attempt exists
    const pathAttempt = await getPathAttempt(pathAttemptId);
    if (!pathAttempt) {
      return NextResponse.json(
        { error: 'Path attempt not found' },
        { status: 404 }
      );
    }

    // Create diagnosis
    const diagnosis = await createDiagnosis(pathAttemptId, diagnosisType);

    return NextResponse.json({ diagnosis }, { status: 201 });
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to create diagnosis' },
      { status: 500 }
    );
  }
}

// GET: Get diagnosis by ID or path attempt ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const diagnosisId = searchParams.get('id');
    const pathAttemptId = searchParams.get('pathAttemptId');

    if (diagnosisId) {
      const diagnosis = await getDiagnosis(diagnosisId);
      if (!diagnosis) {
        return NextResponse.json(
          { error: 'Diagnosis not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ diagnosis });
    }

    if (pathAttemptId) {
      const diagnosis = await getDiagnosisByPathAttempt(pathAttemptId);
      return NextResponse.json({ diagnosis });
    }

    return NextResponse.json(
      { error: 'Diagnosis ID or Path Attempt ID required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to get diagnosis' },
      { status: 500 }
    );
  }
}

// PATCH: Update diagnosis (accepted status, clicked_learn, clicked_hwr)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { diagnosisId, accepted, clickedLearn, clickedHwr } = body as { diagnosisId: string; accepted: boolean; clickedLearn: boolean; clickedHwr: boolean };

    if (!diagnosisId) {
      return NextResponse.json(
        { error: 'Diagnosis ID is required' },
        { status: 400 }
      );
    }

    // Verify diagnosis exists
    const diagnosis = await getDiagnosis(diagnosisId);
    if (!diagnosis) {
      return NextResponse.json(
        { error: 'Diagnosis not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (typeof accepted === 'boolean') {
      await updateDiagnosisAccepted(diagnosisId, accepted);
    }
    if (clickedLearn === true) {
      await updateDiagnosisClickedLearn(diagnosisId);
    }
    if (clickedHwr === true) {
      await updateDiagnosisClickedHwr(diagnosisId);
    }

    // Get updated diagnosis
    const updatedDiagnosis = await getDiagnosis(diagnosisId);

    return NextResponse.json({ diagnosis: updatedDiagnosis });
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to update diagnosis' },
      { status: 500 }
    );
  }
}
