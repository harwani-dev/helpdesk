import type { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendResponse } from "../lib/sendResponse";
import { HTTP_STATUS } from "../constants/status";

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params
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
                    details: ["User not found"]
                }
            });
        }

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: user,
            error: null
        })
    } catch (error) {
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"]
            }
        })
    }
}

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
                    }
                }
            }
        });

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: users,
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