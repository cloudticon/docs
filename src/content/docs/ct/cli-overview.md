---
title: CLI Overview
description: Install CT, global flags, end-to-end scenarios, troubleshooting, and best practices.
---

## Install

One-line install (Linux/macOS):

```bash
curl -fsSL https://raw.githubusercontent.com/cloudticon/ct/master/install.sh | sudo sh
```

Via `go install`:

```bash
go install github.com/cloudticon/ct/cmd/ct@latest
```

Or build from source:

```bash
git clone https://github.com/cloudticon/ct.git
cd ct
go build -o ct ./cmd/ct
```

## Command index

```text
ct [global flags] <command> [args]

Commands:
  init        Create a new CT project scaffold
  template    Render manifests from .ct entrypoint + values
  apply       Render and apply manifests to a Kubernetes cluster
  dev         Run live development workflows on cluster workloads
  types       Generate IDE types (.d.ts) for Values and runtime globals
  version     Print CLI version information
  help        Show help for any command
```

| Command | Description | Page |
| --- | --- | --- |
| [`ct init`](/ct/cmd-init/) | Create a new CT project scaffold | [→](/ct/cmd-init/) |
| [`ct template`](/ct/cmd-template/) | Render manifests from `.ct` entrypoint + values | [→](/ct/cmd-template/) |
| [`ct apply`](/ct/cmd-apply/) | Render and apply manifests to a Kubernetes cluster | [→](/ct/cmd-apply/) |
| [`ct dev`](/ct/cmd-dev/) | Run live development workflows on cluster workloads | [→](/ct/cmd-dev/) |
| [`ct types`](/ct/cmd-types/) | Generate IDE types (`.d.ts`) for Values and runtime globals | [→](/ct/cmd-types/) |

## Global flags

```text
--help, -h      Show help
--verbose       Enable verbose logs
--no-color      Disable ANSI colors in CLI output
```

## `ct version`

Print installed version details.

```bash
ct version
```

## `ct help`

Get command docs quickly:

```bash
ct help
ct help template
ct template --help
```

## End-to-end scenarios

### Scenario A: Bootstrap and render

```bash
ct init
ct template . --namespace production
```

### Scenario B: Multi-environment rendering

```bash
ct template . --values values-dev.yaml --namespace dev
ct template . --values values-staging.yaml --namespace staging
ct template . --values values-prod.yaml --namespace prod
```

### Scenario C: GitOps (ArgoCD style)

```bash
ct template . --values values-prod.yaml --namespace prod > apps/my-app/manifests.yaml
git add apps/my-app/manifests.yaml
git commit -m "update prod manifests"
```

### Scenario D: Apply directly to cluster

```bash
ct apply . --namespace development --context dev
ct apply . --namespace production --context prod --values values-prod.yaml
```

### Scenario E: IDE-first workflow

```bash
ct types .
ct types . --dev
ct template . --namespace production
```

Regenerate types whenever `.ct` files or values change.

### Scenario F: Dev loop

```bash
ct dev --context staging --env-file .env.staging
```

## Troubleshooting

### `ct: command not found`

- Re-run installer.
- Confirm PATH includes CT install location.
- Restart shell session.

### URL imports fail during template/types

- Check repository URL and branch/tag in import string.
- Verify network and git access.
- Clear CT cache (`~/.ct/cache/`) if stale packages are present.

### Values file is not applied

- Ensure valid YAML/JSON syntax.
- Check key names used by templates.
- Use `--set` to test overrides quickly.
- Remember auto-detect order: `values.json` → `values.yaml` → `values.yml`.

### Async/await errors

CT runtime is synchronous (Goja engine). An esbuild plugin rejects `async`/`await` at bundle time. Replace async flows with synchronous alternatives.

### Inconsistent manifests across environments

- Keep one baseline values file plus thin env overlays.
- Version-control all rendered outputs used by GitOps.
- Avoid hidden defaults; prefer explicit values.

## Best practices

- Keep `main.ct` small and split by domain modules.
- Use factory helpers in shared packages for consistency.
- Pin URL imports to tags for reproducibility.
- Run `ct types` in CI for editor parity in teams.
- Use `ct apply` for quick iteration, `ct template` + `kubectl apply` for controlled pipelines.
