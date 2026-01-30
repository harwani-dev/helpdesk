import { prisma } from './prisma.js';
import { ActivityType } from '../../generated/prisma/enums.js';

export async function logActivity(
  userId: string,
  type: ActivityType,
  ticketId: string,
  message?: string
) {
  return await prisma.activity.create({
    data: {
      userId,
      type,
      message: message || null,
    },
  });
}