import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware";
import { getUserById, getUsers, setManagerForUser } from "../controllers/user";

const UserRouter = Router();
UserRouter.use(authenticateToken);

UserRouter.get('/:id', getUserById);

UserRouter.get('/', getUsers);

UserRouter.patch('/manager', requireAdmin, setManagerForUser);

export default UserRouter;