export interface ResponseSchema<T> {
  parse: (data: unknown) => T;
}

export function validateResponse<T>(
  data: unknown,
  schema: ResponseSchema<T>,
): T {
  return schema.parse(data);
}
