import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { UserType } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password once (same password for all users)
  const hashedPassword = await bcrypt.hash('password', SALT_ROUNDS);

  // Clear existing data
  console.log('Clearing existing users...');
  await prisma.activity.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@aubergine.co',
      username: 'admin',
      name: 'admin',
      password: hashedPassword,
      userType: UserType.ADMIN,
    },
  });

  // Create HR user
  console.log('Creating HR user...');
  const hr = await prisma.user.create({
    data: {
      email: 'hr@aubergine.co',
      username: 'hr',
      name: 'hr',
      password: hashedPassword,
      userType: UserType.HR,
    },
  });

  // Create IT user
  console.log('Creating IT user...');
  const it = await prisma.user.create({
    data: {
      email: 'it@aubergine.co',
      username: 'it',
      name: 'it',
      password: hashedPassword,
      userType: UserType.IT,
    },
  });

  // Create employee1 (Manager)
  console.log('Creating employee1 (Manager)...');
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@aubergine.co',
      username: 'employee1',
      name: 'employee1',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Create employee2
  console.log('Creating employee2...');
  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@aubergine.co',
      username: 'employee2',
      name: 'employee2',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Create employee3
  console.log('Creating employee3...');
  const employee3 = await prisma.user.create({
    data: {
      email: 'employee3@aubergine.co',
      username: 'employee3',
      name: 'employee3',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Create employee4 (Manager)
  console.log('Creating employee4 (Manager)...');
  const employee4 = await prisma.user.create({
    data: {
      email: 'employee4@aubergine.co',
      username: 'employee4',
      name: 'employee4',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Create employee5
  console.log('Creating employee5...');
  const employee5 = await prisma.user.create({
    data: {
      email: 'employee5@aubergine.co',
      username: 'employee5',
      name: 'employee5',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Create employee6
  console.log('Creating employee6...');
  const employee6 = await prisma.user.create({
    data: {
      email: 'employee6@aubergine.co',
      username: 'employee6',
      name: 'employee6',
      password: hashedPassword,
      userType: UserType.EMPLOYEE,
    },
  });

  // Set employee1 as manager of employee2 and employee3
  console.log('Setting employee1 as manager of employee2 and employee3...');
  await prisma.user.update({
    where: { id: employee2.id },
    data: { managerId: employee1.id },
  });

  await prisma.user.update({
    where: { id: employee3.id },
    data: { managerId: employee1.id },
  });

  // Set employee4 as manager of employee5 and employee6
  console.log('Setting employee4 as manager of employee5 and employee6...');
  await prisma.user.update({
    where: { id: employee5.id },
    data: { managerId: employee4.id },
  });

  await prisma.user.update({
    where: { id: employee6.id },
    data: { managerId: employee4.id },
  });

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
