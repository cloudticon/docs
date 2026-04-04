---
title: K8s TypeScript Ecosystem
description: Easy for developers, powerful for DevOps — a TypeScript-first Kubernetes platform by Cloudticon.
---

Cloudticon builds a Kubernetes ecosystem that is **easy for developers** and **powerful in the hands of DevOps**.

TypeScript, reusable `resource()` factories, and deterministic `ct` workflows replace fragile YAML and tribal knowledge with a toolchain that feels natural on both sides of the delivery pipeline.

## Philosophy

- **Developer experience first** — write Kubernetes resources in TypeScript with full autocomplete, type safety, and instant local feedback. No YAML guessing, no hidden gotchas.
- **DevOps superpowers** — deterministic rendering, contract-first APIs, and GitOps-ready output give platform engineers confidence, auditability, and control at scale.
- **One language, one ecosystem** — a single TypeScript codebase powers definitions, validation, operator logic, and CI checks, so developers and DevOps speak the same language.

## Core principles

- Contract-first APIs (`spec` and `status` schemas).
- Shared factory helpers instead of copy-paste snippets.
- Deterministic rendering for GitOps.
- Fast local feedback via `ct template` and `ct types`.

## Repository contracts

| Repository | Role |
|---|---|
| `cloudticon/ct` | Runtime, bundling, values merge, type generation. |
| `cloudticon/k8s` | Primitives: `resource()`, `z`, operator helpers. |
| `cloudticon/ct-vscode` | IDE flow aligned with `ct types`. |
| `cloudticon/ct-operator` | Runtime reconciliation for `operator.ct`. |

## Roadmap

- **Near-term** — ship operator phase 4-5 and harden CI.
- **Mid-term** — improve diagnostics and schema evolution checks.
- **Long-term** — add policy packs and runtime observability.
