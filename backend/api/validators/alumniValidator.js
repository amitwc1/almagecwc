const Joi = require('joi');

const updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    graduation_year: Joi.number().integer().min(1950).max(new Date().getFullYear() + 5),
    department: Joi.string().trim().max(200).allow('', null),
    company: Joi.string().trim().max(200).allow('', null),
    job_title: Joi.string().trim().max(200).allow('', null),
    location: Joi.string().trim().max(200).allow('', null),
    skills: Joi.string().trim().max(1000).allow('', null),
    bio: Joi.string().trim().max(2000).allow('', null),
    linkedin: Joi.string().trim().uri().max(500).allow('', null),
    profile_image: Joi.string().trim().max(500).allow('', null)
  })
};

const searchAlumniSchema = {
  query: Joi.object({
    search: Joi.string().trim().max(200),
    company: Joi.string().trim().max(200),
    location: Joi.string().trim().max(200),
    skills: Joi.string().trim().max(200),
    department: Joi.string().trim().max(200),
    year_from: Joi.number().integer().min(1950),
    year_to: Joi.number().integer().max(new Date().getFullYear() + 5),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12)
  })
};

module.exports = { updateProfileSchema, searchAlumniSchema };
