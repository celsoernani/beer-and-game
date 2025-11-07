import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validatePlayerUpdate } from '../validators';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({ where: { id: params.id } });

  if (!player) {
    return Response.json({ error: 'Player not found.' }, { status: 404 });
  }

  return Response.json({ player });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.player.findUnique({ where: { id: params.id } });

  if (!existing) {
    return Response.json({ error: 'Player not found.' }, { status: 404 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const data = validatePlayerUpdate(json);

    const player = await prisma.player.update({
      where: { id: params.id },
      data: {
        name: data.name ?? undefined,
        skillRating: data.skillRating === undefined ? undefined : data.skillRating,
        positionPref: data.positionPref === undefined ? undefined : data.positionPref,
      },
    });

    return Response.json({ player });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to update player.' },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.player.findUnique({ where: { id: params.id } });

  if (!existing) {
    return Response.json({ error: 'Player not found.' }, { status: 404 });
  }

  await prisma.player.delete({ where: { id: params.id } });

  return new Response(null, { status: 204 });
}
