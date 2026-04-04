---
title: CT vs Kustomize
description: Why TypeScript-first templating beats YAML patching, overlays, and Kustomize complexity.
---

## At a glance

| Feature | CT | Kustomize |
| --- | --- | --- |
| Language | TypeScript | YAML patches + overlays |
| IDE support | Full IntelliSense, autocomplete, jump-to-definition | YAML schema only |
| Type safety | Compile-time — generated `.d.ts` | None — patches fail silently on wrong paths |
| Values / config | Typed JS objects (`values.json`) | `configMapGenerator`, `secretGenerator`, vars |
| Logic | Real functions, loops, conditionals | Strategic merge patches, JSON patches |
| Reuse | ES module imports from any Git URL | `bases` / `components` references |
| Composition | Function calls + imports | Directory-based overlays |
| Learning curve | Know TypeScript? You're done. | Patch mechanics, overlay hierarchy, transformer order |
| Output | `ct template` → YAML | `kustomize build` → YAML |

## Patching vs generating

Kustomize starts from base YAML and **patches** it. CT **generates** YAML from code. This is a fundamental difference.

### Kustomize — overlay with patches

```text
base/
  deployment.yaml
  service.yaml
  kustomization.yaml
overlays/
  dev/
    kustomization.yaml      # patches for dev
    replicas-patch.yaml
  staging/
    kustomization.yaml      # patches for staging
  prod/
    kustomization.yaml      # patches for prod
    hpa.yaml
```

`overlays/dev/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - path: replicas-patch.yaml
namePrefix: dev-
namespace: development
```

`overlays/dev/replicas-patch.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
```

### CT — the same thing

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

const env = Values.env; // "dev" | "staging" | "prod"

deployment({
  name: `${env === "dev" ? "dev-" : ""}api`,
  namespace: Values.namespace,
  replicas: Values.replicas,
  image: Values.image,
});

service({
  name: "api",
  namespace: Values.namespace,
  port: 80,
  targetPort: 8080,
});

if (env === "prod") {
  hpa({
    name: "api",
    minReplicas: Values.replicas,
    maxReplicas: Values.maxReplicas,
  });
}
```

One file, real `if`, real variables. No directory trees, no patch files, no mental model of "what is the base + what patches apply in what order."

## Environment handling

### Kustomize — directory-per-environment

```text
overlays/
  dev/
    kustomization.yaml
  staging/
    kustomization.yaml
  prod/
    kustomization.yaml
```

Each environment is a directory with its own `kustomization.yaml` that references the base and adds patches. Shared changes must be replicated or extracted into components.

### CT — values-per-environment

```bash
ct template . --values values-dev.json --namespace dev
ct template . --values values-staging.json --namespace staging
ct template . --values values-prod.json --namespace prod
```

Same template, different values. No directory duplication.

## Conditional resources

### Kustomize — components

To conditionally include resources, Kustomize uses **components** (since v3.7):

```yaml
# components/hpa/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component
resources:
  - hpa.yaml
```

```yaml
# overlays/prod/kustomization.yaml
components:
  - ../../components/hpa
```

Components can only be included or excluded per overlay — no runtime conditionals.

### CT — just `if`

```ts
if (Values.hpa?.enabled) {
  hpa({
    name: "api",
    minReplicas: Values.hpa.min,
    maxReplicas: Values.hpa.max,
  });
}
```

## Labels and naming

### Kustomize — transformers

```yaml
# kustomization.yaml
commonLabels:
  app: myapp
  team: platform
namePrefix: myapp-
namespace: production
```

Labels are injected everywhere including selectors, which can cause issues with immutable fields. `namePrefix`/`nameSuffix` apply blindly to all resource names.

### CT — explicit control

```ts
const labels = {
  "app.kubernetes.io/name": "myapp",
  "app.kubernetes.io/managed-by": "ct",
};

deployment({
  name: "myapp-api",
  labels,
  // ...
});
```

You decide what gets labeled and how. No transformer surprises.

## Debugging

### Kustomize

When a patch doesn't apply correctly, it fails silently or produces unexpected output. You debug by running `kustomize build` and diffing the output with expectations. Strategic merge patches can be especially confusing with arrays.

### CT

TypeScript errors show at write time in the editor. Runtime errors include stack traces. You can `console.log` intermediate values. Output is deterministic — same values always produce same YAML.

## When Kustomize still makes sense

- You have **existing YAML manifests** and want minimal changes (just patches on top).
- Your team doesn't know TypeScript but is comfortable with YAML.
- You use **kubectl apply -k** in a simple CI pipeline and don't need more.
- You consume upstream YAML manifests (e.g. from a vendor) and just need to adjust namespace/labels.

CT can coexist — render CT manifests alongside Kustomize overlays in the same GitOps repo.

## Migration path

1. Keep existing Kustomize bases running.
2. Start new services with `ct init`.
3. Extract shared patterns into CT factory packages.
4. When a Kustomize overlay becomes too complex (3+ patch files, nested components), rewrite it as CT.
