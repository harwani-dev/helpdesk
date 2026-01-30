import { prisma } from "../lib/prisma";
import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware";
import { getUserById, getUsers } from "../controllers/user";

const UserRouter = Router();
UserRouter.use(authenticateToken);

UserRouter.get('/:id', getUserById);

UserRouter.get('/', getUsers);

UserRouter.post('/manager', requireAdmin, async (req, res) => {
  try {
    const { userId, managerId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!managerId) {
      return res.status(400).json({ error: 'managerId is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if manager exists
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Prevent self-assignment
    if (userId === managerId) {
      return res.status(400).json({ error: 'User cannot be their own manager' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId as string },
      data: { managerId },
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

    res.json(updatedUser);
  } catch (error) {
    console.error('Set manager error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default UserRouter;