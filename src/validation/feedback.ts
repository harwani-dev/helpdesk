import Joi from 'joi';

export const createFeedbackSchema = Joi.object({
  description: Joi.string().trim().optional().allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  given_to: Joi.string().trim().required(),
});
