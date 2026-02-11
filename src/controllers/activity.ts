import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sendResponse } from "../lib/sendResponse.js";
import { HTTP_STATUS } from "../constants/status.js";
export const getActivity = async (req: Request, res: Response) => {
    try {
        const activities = await prisma.activity.findMany({
            orderBy: {
                createdAt: "desc"
            },
            select: {
                type: true,
                message: true,
                createdAt: true,
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        if (!activities || activities.length === 0) {
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "NO_ACTIVITIES_FOUND",
                    details: ["No activities found"]
                }
            });
        }
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: activities,
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
        });
    }
}