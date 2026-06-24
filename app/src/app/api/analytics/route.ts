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
  getClusterStats,
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
          diagnosisByWalletType: await getDiagnosisByWalletType(),
        });

      case 'by_value_range':
        return NextResponse.json({
          diagnosisByValueRange: await getDiagnosisByValueRange(),
        });

      case 'path_attempts':
        return NextResponse.json({
          pathAttemptStats: await getPathAttemptStats(),
        });

      case 'drop_off':
        return NextResponse.json({
          dropOffPoints: await getDropOffPoints(),
        });

      case 'engagement':
        return NextResponse.json({
          engagementStats: await getEngagementStats(),
        });

      case 'trends':
        return NextResponse.json({
          diagnosisTrends: await getDiagnosisTrends(days),
        });

      case 'repeat_visitors':
        return NextResponse.json({
          repeatVisitorStats: await getRepeatVisitorStats(),
        });

      case 'session_paths':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for session_paths' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          sessionPaths: await getSessionPaths(sessionId),
        });

      case 'clusters':
        return NextResponse.json({
          clusters: await getClusterStats(),
        });

      case 'all':
      default:
        return NextResponse.json({
          diagnosisByWalletType: await getDiagnosisByWalletType(),
          diagnosisByValueRange: await getDiagnosisByValueRange(),
          pathAttemptStats: await getPathAttemptStats(),
          dropOffPoints: await getDropOffPoints(),
          engagementStats: await getEngagementStats(),
          diagnosisTrends: await getDiagnosisTrends(days),
          repeatVisitorStats: await getRepeatVisitorStats(),
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
