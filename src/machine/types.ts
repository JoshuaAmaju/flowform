export type Schema<T = any> = { [K in keyof T]: Validator<T, T[K]> };

export type Validator<SchemaType = any, T = any> = (
  value: T,
  values: SchemaType
) => T | Promise<T>;

export type TypeOf<T> = T extends Schema<infer R>
  ? {
      [K in keyof R]: R[K] extends Validator<R, R[K]>
        ? ReturnType<R[K]> extends Promise<infer N>
          ? N
          : ReturnType<R[K]>
        : R[K];
    }
  : never;