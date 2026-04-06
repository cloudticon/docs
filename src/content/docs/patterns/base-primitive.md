---
title: Base Primitive – resource()
description: The resource() function is the low-level building block for defining Kubernetes CRDs and custom resources in TypeScript.
---

`resource()` is the foundational primitive of the `@cloudticon/k8s` package.
It lets you define **Custom Resource Definitions** (CRDs) entirely in TypeScript,
with full schema validation powered by Zod.

Everything else — factory helpers, shared packages, operators — is built on top of this single function.

## Signature

```ts
import { resource, z } from "github.com/cloudticon/k8s@master";

const MyResource = resource(apiVersion, kind, options);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `apiVersion` | `string` | Full API group and version, e.g. `apps.example.com/v1`. |
| `kind` | `string` | CRD kind name, e.g. `WebApp`. |
| `options` | `object` | Scope, schema, short names and other CRD metadata. |

## Options

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `scope` | `"Namespaced"` \| `"Cluster"` | yes | Whether the resource lives in a namespace or is cluster-wide. |
| `spec` | Zod schema object | yes | User-provided desired state. |
| `status` | Zod schema object | no | Runtime-owned observed state (never authored by users). |
| `shortNames` | `string[]` | no | Aliases for `kubectl` (e.g. `["wa"]` → `kubectl get wa`). |

## Minimal example

```ts
import { resource, z } from "github.com/cloudticon/k8s@master";

export const Cache = resource("infra.example.com/v1", "Cache", {
  scope: "Namespaced",
  spec: {
    image: z.string(),
    size: z.enum(["small", "medium", "large"]).default("small"),
  },
});

Cache({ name: "redis", image: "redis:7" });
```

`Cache` is now a **typed factory function** — calling it produces a validated Kubernetes manifest.

## Full CRD with status

```ts
import { resource, z } from "github.com/cloudticon/k8s@master";

export const WebApp = resource("apps.example.com/v1", "WebApp", {
  scope: "Namespaced",
  shortNames: ["wa"],
  spec: {
    image: z.string(),
    replicas: z.number().default(1),
    env: z.record(z.string()).optional(),
  },
  status: {
    phase: z.enum(["Pending", "Running", "Failed"]),
    ready: z.boolean(),
  },
});
```

### What this gives you

- **Type safety** — `WebApp({ name: "api", image: 123 })` is a compile-time error.
- **Runtime validation** — Zod checks every value at build time, before anything reaches the cluster.
- **Generated CRD YAML** — the CLI can emit the OpenAPI v3 schema for `kubectl apply`.
- **Short names** — `kubectl get wa` works out of the box.

## `spec` vs `status`

| Concern | `spec`                          | `status`                        |
| ------- | ------------------------------- | ------------------------------- |
| Author  | User / CI pipeline              | Controller / operator           |
| Mutable | Yes (declarative desired state) | Yes (runtime observed state)    |
| Schema  | Strict — validated on apply     | Informational — set by runtime  |

Golden rule: **users write `spec`, controllers write `status`**.

## API versioning

Version your API group deliberately:

| Stage       | Meaning                                    |
| ----------- | ------------------------------------------ |
| `v1alpha1`  | Experimental — breaking changes expected.  |
| `v1beta1`   | Mostly stable — deprecation notices given. |
| `v1`        | Stable — backward-compatible changes only. |

```ts
export const WebApp   = resource("apps.example.com/v1", "WebApp", { /* … */ });
export const WebAppV2 = resource("apps.example.com/v2", "WebApp", { /* … */ });
```

When evolving a CRD:

1. Add new fields as **optional** first.
2. Deprecate old fields in docs / changelogs.
3. Bump the version only when removing or renaming fields.

## Built-in helpers

`@cloudticon/k8s` also exports typed helpers for core Kubernetes resources:

```ts
import { deployment, service, ingress } from "github.com/cloudticon/k8s@master";
```

These follow the same pattern — they are thin, typed wrappers that emit standard manifests.
Use them directly or compose them inside [Factory Helpers](/patterns/factory-helpers/).
