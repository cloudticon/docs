---
title: Examples
description: Minimal, production, and shared-package examples for resource() factories.
---

## Level 1: Minimal

```ts
import { resource, z } from "github.com/cloudticon/k8s@master";

const cache = resource("infra.example.com/v1", "Cache", {
  scope: "Namespaced",
  spec: {
    image: z.string(),
    size: z.enum(["small", "medium", "large"]).default("small")
  }
});

cache({
  name: "redis",
  image: "redis:7"
});
```

## Level 2: Production-ready

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

function appName(name: string): string {
  return `app-${name}`;
}

export function createApi(name: string, image: string, replicas = 2) {
  const app = appName(name);
  const labels = {
    "app.kubernetes.io/name": app,
    "app.kubernetes.io/managed-by": "ct"
  };

  deployment({
    name: app,
    labels,
    image,
    replicas,
    resources: {
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" }
    }
  });

  service({
    name: `${app}-svc`,
    labels,
    selector: labels,
    ports: [{ port: 80, targetPort: 8080 }]
  });
}
```

## Level 3: Shared package

Extract factories to a separate GitHub repo and import them by URL:

```ts
import { webService } from "github.com/my-org/k8s-platform@v1.0.0/web-service";

webService({
  name: "billing",
  image: "ghcr.io/my-org/billing:2.1.4",
  replicas: 3,
  ingressHost: "billing.prod.example.com",
});
```

See the full walkthrough in [Shared Factories](/k8s/shared-factories/) — creating a repo, tagging releases, importing across multiple services.

## Level 4: High-level library (`k8s-factories`)

For common app deployments, you can skip low-level wiring and use `webApp()` + `expose()` helpers:

```ts
import { webApp, expose } from "github.com/cloudticon/k8s@master";

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

`webApp()` creates `Deployment` + `Service` and supports optional HPA, probes, env helpers, and volume helpers. `expose()` handles Istio/Ingress routing for one or many services.
