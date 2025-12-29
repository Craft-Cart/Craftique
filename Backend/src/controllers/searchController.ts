import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @description Vulnerable Search Endpoint for MSc Demo
 * Demonstrates: SQL Injection via String Concatenation in TypeScript
 * Scanner: Semgrep (SAST)
 */
router.get('/products/search', async (req: Request, res: Response) => {
  // 1. TAINT SOURCE: Input comes from the query string (untrusted)
  const searchTerm = req.query.name as string;

  try {
    // 2. VULNERABLE SINK: Using $queryRawUnsafe with string interpolation/concatenation.
    // Even in TS, this allows an attacker to break out of the string literal.
    // Payload Example: ?name=apple' OR '1'='1
    const products = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Product" WHERE name = '${searchTerm}'`
    );

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;