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

## How it works

```text
ct dev
  │
  ├─ Load .env + system environment
  ├─ Bundle + execute dev.ct → extract config + dev targets
  ├─ Deep merge config.values with values.json
  ├─ Render main.ct with merged values
  ├─ Resolve dev target selectors from rendered resources
  ├─ Patch workloads (remove probes, override command/env/replicas)
  ├─ Apply manifests to cluster (Server-Side Apply)
  │
  └─ Start in parallel:
       ├─ Port forwarding (per target, with reconnect)
       ├─ File sync — local → container (tar + exec, fsnotify)
       ├─ Log streaming (colored per target)
       └─ Terminal auto-attach (first target with .terminal)
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
