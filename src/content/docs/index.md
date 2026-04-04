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

## Write less, deploy more

CT resources are concise TypeScript — a few lines replace hundreds of YAML.
Full type safety, IDE autocomplete, and zero boilerplate.

### CT — 12 lines

```ts
import { deployment, service, ingress } from "github.com/cloudticon/k8s@master";

const labels = { "app.kubernetes.io/name": "api" };

deployment({ name: "api", labels, image: "ghcr.io/acme/api:2.1.0", replicas: 3,
  resources: { requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "500m", memory: "512Mi" } },
});

service({ name: "api-svc", labels, selector: labels, ports: [{ port: 80, targetPort: 8080 }] });

ingress({ name: "api-ing", rules: [{ host: "api.acme.com", paths: [{ path: "/", service: "api-svc", port: 80 }] }] });
```

### Generated YAML — 80+ lines

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app.kubernetes.io/name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api
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
  name: api-svc
  labels:
    app.kubernetes.io/name: api
spec:
  selector:
    app.kubernetes.io/name: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ing
spec:
  rules:
    - host: api.acme.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
```

Now wrap that into a reusable factory — and every service in your org gets the same pattern in **one function call**:

```ts
import { createWebStack } from "github.com/my-org/k8s-platform@v1/web-stack";

createWebStack({ name: "api", image: "ghcr.io/acme/api:2.1.0", replicas: 3 });
createWebStack({ name: "auth", image: "ghcr.io/acme/auth:1.0.0" });
createWebStack({ name: "billing", image: "ghcr.io/acme/billing:3.2.1", replicas: 5 });
```

Three apps — three lines. Each gets a Deployment + Service + Ingress with consistent labels, resource limits, and naming.

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
