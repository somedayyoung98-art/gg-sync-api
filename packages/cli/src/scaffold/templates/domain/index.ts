/**
 * Domain facades — stable business-facing API for UI and feature modules.
 *
 * Import boundary (required):
 * - UI / pages / features MUST import from this `domain/` layer (or app-level barrels).
 * - DO NOT import from `../generated/` outside this folder.
 *
 * Wrap generated SDK calls here so OpenAPI churn stays localized.
 */

// Example facade (uncomment after first `sync-api run`):
//
// import { getUserById } from '../generated/sdk';
// import { createApiClient } from '../runtime/client';
//
// const client = createApiClient({ baseURL: process.env.API_BASE_URL });
//
// export async function fetchUserById(id: string) {
//   return getUserById(id, { client });
// }

export {};
