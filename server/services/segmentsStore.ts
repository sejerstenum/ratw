import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';

import { config } from '../config';
import type { Segment } from '../sharedTypes';

export interface StoredSnapshot {
  segments: Segment[];
  updatedAt: string;
}

let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    pool = createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
};

const normalisePayload = (payload: unknown): Segment[] => {
  if (typeof payload === 'string') {
    return JSON.parse(payload) as Segment[];
  }
  if (payload instanceof Buffer) {
    return JSON.parse(payload.toString('utf-8')) as Segment[];
  }
  return payload as Segment[];
};

export async function ensureSchema(): Promise<void> {
  const table = `\`${config.segmentsTable}\``;
  const sql = `
    CREATE TABLE IF NOT EXISTS ${table} (
      dataset VARCHAR(64) NOT NULL,
      payload LONGTEXT NOT NULL,
      updated_at VARCHAR(32) NOT NULL,
      PRIMARY KEY (dataset)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await getPool().query(sql);
}

export async function readSnapshot(): Promise<StoredSnapshot | null> {
  const table = `\`${config.segmentsTable}\``;
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT payload, updated_at FROM ${table} WHERE dataset = ? LIMIT 1`,
    [config.datasetKey],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    segments: normalisePayload(row.payload),
    updatedAt: String(row.updated_at),
  };
}

export async function writeSnapshot(segments: Segment[], updatedAt: string): Promise<StoredSnapshot> {
  const table = `\`${config.segmentsTable}\``;
  const payload = JSON.stringify(segments);
  await getPool().query(
    `INSERT INTO ${table} (dataset, payload, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)`,
    [config.datasetKey, payload, updatedAt],
  );
  return { segments, updatedAt };
}
