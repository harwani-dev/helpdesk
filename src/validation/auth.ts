import Joi from "joi";

export const loginSchema = Joi.object({
    username: Joi.string().required(), // Field is required
    password: Joi.string()
})

export const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum() // Must only contain alphanumeric characters
        .min(3)     // Minimum length of 3 characters
        .max(30)    // Maximum length of 30 characters
        .required(), // Field is required

    password: Joi.string()
        .pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/))
        .required(),

    email: Joi.string()
        .email()
        .pattern(/@aubergine\.co$/i)
        .required()
})