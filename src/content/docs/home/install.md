---
title: Install
description: Install, update, and verify CT — all supported methods, platforms, and troubleshooting.
---

## Install methods

### Official installer (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/cloudticon/ct/master/install.sh | sudo sh
```

The script detects your OS and architecture, downloads the matching binary, and places it in `/usr/local/bin/ct`.

### Via `go install`

If you already have a Go toolchain (1.22+):

```bash
go install github.com/cloudticon/ct/cmd/ct@latest
```

The binary lands in `$GOPATH/bin` (usually `~/go/bin`). Make sure it is in your `PATH`.

### Build from source

```bash
git clone https://github.com/cloudticon/ct.git
cd ct
go build -o ct ./cmd/ct
sudo mv ct /usr/local/bin/
```

## Update

Re-run the same install command you used originally — the installer overwrites the existing binary:

```bash
curl -fsSL https://raw.githubusercontent.com/cloudticon/ct/master/install.sh | sudo sh
```

For `go install`, simply run the command again — Go fetches the latest tag:

```bash
go install github.com/cloudticon/ct/cmd/ct@latest
```

## Uninstall

Remove the binary and the local cache:

```bash
sudo rm "$(which ct)"
rm -rf ~/.ct
```

## From zero to dev in 60 seconds

### 1. Scaffold a project

```bash
ct init my-app
cd my-app
```

This creates a minimal project:

```text
my-app/
  main.ct         # resource definitions (TypeScript syntax)
  values.json     # configurable values
```

### 2. Define your workload

Edit `main.ct` — a few lines of TypeScript replace hundreds of YAML:

```ts
import { deployment, service } from "github.com/cloudticon/k8s@master";

const labels = { "app.kubernetes.io/name": "api" };

deployment({
  name: "api",
  labels,
  image: "ghcr.io/acme/api:latest",
  replicas: 1,
});

service({
  name: "api",
  labels,
  selector: labels,
  ports: [{ port: 80, targetPort: 3000 }],
});
```

### 3. Preview rendered manifests

```bash
ct template . --namespace default
```

CT bundles `main.ct`, evaluates it against `values.json`, and prints Kubernetes YAML to stdout. Review the output before touching the cluster.

### 4. Start developing on-cluster

Create a `dev.ct` file to configure your dev loop:

```ts
config({
  namespace: "my-app-dev",
});

dev("api", {
  command: ["npm", "run", "dev"],
  sync: [{ from: "./src", to: "/app/src" }],
  ports: [[3000, 3000]],
  terminal: "bash",
});
```

Then run:

```bash
ct dev
```

CT applies your resources, patches the workload for development (removes probes, overrides command), and starts:

- **File sync** — local changes stream into the container instantly.
- **Port forwarding** — `localhost:3000` hits your running app.
- **Log streaming** — colored output from all dev targets.
- **Terminal** — drops you into the container shell.

Edit code locally, see it live on the cluster — no image rebuilds, no redeploys. See [CT Dev](/ct/ct-dev/) for the full config reference.

### 5. Apply to a cluster (optional)

When ready for a clean deploy without dev mode:

```bash
ct apply . --namespace default
```

Uses server-side apply — no `kubectl` pipe needed.

## Shell completion

CT does not ship built-in completions yet. You can create a simple alias helper in your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
alias ctt='ct template . --namespace'
alias cta='ct apply . --namespace'
```

## Troubleshooting

### `ct: command not found`

1. Restart your shell session or run `source ~/.bashrc` / `source ~/.zshrc`.
2. Check whether the binary exists:

```bash
ls -l /usr/local/bin/ct
```

3. If you used `go install`, make sure `$GOPATH/bin` is in `PATH`:

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

### Permission denied during install

Run the installer with `sudo`:

```bash
curl -fsSL https://raw.githubusercontent.com/cloudticon/ct/master/install.sh | sudo sh
```

If your system policy blocks `sudo`, install via `go install` or build from source into a directory you own.

### Installer hangs or times out

- Verify network access: `curl -I https://raw.githubusercontent.com`.
- Check corporate proxy / VPN settings.
- Try downloading the binary manually from the [GitHub releases](https://github.com/cloudticon/ct/releases) page.

### URL imports fail after install

CT resolves `github.com/…` imports at bundle time. If they fail:

1. Check git and HTTPS access to the repository.
2. Clear the import cache:

```bash
rm -rf ~/.ct/cache/
```

3. Re-run `ct template .`.

## Next steps

- **[CLI Reference](/ct/cli-reference/)** — full command and flag guide.
- **[CT VS Code](/ct-vscode/overview/)** — editor integration and IntelliSense.
- **[K8s Factories](/k8s/base-primitive/)** — reusable resource helpers.
- **[CT Dev](/ct/ct-dev/)** — live development mode on a cluster.
