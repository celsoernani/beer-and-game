import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validateMatchUpdate } from '../validators';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teams: {
        orderBy: { createdAt: 'asc' },
        include: {
          players: {
            include: {
              player: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      events: {
        orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!match) {
    return Response.json({ error: 'Match not found.' }, { status: 404 });
  }

  return Response.json({ match });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.match.findUnique({
    where: { id: params.id },
    include: { teams: true },
  });

  if (!existing) {
    return Response.json({ error: 'Match not found.' }, { status: 404 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const data = validateMatchUpdate(json);

    const existingTeamIds = new Set(existing.teams.map((team) => team.id));
    const incomingIds = new Set<string>();

    if (data.teams) {
      for (const team of data.teams) {
        if (team.id) {
          if (!existingTeamIds.has(team.id)) {
            throw new Error('One or more teams do not belong to this match.');
          }
          incomingIds.add(team.id);
        }
      }
    }

    const match = await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: params.id },
        data: {
          name: data.name ?? undefined,
          status: data.status ?? undefined,
          startTime: data.startTime === undefined ? undefined : data.startTime,
          location: data.location === undefined ? undefined : data.location,
          tournament: data.tournament === undefined ? undefined : data.tournament,
          notes: data.notes === undefined ? undefined : data.notes,
          config: data.config === undefined ? undefined : data.config,
        },
      });

      if (data.teams) {
        const toDelete: string[] = [];
        existingTeamIds.forEach((id) => {
          if (!incomingIds.has(id)) {
            toDelete.push(id);
          }
        });

        if (toDelete.length > 0) {
          await tx.team.deleteMany({ where: { id: { in: toDelete } } });
        }

        for (const team of data.teams) {
          const teamData = {
            name: team.name,
            color: team.color === undefined ? undefined : team.color,
            isHome: team.isHome === undefined ? undefined : team.isHome,
          };

          if (team.id) {
            await tx.team.update({
              where: { id: team.id },
              data: teamData,
            });
          } else {
            await tx.team.create({
              data: {
                matchId: params.id,
                ...teamData,
              },
            });
          }
        }
      }

      return tx.match.findUniqueOrThrow({
        where: { id: params.id },
        include: {
          teams: {
            orderBy: { createdAt: 'asc' },
            include: {
              players: {
                include: {
                  player: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          events: {
            orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
          },
        },
      });
    });

    return Response.json({ match });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to update match.' },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.match.findUnique({ where: { id: params.id } });

  if (!existing) {
    return Response.json({ error: 'Match not found.' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.deleteMany({ where: { matchId: params.id } });
    const teamIds = await tx.team.findMany({
      where: { matchId: params.id },
      select: { id: true },
    });

    if (teamIds.length > 0) {
      const ids = teamIds.map((team) => team.id);
      await tx.teamPlayer.deleteMany({ where: { teamId: { in: ids } } });
      await tx.team.deleteMany({ where: { id: { in: ids } } });
    }

    await tx.match.delete({ where: { id: params.id } });
  });

  return new Response(null, { status: 204 });
}
