import { NextRequest, NextResponse } from 'next/server';
import {
  getDiagnosisByWalletType,
  getDiagnosisByValueRange,
  getPathAttemptStats,
  getDropOffPoints,
  getEngagementStats,
  getDiagnosisTrends,
  getRepeatVisitorStats,
  getSessionPaths,
} from '@/lib/session';

// GET: Retrieve analytics data
// Query params:
//   - type: 'by_wallet_type' | 'by_value_range' | 'path_attempts' | 'drop_off' | 'engagement' | 'trends' | 'repeat_visitors' | 'session_paths' | 'all'
//   - days: number (for trends, default 30)
//   - sessionId: string (for session_paths)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'all';
    const days = parseInt(searchParams.get('days') ?? '30', 10);
    const sessionId = searchParams.get('sessionId');

    switch (type) {
      case 'by_wallet_type':
        return NextResponse.json({
          diagnosisByWalletType: getDiagnosisByWalletType(),
        });

      case 'by_value_range':
        return NextResponse.json({
          diagnosisByValueRange: getDiagnosisByValueRange(),
        });

      case 'path_attempts':
        return NextResponse.json({
          pathAttemptStats: getPathAttemptStats(),
        });

      case 'drop_off':
        return NextResponse.json({
          dropOffPoints: getDropOffPoints(),
        });

      case 'engagement':
        return NextResponse.json({
          engagementStats: getEngagementStats(),
        });

      case 'trends':
        return NextResponse.json({
          diagnosisTrends: getDiagnosisTrends(days),
        });

      case 'repeat_visitors':
        return NextResponse.json({
          repeatVisitorStats: getRepeatVisitorStats(),
        });

      case 'session_paths':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for session_paths' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          sessionPaths: getSessionPaths(sessionId),
        });

      case 'all':
      default:
        return NextResponse.json({
          diagnosisByWalletType: getDiagnosisByWalletType(),
          diagnosisByValueRange: getDiagnosisByValueRange(),
          pathAttemptStats: getPathAttemptStats(),
          dropOffPoints: getDropOffPoints(),
          engagementStats: getEngagementStats(),
          diagnosisTrends: getDiagnosisTrends(days),
          repeatVisitorStats: getRepeatVisitorStats(),
        });
    }
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}
