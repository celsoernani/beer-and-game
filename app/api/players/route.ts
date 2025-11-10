import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validatePlayerCreate } from './validators';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const take = clampPageSize(parseNumeric(searchParams.get('take')), DEFAULT_PAGE_SIZE);
  const skip = Math.max(parseNumeric(searchParams.get('skip')), 0);

  const where = search
    ? {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : undefined;

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.player.count({ where }),
  ]);

  return Response.json({ players, total, take, skip, search: search ?? null });
}

export async function POST(request: NextRequest) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const data = validatePlayerCreate(json);

    const player = await prisma.player.create({
      data: {
        name: data.name,
        skillRating: data.skillRating ?? undefined,
        positionPref: data.positionPref ?? undefined,
      },
    });

    return Response.json({ player }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to create player.' },
      { status: 400 },
    );
  }
}

function parseNumeric(value: string | null): number {
  if (!value) {
    return 0;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.trunc(numeric);
}

function clampPageSize(value: number, fallback: number): number {
  if (value <= 0) {
    return fallback;
  }

  return Math.min(value, MAX_PAGE_SIZE);
}
