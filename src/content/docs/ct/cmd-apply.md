---
title: ct apply
description: Render manifests and apply them to a Kubernetes cluster using server-side apply.
---

Render and apply manifests in one step using Kubernetes server-side apply.

```bash
ct apply my-release .
```

## Usage

```text
ct apply <name> <dir|repo> [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `name` | yes | Release name used for labels and inventory tracking. |
| `dir\|repo` | yes | Local project directory or GitHub source (for example `github.com/cloudticon/my-app@v1.0`). |

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Target namespace for resources |
| `--values` | `-f` | `string` | *(auto-detect)* | Path to values file (JSON or YAML) |
| `--output` | `-o` | `string` | *(none)* | Output format: `yaml` or `json` (print applied manifests) |
| `--set` | — | `stringArray` | — | Override values inline (e.g. `--set replicas=5`) |
| `--context` | — | `string` | *(current)* | Kubeconfig context to use |
| `--no-cache` | — | `bool` | `false` | Skip cache and re-download remote source before applying |

## How it works

`ct apply` is equivalent to `ct template` + `kubectl apply --server-side`, plus inventory and orphan pruning in a single step:

```text
ct apply <name> <dir|repo>
  │
  ├─ Resolve source (local path or GitHub source URL)
  ├─ Load and merge values (same as ct template)
  ├─ Bundle and execute main.ct
  ├─ Collect rendered resources
  ├─ Inject release labels (managed-by + instance)
  ├─ Load previous inventory for <name>
  ├─ Compute orphaned resources (old - new)
  │
  ├─ Server-Side Apply rendered resources
  ├─ Delete orphaned resources
  └─ Save updated inventory ConfigMap
```

Server-side apply means Kubernetes handles field ownership and merge conflicts. This is safer than client-side apply for multi-tool environments. Inventory-based pruning keeps the release in sync when resources are removed from templates.

## Release inventory and pruning

For each release, `ct apply` stores resource references in an inventory ConfigMap (`ct-inventory-<name>`). On the next apply:

1. Previous inventory is loaded.
2. New manifest set is rendered.
3. Resources present in old inventory but missing in new manifests are deleted.
4. Inventory is updated to the new state.

This gives Helm-like release lifecycle without requiring chart state files in your repo.

## Examples

Apply local project with explicit namespace and context:

```bash
ct apply my-release . --namespace development --context staging
```

Override values while applying:

```bash
ct apply my-release . --values values-staging.yaml --set replicas=2
```

Apply from GitHub source:

```bash
ct apply my-release github.com/cloudticon/my-app@v1.0 --namespace staging
```

Re-download remote source before apply:

```bash
ct apply my-release github.com/cloudticon/my-app@main --namespace prod --no-cache
```

Print applied output:

```bash
ct apply my-release . --output yaml
```

## See also

- [`ct template`](/ct/cmd-template/) — render without applying
- [`ct dev`](/ct/cmd-dev/) — development mode with live features
