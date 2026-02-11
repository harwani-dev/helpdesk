import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sendResponse } from "../lib/sendResponse.js";
import { HTTP_STATUS } from "../constants/status.js";
import { logger } from "../lib/logger.js";
import { setManagerSchema, updateSchema } from "../validation/user.js";

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
                phone: true,
                profileImage: true,
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

export const updateProfilePicture = async (req: Request, res: Response) => {
    const { error, value } = updateSchema.validate(req.body);

    if (error) {
        const details = error.details.map((d) => d.message);
        logger.warn({ details }, "Update profile validation error");
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
            success: false,
            data: null,
            error: {
                code: "VALIDATION_ERROR",
                details,
            },
        });
    }

    if (!req.user) {
        return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, {
            success: false,
            data: null,
            error: {
                code: "UNAUTHORIZED",
                details: ["No user information found in request"],
            },
        });
    }

    const { profileImage, phone } = value;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                profileImage: profileImage || null,
                phone: phone || null,
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                profileImage: true,
                phone: true,
                userType: true,
                managerId: true,
            },
        });

        logger.info({ userId: req.user.id }, "Profile updated successfully");

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: updatedUser,
            error: null,
        });
    } catch (error) {
        logger.error({ error }, "Update profile error");
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

export const getMe = async (req: Request, res: Response) => {
    try {
        // req.user is set by authenticateToken middleware
        if (!req.user) {
            return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, {
                success: false,
                data: null,
                error: {
                    code: "UNAUTHORIZED",
                    details: ["No user information found in request"]
                }
            });
        }
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                profileImage: true,
                manager: true
            }
        });

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: user,
            error: null
        });
    } catch (error) {
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"]
            }
        });
    }
}