import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: string;
        managerId?: string | null;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // Support both "Bearer <token>" and "Token <token>" formats
    const tokenMatch = authHeader.match(/^(Bearer|Token)\s+(.+)$/i);
    if (!tokenMatch) {
      return res.status(401).json({ error: 'Invalid authorization format. Use "Bearer <token>" or "Token <token>"' });
    }

    const token = tokenMatch[2];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }
    const payload = verifyToken(token);

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        managerId: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.userType !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// export const requireManager = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) {
//     return res.status(401).json({ error: 'Authentication required' });
//   }

//   // Admin can always act as manager
//   if (req.user.userType === 'ADMIN') {
//     return next();
//   }

//   // Check if user has reports (is a manager)
//   const reportsCount = await prisma.user.count({
//     where: {
//       managerId: req.user.id,
//     },
//   });

//   if (reportsCount === 0) {
//     return res.status(403).json({ error: 'Manager access required.' });
//   }

//   next();

// };

// export const requireHR = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) {
//     return res.status(401).json({ error: 'Authentication required' });
//   }

//   if (req.user.userType !== 'HR' && req.user.userType !== 'ADMIN') {
//     return res.status(403).json({ error: 'HR access required' });
//   }

//   next();

// };

// export const requireIT = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) {
//     return res.status(401).json({ error: 'Authentication required' });
//   }

//   if (req.user.userType !== 'IT' && req.user.userType !== 'ADMIN') {
//     return res.status(403).json({ error: 'IT access required' });
//   }

//   next();
// };

/** Only HR or IT; not available for employees or managers. */
export const requireHRorIT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.userType !== 'HR' && req.user.userType !== 'IT') {
    return res.status(403).json({ error: 'This endpoint is only available for HR or IT' });
  }
  next();
};

export const requireHRorITorManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const reportsCount = await prisma.user.count({
    where: {
      managerId: req.user.id,
    },
  });
  if (!['HR', 'IT', 'ADMIN'].includes(req.user.userType) && reportsCount === 0) {
    return res.status(403).json({ error: 'This endpoint is not available for employees' });
  }

  next();
};


export const requireManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const reportsCount = await prisma.user.count({
    where: {
      managerId: req.user.id,
    },
  });
  if (reportsCount === 0) {
    return res.status(403).json({ error: 'This endpoint is not available for employees' });
  }
  next();
}

export const requireEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.userType !== "EMPLOYEE") {
    return res.status(403).json({ error: 'This endpoint is only available for employees' });
  }
  next();
}