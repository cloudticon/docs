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
