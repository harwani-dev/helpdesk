import { Router } from "express";
import { handleLogin, handleRegister } from "../controllers/auth";

const AuthRouter = Router();

AuthRouter.post('/login/', handleLogin);
AuthRouter.post('/register/', handleRegister);

export default AuthRouter;