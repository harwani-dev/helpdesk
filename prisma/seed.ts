import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../generated/prisma/enums.js';

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

  // Create employee1
  console.log('Creating employee1...');
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

  // Set employee1 as manager of employee2 and employee3
  console.log('Setting employee1 as manager...');
  await prisma.user.update({
    where: { id: employee2.id },
    data: { managerId: employee1.id },
  });

  await prisma.user.update({
    where: { id: employee3.id },
    data: { managerId: employee1.id },
  });

  // Verify relationships
  const employee1WithReports = await prisma.user.findUnique({
    where: { id: employee1.id },
    include: {
      reports: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  console.log('\n📊 Summary:');
  console.log(
    `Employee1 (${employee1.name}) has ${employee1WithReports?.reports.length} direct reports:`
  );
  employee1WithReports?.reports.forEach((report) => {
    console.log(`  - ${report.name} (${report.email})`);
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
