---
title: Cloudticon
description: TypeScript-first Kubernetes tooling. Build fast with CT CLI, CT VS Code, and K8s resource factories.
template: splash
hero:
  tagline: TypeScript-first Kubernetes tooling — from CLI to cluster.
  actions:
    - text: Get Started
      link: /home/install/
      icon: right-arrow
      variant: primary
    - text: CLI Reference
      link: /ct/cli-reference/
      variant: minimal
---

## Write TypeScript, not YAML

Readable, type-safe resource definitions with IDE autocomplete — no boilerplate, no templating hacks.

### What you write

```ts
import { deployment, service, ingress } from "github.com/cloudticon/k8s@master";

const app = "api";

const labels = {
  "app.kubernetes.io/name": app,
  "app.kubernetes.io/part-of": "acme-platform",
  "app.kubernetes.io/managed-by": "ct",
};

deployment({
  name: app,
  labels,
  image: "ghcr.io/acme/api:2.1.0",
  replicas: 3,
  resources: {
    requests: { cpu: "100m", memory: "128Mi" },
    limits:   { cpu: "500m", memory: "512Mi" },
  },
});

service({
  name: app,
  labels,
  selector: labels,
  ports: [
    { name: "http",    port: 80,   targetPort: 8080 },
    { name: "metrics", port: 9090, targetPort: 9090 },
  ],
});

ingress({
  name: app,
  labels,
  rules: [
    {
      host: "api.acme.com",
      http: {
        paths: [
          {
            path: "/",
            pathType: "Prefix",
            backend: { service: app, port: 80 },
          },
        ],
      },
    },
  ],
});
```

### What Kubernetes gets

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app.kubernetes.io/name: api
    app.kubernetes.io/part-of: acme-platform
    app.kubernetes.io/managed-by: ct
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: api
      app.kubernetes.io/part-of: acme-platform
      app.kubernetes.io/managed-by: ct
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api
        app.kubernetes.io/part-of: acme-platform
        app.kubernetes.io/managed-by: ct
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/api:2.1.0
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: api
  labels:
    app.kubernetes.io/name: api
    app.kubernetes.io/part-of: acme-platform
    app.kubernetes.io/managed-by: ct
spec:
  selector:
    app.kubernetes.io/name: api
    app.kubernetes.io/part-of: acme-platform
    app.kubernetes.io/managed-by: ct
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: metrics
      port: 9090
      targetPort: 9090
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  labels:
    app.kubernetes.io/name: api
    app.kubernetes.io/part-of: acme-platform
    app.kubernetes.io/managed-by: ct
spec:
  rules:
    - host: api.acme.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

Labels repeated 5 times, indentation 8 levels deep, 100+ lines — and that's just one microservice. Now imagine scaling that.

### Scale with factories

Wrap the pattern into a shared package — every team gets identical infra in **one call**:

```ts
import { createWebStack } from "github.com/acme/k8s-platform@v1/web-stack";

createWebStack({ name: "api",     image: "ghcr.io/acme/api:2.1.0",     replicas: 3 });
createWebStack({ name: "auth",    image: "ghcr.io/acme/auth:1.0.0"                 });
createWebStack({ name: "billing", image: "ghcr.io/acme/billing:3.2.1", replicas: 5 });
```

Three apps, three lines — each gets a Deployment + Service + Ingress with consistent labels, resource limits, and naming. No copy-paste drift, no forgotten fields.

---

## Full IntelliSense in VS Code

`.ct` files are TypeScript — so your editor already knows how to help. Install the **CT VS Code** extension and run `ct types .` to unlock:

- **Autocomplete for every field** — type `deployment({` and see `name`, `image`, `replicas`, `resources`, `labels` suggested instantly. No guessing field names, no checking docs mid-flow.
- **Typed Values** — `Values.replicas`, `Values.image` come straight from your `values.json` or `values.yaml`. Rename a key and the editor flags every broken reference.
- **URL import resolution** — types from `github.com/cloudticon/k8s@master` are fetched, cached, and visible to TypeScript. Jump-to-definition works across packages.
- **Errors before you run** — misspell a field, pass a number where a string is expected, forget a required property — red squiggles appear immediately, not after `ct template` fails.

```ts
deployment({
  name: "api",
  image: "ghcr.io/acme/api:2.1.0",
  replicas: "3",
//          ~~~ Type 'string' is not assignable to type 'number'
});
```

Generate types once, iterate with confidence:

```bash
ct types .
```

The extension watches `.ct` and values files — types refresh automatically on save. See [CT VS Code](/ct-vscode/overview/) for setup details.

---

## First run in 60 seconds

```bash
curl -fsSL https://cloudticon.com/install.sh | sudo sh
ct init my-app
cd my-app
ct template --values values.yaml
```

1. Install CT.
2. Initialize a project.
3. Render resources.
4. Iterate in VS Code with IntelliSense and `ct types`.

## Documentation map

- **[CT CLI](/ct/cli-reference/)** — full command and flag reference, workflows, troubleshooting.
- **[CT vs Helm](/ct/ct-vs-helm/)** — why TypeScript beats Go templates.
- **[CT Dev](/ct/ct-dev/)** — development mode for Kubernetes — port forwarding, file sync, logs.
- **[CT VS Code](/ct-vscode/overview/)** — extension setup, type generation, diagnostics.
- **[K8s Resource Factories](/k8s/base-primitive/)** — reusable `resource()` based APIs.
- **[CT Operator](/ct-operator/plan/)** — runtime and deployment model.
