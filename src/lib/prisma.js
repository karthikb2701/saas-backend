const { PrismaClient } = require("../generated/prisma");

let prisma;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Failed to initialize PrismaClient:", error.message);
  process.exit(1);
}

// Disconnect on process termination
process.on("exit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
