import Joi from "joi";

const errorSchema = Joi.object({
    code: Joi.string().required(),
    details: Joi.array().items(Joi.any()).required(),
});

export const responseSchema = Joi.object({
    success: Joi.boolean().required(),
    data: Joi.any().allow(null),
    error: errorSchema.allow(null),
});