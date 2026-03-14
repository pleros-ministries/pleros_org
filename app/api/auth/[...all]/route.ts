import { toNextJsHandler } from "better-auth/next-js";

import { betterAuthServer } from "@/lib/auth/better-auth";

const authHandler = toNextJsHandler(betterAuthServer);

export const { GET, POST } = authHandler;
