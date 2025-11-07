export interface PlayerCreateInput {
  name: string;
  skillRating?: number | null;
  positionPref?: string | null;
}

export interface PlayerUpdateInput {
  name?: string;
  skillRating?: number | null;
  positionPref?: string | null;
}

export function validatePlayerCreate(payload: unknown): PlayerCreateInput {
  if (!isRecord(payload)) {
    throw new Error('Body must be a JSON object.');
  }

  const name = parseName(payload.name);
  const skillRating = parseSkillRating(payload.skillRating, { allowEmpty: true });
  const positionPref = parsePositionPref(payload.positionPref, { allowEmpty: true });

  const data: PlayerCreateInput = { name };

  if (skillRating !== undefined) {
    data.skillRating = skillRating;
  }

  if (positionPref !== undefined) {
    data.positionPref = positionPref;
  }

  return data;
}

export function validatePlayerUpdate(payload: unknown): PlayerUpdateInput {
  if (!isRecord(payload)) {
    throw new Error('Body must be a JSON object.');
  }

  const data: PlayerUpdateInput = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    data.name = parseName(payload.name);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'skillRating')) {
    const skillRating = parseSkillRating(payload.skillRating, { allowEmpty: false });
    data.skillRating = skillRating === undefined ? null : skillRating;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'positionPref')) {
    const positionPref = parsePositionPref(payload.positionPref, { allowEmpty: false });
    data.positionPref = positionPref === undefined ? null : positionPref;
  }

  if (Object.keys(data).length === 0) {
    throw new Error('At least one field must be provided for update.');
  }

  return data;
}

export function validateImportRecord(record: Record<string, string>): PlayerCreateInput {
  const name = parseName(record['name']);
  const skillRating = parseSkillRating(record['skillrating'], { allowEmpty: true });
  const positionPref = parsePositionPref(record['positionpref'], { allowEmpty: true });

  const data: PlayerCreateInput = { name };

  if (skillRating !== undefined) {
    data.skillRating = skillRating;
  }

  if (positionPref !== undefined) {
    data.positionPref = positionPref;
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

function parseSkillRating(
  value: unknown,
  options: { allowEmpty: boolean },
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return options.allowEmpty ? undefined : null;
    }
    value = trimmed;
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Skill rating must be a number.');
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error('Skill rating must be a number.');
  }

  const integer = Math.trunc(numeric);

  if (integer !== numeric) {
    throw new Error('Skill rating must be an integer.');
  }

  if (integer < 0) {
    throw new Error('Skill rating must be zero or positive.');
  }

  return integer;
}

function parsePositionPref(
  value: unknown,
  options: { allowEmpty: boolean },
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Preferred position must be a string.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return options.allowEmpty ? undefined : null;
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
