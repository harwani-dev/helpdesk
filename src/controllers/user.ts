import type { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendResponse } from "../lib/sendResponse";
import { HTTP_STATUS } from "../constants/status";
import { logger } from "../lib/logger";
import { setManagerSchema } from "../validation/user";

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                managerId: true,
                manager: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!user) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "USER_NOT_FOUND",
                    details: ["User not found"],
                },
            });
        }

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: user,
            error: null,
        });
    } catch (error) {
        logger.error({ error }, "Get user by id error");
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"],
            },
        });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: users,
            error: null,
        });
    } catch (error) {
        logger.error({ error }, "Get users error");
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"],
            },
        });
    }
};

export const setManagerForUser = async (req: Request, res: Response) => {
    const { error, value } = setManagerSchema.validate(req.body);

    if (error) {
        const details = error.details.map((d) => d.message);
        logger.warn({ details }, "Set manager validation error");
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
            success: false,
            data: null,
            error: {
                code: "VALIDATION_ERROR",
                details,
            },
        });
    }

    const { username, managerUsername } = value;

    try {
        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "USER_NOT_FOUND",
                    details: ["User not found"],
                },
            });
        }

        // Find manager by username
        const manager = await prisma.user.findUnique({
            where: { username: managerUsername },
        });

        if (!manager) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "MANAGER_NOT_FOUND",
                    details: ["Manager not found"],
                },
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { managerId: manager.id },
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(
            { userId: user.id, managerId: manager.id },
            "Manager set successfully for user",
        );

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: updatedUser,
            error: null,
        });
    } catch (error) {
        logger.error({ error }, "Set manager error");
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"],
            },
        });
    }
};
