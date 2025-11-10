import { MatchStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validateMatchCreate } from './validators';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const take = clampPageSize(parseNumeric(searchParams.get('take')), DEFAULT_PAGE_SIZE);
  const skip = Math.max(parseNumeric(searchParams.get('skip')), 0);
  const statusParam = searchParams.get('status')?.trim();

  let statusFilter: MatchStatus | undefined;

  if (statusParam) {
    const normalized = statusParam.toUpperCase();
    if (!isStatus(normalized)) {
      return Response.json({ error: 'Invalid status filter.' }, { status: 400 });
    }
    statusFilter = normalized;
  }

  const where = buildWhereClause({ search, status: statusFilter });

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        teams: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.match.count({ where }),
  ]);

  return Response.json({
    matches,
    total,
    take,
    skip,
    search: search ?? null,
    status: statusFilter ?? null,
  });
}

export async function POST(request: NextRequest) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const data = validateMatchCreate(json);

    const match = await prisma.match.create({
      data: {
        name: data.name,
        status: data.status,
        startTime: data.startTime ?? undefined,
        location: data.location ?? undefined,
        tournament: data.tournament ?? undefined,
        notes: data.notes ?? undefined,
        config: data.config === undefined ? undefined : data.config,
        teams: data.teams && data.teams.length > 0
          ? {
              create: data.teams.map((team) => ({
                name: team.name,
                color: team.color === undefined ? undefined : team.color,
                isHome: team.isHome === undefined ? undefined : team.isHome,
              })),
            }
          : undefined,
      },
      include: {
        teams: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return Response.json({ match }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to create match.' },
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

function isStatus(value: string): value is MatchStatus {
  return value === MatchStatus.SCHEDULED ||
    value === MatchStatus.IN_PROGRESS ||
    value === MatchStatus.FINISHED ||
    value === MatchStatus.CANCELLED;
}

function buildWhereClause({
  search,
  status,
}: {
  search?: string | null;
  status?: MatchStatus;
}): Prisma.MatchWhereInput {
  const where: Prisma.MatchWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (status) {
    where.status = status;
  }

  return where;
}
