import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Validate or document APP_VERSION at startup
if (!process.env.APP_VERSION) {
  logger.warn(
    "APP_VERSION environment variable is not set. The /health endpoint will fall back to npm_package_version or be undefined.",
  );
}

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
