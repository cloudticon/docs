---
title: ct list
description: List ct-managed releases from inventory ConfigMaps in Kubernetes.
---

List releases managed by `ct apply` from Kubernetes inventory ConfigMaps.

```bash
ct list --namespace production
```

## Usage

```text
ct list [flags]
```

`ct list` does not use positional arguments.

## Flags

| Flag | Short | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `--namespace` | `-n` | `string` | — | Namespace to search for release inventory |
| `--all-namespaces` | `-A` | `bool` | `false` | List releases from all namespaces |
| `--context` | — | `string` | *(current)* | Kubeconfig context to use |
| `--output` | `-o` | `string` | `table` | Output format: `table`, `json`, or `yaml` |

## Examples

List releases in a namespace:

```bash
ct list --namespace production
```

List releases across all namespaces:

```bash
ct list --all-namespaces
```

Print output as JSON:

```bash
ct list --all-namespaces --output json
```

Use a specific kube context and YAML output:

```bash
ct list -n staging --context staging --output yaml
```

## How it works

```text
ct list
  │
  ├─ Create Kubernetes client (uses --context if provided)
  ├─ Search inventory ConfigMaps managed by ct
  │    └─ Label selector: app.kubernetes.io/managed-by=ct
  ├─ Read release metadata from labels
  ├─ Count tracked resources from inventory data
  └─ Print results as table, JSON, or YAML
```

By default, output is shown as a table with `NAME`, `NAMESPACE`, and `RESOURCES`.

## See also

- [`ct apply`](/ct/cmd-apply/) — apply manifests and update release inventory
- [`ct delete`](/ct/cmd-delete/) — delete releases using stored inventory
