export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(422).json({
        error: 'Erro de validação dos dados de entrada.',
        details: errors
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
