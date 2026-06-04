#!/usr/bin/env node
/**
 * 从 OPENAPI_URL 拉取 OpenAPI，规范化后写入 fixtures/openapi.json。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { normalizeOpenApiForTooling } from '@gg-sync/core';

const exampleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(exampleRoot, '.env') });

const openApiUrl = process.env.OPENAPI_URL?.trim();
if (!openApiUrl) {
  console.error('Missing OPENAPI_URL. Copy .env.example to .env and set OPENAPI_URL.');
  process.exit(1);
}

const url = openApiUrl.replace(/\/$/, '');
const out = path.join(exampleRoot, 'fixtures/openapi.json');

const res = await fetch(url);
if (!res.ok) {
  console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const doc = normalizeOpenApiForTooling(await res.json());
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
console.log(`Wrote ${out} (openapi ${doc.openapi}) from ${url}`);
