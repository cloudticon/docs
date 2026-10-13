---
title: Plan
description: CT Operator vision, positioning, delivery plan for phases 4 and 5, and open questions.
---

## Vision

`ct-operator` executes `operator.ct` with the same CT runtime model, then reconciles Kubernetes resources declaratively.

The same factory code serves two modes: render it once with `ct apply`, or keep it continuously reconciled by `ct-operator`. A reconcile is a pure function from the observed cluster state to desired children and a status patch, which makes it easy to test without a cluster and easy for AI agents to write.

Core goals:

- one `operator()` call -> one CRD; a script may register several operators that share one process
- TypeScript-first authoring with generated typings
- server-side apply + owner references for managed children
- zero-Docker deployment model via generated manifests
- reconcile testable offline from fixture files

## Why another operator framework

| | Language | Reconcile runs in | Image build per change | Typed CRD authoring |
| --- | --- | --- | --- | --- |
| kubebuilder / controller-runtime | Go | your binary | yes | Go structs + markers |
| Metacontroller | any (webhook) | your HTTP service | yes (the webhook) | no |
| shell-operator | shell / any | hook scripts in the image | yes | no |
| KRO | CEL in YAML | KRO controller | no | YAML schema |
| ct-operator | TypeScript | generic controller (Goja) | no | `resource()` + `z` schema |

`ct-operator` fits teams that already write manifests with CT: the same `resource()` definitions, the same factories, the same `ct types` IntelliSense, and no second toolchain. It is not a general-purpose replacement for controller-runtime; operators that need concurrency, async I/O or heavy computation stay in Go.

## Already in place

- `resource()` with `z` schemas and OpenAPI generation (`toOpenAPI`)
- `operator()` builder in `cloudticon/k8s`: `.manages()`, `.reads()`, `.permission()`, `.env()`, `.every()`, `.reconcile()`; it records the config in `__ct_operator`
- `Result.ok()`, `Result.requeue()`, `Result.requeueAfter()`
- `ct types --operator` emits typings for the operator globals

`ct-operator` is a second binary in the `cloudticon/ct` repository (`cmd/ct-operator` next to `cmd/ct`) and shares the Goja runtime, the bundler and the Kubernetes client with `ct`.

## Phase 4: Core runtime and controller

Phase 4 is split so that a usable loop ships before the risky parts.

### Phase 4a: minimal loop (ship first)

- runtime loader for the `operator.ct` bundle
- Goja VM callbacks: `getStatus`, `getObserved`, `setStatus`, `randomString`, `log`, `Env`, `Values`
- `fetch` callback: synchronous HTTP with a per-call timeout bounded by `--reconcile-timeout`; needed by the first dogfood operator
- controller with a primary watch on the CRD and a periodic tick from `.every()`
- applier: server-side apply of desired children with owner references, field manager `ct-operator`
- status patch through the status subresource
- `ct-operator run` command with `--dev`

### Phase 4b: hardening

- secondary watches on `.manages()` and `.reads()` GVKs (reconcile the parent when a child changes)
- orphan cleanup: children applied in an earlier reconcile and missing from the current desired set are deleted; only objects carrying the `ct-operator` field manager and a matching owner reference are candidates, and deletion is logged per object
- leader election (on by default outside `--dev`)
- finalizers and deletion hook (see below)

### Runtime flow

1. Load and execute bundled JS.
2. Extract operator config from `__ct_operator`.
3. Build informer graph from watched and managed GVKs.
4. On reconcile: clear buffers, inject observed map and globals, call `reconcile`.
5. Read desired resources and status patch, apply them, process `Result`.

### Deletion and finalizers

Children in the cluster are garbage-collected through owner references, so the common case needs no code. Operators that create anything outside the cluster (through `fetch`, or in another namespace without an owner reference) register a deletion hook:

```ts
operator(webApp)
  .reconcile((cr) => { /* ... */ })
  .finalize((cr) => {
    // release external resources; return Result.requeueAfter("30s") while they are still going away
    return Result.ok();
  });
```

Registering `.finalize()` makes the runtime add the finalizer `ct-operator.cloudticon.com/<name>` on first reconcile and remove it once the hook returns `Result.ok()`. `.finalize()` is a proposed addition to the builder and is not part of the current `operator()` API yet.

### Status conventions

The runtime maintains two fields next to whatever the script sets through `setStatus`:

- `status.observedGeneration` — the `metadata.generation` the last successful reconcile saw
- `status.conditions[]` — at least a `Ready` condition with `observedGeneration`, `reason` and `message`; `Result.ok()` sets it to `True`, a thrown error or timeout sets it to `False` with the error as the message

These are what `kubectl wait --for=condition=Ready`, Argo CD health checks and other operators read, so they are not optional.

### Runtime limits

Goja runs the script synchronously, and CT rejects `async`/`await`. Consequences:

