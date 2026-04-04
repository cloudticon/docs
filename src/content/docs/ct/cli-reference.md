---
title: CLI Reference
description: Complete reference for CT commands, flags, workflows, and troubleshooting.
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

## Global flags

```text
--help, -h      Show help
--verbose       Enable verbose logs
--no-color      Disable ANSI colors in CLI output
```

## `ct init`

Initialize a new project with a default structure.

```bash
ct init
```

### Usage

```text
ct init [flags]
```

### Flags

```text
-d, --dir string   project directory (default ".")
```

### Output structure

```text
myproject/
  main.ct         # manifest definitions (TypeScript syntax)
  values.json     # configurable values
```

## `ct template`

Bundle and execute a `.ct` entrypoint, then print manifests.

```bash
ct template . --namespace production
```

### Usage

```text
ct template <dir> [flags]
```

### Flags

```text
-n, --namespace string   default namespace for resources
-f, --values string      path to values file (JSON or YAML, overrides auto-detect)
-o, --output string      output format: yaml or json (default "yaml")
    --set stringArray    override values (e.g. --set replicas=5)
```

`ct template` auto-detects values files in order: `values.json`, `values.yaml`, `values.yml`. Use `--values` to override.

### Typical examples

Render YAML:

```bash
ct template . --namespace production
```

Render JSON:

```bash
ct template . --namespace production --output json
```

Override values inline:

```bash
ct template . --namespace production --set replicas=5
```

Explicit values file (multi-env):

```bash
ct template . --namespace staging --values values-staging.json
```

## `ct apply`

Render and apply manifests in one step using Kubernetes server-side apply.

```bash
ct apply .
```

### Usage

```text
ct apply <dir> [flags]
```

### Flags

```text
-n, --namespace string   target namespace for resources
-f, --values string      path to values file (JSON or YAML, overrides auto-detect)
-o, --output string      output format: yaml or json (default: no output)
    --set stringArray    override values (e.g. --set replicas=5)
    --context string     kubeconfig context to use
```

### Typical examples

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

## `ct dev`

Run live development workflows directly on cluster workloads from `dev.ct` (DevSpace-inspired flow).

`ct dev` executes `dev.ct`, applies rendered resources, then starts development features such as port forwarding, logs, and sync according to your dev targets.

```bash
ct dev
```

### Usage

```text
ct dev [flags]
```

### Flags

```text
--env-file string    path to .env file (empty to skip) (default ".env")
--context string     kubeconfig context
```

### Typical examples

Use a custom env file:

```bash
ct dev --env-file .env.dev
```

Skip env file loading:

```bash
ct dev --env-file ""
```

Use a specific kubeconfig context:

```bash
ct dev --context staging
```

## `ct types`

Generate TypeScript definitions for editor IntelliSense.

```bash
ct types .
```

### Usage

```text
ct types [dir] [flags]
```

### Flags

```text
--output string    output directory (default: ~/.ct/types/<project-hash>)
--operator         include operator globals (getStatus, setStatus, fetch, log, Env)
--dev              generate dev.d.ts for dev.ct IDE support
```

### Generated files

| File           | Contents                                               |
| -------------- | ------------------------------------------------------ |
| `values.d.ts`  | `CtValues` interface inferred from `values.json`/YAML  |
| `globals.d.ts` | `declare const Values: CtValues` + operator globals    |

The command also resolves and caches URL imports so IDE resolution works offline.

Output directory defaults to `~/.ct/types/<project-hash>`. The path is printed to stdout so tools (e.g. VS Code extension) can consume it.

### Operator mode

```bash
ct types . --operator
```

Adds declarations for:

- `getStatus`
- `setStatus`
- `fetch`
- `log`
- `Env`

### Dev mode

```bash
ct types . --dev
```

Generates `dev.d.ts` for `dev.ct` IDE support.

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
