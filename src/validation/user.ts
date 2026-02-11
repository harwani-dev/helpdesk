import Joi from "joi";

export const updateSchema = Joi.object({
    profileImage: Joi.string().trim().allow("").required(),
    phone: Joi.string().trim().length(10).pattern(/^\d+$/).allow(""),
});

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

