---
title: ct template
description: Bundle and execute a .ct entrypoint, then render Kubernetes manifests as YAML or JSON.
---

Bundle and execute a `.ct` entrypoint, then print rendered manifests.

```bash
ct template . --namespace production
```

## Usage

```text
ct template <dir> [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `dir` | yes | Project directory containing `main.ct` and values file. |

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Default namespace for resources |
| `--values` | `-f` | `string` | *(auto-detect)* | Path to values file (JSON or YAML) |
| `--output` | `-o` | `string` | `"yaml"` | Output format: `yaml` or `json` |
| `--set` | — | `stringArray` | — | Override values inline (e.g. `--set replicas=5`) |

## Values auto-detection

When `--values` is not specified, CT looks for values files in order:

1. `values.json`
2. `values.yaml`
3. `values.yml`

The first file found is used. Use `--values` to override this behavior.

## Examples

Render YAML with a namespace:

```bash
ct template . --namespace production
```

Render as JSON:

```bash
ct template . --namespace production --output json
```

Override values inline:

```bash
ct template . --namespace production --set replicas=5
```

Explicit values file (multi-environment):

```bash
ct template . --namespace staging --values values-staging.json
```

Pipe to kubectl:

```bash
ct template . --namespace production | kubectl apply -f -
```

Save for GitOps:

```bash
ct template . --namespace prod --values values-prod.yaml > manifests.yaml
```

## How it works

```text
ct template <dir>
  │
  ├─ Auto-detect or load values file
  ├─ Apply --set overrides on top of values
  ├─ Bundle main.ct (esbuild: TS → JS, resolve URL imports)
  ├─ Execute bundled JS in Goja runtime
  ├─ Collect emitted Kubernetes resources
  ├─ Set namespace on resources (if --namespace provided)
  │
  └─ Print manifests to stdout (YAML or JSON)
```

## See also

- [`ct apply`](/ct/cmd-apply/) — render and apply in one step
- [`ct init`](/ct/cmd-init/) — scaffold a new project
