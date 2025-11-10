import { MatchStatus } from '@prisma/client';

export interface MatchCreateInput {
  name: string;
  status?: MatchStatus;
  startTime?: Date | null;
  location?: string | null;
  tournament?: string | null;
  notes?: string | null;
  config?: unknown;
  teams?: TeamInput[];
}

export interface MatchUpdateInput {
  name?: string;
  status?: MatchStatus;
  startTime?: Date | null;
  location?: string | null;
  tournament?: string | null;
  notes?: string | null;
  config?: unknown;
  teams?: TeamInput[];
}

export interface TeamInput {
  id?: string;
  name: string;
  color?: string | null;
  isHome?: boolean | null;
}

export interface EventCreateInput {
  type: string;
  teamId?: string | null;
  playerId?: string | null;
  occurredAt?: Date;
  matchMinute?: number | null;
  payload?: unknown;
  createdBy?: string | null;
}

const STATUS_VALUES = new Set<MatchStatus>([
  MatchStatus.SCHEDULED,
  MatchStatus.IN_PROGRESS,
  MatchStatus.FINISHED,
  MatchStatus.CANCELLED,
]);

export function validateMatchCreate(payload: unknown): MatchCreateInput {
  if (!isRecord(payload)) {
    throw new Error('Body must be a JSON object.');
  }

  const name = parseName(payload.name);
  const status = parseStatus(payload.status, { allowEmpty: true });
  const startTime = parseDate(payload.startTime, { allowEmpty: true });
  const location = parseOptionalString(payload.location, { allowNull: true });
  const tournament = parseOptionalString(payload.tournament, { allowNull: true });
  const notes = parseOptionalString(payload.notes, { allowNull: true });
  const config = parseConfig(payload.config, { allowEmpty: true });
  const teams = parseTeams(payload.teams, { allowEmpty: true });

  const data: MatchCreateInput = { name };

  if (status !== undefined) {
    data.status = status;
  }
  if (startTime !== undefined) {
    data.startTime = startTime;
  }
  if (location !== undefined) {
    data.location = location;
  }
  if (tournament !== undefined) {
    data.tournament = tournament;
  }
  if (notes !== undefined) {
    data.notes = notes;
  }
  if (config !== undefined) {
    data.config = config;
  }
  if (teams !== undefined) {
    data.teams = teams;
  }

  return data;
}

export function validateMatchUpdate(payload: unknown): MatchUpdateInput {
  if (!isRecord(payload)) {
    throw new Error('Body must be a JSON object.');
  }

  const data: MatchUpdateInput = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    data.name = parseName(payload.name);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    data.status = parseStatus(payload.status, { allowEmpty: false });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'startTime')) {
    data.startTime = parseDate(payload.startTime, { allowEmpty: false });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'location')) {
    data.location = parseOptionalString(payload.location, { allowNull: true });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'tournament')) {
    data.tournament = parseOptionalString(payload.tournament, { allowNull: true });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    data.notes = parseOptionalString(payload.notes, { allowNull: true });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'config')) {
    data.config = parseConfig(payload.config, { allowEmpty: false });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'teams')) {
    data.teams = parseTeams(payload.teams, { allowEmpty: false });
  }

  if (Object.keys(data).length === 0) {
    throw new Error('At least one field must be provided for update.');
  }

  return data;
}

export function validateEventCreate(payload: unknown): EventCreateInput {
  if (!isRecord(payload)) {
    throw new Error('Body must be a JSON object.');
  }

  const type = parseEventType(payload.type);
  const teamId = parseId(payload.teamId, { allowEmpty: true });
  const playerId = parseId(payload.playerId, { allowEmpty: true });
  const occurredAt = parseDate(payload.occurredAt, { allowEmpty: true });
  const matchMinute = parseMatchMinute(payload.matchMinute, { allowEmpty: true });
  const payloadData = parseEventPayload(payload.payload, { allowEmpty: true });
  const createdBy = parseOptionalString(payload.createdBy, { allowNull: true });

  const data: EventCreateInput = { type };

  if (teamId !== undefined) {
    data.teamId = teamId;
  }

  if (playerId !== undefined) {
    data.playerId = playerId;
  }

  if (occurredAt !== undefined) {
    data.occurredAt = occurredAt;
  }

  if (matchMinute !== undefined) {
    data.matchMinute = matchMinute;
  }

  if (payloadData !== undefined) {
    data.payload = payloadData;
  }

  if (createdBy !== undefined) {
    data.createdBy = createdBy;
  }

  return data;
}

