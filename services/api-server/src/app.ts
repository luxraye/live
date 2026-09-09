import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";

const app: Express = express();

const isProduction = process.env.NODE_ENV === 'production';
const requiredProductionConfig = [
  'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY', 'ADMIN_USER_IDS',
  'CORS_ORIGIN', 'DATABASE_URL', 'FABRIC_NODE_URL', 'FABRIC_GATEWAY_SECRET',
];
if (isProduction) {
  const missing = requiredProductionConfig.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  if (process.env.PILOT_AUTH_ENABLED === 'true') throw new Error('PILOT_AUTH_ENABLED cannot be enabled in production.');
}
const corsOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
if (isProduction && corsOrigins.includes('*')) throw new Error('Wildcard CORS_ORIGIN is not permitted in production.');
const allowedCorsOrigins = corsOrigins.length
  ? corsOrigins
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: allowedCorsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rawClerkPk =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (rawClerkPk) {
  const match = rawClerkPk.match(/(pk_(test|live)_[a-zA-Z0-9_-]+)/);
  const cleanKey = match ? match[1] : rawClerkPk.replace(/^["']|["']$/g, '').trim();
  app.use(clerkMiddleware({ publishableKey: cleanKey }));
}

// Dual mounting: supports both /api/path and direct /path across all frontend apps
app.use("/api", router);
app.use("/", router);

export default app;
