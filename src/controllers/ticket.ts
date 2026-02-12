import type { Request, Response } from "express";
import { createTicketSchema, performActionSchema } from "../validation/ticket.js";
import { requiresManagerApproval } from "../utils/approval.js";
import { sendResponse } from "../lib/sendResponse.js";
import { HTTP_STATUS } from "../constants/status.js";
import prisma from "../lib/prisma.js";
import { TicketStatus, UserType, ActivityType, TicketType } from "@prisma/client";
import { logger } from "../lib/logger.js";
import { logActivity } from "../lib/activity.js";

export const createTicket = async (req: Request, res: Response) => {
    const { error, value } = createTicketSchema.validate(req.body);
    if (error) {
        logger.warn({ userId: req.user!.id, details: error.details }, `Create ticket validation error: ${error.message}`);
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

    // Admins cannot create tickets
    if (req.user!.userType === UserType.ADMIN) {
        logger.warn({ userId: req.user!.id, userType: req.user!.userType }, `Admin attempted to create ticket`);
        return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
            success: false,
            data: null,
            error: {
                code: "FORBIDDEN",
                details: ["Admins cannot create tickets"]
            }
        });
    }

    // Only EMPLOYEE user type can create tickets
    if (req.user!.userType !== UserType.EMPLOYEE) {
        logger.warn({ userId: req.user!.id, userType: req.user!.userType }, `Invalid user type attempted to create ticket`);
        return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
            success: false,
            data: null,
            error: {
                code: "FORBIDDEN",
                details: ["Only employees can create tickets"]
            }
        });
    }

    try {
        // Check if user is a manager (has reports)
        const reportsCount = await prisma.user.count({
            where: {
                managerId: req.user!.id,
            },
        });
        const isManager = reportsCount > 0;

        // Managers bypass manager approval
        const requiresApproval = isManager ? false : requiresManagerApproval(value.ticketType, value.hrType, value.itType);

        const ticket = await prisma.ticket.create({
            data: {
                title: value.title,
                description: value.description,
                ticketType: value.ticketType,
                hrType: value.hrType,
                itType: value.itType,
                requiresApproval,
                createdById: req.user!.id,
                status: requiresApproval ? TicketStatus.FORWARDED_TO_MANAGER : (value.hrType ? TicketStatus.FORWARDED_TO_HR : TicketStatus.FORWARDED_TO_IT)
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info({ ticketId: ticket.id, userId: req.user!.id, status: ticket.status, isManager }, `Ticket created successfully`);
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: ticket,
            error: null
        })
    } catch (error) {
        logger.error({ userId: req.user!.id }, `Create ticket error: ${error}`);
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

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await prisma.ticket.findMany({
            ...(req.user?.userType === "ADMIN"
                ? {}
                : { where: { createdById: req.user!.id } }),
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        logger.info({ userId: req.user!.id, count: tickets.length }, `Tickets retrieved successfully`);
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: tickets,
            error: null
        })

    } catch (error) {
        logger.error({ userId: req.user!.id }, `Get all tickets error: ${error}`);
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

export const getTicketById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: req.user?.userType === "ADMIN"
                ? { id: id as string }
                : { id: id as string, createdById: req.user!.id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userType: true,
                    },
                },
            },
        });

        if (!ticket) {
            logger.warn({ ticketId: id, userId: req.user!.id }, `Ticket not found or access denied`);
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND_OR_FORBIDDEN",
                    details: ["Ticket not found or you dont have access to see ticket generated by another employee"]
                }
            });
        }

        logger.info({ ticketId: id, userId: req.user!.id }, `Ticket retrieved successfully`);
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: ticket,
            error: null
        });
    } catch (error) {
        logger.error({ ticketId: req.params.id, userId: req.user!.id }, `Get ticket by id error: ${error}`);
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

export const getActionTickets = async (req: Request, res: Response) => {
    try {
        let ticketStatus;
        switch (req.user!.userType) {
            case UserType.HR:
                ticketStatus = TicketStatus.FORWARDED_TO_HR
                break;
            case UserType.IT:
                ticketStatus = TicketStatus.FORWARDED_TO_IT
                break;
            default:
                ticketStatus = TicketStatus.FORWARDED_TO_MANAGER
                break
        }

        // Managers only see tickets created by employees under them; HR/IT see all tickets with that status
        const reportIds =
            req.user!.userType === UserType.HR || req.user!.userType === UserType.IT
                ? undefined
                : (await prisma.user.findMany({
                    where: { managerId: req.user!.id },
                    select: { id: true },
                })).map((r: { id: string }) => r.id);

        const tickets = await prisma.ticket.findMany({
            where: {
                status: ticketStatus,
                ...(reportIds !== undefined ? { createdById: { in: reportIds } } : {}),
            },
            include: {
                createdBy: {
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

        logger.info({ userId: req.user!.id, userType: req.user!.userType }, 'Action tickets retrieved successfully');
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: tickets,
            error: null
        });
    } catch (error) {
        logger.error({ userId: req.user!.id, userType: req.user!.userType }, `Get action tickets error: ${error}`);
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

export const performActionTickets = async (req: Request, res: Response) => {
    const { error, value } = performActionSchema.validate(req.body);
    if (error) {
        logger.warn({ userId: req.user!.id, details: error.details }, `Perform action validation error: ${error.message}`);
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
            success: false,
            data: null,
            error: {
                code: error.message,
                details: error.details
            }
        });
    }

    try {
        const { id } = req.params;
        const { action, remarks, rating } = value;
        const userType = req.user!.userType;

        // Get ticket first to use for all validations
        const ticket = await prisma.ticket.findUnique({
            where: { id: id as string },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        managerId: true,
                    },
                },
            },
        });

        if (!ticket) {
            logger.warn({ ticketId: id, userId: req.user!.id }, `Ticket not found`);
            return sendResponse(res, HTTP_STATUS.NOT_FOUND, {
                success: false,
                data: null,
                error: {
                    code: "TICKET_NOT_FOUND",
                    details: ["Ticket not found"]
                }
            });
        }

        // Check if user is a manager (has reports)
        const reportsCount = await prisma.user.count({
            where: {
                managerId: req.user!.id,
            },
        });
        const isManager = reportsCount > 0;

        // Check if this is the user's own ticket
        const isOwnTicket = ticket.createdById === req.user!.id;

        // Validate action based on user type and role
        let validActions: string[];
        let expectedStatus: TicketStatus | null = null; // null means no status check needed
        let newStatus: TicketStatus;
        let activityType: ActivityType;


        // MANAGER ROLE: Can approve or reject tickets of employees under them
        if (isManager && userType === UserType.EMPLOYEE && !isOwnTicket) {
            validActions = ['approve', 'rejected'];
            expectedStatus = TicketStatus.FORWARDED_TO_MANAGER;

            // Verify they are the manager of the ticket creator
            const isTicketCreatorManager = ticket.createdBy.managerId === req.user!.id;
            if (!isTicketCreatorManager) {
                logger.warn({ ticketId: id, userId: req.user!.id }, `User is not the manager of ticket creator`);
                return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
                    success: false,
                    data: null,
                    error: {
                        code: "FORBIDDEN",
                        details: ["You can only approve/reject tickets of employees under you"]
                    }
                });
            }

            if (action.toLowerCase() === 'approve') {
                // Determine next status based on ticket type
                newStatus = ticket.ticketType === TicketType.HR
                    ? TicketStatus.FORWARDED_TO_HR
                    : TicketStatus.FORWARDED_TO_IT;
                activityType = ActivityType.TICKET_APPROVED;
            } else {
                newStatus = TicketStatus.REJECTED;
                activityType = ActivityType.TICKET_REJECTED;
            }
        }
        // HR ROLE: Can resolve or reject if status is FORWARDED_TO_HR
        else if (userType === UserType.HR || userType === UserType.ADMIN) {
            validActions = ['resolved', 'rejected'];
            expectedStatus = TicketStatus.FORWARDED_TO_HR;

            if (action.toLowerCase() === 'resolved') {
                newStatus = TicketStatus.RESOLVED;
                activityType = ActivityType.TICKET_APPROVED;
            } else {
                newStatus = TicketStatus.REJECTED;
                activityType = ActivityType.TICKET_REJECTED;
            }
        }
        // IT ROLE: Can resolve or reject if status is FORWARDED_TO_IT
        else if (userType === UserType.IT || userType === UserType.ADMIN) {
            validActions = ['resolved', 'rejected'];
            expectedStatus = TicketStatus.FORWARDED_TO_IT;

            if (action.toLowerCase() === 'resolved') {
                newStatus = TicketStatus.RESOLVED;
                activityType = ActivityType.TICKET_APPROVED;
            } else {
                newStatus = TicketStatus.REJECTED;
                activityType = ActivityType.TICKET_REJECTED;
            }
        }
        // NORMAL EMPLOYEE: Can close at any stage, reopen only if rejected
        else if (userType === UserType.EMPLOYEE || userType === UserType.ADMIN) {
            validActions = ['reopen', 'close'];

            // Verify user is the ticket creator
            if (!isOwnTicket) {
                logger.warn({ ticketId: id, userId: req.user!.id }, `User is not the creator of this ticket`);
                return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
                    success: false,
                    data: null,
                    error: {
                        code: "FORBIDDEN",
                        details: ["You can only perform actions on tickets that you created"]
                    }
                });
            }

            if (action.toLowerCase() === 'close') {
                // If ticket is RESOLVED, rating is required
                if (ticket.status === TicketStatus.RESOLVED && !rating) {
                    logger.warn({ ticketId: id, userId: req.user!.id }, `Rating required when closing resolved ticket`);
                    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                        success: false,
                        data: null,
                        error: {
                            code: "RATING_REQUIRED",
                            details: ["Rating (1-5) is required when closing a resolved ticket"]
                        }
                    });
                }

                // Employee can close ticket at any stage
                newStatus = TicketStatus.CLOSED;
                activityType = ActivityType.TICKET_CLOSED;
            } else {
                // For reopen, check if ticket status is REJECTED
                if (ticket.status !== TicketStatus.REJECTED) {
                    logger.warn({ ticketId: id, userId: req.user!.id, ticketStatus: ticket.status }, `Ticket cannot be reopened - status must be REJECTED`);
                    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                        success: false,
                        data: null,
                        error: {
                            code: "INVALID_TICKET_STATUS",
                            details: ["Ticket can only be reopened if it is in REJECTED status"]
                        }
                    });
                }

                // Determine the status to reopen to based on ticket properties
                if (ticket.requiresApproval) {
                    newStatus = TicketStatus.FORWARDED_TO_MANAGER;
                } else {
                    newStatus = ticket.ticketType === TicketType.HR
                        ? TicketStatus.FORWARDED_TO_HR
                        : TicketStatus.FORWARDED_TO_IT;
                }
                activityType = ActivityType.TICKET_REOPENED;
            }
        }
        // ADMIN: Can close their own tickets
        else if (userType === UserType.ADMIN || userType === 'ADMIN') {
            validActions = ['close'];

            // Verify user is the ticket creator
            if (!isOwnTicket) {
                logger.warn({ ticketId: id, userId: req.user!.id }, `Admin is not the creator of this ticket`);
                return sendResponse(res, HTTP_STATUS.FORBIDDEN, {
                    success: false,
                    data: null,
                    error: {
                        code: "FORBIDDEN",
                        details: ["You can only close tickets that you created"]
                    }
                });
            }

            newStatus = TicketStatus.CLOSED;
            activityType = ActivityType.TICKET_CLOSED;
        }
        else {
            logger.warn({ userId: req.user!.id, userType }, `Invalid user type for ticket action`);
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                success: false,
                data: null,
                error: {
                    code: "INVALID_USER_TYPE",
                    details: ["User type is not authorized to perform actions on tickets"]
                }
            });
        }

        // Validate action
        if (!validActions.includes(action.toLowerCase())) {
            logger.warn({ userId: req.user!.id, action, userType, validActions }, `Invalid action for user type`);
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                success: false,
                data: null,
                error: {
                    code: "INVALID_ACTION",
                    details: [`Action must be one of: ${validActions.join(', ')}`]
                }
            });
        }

        // Verify ticket is in the expected status for this user type (skip if expectedStatus is null)
        if (expectedStatus !== null && ticket.status !== expectedStatus) {
            logger.warn({ ticketId: id, userId: req.user!.id, ticketStatus: ticket.status, expectedStatus }, `Ticket not in expected status`);
            return sendResponse(res, HTTP_STATUS.BAD_REQUEST, {
                success: false,
                data: null,
                error: {
                    code: "INVALID_TICKET_STATUS",
                    details: [`Ticket must be in ${expectedStatus} status for this action`]
                }
            });
        }

        // Update ticket status with rating if provided
        const updatedTicket = await prisma.ticket.update({
            where: { id: id as string },
            data: {
                status: newStatus,
                remarks,
                ...(rating && { rating }) // Only include rating if provided
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Log activity
        await logActivity(
            req.user!.id,
            activityType,
            id as string,
            remarks
        );

        logger.info({ ticketId: id, userId: req.user!.id, action, newStatus, rating }, `Ticket action performed successfully`);
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: {
                ticket: updatedTicket,
                action: action.toLowerCase(),
                remarks,
                ...(rating && { rating })
            },
            error: null
        });
    } catch (error) {
        logger.error({ userId: req.user!.id, ticketId: req.params.id }, `Perform action tickets error: ${error}`);
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

// for HR/IT to see tickets by their department (HR sees HR tickets, IT sees IT tickets)
export const getTicketsByDepartment = async (req: Request, res: Response) => {
    try {
        const userType = req.user!.userType;
        const ticketType = userType === UserType.HR ? TicketType.HR : TicketType.IT;

        const tickets = await prisma.ticket.findMany({
            where: { ticketType },
            include: {
                createdBy: {
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

        logger.info({ userId: req.user!.id, userType, ticketType, count: tickets.length }, 'Department tickets retrieved successfully');
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: tickets,
            error: null
        });
    } catch (error) {
        logger.error({ userId: req.user!.id, userType: req.user!.userType }, `Get department tickets error: ${error}`);
        return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
            success: false,
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: ["There has been an internal server error"]
            }
        });
    }
};

// for manager to see all his/her employee tickets
export const getEmployeeTickets = async (req: Request, res: Response) => {
    try {
        const reportIds = (await prisma.user.findMany({
            where: { managerId: req.user!.id },
            select: { id: true },
        })).map((r: { id: string }) => r.id);

        const tickets = await prisma.ticket.findMany({
            where: {
                ...(reportIds !== undefined ? { createdById: { in: reportIds } } : {}),
            },
            include: {
                createdBy: {
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
        logger.info({ userId: req.user!.id, userType: req.user!.userType }, 'Action tickets retrieved successfully');
        return sendResponse(res, HTTP_STATUS.OK, {
            success: true,
            data: tickets,
            error: null
        });
    } catch (error) {
        logger.error({ userId: req.user!.id, userType: req.user!.userType }, `Get action tickets error: ${error}`);
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
