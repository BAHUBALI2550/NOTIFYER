require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Prisma 7: engine type "client" needs adapter or accelerateUrl
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
