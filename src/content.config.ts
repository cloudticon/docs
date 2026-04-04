import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";

const docs = defineCollection({ schema: docsSchema() });

export const collections = { docs };
