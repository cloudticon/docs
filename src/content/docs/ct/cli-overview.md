---
title: CLI Overview
description: Install CT, global flags, end-to-end scenarios, troubleshooting, and best practices.
---

## Install

One-line install (Linux/macOS):

```bash
curl -fsSL https://cloudticon.com/install.sh | sudo sh
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
  template    Render manifests from .ct entrypoint + release name
  apply       Render and apply manifests for a release
  delete      Delete a release from cluster using inventory
  dev         Run live development workflows on cluster workloads
  types       Generate IDE types (.d.ts) for Values and runtime globals
  version     Print CLI version information
  help        Show help for any command
```

| Command | Description | Page |
| --- | --- | --- |
| [`ct init`](/ct/cmd-init/) | Create a new CT project scaffold | [→](/ct/cmd-init/) |
| [`ct template`](/ct/cmd-template/) | Render manifests from `.ct` entrypoint + release name | [→](/ct/cmd-template/) |
| [`ct apply`](/ct/cmd-apply/) | Render and apply manifests to a Kubernetes cluster | [→](/ct/cmd-apply/) |
| [`ct delete`](/ct/cmd-delete/) | Delete release resources tracked by inventory | [→](/ct/cmd-delete/) |
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
ct template my-app . --namespace production
```

### Scenario B: Multi-environment rendering

```bash
ct template my-app . --values values-dev.yaml --namespace dev
ct template my-app . --values values-staging.yaml --namespace staging
ct template my-app . --values values-prod.yaml --namespace prod
```

### Scenario C: GitOps (ArgoCD style)

```bash
ct template my-app . --values values-prod.yaml --namespace prod > apps/my-app/manifests.yaml
git add apps/my-app/manifests.yaml
git commit -m "update prod manifests"
```

### Scenario D: Apply directly to cluster

```bash
ct apply my-app . --namespace development --context dev
ct apply my-app . --namespace production --context prod --values values-prod.yaml
```

### Scenario E: Deploy from GitHub source

```bash
ct template my-app github.com/cloudticon/my-app@v1.0 --namespace staging
ct apply my-app github.com/cloudticon/my-app@v1.0 --namespace staging
ct apply my-app github.com/cloudticon/my-app@main --namespace staging --no-cache
```

### Scenario F: Deploy and teardown

```bash
ct apply my-app . --namespace production --context prod
ct delete my-app --namespace production --context prod
```

### Scenario G: IDE-first workflow

```bash
ct types .
ct types . --dev
ct template my-app . --namespace production
```

Regenerate types whenever `.ct` files or values change.

### Scenario H: Dev loop with cleanup

```bash
ct dev --context staging --env-file .env.staging --name dev-alice
ct dev --delete --context staging --name dev-alice
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
- Use `--no-cache` on `ct template`/`ct apply` to force re-download.

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
- Use stable release names so inventory and pruning stay predictable.

## Best practices

- Keep `main.ct` small and split by domain modules.
- Use factory helpers in shared packages for consistency.
- Pin URL imports to tags for reproducibility.
- Run `ct types` in CI for editor parity in teams.
- Use `ct apply` for quick iteration, `ct template` + `kubectl apply` for controlled pipelines.
