import { prisma } from "../lib/prisma.js";
import { Router } from "express";
import { authenticateToken, requireEmployee, requireHRorIT, requireHRorITorManager, requireManager } from "../middleware/middleware.js";
import { logActivity } from "../lib/activity.js";
import { ActivityType } from "@prisma/client";
import { createTicket, getActionTickets, getAllTickets, getEmployeeTickets, getTicketById, getTicketsByDepartment, performActionTickets } from "../controllers/ticket.js";

const TicketRouter = Router();
TicketRouter.use(authenticateToken);

// approve/reject a request
TicketRouter.post('/action/:id/', requireHRorITorManager, performActionTickets);

// get all action tickets
TicketRouter.get('/action/', requireHRorITorManager, getActionTickets);

TicketRouter.get("/manager/action/", requireManager, getEmployeeTickets);

// get tickets by department (HR/IT only)
TicketRouter.get("/department", requireHRorIT, getTicketsByDepartment);

// reopen a ticket 
TicketRouter.post('/:id/reopen/', async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is the creator or has appropriate permissions
    if (ticket.createdById !== req.user!.id && req.user!.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to reopen this ticket' });
    }

    await logActivity(
      req.user!.id,
      ActivityType.TICKET_REOPENED,
      ticket.id,
      'Ticket reopened'
    );

    res.json({ message: 'Ticket reopened', ticket });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get specific ticket
TicketRouter.get('/:id', getTicketById);

// get all tickets
TicketRouter.get('/', getAllTickets);

// create a new ticket 
TicketRouter.post('/', requireEmployee, createTicket);

export default TicketRouter;
