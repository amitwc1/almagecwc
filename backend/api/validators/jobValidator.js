const Joi = require('joi');

const createJobSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    company: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().max(5000).allow('', null),
    location: Joi.string().trim().max(200).allow('', null),
    salary: Joi.string().trim().max(100).allow('', null),
    job_type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').default('full-time'),
    skills_required: Joi.string().trim().max(500).allow('', null)
  })
};

const jobQuerySchema = {
  query: Joi.object({
    search: Joi.string().trim().max(200),
    company: Joi.string().trim().max(200),
    location: Joi.string().trim().max(200),
    job_type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

module.exports = { createJobSchema, jobQuerySchema };
