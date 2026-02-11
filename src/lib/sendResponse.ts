import type { Response } from "express";
import { responseSchema } from "../validation/response.js";

type ErrorPayload = {
    code: string;
    details: unknown[];
};

export type ApiResponse<T = unknown> = {
    success: boolean;
    data: T | null;
    error: ErrorPayload | null;
};

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    payload: ApiResponse<T>
) => {
    const { error, value } = responseSchema.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        // If the response does not match the schema, send a safe fallback response
        const fallback: ApiResponse = {
            success: false,
            data: null,
            error: {
                code: "RESPONSE_VALIDATION_ERROR",
                details: error.details,
            },
        };

        return res.status(500).json(fallback);
    }

    return res.status(statusCode).json(value);
};

