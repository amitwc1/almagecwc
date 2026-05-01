const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({ 'string.min': 'Name must be at least 2 characters' }),
    email: Joi.string().trim().email().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
    password: Joi.string().min(6).max(128).required()
      .messages({ 'string.min': 'Password must be at least 6 characters' }),
    role: Joi.string().valid('student', 'alumni').default('student')
      .messages({ 'any.only': 'Role must be either student or alumni' })
  })
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  })
};

module.exports = { registerSchema, loginSchema };
