import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Story } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stories = db
      .prepare('SELECT * FROM stories ORDER BY created_at DESC')
      .all() as Story[];

    return NextResponse.json(stories);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 },
    );
  }
}
