import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Story } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const storyId = Number(params.id);

    if (!Number.isInteger(storyId) || storyId <= 0) {
      return NextResponse.json({ error: 'Invalid story id' }, { status: 400 });
    }

    const rs = await db.execute({
      sql: 'SELECT * FROM stories WHERE id = ?',
      args: [storyId]
    });
    const story = rs.rows[0] as unknown as Story | undefined;

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 },
    );
  }
}
