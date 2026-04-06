---
title: Factory Helpers
description: Build reusable app-level factories on top of resource() and share them across teams.
---

## Why factory helpers

[`resource()`](/patterns/base-primitive/) gives a low-level primitive that is easy to standardize.
Factory helpers wrap it to encode **naming conventions**, **labels**, **security defaults**,
and **resource limits** — so every team gets production-grade manifests without copy-pasting boilerplate.

## Reusable app-specific helper

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

export function createWebStack(opts: {
  name: string;
  image: string;
  replicas?: number;
  port?: number;
}) {
  const labels = { "app.kubernetes.io/name": opts.name };

  deployment({
    name: opts.name,
    labels,
    image: opts.image,
    replicas: opts.replicas ?? 1,
  });

  service({
    name: `${opts.name}-svc`,
    labels,
    selector: labels,
    ports: [{ port: 80, targetPort: opts.port ?? 8080 }],
  });
}
```

One call — one deployment + one service, with consistent labels and naming.

## Production-grade helper with defaults

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

const DEFAULT_RESOURCES = {
  requests: { cpu: "100m", memory: "128Mi" },
  limits: { cpu: "500m", memory: "512Mi" },
};

function prefixedName(name: string): string {
  return `app-${name}`;
}

export function createApi(opts: {
  name: string;
  image: string;
  replicas?: number;
  resources?: { requests: Record<string, string>; limits: Record<string, string> };
}) {
  const app = prefixedName(opts.name);
  const labels = {
    "app.kubernetes.io/name": app,
    "app.kubernetes.io/managed-by": "ct",
  };

  deployment({
    name: app,
    labels,
    image: opts.image,
    replicas: opts.replicas ?? 2,
    resources: opts.resources ?? DEFAULT_RESOURCES,
  });

  service({
    name: `${app}-svc`,
    labels,
    selector: labels,
    ports: [{ port: 80, targetPort: 8080 }],
  });
}
```

Defaults are baked in, but every field can be overridden.

## Composition patterns

- **One helper per domain** — `network.ts`, `storage.ts`, `runtime.ts`.
- **Return plain manifests** when you need post-processing (e.g. patching per env).
- **Accept small, typed inputs** — avoid passing full Helm-style `Values` objects.
- **Centralize labels/annotations** inside helper internals, not at every callsite.

## Anti-patterns

- Hidden namespace changes in helper internals.
- Inconsistent naming conventions across helper files.
- Business logic mixed directly into resource constructor code.
- Re-implementing shared labels in every callsite instead of centralizing them.

## Suggested package layout

```text
packages/
  k8s-platform/
    resource-factories/
      app.ts
      networking.ts
      observability.ts
    labels.ts
    naming.ts
```

Keep factories small and focused. For sharing them across repos, see
[Shared Factories](/patterns/shared-factories/).
