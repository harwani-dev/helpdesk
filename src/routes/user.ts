import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware.js";
import { getMe, getUserById, getUsers, setManagerForUser, updateProfilePicture } from "../controllers/user.js";

const UserRouter = Router();
UserRouter.use(authenticateToken);

UserRouter.get('/:id', getUserById);

UserRouter.get('/', getUsers);

UserRouter.get('/me', getMe);

UserRouter.post('/profile', updateProfilePicture);

UserRouter.patch('/manager', requireAdmin, setManagerForUser);

export default UserRouter;