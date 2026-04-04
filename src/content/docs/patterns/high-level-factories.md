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

## What you get

- `webApp()` for `Deployment` + `Service` with optional probes, HPA, env helpers, and volumes.
- `expose()` for Istio or Ingress routes with optional TLS configuration.
- A small, composable API that keeps your templates readable as apps grow.

For lower-level reusable patterns, see [Factory Helpers](/patters/factory-helpers/) and [Shared Factories](/patters/shared-factories/).
