---
title: ct delete
description: Delete a release from Kubernetes using inventory saved by ct apply.
---

Delete all resources that belong to a release, based on inventory created during `ct apply`.

```bash
ct delete my-release --namespace production
```

## Usage

```text
ct delete <name> [flags]
```

| Argument | Required | Description |
| --- | --- | --- |
| `name` | yes | Release name to delete. |

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Namespace where release inventory is stored |
| `--context` | — | `string` | *(current)* | Kubeconfig context to use |

## Examples

Delete a release from production namespace:

```bash
ct delete my-release --namespace production
```

Delete using a specific kube context:

```bash
ct delete my-release --namespace staging --context staging
```

## How it works

```text
ct delete <name>
  │
  ├─ Create Kubernetes client (uses --context if provided)
  ├─ Load release inventory ConfigMap: ct-inventory-<name>
  ├─ Delete all resources from inventory
  │    └─ NotFound resources are skipped
  └─ Delete inventory ConfigMap
```

`ct delete` does not require source directory or repository URL. It removes resources by reading the last saved inventory for the release.

## See also

- [`ct apply`](/ct/cmd-apply/) — apply and update release inventory
- [`ct template`](/ct/cmd-template/) — render manifests without cluster changes
