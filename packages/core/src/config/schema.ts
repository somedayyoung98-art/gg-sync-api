import path from 'node:path';
import { z } from 'zod';

export const generatorIdSchema = z.enum([
  'typescript',
  'sdk',
  'react-query',
  'msw',
  'zod',
]);

export const modelsOutputSchema = z.union([
  z.enum(['split', 'single']),
  z
    .object({
      file: z
        .string()
        .min(1)
        .endsWith('.ts')
        .refine(
          (file) =>
            !path.posix.isAbsolute(file) &&
            !path.win32.isAbsolute(file) &&
            !file.split(/[\\/]/).includes('..'),
          'Models file must be relative to output.dir',
        ),
    })
    .strict(),
]);

/** Namespace keys: letter-first alphanumeric, underscore, hyphen */
export const namespaceKeySchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    'Namespace id must start with a letter and contain only letters, numbers, _ or -',
  );

export const serviceConfigSchema = z
  .object({
    input: z.union([
      z.object({ path: z.string().min(1) }).strict(),
      z.object({ url: z.string().url() }).strict(),
    ]),
    output: z.object({
      dir: z.string().min(1),
      models: modelsOutputSchema.optional(),
      format: z
        .union([z.enum(['auto', 'prettier']), z.literal(false)])
        .optional(),
      /** Keep `.api-sync-openapi.json` under output.dir after codegen (default: false). */
      keepSpec: z.boolean().optional(),
    }),
    generators: z.array(generatorIdSchema).optional(),
    compliance: z
      .object({
        strict: z.boolean().optional(),
      })
      .optional(),
    runtime: z
      .object({
        baseURL: z.string().optional(),
        timeout: z.number().positive().optional(),
        validationRate: z.number().min(0).max(1).optional(),
      })
      .optional(),
  })
  .strict();

export const apiSyncConfigSchema = z
  .object({
    compliance: z
      .object({
        strict: z.boolean().optional(),
      })
      .optional(),
    runtime: serviceConfigSchema.shape.runtime.optional(),
    services: z
      .record(namespaceKeySchema, serviceConfigSchema)
      .refine((s) => Object.keys(s).length > 0, {
        message: 'At least one service namespace is required',
      }),
  })
  .strict();

export type GeneratorId = z.infer<typeof generatorIdSchema>;
export type ModelsOutput = z.infer<typeof modelsOutputSchema>;
export type ServiceConfig = z.infer<typeof serviceConfigSchema>;
export type ApiSyncConfig = z.infer<typeof apiSyncConfigSchema>;

export function defineConfig(config: ApiSyncConfig): ApiSyncConfig {
  return config;
}
