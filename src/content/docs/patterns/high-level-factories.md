---
title: High-level Factories
description: Use webApp() and expose() to create app workloads with minimal boilerplate.
---

`k8s-factories` is a high-level helper layer for common Kubernetes application setups.
It helps you create single-container workloads with less repeated code and cleaner defaults.

## Quick start

```ts
import { webApp } from "github.com/cloudticon/k8s-factories@master";

webApp({
  name: "node",
  image: "node:20-alpine",
  port: 3000,
  expose: {
    type: "istio",
    host: Values.host,
  },
});
```

This creates a `Deployment`, a `Service`, and an Istio `VirtualService`.

## Platform factory (`createFactory`)

Use `createFactory()` when you want to centralize platform defaults and expose a ready-to-use `{ webApp, expose }` API for teams.

```ts
import { createFactory } from "github.com/cloudticon/k8s-factories@master";

export const { webApp, expose } = createFactory({
  networking: {
    type: "istio",
    gateway: "shared-gateway/default",
    tls: { issuer: "letsencrypt-prod" },
  },
  resourcePresets: {
    small: {
      requests: { cpu: "50m", memory: "64Mi" },
      limits: { cpu: "200m", memory: "128Mi" },
    },
  },
  webApp: {
    defaults: {
      replicas: 2,
      probes: "/health",
      resources: "medium",
    },
    transform: (config) => ({
      ...config,
      labels: { ...config.labels, "managed-by": "platform-team" },
    }),
  },
});
```

`webApp()` and `expose()` still work standalone without factory. Factory is an optional layer.

## Resource presets

`webApp.resources` accepts presets in addition to full objects:

```ts
resources: "small"; // "small" | "medium" | "large"
```

Built-in defaults:

- `small`: requests `100m/128Mi`, limits `250m/256Mi`
- `medium`: requests `250m/256Mi`, limits `500m/512Mi`
- `large`: requests `500m/512Mi`, limits `1000m/1Gi`

## Production-oriented example

```ts
import { env, vol, webApp } from "github.com/cloudticon/k8s-factories@master";

webApp({
  name: "worker",
  image: "worker:latest",
  port: 8080,
  env: {
    NODE_ENV: "production",
    DB_PASSWORD: env.secret("db-credentials", "password"),
  },
  volumes: {
    "/data": "existing-pvc",
    "/storage": vol.pvc({ size: "10Gi", storageClass: "ssd" }),
    "/cache": vol.emptyDir(),
    "/secrets": vol.secret("app-secrets"),
  },
  probes: {
    readiness: { path: "/ready", periodSeconds: 5 },
    liveness: { path: "/healthz", initialDelaySeconds: 20 },
  },
  hpa: { min: 2, max: 8, cpu: 75, memory: 80 },
});
```

## Multi-service routing

```ts
import { webApp, expose } from "github.com/cloudticon/k8s-factories@master";

const api = webApp({ name: "api", image: "api:latest", port: 8080 });
const frontend = webApp({ name: "frontend", image: "frontend:latest", port: 3000 });
const admin = webApp({ name: "admin", image: "admin:latest", port: 3000 });

expose({
  name: "my-app",
  type: "istio",
  host: "app.example.com",
  tls: { issuer: "letsencrypt-prod" },
  routes: [
    { prefix: "/api", destination: api },
    { prefix: "/admin", destination: admin },
    { prefix: "/", destination: frontend },
  ],
});
```

## Conditional routes

`routes` accepts falsy items and filters them automatically:

```ts
const isStaging = Values.env === "staging";

expose({
  name: "my-app",
  type: "istio",
  host: "app.example.com",
  routes: [
    { prefix: "/api", destination: api },
    isStaging && { prefix: "/admin", destination: admin },
    { prefix: "/", destination: frontend },
  ],
});
```

## TLS and gateway behavior (Istio)

When `tls` is enabled:

- `createCertificate` defaults to `true`
- `createGateway` defaults to `true`
- if `gateway` is explicitly provided, helper reuses it and does not create a dedicated gateway by default

This allows platform teams to choose between shared gateway and dedicated gateway behavior per environment.

## What you get

- `webApp()` for `Deployment` + `Service` with optional probes, HPA, env helpers, and volumes.
- `expose()` for Istio or Ingress routes with optional TLS configuration and conditional routes.
- `createFactory()` for shared networking defaults, resource presets, and config transforms.
- A composable API that keeps templates readable as apps grow.

For lower-level reusable patterns, see [Factory Helpers](/patterns/factory-helpers/) and [Shared Factories](/patterns/shared-factories/).