- `fetch` blocks the reconcile; the whole reconcile must finish within `--reconcile-timeout`
- long waits on external systems are expressed as `Result.requeueAfter("…")`, not as loops inside `reconcile`
- one reconcile at a time per operator; Goja is not a fit for high-throughput controllers

### CLI (`ct-operator run`)

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

### Scope (Phase 5)

- `ct-operator manifests` command
- CRD generation from `openAPISchema`, with the status subresource enabled
- RBAC generation from `.manages()`, `.reads()`, `.permission()`; finalizer patch rights on the CRD when `.finalize()` is registered
- ConfigMap bundle transport (`bundle.js.gz`); imports are bundled at `manifests` time, so a `@master` URL is pinned to the content that was bundled
- Deployment generation with hash-based rollout
- plugin interface in `pkg/plugin` (deferred until a second consumer exists)

### CLI (`ct-operator manifests`)

```text
ct-operator manifests [dir] [flags]

--entry string      Entry point (default: "operator.ct")
--image string      Operator image (default: ghcr.io/cloudticon/ct-operator:latest)
--namespace string  Target namespace (default: "<name>-system")
```

### Deploy model

```bash
ct-operator manifests ./my-operator | kubectl apply -f -
```

This supports updates without rebuilding images. A bundle hash annotation forces rollout when script content changes. The compressed bundle has to fit the 1 MiB ConfigMap limit; `manifests` fails with the bundle size when it does not.

## Testing

Because `reconcile` only sees the observed map and only emits desired resources plus a status patch, it runs without a cluster:

```text
ct-operator test [dir]

my-operator/
  operator.ct
  tests/
    creates-deployment/
      cr.yaml          # the primary resource
      observed/        # optional: objects visible through getObserved
      expected/        # desired children and status after reconcile
```

`ct-operator test` runs every case, diffs the emitted objects against `expected/` and prints the diff. `--update` rewrites `expected/` from the current output. This is the primary development loop; `ct-operator run --dev` against a kind cluster is the second one.

## Dogfood milestone

The first real operator is a port of the `ProjectSecrets` controller from the Go operator for the `apps.cloudticon.com` CRDs. It is the smallest of that operator's controllers and still exercises everything in Phase 4a: a CRD with spec and status, an external API read through `fetch` (secrets from Infisical), one child Secret per secret folder with owner references, and a `Synced` condition.

It runs on a kind cluster against copies of the `ProjectSecrets` objects from the development cluster, through `ct-operator run --dev` from the developer machine. The milestone passes when the child Secrets match those produced by the Go controller and the TypeScript version is substantially shorter. If it does not, Phase 4b is reconsidered before more work goes in.

## Example `operator.ct`

```ts
import {
  resource,
  z,
  operator,
  deployment,
  secret,
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

operator(webApp)
  .manages(deployment)
  .reads(secret)
  .every("5m")
  .reconcile((cr) => {
    const tokenSecret = getObserved(secret, `${cr.metadata.name}-token`);
    const token = tokenSecret?.data?.token ?? randomString(32);

    deployment({
      name: cr.metadata.name,
      namespace: cr.metadata.namespace,
      spec: {
        replicas: cr.spec.replicas,
        selector: { matchLabels: { app: cr.metadata.name } },
        template: {
          metadata: { labels: { app: cr.metadata.name } },
          spec: {
            containers: [
              { name: "app", image: cr.spec.image, env: [{ name: "TOKEN", value: token }] }
            ]
          }
        }
      }
    });

    setStatus(cr, { ready: true, phase: "Running" });
    return Result.ok();
  });
```

Every factory call inside `reconcile` becomes a desired child, the same way it becomes a manifest in `main.ct`.

## Acceptance criteria

Phase 4a:

- `ct-operator run` reconciles CR events and periodic ticks.
- status updates are persisted via subresource, with `observedGeneration` and a `Ready` condition.
- desired children are server-side applied with owner refs.
- a reconcile that throws or times out sets `Ready=False` and requeues with backoff.

Phase 4b:

- a change to a managed or read object triggers a reconcile of its parent.
- orphans are detected and removed safely; every deletion is logged with the reason.
- a CR with `.finalize()` registered is not removed until the hook returns `Result.ok()`.

Phase 5:

- `ct-operator manifests` outputs valid multi-doc YAML.
- a changed bundle rolls out the Deployment without an image change.

Testing:

- `ct-operator test` runs the fixture cases without a cluster and fails on any diff.

## Open questions

- CRD versioning: how a second `version` of a `resource()` is declared and whether conversion is in scope.
- Metrics: expose controller-runtime defaults, or add per-operator reconcile counters and durations.
- Several `operator()` calls in one script: one Deployment with several controllers, or one Deployment per operator.
- Bundle size: operators that import large factory packages may exceed the ConfigMap limit; a Secret or an image layer is the fallback.
