---
title: CT vs Terraform
description: CT generates Kubernetes YAML from TypeScript. Terraform provisions cloud infrastructure with HCL. Different tools for different layers.
---

## At a glance

| Feature | CT | Terraform |
| --- | --- | --- |
| Scope | Kubernetes manifests only | Any cloud resource (AWS, GCP, Azure, K8s, …) |
| Language | TypeScript | HCL (HashiCorp Configuration Language) |
| Output | Static YAML / JSON | API calls via providers (real provisioning) |
| State | Stateless — no state file | Stateful — `terraform.tfstate` required |
| Apply model | `ct template` → YAML → kubectl / ArgoCD | `terraform apply` — provisions directly |
| IDE support | Full IntelliSense via generated `.d.ts` | HCL extension (limited vs TypeScript) |
| Drift detection | GitOps tool responsibility | Built-in (`terraform plan`) |
| Learning curve | Know TypeScript + K8s YAML? You're done. | HCL syntax + provider schemas + state mechanics |
| Modules / reuse | ES module imports from Git URLs | Terraform modules from registry / Git |

## Different layers

Like Pulumi, Terraform operates at a **different layer** than CT:

```text
┌─────────────────────────────────┐
│  Cloud Infrastructure           │  ← Terraform
│  (VPCs, databases, DNS, IAM)    │
├─────────────────────────────────┤
│  Kubernetes Manifests           │  ← CT
│  (Deployments, Services, CRDs)  │
├─────────────────────────────────┤
│  GitOps / Apply                 │  ← ArgoCD, Flux, kubectl
└─────────────────────────────────┘
```

Terraform can manage Kubernetes resources via the `kubernetes` and `helm` providers, but it's designed for infrastructure, not for templating application manifests at scale.

## Kubernetes resources: CT vs Terraform

### Terraform — HCL resource blocks

```hcl
resource "kubernetes_deployment" "api" {
  metadata {
    name      = "api"
    namespace = "production"
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "api"
      }
    }

    template {
      metadata {
        labels = {
          app = "api"
        }
      }

      spec {
        container {
          name  = "api"
          image = "myapp:1.0"

          port {
            container_port = 8080
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "api" {
  metadata {
    name      = "api"
    namespace = "production"
  }

  spec {
    selector = {
      app = "api"
    }

    port {
      port        = 80
      target_port = 8080
    }
  }
}
```

Verbose. Each Kubernetes field maps to an HCL block/attribute. The provider translates HCL to Kubernetes API calls and tracks state.

### CT — TypeScript factories

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

deployment({
  name: "api",
  replicas: Values.replicas,
  image: Values.image,
  port: 8080,
});

service({
  name: "api",
  port: 80,
  targetPort: 8080,
});
```

Concise. Factory helpers abstract away boilerplate. Output is YAML.

## State: the fundamental difference

### Terraform

Terraform requires a **state file** (`terraform.tfstate`) that maps every managed resource to its real-world counterpart. This means:

- You need a **state backend** (S3, Terraform Cloud, local file, Consul, …).
- Concurrent runs need **state locking** to prevent corruption.
- Losing state means losing track of what Terraform manages — manual imports required.
- `terraform plan` shows a diff against state, not against the cluster directly.
- Sensitive values can end up in state.

### CT

CT is **stateless**. It generates YAML. The only "state" is your Git repo and whatever your GitOps tool tracks. Nothing to lock, nothing to corrupt, nothing to back up.

## Logic and conditionals

### Terraform — HCL constructs

```hcl
resource "kubernetes_deployment" "api" {
  count = var.enable_api ? 1 : 0

  metadata {
    name = "api"
  }

  spec {
    replicas = var.replicas
  }
}

resource "kubernetes_horizontal_pod_autoscaler" "api" {
  count = var.enable_hpa ? 1 : 0

  metadata {
    name = "api"
  }

  spec {
    min_replicas = var.replicas
    max_replicas = var.max_replicas

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.api[0].metadata[0].name
    }
  }
}
```

`count` and `for_each` are the primary conditional mechanisms. Referencing conditional resources requires index syntax (`[0]`). Dynamic blocks add more complexity.

### CT — real TypeScript

```ts
deployment({
  name: "api",
  replicas: Values.replicas,
  image: Values.image,
  port: 8080,
});

if (Values.hpa?.enabled) {
  hpa({
    name: "api",
    minReplicas: Values.replicas,
    maxReplicas: Values.hpa.max,
  });
}
```

Real `if`, real variables, real functions. No `count`, no index references.

## Modules vs imports

### Terraform modules

```hcl
module "api" {
  source = "git::https://github.com/my-org/tf-modules.git//k8s-app?ref=v1.0"

  name     = "api"
  image    = var.api_image
  replicas = var.replicas
}
```

Modules are directories with `variables.tf`, `outputs.tf`, and resource definitions. Version pinning via `?ref=`. Registry publishing for sharing.

### CT imports

```ts
import { createApp } from "github.com/my-org/k8s-helpers@v1.0/app";

createApp({
  name: "api",
  image: Values.image,
  replicas: Values.replicas,
});
```

Standard ES imports. Pin to a tag. No special module structure, no variable/output declarations.

## When Terraform makes more sense

- You need to provision **cloud infrastructure** (VPCs, RDS, Route53, IAM) — CT doesn't do this.
- Your org standardizes on Terraform and the `kubernetes` provider is good enough for your K8s needs.
- You need `terraform plan` for **change preview** including infrastructure dependencies.
- You manage resources across **multiple providers** in a single configuration.

## When CT makes more sense

- You only need **Kubernetes manifests** and already have a GitOps pipeline.
- You want **stateless** generation — no `tfstate`, no backend, no locking headaches.
- You want real **TypeScript** instead of HCL for logic, loops, and composition.
- You want **concise** manifests — CT factories vs verbose HCL resource blocks.
- You want generated YAML you can review in a PR before it reaches the cluster.

## Using them together

CT and Terraform are natural complements:

```text
Terraform → provisions infrastructure (VPC, EKS, RDS, DNS)
CT        → generates Kubernetes manifests for apps
ArgoCD    → syncs CT-generated manifests to the EKS cluster
```

Terraform manages the platform, CT manages the workloads running on it. No overlap, no conflict.
