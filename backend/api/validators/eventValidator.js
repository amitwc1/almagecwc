const Joi = require('joi');

const createEventSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().max(5000).allow('', null),
    event_date: Joi.date().iso().required()
      .messages({ 'date.format': 'Event date must be a valid date' }),
    location: Joi.string().trim().max(300).allow('', null),
    image_url: Joi.string().trim().uri().max(500).allow('', null),
    max_attendees: Joi.number().integer().min(1).max(10000).allow(null)
  })
};

const registerEventSchema = {
  params: Joi.object({
    id: Joi.number().integer().required()
  })
};

module.exports = { createEventSchema, registerEventSchema };
