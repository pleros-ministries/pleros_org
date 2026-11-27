# Production image for Railway. Deps, build and run stages keep the final image to the
# Next.js standalone server, public files and static chunks.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Railway passes service variables to the build only when they are declared here.
# The private database host isn't reachable during a build, so prerendering uses
# the public URL when it is set.
ARG DATABASE_URL
ARG DATABASE_PUBLIC_URL
ARG BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG RESEND_API_KEY
ARG EMAIL_FROM_PLEROS
ARG UPLOADTHING_TOKEN
ARG YOUTUBE_API_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_GOOGLE_AUTH_ENABLED
RUN DATABASE_URL="${DATABASE_PUBLIC_URL:-$DATABASE_URL}" npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
