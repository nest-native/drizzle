# Deployment Recipes

These recipes show where `@nest-native/drizzle` fits in common deployment
targets. They are intentionally app-owned: the package registers Drizzle clients
inside Nest, while your deployment owns secrets, migration execution, health
checks, process startup, and shutdown.

Every production recipe should keep this order:

1. Install dependencies.
2. Build the Nest application.
3. Apply Drizzle migrations once.
4. Start the Nest process.
5. Route traffic only after readiness succeeds.
6. Let Nest shutdown hooks close owned drivers or pools.

## Package Scripts

Give the deployment platform clear commands. Names vary by application, but the
shape should stay familiar:

```json
{
  "scripts": {
    "build": "nest build",
    "db:migrate": "drizzle-kit migrate",
    "start:prod": "node dist/main.js"
  }
}
```

Keep `DATABASE_URL` and any driver credentials in the platform secret manager.
Do not commit `.env.production` files, copied connection strings, or provider
tokens.

## Docker

Use a container image for build output, not for hiding deployment state. Run
migrations as a separate release step or one-off job before starting replicas.

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
CMD ["npm", "run", "start:prod"]
```

Run migrations with the same image before traffic:

```bash
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  app-image \
  npm run db:migrate
```

Then start the long-running container. Configure the platform to call
`/health/live` for liveness and `/health/ready` for readiness.

## Kubernetes

Use a `Job` for migrations and a `Deployment` for the Nest app. The job should
finish before the rollout sends traffic to new pods.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: app-migrate
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: app-image
          command: ["npm", "run", "db:migrate"]
          envFrom:
            - secretRef:
                name: app-database
```

Use probes on the app deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
        - name: app
          image: app-image
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: app-database
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
```

Avoid running migrations from every pod init container unless your platform adds
a strict single-runner guarantee. A rolling update can start several pods at
once.

## Render, Fly.io, Railway, And Similar Platforms

For platforms with one command for the web process and another command for
release or deploy hooks, keep migrations in the release hook:

```bash
npm ci
npm run build
npm run db:migrate
npm run start:prod
```

The exact UI differs by provider, but the split should be:

| Concern | Configure As |
| --- | --- |
| Database credentials | Secret or environment variable |
| Build | `npm ci && npm run build` |
| Migration | Release command, deploy hook, or one-off task |
| Web process | `npm run start:prod` |
| Readiness | `/health/ready` if the platform supports health checks |
| Liveness | `/health/live` if the platform supports separate probes |

If the platform cannot run a release command before traffic, use a manual
one-off migration command during deploys or keep production at one replica until
you have a safe migration owner.

## GitHub Actions Deploy Flow

For GitHub Actions, keep validation, migration, and deployment as separate
steps. Use environment protection for production migrations.

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: ./scripts/deploy-app.sh
```

The deploy step can push an image, call a platform CLI, or trigger an external
deployment system. Keep the database secret scoped to the migration step unless
the deploy command also needs it.

## Graceful Shutdown

The application should pass a `shutdown` function to `DrizzleModule` when Nest
owns the driver or pool:

```ts
DrizzleModule.forRoot({
  schema,
  connection: drizzle(pool, { schema }),
  shutdown: () => pool.end(),
});
```

Make sure the platform sends a normal termination signal and gives the process
time to drain. Kubernetes uses `terminationGracePeriodSeconds`; other platforms
expose similar stop timeout settings.

## Security Checklist

- Store connection strings in platform secrets.
- Run migrations once before traffic, not concurrently in every replica.
- Keep readiness responses generic; do not return driver errors or hostnames.
- Do not log connection URLs, credentials, generated secrets, or raw production
  data.
- Review migration SQL before deploy, especially raw SQL and destructive
  schema changes.
- Use least-privilege database users when your operations model allows separate
  migration and application credentials.
