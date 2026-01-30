import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../validation/auth";
import prisma from "../lib/prisma";
import { HTTP_STATUS } from "../constants/status";
import { sendResponse } from "../lib/sendResponse";
import { comparePassword, hashPassword } from "../utils/password";
import { generateToken } from "../lib/jwt";
import { UserType } from "../../generated/prisma/enums";
import { logger } from "../utils/logger";

export const handleLogin = async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        logger.warn({ details: error.details }, `Login validation error: ${error.message}`);
        const response = {
            success: false,
            data: null,
            error: {
                code: 'VALIDATION_ERROR',
                details: error.details
            },
        }
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, response)
    }
    try {
        const user = await prisma.user.findFirst({
            where: {
                username: value.username
            },
        });
        if (!user) {
            logger.warn({ username: value.username }, `Login failed: user not found`);
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                // TODO:- add error code to consts
                error: {
                    code: "INVALID_CREDENTIALS",
                    details: ["Invalid username or password"]
                }
            })
        };
        const isCorrect = await comparePassword(value.password, user.password)
        if (!isCorrect) {
            logger.warn({ userId: user.id, username: value.username }, `Login failed: incorrect password`);
            return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, {
                success: false,
                data: null,
                // TODO:- add error code to consts
                error: {
                    code: "INVALID_CREDENTIALS",
                    details: ["Invalid username or password"]
                }
            })
        };

        const token = generateToken({
            userId: user.id,
            email: user.email,
            userType: user.userType,
        });

        logger.info({ userId: user.id, username: value.username, userType: user.userType }, `Login successful`);
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    userType: user.userType,
                },
            },
            error: null
        });
    } catch (error) {
        logger.error({ username: value?.username }, `Login error: ${error}`);
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["there has been an internal server error"]
            }
        })
    }
}

export const handleRegister = async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
        logger.warn({ details: error.details }, `Register validation error: ${error.message}`);
        const response = {
            success: false,
            data: null,
            error: {
                code: error.message,
                details: error.details
            },
        }
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, response)
    }
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: value.username },
                    { email: value.email }
                ]
            },
        });

        if (existingUser) {
            logger.warn({ username: value.username, email: value.email }, `Registration failed: user already exists`);
            return sendResponse(res, HTTP_STATUS.CONFLICT, {
                success: false,
                data: null,
                // TODO:- add error code to consts
                error: {
                    code: "USER_ALREADY_EXISTS",
                    details: ["User with this username or email already exists"]
                }
            })
        }

        // Hash the password
        const hashedPassword = await hashPassword(value.password);

        // Create new user
        const user = await prisma.user.create({
            data: {
                username: value.username,
                email: value.email,
                name: value.name,
                password: hashedPassword,
                userType: UserType.EMPLOYEE, // Default userType if not provided
            },
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            userType: UserType.EMPLOYEE,
        });

        logger.info({ userId: user.id, username: value.username, email: value.email }, `User registered successfully`);
        return sendResponse(res, HTTP_STATUS.CREATED, {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    userType: UserType.EMPLOYEE,
                },
            },
            error: null
        });
    } catch (error) {
        logger.error({ username: value?.username, email: value?.email }, `Registration error: ${error}`);
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["there has been an internal server error"]
            }
        })
    }
}