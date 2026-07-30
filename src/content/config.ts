import { defineCollection, z } from 'astro:content';

const work = defineCollection({
		schema: ({ image }) => z.object({
			title: z.string(),
			description: z.string(),
			year: z.union([z.number(), z.string()]),
			status: z.string(),
			signal: z.string(),
	        category: z.string(),
        role: z.string().optional(),
        color: z.string(),
        stack: z.array(z.string()),
        links: z.record(z.string()).optional(),
        featured: z.boolean().default(false),
        cover: image().optional(),
	}),
});

export const collections = { work };
