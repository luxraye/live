import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";

const app: Express = express();

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
    origin: (_origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }),
);
app.options('*', cors());

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

// Universal pilot fallback — ensures pilot presets and unauthenticated requests work gracefully
app.use((req, _res, next) => {
  const currentAuth = (req as any).auth;
  if (!currentAuth || !currentAuth.userId) {
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    (req as any).auth = {
      userId: bearer || 'dev-pilot-user',
    };
  }
  next();
});

// Dual mounting: supports both /api/path and direct /path across all frontend apps
app.use("/api", router);
app.use("/", router);

export default app;
