import prisma from '@/lib/prisma';
import { validateEventCreate } from '../../validators';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!match) {
    return Response.json({ error: 'Match not found.' }, { status: 404 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const data = validateEventCreate(json);

    let teamId: string | null | undefined = data.teamId ?? undefined;

    if (data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId },
        select: { id: true, matchId: true },
      });

      if (!team || team.matchId !== params.id) {
        return Response.json({ error: 'Team does not belong to this match.' }, { status: 400 });
      }
    }

    if (data.playerId) {
      const assignment = await prisma.teamPlayer.findFirst({
        where: {
          playerId: data.playerId,
          team: { matchId: params.id },
        },
        select: { teamId: true },
      });

      if (!assignment) {
        return Response.json({ error: 'Player is not assigned to this match.' }, { status: 400 });
      }

      if (!teamId) {
        teamId = assignment.teamId;
      } else if (teamId !== assignment.teamId) {
        return Response.json(
          { error: 'Player assignment does not match the provided team.' },
          { status: 400 },
        );
      }
    }

    const event = await prisma.event.create({
      data: {
        matchId: params.id,
        teamId: teamId === undefined ? undefined : teamId,
        playerId: data.playerId ?? undefined,
        type: data.type,
        occurredAt: data.occurredAt ?? undefined,
        matchMinute: data.matchMinute === undefined ? undefined : data.matchMinute,
        payload: data.payload === undefined ? undefined : data.payload,
        createdBy: data.createdBy ?? undefined,
      },
      include: {
        team: true,
        player: true,
      },
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to create event.' },
      { status: 400 },
    );
  }
}
