import Joi from "joi";

export const setManagerSchema = Joi.object({
    username: Joi.string().trim().min(1).required(),
    managerUsername: Joi.string()
        .trim()
        .min(1)
        .required()
        .invalid(Joi.ref("username"))
        .messages({
            "any.invalid": "User cannot be their own manager",
        }),
});

