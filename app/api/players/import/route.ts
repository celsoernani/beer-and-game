import prisma from '@/lib/prisma';
import { validateImportRecord } from '../validators';

export const dynamic = 'force-dynamic';

interface CsvParseResult {
  records: Record<string, string>[];
  errors: string[];
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Request body must be form-data.' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Field "file" with a CSV file is required.' }, { status: 400 });
  }

  const text = await file.text();

  const { records, errors } = parseCsv(text);

  if (errors.length > 0) {
    return Response.json({ error: 'Failed to parse CSV.', details: errors }, { status: 400 });
  }

  if (records.length === 0) {
    return Response.json({ error: 'No records found in CSV.' }, { status: 400 });
  }

  const players: { name: string; skillRating?: number | null; positionPref?: string | null }[] = [];
  const validationErrors: string[] = [];

  records.forEach((record, index) => {
    try {
      const data = validateImportRecord(record);
      players.push(data);
    } catch (error) {
      validationErrors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data.'}`);
    }
  });

  if (validationErrors.length > 0) {
    return Response.json(
      { error: 'Validation failed for one or more rows.', details: validationErrors },
      { status: 400 },
    );
  }

  const created = await prisma.$transaction((tx) =>
    Promise.all(
      players.map((player) =>
        tx.player.create({
          data: {
            name: player.name,
            skillRating: player.skillRating ?? undefined,
            positionPref: player.positionPref ?? undefined,
          },
        }),
      ),
    ),
  );

  return Response.json({ imported: created.length, players: created }, { status: 201 });
}

function parseCsv(text: string): CsvParseResult {
  const rows = splitCsv(stripBom(text));

  if (rows === null) {
    return { records: [], errors: ['CSV contains unmatched quote characters.'] };
  }

  if (rows.length === 0) {
    return { records: [], errors: [] };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const normalizedHeaders = headers.map(normalizeHeader);

  if (!normalizedHeaders.includes('name')) {
    return { records: [], errors: ['CSV header must include a "name" column.'] };
  }

  const records: Record<string, string>[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    if (row.every((value) => value.trim() === '')) {
      return;
    }

    if (row.length > headers.length) {
      errors.push(`Row ${index + 2} has more columns than the header.`);
      return;
    }

    const record: Record<string, string> = {};

    normalizedHeaders.forEach((header, headerIndex) => {
      record[header] = row[headerIndex]?.trim() ?? '';
    });

    records.push(record);
  });

  return { records, errors };
}

function splitCsv(text: string): string[][] | null {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (insideQuotes) {
      if (char === '"') {
        const next = text[index + 1];
        if (next === '"') {
          currentField += '"';
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    currentField += char;
  }

  if (insideQuotes) {
    return null;
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  while (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    if (lastRow.length === 1 && lastRow[0] === '') {
      rows.pop();
    } else {
      break;
    }
  }

  return rows.filter((row) => row.length > 0);
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }

  return text;
}
