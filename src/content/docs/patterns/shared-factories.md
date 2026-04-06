---
title: Shared Factories
description: Publish factory helpers on GitHub and reuse them across multiple repositories and teams.
---

Factory helpers become most powerful when you extract them into a **standalone repository**
and import them by URL in every project that needs them.
No npm registry required — just a GitHub repo and a version tag.

## How it works

1. Create a repository with your factory helpers (e.g. `github.com/your-org/k8s-platform`).
2. Export typed functions that compose [`resource()`](/patterns/base-primitive/) and built-in helpers.
3. Tag releases with semver (`v1.0.0`, `v1.1.0`, …).
4. Import by URL in any other repo — pinned to a tag.

```text
my-org/
  k8s-platform/          ← shared factory repo (on GitHub)
    web-service.ts
    database.ts
    queue.ts
  billing-service/       ← consumer repo
    main.ts              ← imports from k8s-platform
  user-service/          ← another consumer
    main.ts
```

## Step 1 — Create the shared factory repo

```ts
// github.com/my-org/k8s-platform/web-service.ts

import {
  deployment,
  service,
  ingress,
} from "github.com/cloudticon/k8s@master";

export type WebServiceInput = {
  name: string;
  image: string;
  replicas?: number;
  port?: number;
  ingressHost?: string;
};

export function webService(input: WebServiceInput): void {
  const labels = {
    "app.kubernetes.io/name": input.name,
    "app.kubernetes.io/managed-by": "ct",
  };

  deployment({
    name: input.name,
    labels,
    image: input.image,
    replicas: input.replicas ?? 2,
    resources: {
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    },
  });

  service({
    name: `${input.name}-svc`,
    labels,
    selector: labels,
    ports: [{ port: 80, targetPort: input.port ?? 8080 }],
  });

  if (input.ingressHost) {
    ingress({
      name: `${input.name}-ingress`,
      labels,
      rules: [
        {
          host: input.ingressHost,
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: { service: `${input.name}-svc`, port: 80 },
              },
            ],
          },
        },
      ],
    });
  }
}
```

```ts
// github.com/my-org/k8s-platform/database.ts

import { deployment, service, resource, z } from "github.com/cloudticon/k8s@master";

export const Database = resource("infra.my-org.com/v1", "Database", {
  scope: "Namespaced",
  shortNames: ["db"],
  spec: {
    engine: z.enum(["postgres", "mysql", "mariadb"]),
    version: z.string(),
    storage: z.string().default("10Gi"),
    replicas: z.number().default(1),
  },
  status: {
    ready: z.boolean(),
    endpoint: z.string().optional(),
  },
});

export function managedDatabase(opts: {
  name: string;
  engine: "postgres" | "mysql" | "mariadb";
  version: string;
  storage?: string;
}) {
  const labels = {
    "app.kubernetes.io/name": opts.name,
    "app.kubernetes.io/component": "database",
  };

  deployment({
    name: opts.name,
    labels,
    image: `${opts.engine}:${opts.version}`,
    resources: {
      requests: { cpu: "250m", memory: "256Mi" },
      limits: { cpu: "1", memory: "1Gi" },
    },
  });

  service({
    name: `${opts.name}-svc`,
    labels,
    selector: labels,
    ports: [{ port: 5432, targetPort: 5432 }],
  });
}
```

## Step 2 — Tag a release

```bash
cd k8s-platform
git tag v1.0.0
git push origin v1.0.0
```

Every consumer now has an immutable snapshot to pin against.

## Step 3 — Import in other repositories

```ts
// billing-service/main.ts

import { webService } from "github.com/my-org/k8s-platform@v1.0.0/web-service";
import { managedDatabase } from "github.com/my-org/k8s-platform@v1.0.0/database";

webService({
  name: "billing-api",
  image: "ghcr.io/my-org/billing:2.1.4",
  replicas: 3,
  ingressHost: "billing.prod.example.com",
});

managedDatabase({
  name: "billing-db",
  engine: "postgres",
  version: "16",
  storage: "50Gi",
});
```

```ts
// user-service/main.ts

import { webService } from "github.com/my-org/k8s-platform@v1.0.0/web-service";

webService({
  name: "user-api",
  image: "ghcr.io/my-org/user-service:1.0.0",
  ingressHost: "users.prod.example.com",
});
```

Both repos get the same labels, naming, resource limits, and ingress patterns
— with zero copy-paste.

## Upgrading across repos

When the platform team releases `v1.1.0`:

```ts
// just bump the tag
import { webService } from "github.com/my-org/k8s-platform@v1.1.0/web-service";
```

The CT CLI resolves the tag at build time, so every deploy is deterministic.

## Multiple platform packages

Large organizations can split factories by domain:

```text
my-org/
  k8s-platform-core/      ← deployment, service, ingress helpers
  k8s-platform-data/       ← database, cache, queue helpers
  k8s-platform-observability/ ← prometheus, grafana, alert helpers
```

```ts
import { webService } from "github.com/my-org/k8s-platform-core@v2.0.0/web-service";
import { managedDatabase } from "github.com/my-org/k8s-platform-data@v1.3.0/database";
import { prometheusStack } from "github.com/my-org/k8s-platform-observability@v1.0.0/prometheus";
```

## Versioning best practices

| Rule | Why |
| --- | --- |
| Tag every release with semver | Consumers pin to an exact version — no surprises. |
| Never break required fields in a patch release | `v1.0.1` must be a drop-in replacement for `v1.0.0`. |
| Add new optional fields in minor releases | `v1.1.0` can add `ingressAnnotations?: Record<…>`. |
| Bump major for breaking changes | `v2.0.0` can rename or remove fields. |
| Keep a changelog focused on contract changes | Consumers care about inputs/outputs, not internal diffs. |

## Testing shared factories

```ts
import { describe, it, expect } from "vitest";
import { webService } from "./web-service";

describe("webService", () => {
  it("should produce consistent labels", () => {
    const manifests = webService({
      name: "test-app",
      image: "nginx:latest",
    });
    expect(manifests).toMatchSnapshot();
  });

  it("should skip ingress when no host provided", () => {
    const manifests = webService({
      name: "test-app",
      image: "nginx:latest",
    });
    expect(manifests.filter((m) => m.kind === "Ingress")).toHaveLength(0);
  });

  it("should create ingress when host is provided", () => {
    const manifests = webService({
      name: "test-app",
      image: "nginx:latest",
      ingressHost: "test.example.com",
    });
    expect(manifests.filter((m) => m.kind === "Ingress")).toHaveLength(1);
  });
});
```

Run tests in CI before tagging a release to guarantee contract stability.
