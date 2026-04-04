---
title: ct apply
description: Render manifests and apply them to a Kubernetes cluster using server-side apply.
---

Render and apply manifests in one step using Kubernetes server-side apply.

```bash
ct apply .
```

## Usage

```text
ct apply <dir> [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `dir` | yes | Project directory containing `main.ct` and values file. |

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Target namespace for resources |
| `--values` | `-f` | `string` | *(auto-detect)* | Path to values file (JSON or YAML) |
| `--output` | `-o` | `string` | *(none)* | Output format: `yaml` or `json` (print applied manifests) |
| `--set` | — | `stringArray` | — | Override values inline (e.g. `--set replicas=5`) |
| `--context` | — | `string` | *(current)* | Kubeconfig context to use |

## How it works

`ct apply` is equivalent to `ct template` + `kubectl apply --server-side`, but in a single step:

```text
ct apply <dir>
  │
  ├─ Load and merge values (same as ct template)
  ├─ Bundle and execute main.ct
  ├─ Collect rendered resources
  ├─ Set namespace
  │
  └─ Server-Side Apply to Kubernetes cluster
       └─ Uses --context if provided, otherwise current kubeconfig context
```

Server-side apply means Kubernetes handles field ownership and merge conflicts. This is safer than client-side apply for multi-tool environments.

## Examples

Apply with explicit namespace and context:

```bash
ct apply . --namespace development --context staging
```

Override values while applying:

```bash
ct apply . --values values-staging.yaml --set replicas=2
```

Print applied output:

```bash
ct apply . --output yaml
```

Apply to production with specific values:

```bash
ct apply . --namespace production --context prod --values values-prod.yaml
```

## See also

- [`ct template`](/ct/cmd-template/) — render without applying
- [`ct dev`](/ct/cmd-dev/) — development mode with live features
