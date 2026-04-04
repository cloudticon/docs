import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

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
            { label: "ct init", slug: "ct/cmd-init" },
            { label: "ct template", slug: "ct/cmd-template" },
            { label: "ct apply", slug: "ct/cmd-apply" },
            { label: "ct dev", slug: "ct/cmd-dev" },
            { label: "ct types", slug: "ct/cmd-types" },
          ],
        },
        {
          label: "CT Dev",
          items: [
            { label: "Overview", slug: "ct-dev/overview" },
            { label: "dev()", slug: "ct-dev/dev-function" },
            { label: "config()", slug: "ct-dev/config-function" },
            { label: "env() & prompt()", slug: "ct-dev/helpers" },
          ],
        },
        {
          label: "Visual Studio Code",
          items: [{ label: "Overview", slug: "ct-vscode/overview" }],
        },
        {
          label: "Comparisons",
          items: [
            { label: "CT vs Helm", slug: "comparisons/ct-vs-helm" },
            { label: "CT vs Kustomize", slug: "comparisons/ct-vs-kustomize" },
            { label: "CT vs Terraform", slug: "comparisons/ct-vs-terraform" },
            { label: "CT vs Pulumi", slug: "comparisons/ct-vs-pulumi" },
          ],
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
      head: [
        {
          tag: "script",
          content: `if(!localStorage.getItem('starlight-theme')){localStorage.setItem('starlight-theme','dark');document.documentElement.dataset.theme='dark';}`,
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
