import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sendResponse } from "../lib/sendResponse.js";
import { HTTP_STATUS } from "../constants/status.js";
import { logger } from "../lib/logger.js";
import { TicketStatus, UserType, TicketType } from "@prisma/client";
import { createFeedbackSchema } from "../validation/feedback.js";

export const getFeedbacks = async (req: Request, res: Response) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            include: {
                givenBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                givenTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });

        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: feedbacks,
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

export const giveFeedback = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const { error, value } = createFeedbackSchema.validate(req.body);
        if (error) {
            logger.warn({ userId: req.user!.id, details: error.details }, `Create feedback validation error: ${error.message}`);
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                success: false,
                data: null,
                error: {
                    code: error.message,
                    details: error.details.map((d: any) => d.message)
                }
            });
        }

        const { description, rating, given_to } = value;

        // Check that only employees can give feedback
        if (req.user!.userType !== UserType.EMPLOYEE) {
            logger.warn({ userId: req.user!.id, userType: req.user!.userType }, `Non-employee attempted to give feedback`);
            return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
                success: false,
                data: null,
                error: {
                    code: "FORBIDDEN",
                    details: ["Only employees can give feedback"]
                }
            });
        }

        // Find target user by username
        const targetUser = await prisma.user.findUnique({
            where: { username: given_to },
        });

        if (!targetUser) {
            logger.warn({ username: given_to }, `Target user not found`);
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "USER_NOT_FOUND",
                    details: ["Target user not found"]
                }
            });
        }

        // Check that target user is HR or IT
        if (targetUser.userType !== UserType.HR && targetUser.userType !== UserType.IT) {
            logger.warn({ userId: req.user!.id, targetUserId: targetUser.id, targetUserType: targetUser.userType }, `Target user is not HR or IT`);
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                success: false,
                data: null,
                error: {
                    code: "INVALID_TARGET_USER",
                    details: ["Feedback can only be given to HR or IT personnel"]
                }
            });
        }

        // Check that employee has resolved tickets matching the target user type
        const expectedTicketType = targetUser.userType === UserType.HR ? TicketType.HR : TicketType.IT;
        const resolvedTickets = await prisma.ticket.findMany({
            where: {
                createdById: req.user!.id,
                ticketType: expectedTicketType,
                status: TicketStatus.RESOLVED,
            },
        });

        if (resolvedTickets.length === 0) {
            logger.warn({ userId: req.user!.id, targetUserType: targetUser.userType }, `Employee has no resolved tickets of matching type`);
            return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
                success: false,
                data: null,
                error: {
                    code: "NO_MATCHING_TICKETS",
                    details: [`You can only give feedback to ${targetUser.userType} personnel who worked on your ${expectedTicketType} tickets. You need to have at least one resolved ${expectedTicketType} ticket.`]
                }
            });
        }

        // Create feedback
        const feedback = await prisma.feedback.create({
            data: {
                comment: description || null,
                rating: rating,
                givenById: req.user!.id,
                givenToId: targetUser.id,
            },
            include: {
                givenBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                givenTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info({ feedbackId: feedback.id, userId: req.user!.id, targetUserId: targetUser.id }, `Feedback created successfully`);
        return sendResponse(res, HTTP_STATUS.CREATED, {
            success: true,
            data: feedback,
            error: null
        });
    } catch (error) {
        logger.error({ userId: req.user!.id }, `Create feedback error: ${error}`);
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["Internal server error"]
            }
        });
    }
}