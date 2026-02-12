import Joi from 'joi';

// Prisma enums (kept in sync with `schema.prisma`)
const ticketTypes = ['HR', 'IT'] as const;

const hrTypes = [
    'LEAVE_BALANCE',
    'LEAVE_POLICY',
    'PAYROLL',
    'PF',
    'KEKA_ISSUES',
    'SODEXO_FOOD_COUPONS',
    'HEALTH_INSURANCE',
    'ANY_FORM_OF_LETTER',
    'REFERRAL_APPLICATION',
    'COURSE_PURCHASE',
    'BANK_ACCOUNT_ISSUE',
] as const;

const itTypes = [
    'LAPTOP_BOOTUP',
    'LAPTOP_CHARGER_NOT_WORKING',
    'LAPTOP_BATTERY_LIFE',
    'ADD_RAM',
    'NEW_MONITOR',
    'NEW_KEYBOARD',
    'NEW_MOUSE',
    'MOBILE_PHONE_ISSUE',
    'MOBILE_DATA_CABLE_ISSUE',
    'HARD_DISK_FAILURE',
] as const;

export const createTicketSchema = Joi.object({
    title: Joi.string().trim().min(1).required(),
    description: Joi.string().trim().min(1).required(),

    // HR / ITs
    ticketType: Joi.string()
        .valid(...ticketTypes)
        .insensitive()
        .required(),

    // If request_type is HR, hr_type must be a valid HrType and required,
    // and it_type must be null/absent. Vice‑versa for IT.
    hrType: Joi.when('ticketType', {
        is: Joi.string().valid('HR').insensitive(),
        then: Joi.string()
            .valid(...hrTypes)
            .insensitive()
            .required(),
        otherwise: Joi.valid(null).optional(),
    }),

    itType: Joi.when('ticketType', {
        is: Joi.string().valid('IT').insensitive(),
        then: Joi.string()
            .valid(...itTypes)
            .insensitive()
            .required(),
        otherwise: Joi.valid(null).optional(),
    }),
});

export const performActionSchema = Joi.object({
    action: Joi.string().trim().required(),
    remarks: Joi.string().trim().min(1).required(),
    rating: Joi.number().integer().min(1).max(5).optional(), // Optional rating (1-5) when closing ticket
});
