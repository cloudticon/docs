import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://cloudticon.com",
  integrations: [
    starlight({
      title: "Cloudticon",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/cloudticon",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [{ label: "Install", slug: "home/install" }],
        },
        {
          label: "CT CLI",
          items: [
            { label: "CLI Reference", slug: "ct/cli-reference" },
            { label: "CT vs Helm", slug: "ct/ct-vs-helm" },
            { label: "CT Dev", slug: "ct/ct-dev" },
          ],
        },
        {
          label: "CT VS Code",
          items: [{ label: "Overview", slug: "ct-vscode/overview" }],
        },
        {
          label: "Kubernetes",
          items: [
            { label: "Base Primitive", slug: "k8s/base-primitive" },
            { label: "Factory Helpers", slug: "k8s/factory-helpers" },
            { label: "Shared Factories", slug: "k8s/shared-factories" },
            { label: "Examples", slug: "k8s/examples" },
          ],
        },
        {
          label: "CT Operator",
          items: [{ label: "Plan", slug: "ct-operator/plan" }],
        },
        {
          label: "Manifesto",
          items: [
            {
              label: "K8s TypeScript Ecosystem",
              slug: "manifesto/k8s-typescript-ecosystem",
            },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
      expressiveCode: {
        themes: ["github-dark-dimmed", "github-light"],
        styleOverrides: {
          borderRadius: "0.5rem",
          codePaddingBlock: "0.75rem",
          codePaddingInline: "1rem",
        },
      },
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