function parseName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Name is required.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('Name is required.');
  }

  return trimmed;
}

function parseStatus(
  value: unknown,
  options: { allowEmpty: boolean },
): MatchStatus | undefined {
  if (value === undefined) {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Status must be one of the supported values.');
  }

  if (value === null) {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Status must be one of the supported values.');
  }

  if (typeof value !== 'string') {
    throw new Error('Status must be one of the supported values.');
  }

  const upper = value.trim().toUpperCase();

  if (!upper) {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Status must be one of the supported values.');
  }

  if (!STATUS_VALUES.has(upper as MatchStatus)) {
    throw new Error('Status must be one of the supported values.');
  }

  return upper as MatchStatus;
}

function parseDate(
  value: unknown,
  options: { allowEmpty: boolean },
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return options.allowEmpty ? undefined : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return options.allowEmpty ? undefined : null;
    }
    value = trimmed;
  }

  if (typeof value === 'number') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error('Date must be a valid ISO string or timestamp.');
    }
    return new Date(numeric);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Date must be a valid ISO string or timestamp.');
    }
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error('Date must be a valid ISO string or timestamp.');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Date must be a valid ISO string or timestamp.');
  }

  return date;
}

function parseOptionalString(
  value: unknown,
  options: { allowNull: boolean },
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return options.allowNull ? null : undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('Field must be a string.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function parseConfig(
  value: unknown,
  options: { allowEmpty: boolean },
): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'object') {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Config must be an object.');
  }

  return value;
}

function parseTeams(
  value: unknown,
  options: { allowEmpty: boolean },
): TeamInput[] | undefined {
  if (value === undefined || value === null) {
    return options.allowEmpty ? undefined : [];
  }

  if (!Array.isArray(value)) {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Teams must be an array.');
  }

  return value.map((item) => parseTeam(item));
}

function parseTeam(value: unknown): TeamInput {
  if (!isRecord(value)) {
    throw new Error('Each team must be an object.');
  }

  const id = parseId(value.id, { allowEmpty: true });
  const name = parseName(value.name);
  const color = parseOptionalString(value.color, { allowNull: true });
  const isHome = parseOptionalBoolean(value.isHome);

  const team: TeamInput = { name };

  if (id !== undefined) {
    team.id = id;
  }
  if (color !== undefined) {
    team.color = color;
  }
  if (isHome !== undefined) {
    team.isHome = isHome;
  }

  return team;
}

function parseEventType(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Event type is required.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('Event type is required.');
  }

  return trimmed;
}

function parseId(
  value: unknown,
  options: { allowEmpty: boolean },
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return options.allowEmpty ? null : undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('Identifier must be a string.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return options.allowEmpty ? null : undefined;
  }

  return trimmed;
}

function parseMatchMinute(
  value: unknown,
  options: { allowEmpty: boolean },
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return options.allowEmpty ? null : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return options.allowEmpty ? null : undefined;
    }
    value = trimmed;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error('Match minute must be a number.');
  }

  const integer = Math.trunc(numeric);

  if (integer < 0) {
    throw new Error('Match minute must be zero or positive.');
  }

  return integer;
}

function parseEventPayload(
  value: unknown,
  options: { allowEmpty: boolean },
): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'object') {
    if (options.allowEmpty) {
      return undefined;
    }
    throw new Error('Payload must be an object or array.');
  }

  return value;
}

function parseOptionalBoolean(value: unknown): boolean | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }
    if (trimmed === 'true' || trimmed === '1') {
      return true;
    }
    if (trimmed === 'false' || trimmed === '0') {
      return false;
    }
  }

  throw new Error('Boolean field must be true or false.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
