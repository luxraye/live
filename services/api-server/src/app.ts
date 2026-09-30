import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { devPilotAuthMiddleware } from "./middlewares/devPilotAuthMiddleware";

const app: Express = express();

// Running behind Render / reverse proxy — trust 1 hop for req.ip
app.set("trust proxy", 1);

// Security headers: CSP, HSTS, X-Content-Type-Options, etc.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

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
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5176',
  'https://bloodchain.life',
  'https://www.bloodchain.life',
  'https://rubric.bloodchain.life',
];
const allowedOriginsList = Array.from(new Set([...corsOrigins, ...defaultAllowedOrigins]));

// General rate limiter for API endpoints (exempting health check for Render/monitors)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // 500 requests per 15 min per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path === '/healthz' || req.path === '/api/healthz',
});
app.use(generalLimiter);

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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOriginsList.includes(origin)) return callback(null, true);
      if (/^https:\/\/bloodchain-[a-z0-9-]+\.onrender\.com$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Idempotency-Key',
      'X-Clinician-Id',
      'X-Operator-Id',
      'X-Pilot-Role',
      'X-Courier-Id',
      'X-Driver-Id',
      'X-Dispatcher-Id',
    ],
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

// Development-only pilot authentication bypass (strictly blocked in production)
if (!isProduction && process.env.PILOT_AUTH_ENABLED === 'true') {
  app.use(devPilotAuthMiddleware);
}

// Dual mounting: supports both /api/path and direct /path across all frontend apps
app.use("/api", router);
app.use("/", router);

export default app;
