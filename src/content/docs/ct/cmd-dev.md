---
title: ct dev
description: Run live development workflows directly on cluster workloads — port forwarding, file sync, logs, and terminal.
---

Run live development workflows directly on cluster workloads from `dev.ct` (DevSpace-inspired flow).

`ct dev` executes `dev.ct`, applies rendered resources, then starts development features such as port forwarding, logs, file sync, and terminal according to your dev targets.

```bash
ct dev
```

## Usage

```text
ct dev [flags]
```

## Flags

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--env-file` | `string` | `".env"` | Path to `.env` file (empty string to skip) |
| `--context` | `string` | *(current)* | Kubeconfig context to use |
| `--name` | `string` | `"dev"` | Release name used for labels and inventory |
| `--delete` | `bool` | `false` | Delete resources from the last dev inventory and exit |

## Examples

Start dev mode (looks for `dev.ct` in current directory):

```bash
ct dev
```

Use a custom env file:

```bash
ct dev --env-file .env.dev
```

Skip env file loading entirely:

```bash
ct dev --env-file ""
```

Use a specific kubeconfig context:

```bash
ct dev --context staging
```

Start named dev session (multiple sessions in one namespace):

```bash
ct dev --name dev-alice
```

Cleanup previously deployed dev resources:

```bash
ct dev --delete --name dev-alice --context staging
```

## How it works

```text
ct dev
  │
  ├─ Load .env + system environment
  ├─ Bundle + execute dev.ct → extract config + dev targets
  ├─ Deep merge config.values with values.json
  ├─ Render main.ct with merged values
  ├─ Inject release labels (managed-by + instance)
  ├─ Resolve dev target selectors from rendered resources
  ├─ Patch workloads (remove probes, override command/env/replicas)
  ├─ Apply manifests to cluster (Server-Side Apply)
  ├─ Save release inventory
  │
  └─ Start in parallel:
       ├─ Port forwarding (per target, with reconnect)
       ├─ File sync — local → container (tar + exec, fsnotify)
       ├─ Log streaming (colored per target)
       └─ Terminal auto-attach (first target with .terminal)
```

### Cleanup dev environment

When `--delete` is used, `ct dev` runs cleanup flow only:

```text
ct dev --delete
  │
  ├─ Execute dev.ct to resolve namespace
  ├─ Load inventory for release (--name, default: dev)
  ├─ Delete resources from inventory
  └─ Delete inventory ConfigMap
```

## Dev API reference

The `dev.ct` file uses four global functions to configure development mode. See the full API documentation:

- [`dev()`](/ct-dev/dev-function/) — declare dev targets
- [`config()`](/ct-dev/config-function/) — set namespace and overlay values
- [`env()` & `prompt()`](/ct-dev/helpers/) — environment variables and interactive prompts
- [CT Dev Overview](/ct-dev/overview/) — full dev mode documentation

## See also

- [`ct apply`](/ct/cmd-apply/) — apply without dev features
- [`ct template`](/ct/cmd-template/) — render manifests only
