const { ApiError } = require('./errorHandler');

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema with optional body, query, params keys
 * @returns Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each part of the request
    ['body', 'query', 'params'].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: key === 'query' // Allow extra query params
        });

        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message.replace(/"/g, '')
            }))
          );
        } else {
          // Replace with validated/sanitized values
          req[key] = value;
        }
      }
    });

    if (errors.length > 0) {
      throw new ApiError(422, 'Validation failed', errors);
    }

    next();
  };
};

module.exports = validate;
