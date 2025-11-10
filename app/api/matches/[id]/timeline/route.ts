import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!match) {
    return Response.json({ error: 'Match not found.' }, { status: 404 });
  }

  const events = await prisma.event.findMany({
    where: { matchId: params.id },
    orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    include: {
      team: {
        select: {
          id: true,
          name: true,
          color: true,
          isHome: true,
        },
      },
      player: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return Response.json({ events });
}
