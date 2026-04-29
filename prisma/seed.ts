import { PrismaClient } from './generated-client';
import { faker } from '@faker-js/faker';
import "dotenv/config";

const prisma = new PrismaClient({
  accelerateUrl: process.env.ACCELERATE_URL
});

const MAJOR_INDIAN_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
];

async function main() {
  console.log('--- PURGING DATABASE ---');
  await prisma.resource.deleteMany();
  await prisma.sosRequest.deleteMany();
  await prisma.rescueTeam.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.shelter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.broadcastAlert.deleteMany();
  await prisma.droneIntel.deleteMany();

  console.log('--- SEEDING USERS ---');
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo-citizen-id',
      name: 'Aditya Sharma',
      phone: '9988776655',
      role: 'CITIZEN',
    },
  });

  console.log('--- SEEDING SHELTERS (120 nodes) ---');
  const shelters = [];
  for (let i = 0; i < 120; i++) {
    const city = faker.helpers.arrayElement(MAJOR_INDIAN_CITIES);
    const lat = city.lat + (Math.random() - 0.5) * 0.1;
    const lng = city.lng + (Math.random() - 0.5) * 0.1;
    const capacity = faker.number.int({ min: 500, max: 2000 });
    
    const shelter = await prisma.shelter.create({
      data: {
        name: `${city.name}-S${i + 1}`,
        lat,
        lng,
        capacity,
        currentOccupancy: faker.number.int({ min: 50, max: Math.floor(capacity * 0.8) }),
      },
    });
    shelters.push(shelter);
  }

  console.log('--- SEEDING RESCUE TEAMS (60 units) ---');
  for (let i = 0; i < 60; i++) {
    const shelter = faker.helpers.arrayElement(shelters);
    const cityName = shelter.name.split('-')[0];
    await prisma.rescueTeam.create({
      data: {
        name: `${cityName} Response Unit ${faker.helpers.arrayElement(['Alpha', 'Bravo', 'Charlie', 'Delta'])}`,
        lat: shelter.lat + (Math.random() - 0.5) * 0.05,
        lng: shelter.lng + (Math.random() - 0.5) * 0.05,
        isActive: true,
        status: 'ACTIVE',
      },
    });
  }

  console.log('--- SEEDING SOS REQUESTS (220 signals) ---');
  const emergencyTypes = ['RESCUE', 'FOOD', 'WATER', 'MEDICAL', 'MISSING'];
  const priorityScores = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < 220; i++) {
    const isVoice = Math.random() < 0.2; // 20% Voice SOS
    const city = faker.helpers.arrayElement(MAJOR_INDIAN_CITIES);
    
    await prisma.sosRequest.create({
      data: {
        userId: demoUser.id,
        name: faker.person.fullName(),
        type: faker.helpers.arrayElement(emergencyTypes),
        severity: faker.number.int({ min: 1, max: 10 }),
        lat: city.lat + (Math.random() - 0.5) * 0.5,
        lng: city.lng + (Math.random() - 0.5) * 0.5,
        priorityScore: faker.helpers.arrayElement(priorityScores),
        isVoice: isVoice,
        status: 'PENDING',
        calculationFactors: isVoice ? {
          transcription: `Emergency signal detected near ${city.name}. Immediate assistance required for ${faker.helpers.arrayElement(['flooding', 'medical trauma', 'structural collapse'])}.`,
          confidence: 0.92
        } : {},
      },
    });
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
