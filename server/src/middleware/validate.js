// validate({ body, query, params }) with Zod schemas. Parsed (coerced/trimmed) values replace the raw ones.
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key] ?? {});
    }
    next();
  } catch (err) {
    next(err);
  }
};
