---
title: ct template
description: Bundle and execute a .ct entrypoint, then render Kubernetes manifests as YAML or JSON.
---

Bundle and execute a `.ct` entrypoint, then print rendered manifests with release labels.

```bash
ct template my-release . --namespace production
```

## Usage

```text
ct template <name> <dir|repo> [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `name` | yes | Release name used for `Release.name` and injected labels. |
| `dir\|repo` | yes | Local project directory or GitHub source (for example `github.com/cloudticon/my-app@v1.0`). |

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Default namespace for resources |
| `--values` | `-f` | `string` | *(auto-detect)* | Path to values file (JSON or YAML) |
| `--output` | `-o` | `string` | `"yaml"` | Output format: `yaml` or `json` |
| `--set` | — | `stringArray` | — | Override values inline (e.g. `--set replicas=5`) |
| `--no-cache` | — | `bool` | `false` | Skip cache and re-download remote source before rendering |

## Values auto-detection

When `--values` is not specified, CT looks for values files in order:

1. `values.json`
2. `values.yaml`
3. `values.yml`

The first file found is used. Use `--values` to override this behavior.

## Remote sources

`ct template` accepts both local directories and GitHub sources:

- Local: `ct template my-release . --namespace prod`
- Remote: `ct template my-release github.com/cloudticon/my-app@v1.0 --namespace prod`

Remote sources are cached in `~/.ct/cache/`. Use `--no-cache` to force re-download.

## Examples

Render YAML from local directory:

```bash
ct template my-release . --namespace production
```

Render as JSON:

```bash
ct template my-release . --namespace production --output json
```

Override values inline:

```bash
ct template my-release . --namespace production --set replicas=5
```

Explicit values file (multi-environment):

```bash
ct template my-release . --namespace staging --values values-staging.json
```

Render from GitHub source:

```bash
ct template my-release github.com/cloudticon/my-app@v1.0 --namespace staging
```

Force re-download remote source:

```bash
ct template my-release github.com/cloudticon/my-app@main --namespace prod --no-cache
```

Pipe rendered output to kubectl:

```bash
ct template my-release . --namespace production | kubectl apply -f -
```

## How it works

```text
ct template <name> <dir|repo>
  │
  ├─ Resolve source (local path or GitHub source URL)
  ├─ Optionally invalidate source cache (--no-cache)
  ├─ Auto-detect or load values file
  ├─ Apply --set overrides on top of values
  ├─ Bundle main.ct (esbuild: TS → JS, resolve URL imports)
  ├─ Execute bundled JS in Goja runtime
  ├─ Collect emitted Kubernetes resources
  ├─ Inject release labels:
  │    app.kubernetes.io/managed-by=ct
  │    ct.cloudticon.com/instance=<name>
  ├─ Set namespace on resources (if --namespace provided)
  │
  └─ Print manifests to stdout (YAML or JSON)
```

## See also

- [`ct apply`](/ct/cmd-apply/) — render and apply in one step
- [`ct init`](/ct/cmd-init/) — scaffold a new project
