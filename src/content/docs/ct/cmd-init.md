---
title: ct init
description: Create a new CT project scaffold with main.ct and values.json.
---

Initialize a new project with a default structure.

```bash
ct init
```

## Usage

```text
ct init [flags]
```

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--dir` | `-d` | `string` | `"."` | Project directory |

## Output structure

```text
myproject/
  main.ct         # manifest definitions (TypeScript syntax)
  values.json     # configurable values
```

`main.ct` is the entrypoint for your Kubernetes manifests, written in TypeScript-like syntax executed by the CT runtime.

`values.json` holds configurable values that can be overridden per environment via `ct template --values` or `ct apply --set`.

## Examples

Initialize in the current directory:

```bash
ct init
```

Initialize in a specific directory:

```bash
ct init --dir ./my-app
```

## What's next

After initializing, you typically:

1. Edit `main.ct` to define your Kubernetes resources.
2. Adjust `values.json` for your environment.
3. Render manifests with [`ct template`](/ct/cmd-template/).
4. Generate IDE types with [`ct types`](/ct/cmd-types/).
