import { z } from 'zod';

export const generatorIdSchema = z.enum([
  'typescript',
  'sdk',
  'react-query',
  'msw',
  'zod',
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
    input: z
      .object({
        url: z.string().url().optional(),
        path: z.string().min(1).optional(),
      })
      .refine((i) => Boolean(i.url) !== Boolean(i.path), {
        message: 'Exactly one of input.url or input.path is required',
      }),
    output: z.object({
      dir: z.string().min(1),
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
      })
      .refine(
        (services) => {
          const dirs = Object.values(services).map((s) => s.output.dir);
          return new Set(dirs).size === dirs.length;
        },
        {
          message:
            'Each service namespace must use a unique output.dir (isolated artifacts)',
        },
      ),
  })
  .strict();

export type ApiSyncConfigInput = z.infer<typeof apiSyncConfigSchema>;
