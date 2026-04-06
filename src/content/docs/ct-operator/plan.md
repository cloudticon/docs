---
title: Plan
description: CT Operator vision and delivery plan for phases 4 and 5.
---

## Vision

`ct-operator` executes `operator.ct` with the same CT runtime model, then reconciles Kubernetes resources declaratively.

Core goals:

- one operator script -> one CRD
- TypeScript-first authoring with generated typings
- server-side apply + owner references for managed children
- zero-Docker deployment model via generated manifests

## Phase 4: Core runtime and controller

## Scope (Phase 4)

- runtime loader for `operator.ct` bundle
- Goja VM callbacks: `getStatus`, `getObserved`, `setStatus`, `randomString`, `fetch`, `log`, `Env`, `Values`
- dynamic controller with primary and secondary watches
- applier for desired resources and orphan cleanup
- `ct-operator run` command

## Runtime flow

1. Load and execute bundled JS.
2. Extract operator config from `__ct_operator`.
3. Build informer graph from watched and managed GVKs.
4. On reconcile: clear buffers, inject observed map and globals, call `reconcile`.
5. Read desired resources and status patch, apply them, process `Result`.

## CLI (`ct-operator run`)

```text
ct-operator run [dir] [flags]

--entry string              Entry point (default: "operator.ct")
--values string             Values file (auto-detect supported)
--bundle string             Pre-bundled JS for production mode
--reconcile-timeout string  Max reconcile duration (default: "30s")
--leader-elect              Enable leader election (default: true)
--health-port int           Health probe port (default: 8081)
--dev                       Dev mode (no leader election, text logs)
--namespace string          Restrict scope (default: cluster-wide)
```

## Phase 5: Deploy and packaging

## Scope (Phase 5)

- `ct-operator manifests` command
- CRD generation from `openAPISchema`
- RBAC generation from `.manages()`, `.reads()`, `.permission()`
- ConfigMap bundle transport (`bundle.js.gz`)
- Deployment generation with hash-based rollout
- plugin interface in `pkg/plugin`

## CLI (`ct-operator manifests`)

```text
ct-operator manifests [dir] [flags]

--entry string      Entry point (default: "operator.ct")
--image string      Operator image (default: ghcr.io/cloudticon/ct-operator:latest)
--namespace string  Target namespace (default: "<name>-system")
```

## Deploy model

```bash
ct-operator manifests ./my-operator | kubectl apply -f -
```

This supports updates without rebuilding images. A bundle hash annotation forces rollout when script content changes.

## Example `operator.ct`

```ts
import {
  resource,
  z,
  operator,
  getStatus,
  setStatus,
  getObserved,
  randomString,
  Result
} from "https://github.com/cloudticon/k8s@master";

const webApp = resource("apps.example.com/v1", "WebApp", {
  scope: "Namespaced",
  spec: {
    image: z.string(),
    replicas: z.number().default(1)
  },
  status: {
    ready: z.boolean(),
    phase: z.enum(["Pending", "Running", "Failed"])
  }
});

operator(webApp).every("5m").reconcile((cr) => {
  const tokenSecret = getObserved(secret, `${cr.metadata.name}-token`);
  const token = tokenSecret?.data?.token ?? randomString(32);
  // build desired resources...
  setStatus(cr, { ready: true, phase: "Running" });
  return Result.ok();
});
```

## Acceptance criteria

- `ct-operator run` reconciles CR events and periodic ticks.
- status updates are persisted via subresource.
- desired children are server-side applied with owner refs.
- orphans are detected and removed safely.
- `ct-operator manifests` outputs valid multi-doc YAML.
