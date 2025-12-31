export interface TechSignature {
    name: string;
    type: 'framework' | 'language' | 'tool' | 'infrastructure';
    files?: string[];      // Exact filename matches (e.g., "Dockerfile")
    extensions?: string[]; // Extension matches (e.g., ".tf")
    packageJSONDependencies?: string[]; // NPM package names to match in package.json
    logo?: string | { light: string; dark: string };
}

export const signatures: TechSignature[] = [
    // --- THE EFFECT ECOSYSTEM (effect.website) - COMPREHENSIVE COVERAGE ---
    // Shared logo for all Effect packages
    // Core Effect
    { name: 'Effect', type: 'framework', packageJSONDependencies: ['effect'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Schema (data validation & transformation)
    { name: 'Effect Schema', type: 'tool', packageJSONDependencies: ['@effect/schema'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Platform (cross-runtime abstractions)
    { name: 'Effect Platform', type: 'tool', packageJSONDependencies: ['@effect/platform'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Platform Node', type: 'tool', packageJSONDependencies: ['@effect/platform-node', '@effect/platform-node-shared'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Platform Browser', type: 'tool', packageJSONDependencies: ['@effect/platform-browser'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Platform Bun', type: 'tool', packageJSONDependencies: ['@effect/platform-bun'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect SQL (database integrations)
    { name: 'Effect SQL', type: 'tool', packageJSONDependencies: ['@effect/sql'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL PostgreSQL', type: 'tool', packageJSONDependencies: ['@effect/sql-pg'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL MySQL', type: 'tool', packageJSONDependencies: ['@effect/sql-mysql2'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL SQLite Node', type: 'tool', packageJSONDependencies: ['@effect/sql-sqlite-node'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL SQLite Bun', type: 'tool', packageJSONDependencies: ['@effect/sql-sqlite-bun'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL SQLite WASM', type: 'tool', packageJSONDependencies: ['@effect/sql-sqlite-wasm'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL SQLite React Native', type: 'tool', packageJSONDependencies: ['@effect/sql-sqlite-react-native'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL ClickHouse', type: 'tool', packageJSONDependencies: ['@effect/sql-clickhouse'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL MSSQL', type: 'tool', packageJSONDependencies: ['@effect/sql-mssql'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL LibSQL', type: 'tool', packageJSONDependencies: ['@effect/sql-libsql'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL Cloudflare D1', type: 'tool', packageJSONDependencies: ['@effect/sql-d1'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL Cloudflare DO', type: 'tool', packageJSONDependencies: ['@effect/sql-sqlite-do'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL Drizzle', type: 'tool', packageJSONDependencies: ['@effect/sql-drizzle'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect SQL Kysely', type: 'tool', packageJSONDependencies: ['@effect/sql-kysely'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect RPC (remote procedure calls)
    { name: 'Effect RPC', type: 'tool', packageJSONDependencies: ['@effect/rpc', '@effect/rpc-http'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect AI (AI provider integrations)
    { name: 'Effect AI', type: 'tool', packageJSONDependencies: ['@effect/ai'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect AI OpenAI', type: 'tool', packageJSONDependencies: ['@effect/ai-openai'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect AI Anthropic', type: 'tool', packageJSONDependencies: ['@effect/ai-anthropic'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect AI Google', type: 'tool', packageJSONDependencies: ['@effect/ai-google'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect AI Amazon Bedrock', type: 'tool', packageJSONDependencies: ['@effect/ai-amazon-bedrock'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Cluster (distributed computing)
    { name: 'Effect Cluster', type: 'tool', packageJSONDependencies: ['@effect/cluster'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Cluster Node', type: 'tool', packageJSONDependencies: ['@effect/cluster-node'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Cluster Browser', type: 'tool', packageJSONDependencies: ['@effect/cluster-browser'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Cluster Workflow', type: 'tool', packageJSONDependencies: ['@effect/cluster-workflow'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect CLI (command-line interfaces)
    { name: 'Effect CLI', type: 'tool', packageJSONDependencies: ['@effect/cli'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Testing
    { name: 'Effect Vitest', type: 'tool', packageJSONDependencies: ['@effect/vitest'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Observability
    { name: 'Effect OpenTelemetry', type: 'tool', packageJSONDependencies: ['@effect/opentelemetry'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Printer (pretty printing)
    { name: 'Effect Printer', type: 'tool', packageJSONDependencies: ['@effect/printer'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Printer ANSI', type: 'tool', packageJSONDependencies: ['@effect/printer-ansi'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Experimental & Advanced
    { name: 'Effect Experimental', type: 'tool', packageJSONDependencies: ['@effect/experimental'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Typeclass', type: 'tool', packageJSONDependencies: ['@effect/typeclass'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Effect Build & Tooling
    { name: 'Effect Build Utils', type: 'tool', packageJSONDependencies: ['@effect/build-utils'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Docgen', type: 'tool', packageJSONDependencies: ['@effect/docgen'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect ESLint Plugin', type: 'tool', packageJSONDependencies: ['@effect/eslint-plugin'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Language Service', type: 'tool', packageJSONDependencies: ['@effect/language-service'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // Legacy/Internal Effect modules (still detect for completeness)
    { name: 'Effect STM', type: 'tool', packageJSONDependencies: ['@effect/stm'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Stream', type: 'tool', packageJSONDependencies: ['@effect/stream'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },
    { name: 'Effect Match', type: 'tool', packageJSONDependencies: ['@effect/match'], logo: { light: "https://svgl.app/library/effect_light.svg", dark: "https://svgl.app/library/effect_dark.svg" } },

    // --- PACKAGE MANAGERS ---
    { name: 'pnpm', type: 'tool', files: ['pnpm-lock.yaml', 'pnpm-workspace.yaml', '.pnpmfile.cjs'], logo: "https://svgl.app/library/pnpm.svg" },
    { name: 'npm', type: 'tool', files: ['package-lock.json', '.npmrc'], logo: "https://svgl.app/library/npm.svg" },
    { name: 'Yarn', type: 'tool', files: ['yarn.lock', '.yarnrc', '.yarnrc.yml'], logo: "https://svgl.app/library/yarn.svg" },
    { name: 'Bun', type: 'tool', files: ['bun.lockb', 'bun.lock', 'bunfig.toml'], logo: "https://svgl.app/library/bun.svg" },

    // --- MONOREPO TOOLS ---
    { name: 'Changesets', type: 'tool', files: ['.changeset'], packageJSONDependencies: ['@changesets/cli'] },
    { name: 'Lerna', type: 'tool', files: ['lerna.json'], packageJSONDependencies: ['lerna'] },
    { name: 'Rush', type: 'tool', files: ['rush.json'], packageJSONDependencies: ['@microsoft/rush'] },

    // --- TYPESCRIPT TOOLING ---
    { name: 'TypeScript', type: 'language', files: ['tsconfig.json', 'tsconfig.build.json'], packageJSONDependencies: ['typescript'], extensions: ['.ts', '.tsx', '.mts', '.cts'], logo: "https://svgl.app/library/typescript.svg" },
    { name: 'tsx', type: 'tool', packageJSONDependencies: ['tsx'] },
    { name: 'ts-node', type: 'tool', packageJSONDependencies: ['ts-node'] },
    { name: 'tsup', type: 'tool', files: ['tsup.config.ts'], packageJSONDependencies: ['tsup'] },
    { name: 'tstyche', type: 'tool', packageJSONDependencies: ['tstyche'] },

    // --- CODE QUALITY & ANALYSIS ---
    { name: 'Madge', type: 'tool', packageJSONDependencies: ['madge'] },
    { name: 'jscodeshift', type: 'tool', packageJSONDependencies: ['jscodeshift'] },

    // --- VITE ECOSYSTEM ---
    { name: 'Vite', type: 'tool', files: ['vite.config.ts', 'vite.config.js', 'vite.config.mts'], packageJSONDependencies: ['vite'], logo: "https://svgl.app/library/vitejs.svg" },
    { name: 'Vitest', type: 'tool', files: ['vitest.config.ts', 'vitest.workspace.ts'], packageJSONDependencies: ['vitest'], logo: "https://svgl.app/library/vitest.svg" },
    { name: 'Vitest Browser', type: 'tool', packageJSONDependencies: ['@vitest/browser'] },
    { name: 'Vitest Coverage', type: 'tool', packageJSONDependencies: ['@vitest/coverage-v8', '@vitest/coverage-istanbul'] },

    // --- T3 STACK & MODERN TYPESAFE TOOLS ---
    { name: 'tRPC', type: 'tool', packageJSONDependencies: ['@trpc/server', '@trpc/client', '@trpc/react-query', '@trpc/next'], logo: { light: "https://svgl.app/library/trpc.svg", dark: "https://svgl.app/library/trpc.svg" } },
    { name: 'NextAuth.js / Auth.js', type: 'tool', packageJSONDependencies: ['next-auth', '@auth/core', '@auth/prisma-adapter'], logo: "https://svgl.app/library/authjs.svg" },
    { name: 'Lucia Auth', type: 'tool', packageJSONDependencies: ['lucia'] },
    { name: 'UploadThing', type: 'tool', packageJSONDependencies: ['uploadthing', '@uploadthing/react'] },
    { name: 'Clerk', type: 'tool', packageJSONDependencies: ['@clerk/nextjs', '@clerk/clerk-sdk-node'], logo: { light: "https://svgl.app/library/clerk-icon-light.svg", dark: "https://svgl.app/library/clerk-icon-dark.svg" } },
    { name: 'Kinde', type: 'tool', packageJSONDependencies: ['@kinde-oss/kinde-auth-nextjs'] },

    // --- UNJS & NUXT ECOSYSTEM ---
    { name: 'Nuxt', type: 'framework', files: ['nuxt.config.ts', 'nuxt.config.js'], packageJSONDependencies: ['nuxt'], logo: "https://svgl.app/library/nuxt.svg" },
    { name: 'Nitro', type: 'framework', files: ['nitro.config.ts'], packageJSONDependencies: ['nitropack'] },
    { name: 'h3', type: 'framework', packageJSONDependencies: ['h3'] },
    { name: 'Ofetch', type: 'tool', packageJSONDependencies: ['ofetch'] },
    { name: 'UnoCSS', type: 'tool', files: ['uno.config.ts', 'unocss.config.ts'], packageJSONDependencies: ['unocss'], logo: "https://svgl.app/library/unocss.svg" },
    { name: 'Unplugin', type: 'tool', packageJSONDependencies: ['unplugin'] },
    { name: 'Consola', type: 'tool', packageJSONDependencies: ['consola'] },
    { name: 'Defu', type: 'tool', packageJSONDependencies: ['defu'] },
    { name: 'Jiti', type: 'tool', packageJSONDependencies: ['jiti'] },
    { name: 'Citty', type: 'tool', packageJSONDependencies: ['citty'] },

    // --- HIGH-PERFORMANCE RUST-BASED TOOLS (Oxc, Ruff, etc.) ---
    { name: 'Oxc', type: 'tool', files: ['oxc.json'], packageJSONDependencies: ['oxc', '@oxc-project/types'], logo: "https://svgl.app/library/oxc.svg" },
    { name: 'Ruff', type: 'tool', files: ['ruff.toml', '.ruff.toml'] },
    { name: 'Rolldown', type: 'tool', packageJSONDependencies: ['@rolldown/node'], logo: "https://svgl.app/library/rolldown.svg" },
    { name: 'Uv', type: 'tool', files: ['uv.lock'], logo: "https://svgl.app/library/uv.svg" },
    { name: 'Rspack', type: 'tool', files: ['rspack.config.ts', 'rspack.config.js'], packageJSONDependencies: ['@rspack/core'], logo: "https://svgl.app/library/rspack.svg" },
    { name: 'Rsbuild', type: 'tool', files: ['rsbuild.config.ts'], packageJSONDependencies: ['@rsbuild/core'], logo: "https://svgl.app/library/rsbuild.svg" },
    { name: 'Swc', type: 'tool', files: ['.swcrc'], packageJSONDependencies: ['@swc/core'], logo: "https://svgl.app/library/swc.svg" },
    { name: 'Lightning CSS', type: 'tool', packageJSONDependencies: ['lightningcss'] },
    { name: 'Turborepo', type: 'tool', files: ['turbo.json'], logo: { light: "https://svgl.app/library/turborepo-icon-light.svg", dark: "https://svgl.app/library/turborepo-icon-dark.svg" } },
    { name: 'Biome', type: 'tool', files: ['biome.json'], packageJSONDependencies: ['@biomejs/biome'], logo: "https://svgl.app/library/biomejs.svg" },

    // --- MODERN STYLING & UI ---
    { name: 'Tailwind CSS v4', type: 'tool', files: ['tailwind.css'], packageJSONDependencies: ['@tailwindcss/vite', '@tailwindcss/postcss'], logo: "https://svgl.app/library/tailwindcss.svg" },
    { name: 'Tailwind CSS v3', type: 'tool', files: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'], logo: "https://svgl.app/library/tailwindcss.svg" },
    { name: 'shadcn/ui', type: 'tool', files: ['components.json'], logo: { light: "https://svgl.app/library/shadcn-ui.svg", dark: "https://svgl.app/library/shadcn-ui_dark.svg" } },
    { name: 'daisyUI', type: 'tool', packageJSONDependencies: ['daisyui'], logo: "https://svgl.app/library/daisyui.svg" },
    { name: 'Radix UI', type: 'tool', packageJSONDependencies: ['@radix-ui/react-primitive', '@radix-ui/react-slot'], logo: { light: "https://svgl.app/library/radix-ui_light.svg", dark: "https://svgl.app/library/radix-ui_dark.svg" } },
    { name: 'Mantine', type: 'framework', packageJSONDependencies: ['@mantine/core'], logo: "https://svgl.app/library/mantine.svg" },
    { name: 'Panda CSS', type: 'tool', files: ['panda.config.ts'], packageJSONDependencies: ['@pandacss/dev'], logo: "https://svgl.app/library/pandacss.svg" },

    // --- TYPESCRIPT FRAMEWORKS & RUNTIMES ---
    { name: 'Next.js', type: 'framework', files: ['next.config.js', 'next.config.ts', 'next.config.mjs'], packageJSONDependencies: ['next'], logo: "https://svgl.app/library/nextjs_icon_dark.svg" },
    { name: 'Remix', type: 'framework', files: ['remix.config.js', 'vite.config.ts'], packageJSONDependencies: ['@remix-run/react'], logo: { light: "https://svgl.app/library/remix_light.svg", dark: "https://svgl.app/library/remix_dark.svg" } },
    { name: 'Astro', type: 'framework', files: ['astro.config.mjs', 'astro.config.ts'], packageJSONDependencies: ['astro'], logo: { light: "https://svgl.app/library/astro-icon-light.svg", dark: "https://svgl.app/library/astro-icon-dark.svg" } },
    { name: 'SvelteKit', type: 'framework', files: ['svelte.config.js'], packageJSONDependencies: ['@sveltejs/kit'], logo: "https://svgl.app/library/svelte.svg" },
    { name: 'Hono', type: 'framework', packageJSONDependencies: ['hono'], logo: "https://svgl.app/library/hono.svg" },
    { name: 'Elysia', type: 'framework', packageJSONDependencies: ['elysia'], logo: "https://svgl.app/library/elysiajs.svg" },
    { name: 'TanStack Start', type: 'framework', packageJSONDependencies: ['@tanstack/start'], logo: "https://svgl.app/library/tanstack.svg" },

    { name: 'Deno', type: 'tool', files: ['deno.json', 'deno.jsonc'], logo: { light: "https://svgl.app/library/deno.svg", dark: "https://svgl.app/library/deno_dark.svg" } },

    // --- DATA & VALIDATION ---
    { name: 'Prisma', type: 'tool', files: ['prisma/schema.prisma'], packageJSONDependencies: ['prisma'], logo: { light: "https://svgl.app/library/prisma.svg", dark: "https://svgl.app/library/prisma_dark.svg" } },
    { name: 'Drizzle ORM', type: 'tool', files: ['drizzle.config.ts'], packageJSONDependencies: ['drizzle-orm'], logo: { light: "https://svgl.app/library/drizzle-orm_light.svg", dark: "https://svgl.app/library/drizzle-orm_dark.svg" } },
    { name: 'Kysely', type: 'tool', packageJSONDependencies: ['kysely'] },
    { name: 'Zod', type: 'tool', packageJSONDependencies: ['zod'], logo: "https://svgl.app/library/zod.svg" },
    { name: 'Valibot', type: 'tool', packageJSONDependencies: ['valibot'], logo: "https://svgl.app/library/valibot.svg" },
    { name: 'ArkType', type: 'tool', packageJSONDependencies: ['arktype'] },
    { name: 'TanStack Query', type: 'tool', packageJSONDependencies: ['@tanstack/react-query'], logo: "https://svgl.app/library/tanstack.svg" },

    // --- RUST ECOSYSTEM ---
    { name: 'Rust', type: 'language', files: ['Cargo.toml', 'Cargo.lock'], extensions: ['.rs'], logo: { light: "https://svgl.app/library/rust.svg", dark: "https://svgl.app/library/rust_dark.svg" } },
    { name: 'Tauri', type: 'framework', files: ['tauri.conf.json', 'src-tauri/tauri.conf.json'], logo: "https://svgl.app/library/tauri.svg" },
    { name: 'Axum', type: 'framework', packageJSONDependencies: ['axum'] },
    { name: 'Leptos', type: 'framework', packageJSONDependencies: ['leptos'] },
    { name: 'Tokio', type: 'tool', packageJSONDependencies: ['tokio'] },
    { name: 'Serde', type: 'tool', packageJSONDependencies: ['serde'] },
    { name: 'SQLx', type: 'tool', files: ['.sqlx-data.json'] },

    // --- PYTHON & AI ---
    { name: 'Python', type: 'language', extensions: ['.py'], files: ['pyproject.toml', 'requirements.txt', 'Pipfile'], logo: "https://svgl.app/library/python.svg" },
    { name: 'Mojo', type: 'language', extensions: ['.mojo', '.🔥'] },
    { name: 'FastAPI', type: 'framework', packageJSONDependencies: ['fastapi'], logo: "https://svgl.app/library/fastapi.svg" },
    { name: 'Django', type: 'framework', files: ['manage.py'], logo: "https://svgl.app/library/django.svg" },
    { name: 'Poetry', type: 'tool', files: ['poetry.lock'] },
    { name: 'LangChain', type: 'tool', packageJSONDependencies: ['langchain'], logo: "https://svgl.app/library/langchain.svg" },
    { name: 'LlamaIndex', type: 'tool', packageJSONDependencies: ['llama-index'] },
    { name: 'PyTorch', type: 'tool', packageJSONDependencies: ['torch'], files: ['requirements.txt'], logo: "https://svgl.app/library/pytorch.svg" },

    // --- INFRASTRUCTURE & OPS ---
    { name: 'Terraform', type: 'infrastructure', extensions: ['.tf'], files: ['.terraform.lock.hcl'], logo: "https://svgl.app/library/terraform.svg" },
    { name: 'OpenTofu', type: 'infrastructure', files: ['.opentofu.lock.hcl'] },
    { name: 'Pulumi', type: 'infrastructure', files: ['Pulumi.yaml'], logo: "https://svgl.app/library/pulumi.svg" },
    { name: 'Docker', type: 'infrastructure', files: ['Dockerfile', 'docker-compose.yml'], logo: "https://svgl.app/library/docker.svg" },
    { name: 'Nix', type: 'infrastructure', files: ['flake.nix', 'shell.nix'] },
    { name: 'GitHub Actions', type: 'infrastructure', files: ['.github/workflows'] },

    // --- CORE LANGUAGES & MISC ---
    { name: 'Go', type: 'language', files: ['go.mod'], extensions: ['.go'], logo: { light: "https://svgl.app/library/golang.svg", dark: "https://svgl.app/library/golang_dark.svg" } },
    { name: 'Zig', type: 'language', extensions: ['.zig'], files: ['build.zig', 'build.zig.zon'], logo: "https://svgl.app/library/zig.svg" },
    { name: 'Lua', type: 'language', extensions: ['.lua'], logo: "https://svgl.app/library/lua.svg" },
    { name: 'Neovim', type: 'tool', files: ['init.lua'], logo: "https://svgl.app/library/neovim.svg" },
    { name: 'Lazy.nvim', type: 'tool', files: ['lazy-lock.json'] },

    // --- UI LIBRARIES & CSS FRAMEWORKS ---
    { name: 'React', type: 'framework', packageJSONDependencies: ['react'], logo: { light: "https://svgl.app/library/react_light.svg", dark: "https://svgl.app/library/react_dark.svg" } },
    { name: 'Vue', type: 'framework', packageJSONDependencies: ['vue'], logo: "https://svgl.app/library/vue.svg" },
    { name: 'Svelte', type: 'framework', packageJSONDependencies: ['svelte'], logo: "https://svgl.app/library/svelte.svg" },
    { name: 'Preact', type: 'framework', packageJSONDependencies: ['preact'], logo: "https://svgl.app/library/preact.svg" },
    { name: 'SolidJS', type: 'framework', packageJSONDependencies: ['solid-js'], logo: "https://svgl.app/library/solidjs.svg" },
    { name: 'Qwik', type: 'framework', packageJSONDependencies: ['@builder.io/qwik'], logo: "https://svgl.app/library/qwik.svg" },
    { name: 'Angular', type: 'framework', packageJSONDependencies: ['@angular/core'], logo: "https://svgl.app/library/angular.svg" },
    { name: 'Ember.js', type: 'framework', packageJSONDependencies: ['ember-source'], logo: "https://svgl.app/library/ember.svg" },
    { name: 'Bootstrap', type: 'framework', packageJSONDependencies: ['bootstrap'], logo: "https://svgl.app/library/bootstrap.svg" },
    { name: 'Chakra UI', type: 'tool', packageJSONDependencies: ['@chakra-ui/react'], logo: "https://svgl.app/library/chakra-ui.svg" },
    { name: 'Material UI', type: 'tool', packageJSONDependencies: ['@mui/material'], logo: "https://svgl.app/library/materialui.svg" },
    { name: 'Headless UI', type: 'tool', packageJSONDependencies: ['@headlessui/react', '@headlessui/vue'], logo: "https://svgl.app/library/headlessui.svg" },
    { name: 'Flowbite', type: 'tool', packageJSONDependencies: ['flowbite', 'flowbite-react'], logo: "https://svgl.app/library/flowbite.svg" },
    { name: 'Ant Design', type: 'tool', packageJSONDependencies: ['antd'], logo: "https://svgl.app/library/ant-design-dark-theme.svg" },
    { name: 'HeroUI (NextUI)', type: 'tool', packageJSONDependencies: ['@heroui/react', '@nextui-org/react'], logo: { light: "https://svgl.app/library/heroui_black.svg", dark: "https://svgl.app/library/heroui_light.svg" } },
    { name: 'Ark UI', type: 'tool', packageJSONDependencies: ['@ark-ui/react', '@ark-ui/vue'], logo: "https://svgl.app/library/ark-ui.svg" },
    { name: 'Magic UI', type: 'tool', packageJSONDependencies: ['magic-ui'], logo: "https://svgl.app/library/magicui.svg" },
    { name: 'Framer Motion', type: 'tool', packageJSONDependencies: ['framer-motion'], logo: { light: "https://svgl.app/library/motion.svg", dark: "https://svgl.app/library/motion_dark.svg" } },

    // --- STATE MANAGEMENT ---
    { name: 'Redux', type: 'tool', packageJSONDependencies: ['redux', '@reduxjs/toolkit'], logo: "https://svgl.app/library/redux.svg" },
    { name: 'XState', type: 'tool', packageJSONDependencies: ['xstate'], logo: { light: "https://svgl.app/library/xstate.svg", dark: "https://svgl.app/library/xstate_dark.svg" } },
    { name: 'Recoil', type: 'tool', packageJSONDependencies: ['recoil'] },
    { name: 'MobX', type: 'tool', packageJSONDependencies: ['mobx'] },
    { name: 'Zustand', type: 'tool', packageJSONDependencies: ['zustand'] },
    { name: 'Jotai', type: 'tool', packageJSONDependencies: ['jotai'] },

    // --- BACKEND FRAMEWORKS & API ---
    { name: 'Express.js', type: 'framework', packageJSONDependencies: ['express'], logo: { light: "https://svgl.app/library/expressjs.svg", dark: "https://svgl.app/library/expressjs_dark.svg" } },
    { name: 'Fastify', type: 'framework', packageJSONDependencies: ['fastify'], logo: { light: "https://svgl.app/library/fastify.svg", dark: "https://svgl.app/library/fastify_dark.svg" } },
    { name: 'NestJS', type: 'framework', packageJSONDependencies: ['@nestjs/core'], logo: "https://svgl.app/library/nestjs.svg" },
    { name: 'GraphQL', type: 'tool', packageJSONDependencies: ['graphql'], extensions: ['.graphql', '.gql'], logo: "https://svgl.app/library/graphql.svg" },
    { name: 'Apollo', type: 'tool', packageJSONDependencies: ['@apollo/client', 'apollo-server'] },
    { name: 'Socket.IO', type: 'tool', packageJSONDependencies: ['socket.io', 'socket.io-client'], logo: { light: "https://svgl.app/library/socketio-icon-light.svg", dark: "https://svgl.app/library/socketio-icon-dark.svg" } },
    { name: 'AdonisJS', type: 'framework', packageJSONDependencies: ['@adonisjs/core'] },

    // --- DATABASES & BAAS ---
    { name: 'PostgreSQL', type: 'tool', packageJSONDependencies: ['pg', 'postgres'], logo: "https://svgl.app/library/postgresql.svg" },
    { name: 'MySQL', type: 'tool', packageJSONDependencies: ['mysql2', 'mysql'], logo: { light: "https://svgl.app/library/mysql-icon-light.svg", dark: "https://svgl.app/library/mysql-icon-dark.svg" } },
    { name: 'MongoDB', type: 'tool', packageJSONDependencies: ['mongodb', 'mongoose'], logo: { light: "https://svgl.app/library/mongodb-icon-light.svg", dark: "https://svgl.app/library/mongodb-icon-dark.svg" } },
    { name: 'Redis', type: 'tool', packageJSONDependencies: ['redis', 'ioredis'], logo: "https://svgl.app/library/redis.svg" },
    { name: 'SQLite', type: 'tool', packageJSONDependencies: ['sqlite3', 'better-sqlite3'], logo: "https://svgl.app/library/sqlite.svg" },
    { name: 'Firebase', type: 'tool', packageJSONDependencies: ['firebase'], files: ['firebase.json'], logo: "https://svgl.app/library/firebase.svg" },
    { name: 'Supabase', type: 'tool', packageJSONDependencies: ['@supabase/supabase-js'], logo: "https://svgl.app/library/supabase.svg" },
    { name: 'PlanetScale', type: 'tool', packageJSONDependencies: ['@planetscale/database'], logo: { light: "https://svgl.app/library/planetscale.svg", dark: "https://svgl.app/library/planetscale_dark.svg" } },
    { name: 'Neon', type: 'tool', packageJSONDependencies: ['@neondatabase/serverless'], logo: "https://svgl.app/library/neon.svg" },
    { name: 'Convex', type: 'tool', packageJSONDependencies: ['convex'], logo: "https://svgl.app/library/convex.svg" },
    { name: 'PocketBase', type: 'tool', packageJSONDependencies: ['pocketbase'], logo: "https://svgl.app/library/pocket-base.svg" },
    { name: 'SurrealDB', type: 'tool', packageJSONDependencies: ['surrealdb.js'], logo: "https://svgl.app/library/surrealdb.svg" },
    { name: 'Appwrite', type: 'tool', packageJSONDependencies: ['appwrite'], logo: "https://svgl.app/library/appwrite.svg" },

    // --- BUILD TOOLS & BUNDLERS ---
    { name: 'Webpack', type: 'tool', files: ['webpack.config.js'], packageJSONDependencies: ['webpack'] },
    { name: 'Rollup', type: 'tool', files: ['rollup.config.js'], packageJSONDependencies: ['rollup'] },
    { name: 'Parcel', type: 'tool', files: ['.parcelrc'], packageJSONDependencies: ['parcel'], logo: "https://svgl.app/library/parcel.svg" },
    { name: 'Esbuild', type: 'tool', packageJSONDependencies: ['esbuild'], logo: "https://svgl.app/library/esbuild.svg" },
    { name: 'Babel', type: 'tool', files: ['babel.config.js', '.babelrc'], packageJSONDependencies: ['@babel/core'], logo: "https://svgl.app/library/babel.svg" },
    { name: 'Turbopack', type: 'tool', packageJSONDependencies: ['turbopack'], logo: { light: "https://svgl.app/library/turbopack-icon-light.svg", dark: "https://svgl.app/library/turbopack-icon-dark.svg" } },

    // --- TESTING ---
    { name: 'Jest', type: 'tool', files: ['jest.config.js'], packageJSONDependencies: ['jest'], logo: "https://svgl.app/library/jest.svg" },

    { name: 'Cypress', type: 'tool', files: ['cypress.json', 'cypress.config.ts'], packageJSONDependencies: ['cypress'], logo: "https://svgl.app/library/cypress.svg" },
    { name: 'Playwright', type: 'tool', files: ['playwright.config.ts'], packageJSONDependencies: ['@playwright/test'], logo: "https://svgl.app/library/playwright.svg" },
    { name: 'Storybook', type: 'tool', files: ['.storybook'], packageJSONDependencies: ['storybook'], logo: "https://svgl.app/library/storybook.svg" },

    // --- PROGRAMMING LANGUAGES (Backend/System) ---
    { name: 'Java', type: 'language', extensions: ['.java'], files: ['pom.xml', 'build.gradle'], logo: "https://svgl.app/library/java.svg" },
    { name: 'Kotlin', type: 'language', extensions: ['.kt', '.kts'], logo: "https://svgl.app/library/kotlin.svg" },
    { name: 'Swift', type: 'language', extensions: ['.swift'], files: ['Package.swift'], logo: "https://svgl.app/library/swift.svg" },
    { name: 'Dart', type: 'language', extensions: ['.dart'], files: ['pubspec.yaml'], logo: "https://svgl.app/library/dart.svg" },
    { name: 'C', type: 'language', extensions: ['.c', '.h'], files: ['Makefile'], logo: "https://svgl.app/library/c.svg" },
    { name: 'C++', type: 'language', extensions: ['.cpp', '.hpp', '.cc'], logo: "https://svgl.app/library/c-plusplus.svg" },
    { name: 'C#', type: 'language', extensions: ['.cs'], files: ['.csproj', '.sln'], logo: "https://svgl.app/library/csharp.svg" },
    { name: 'Haskell', type: 'language', extensions: ['.hs'], files: ['stack.yaml', '.cabal'], logo: "https://svgl.app/library/haskell.svg" },
    { name: 'Scala', type: 'language', extensions: ['.scala'], files: ['build.sbt'], logo: "https://svgl.app/library/scala.svg" },
    { name: 'Julia', type: 'language', extensions: ['.jl'], logo: "https://svgl.app/library/julia.svg" },
    { name: 'Elixir', type: 'language', extensions: ['.ex', '.exs'], files: ['mix.exs'] },
    { name: 'PHP', type: 'language', extensions: ['.php'], files: ['composer.json'], logo: { light: "https://svgl.app/library/php.svg", dark: "https://svgl.app/library/php_dark.svg" } },

    // --- AI & ML LIBRARIES (Expanded) ---
    { name: 'CUDA', type: 'tool', extensions: ['.cu', '.cuh'], files: ['CMakeLists.txt'] },
    { name: 'TensorFlow', type: 'tool', packageJSONDependencies: ['@tensorflow/tfjs', 'tensorflow'], logo: { light: "https://svgl.app/library/tensorflow-icon-light.svg", dark: "https://svgl.app/library/tensorflow-icon-dark.svg" } },
    { name: 'PyTorch', type: 'tool', packageJSONDependencies: ['torch'], files: ['requirements.txt'], logo: "https://svgl.app/library/pytorch.svg" },
    { name: 'Keras', type: 'tool', packageJSONDependencies: ['keras'] },
    { name: 'Scikit-learn', type: 'tool', packageJSONDependencies: ['scikit-learn', 'sklearn'] },
    { name: 'Pandas', type: 'tool', packageJSONDependencies: ['pandas'] },
    { name: 'NumPy', type: 'tool', packageJSONDependencies: ['numpy'] },
    { name: 'Matplotlib', type: 'tool', packageJSONDependencies: ['matplotlib'] },
    { name: 'JAX', type: 'tool', packageJSONDependencies: ['jax'] },
    { name: 'ONNX', type: 'tool', packageJSONDependencies: ['onnx', 'onnxruntime'] },
    { name: 'OpenAI', type: 'tool', packageJSONDependencies: ['openai'], logo: { light: "https://svgl.app/library/openai.svg", dark: "https://svgl.app/library/openai_dark.svg" } },
    { name: 'Anthropic', type: 'tool', packageJSONDependencies: ['@anthropic-ai/sdk'], logo: { light: "https://svgl.app/library/anthropic_black.svg", dark: "https://svgl.app/library/anthropic_white.svg" } },
    { name: 'LangChain', type: 'tool', packageJSONDependencies: ['langchain'], logo: "https://svgl.app/library/langchain.svg" },
    { name: 'Hugging Face', type: 'tool', packageJSONDependencies: ['@huggingface/inference', 'transformers'], logo: "https://svgl.app/library/hugging_face.svg" },
    { name: 'Mistral AI', type: 'tool', packageJSONDependencies: ['@mistralai/mistralai'], logo: "https://svgl.app/library/mistral-ai_logo.svg" },
    { name: 'Ollama', type: 'tool', packageJSONDependencies: ['ollama'], logo: { light: "https://svgl.app/library/ollama_light.svg", dark: "https://svgl.app/library/ollama_dark.svg" } },
    { name: 'Pinecone', type: 'tool', packageJSONDependencies: ['@pinecone-database/pinecone'] },

    // --- NOTEBOOKS ---
    { name: 'Jupyter', type: 'tool', extensions: ['.ipynb'] },

    // --- VISUAL EFFECTS & 3D ---
    { name: 'Three.js', type: 'tool', packageJSONDependencies: ['three'], logo: { light: "https://svgl.app/library/threejs-light.svg", dark: "https://svgl.app/library/threejs-dark.svg" } },
    { name: 'React Three Fiber', type: 'tool', packageJSONDependencies: ['@react-three/fiber'] },
    { name: 'GSAP', type: 'tool', packageJSONDependencies: ['gsap'] },
    { name: 'Lottie', type: 'tool', packageJSONDependencies: ['lottie-web', 'lottie-react'], logo: "https://svgl.app/library/lottiefiles.svg" },
    { name: 'PixiJS', type: 'tool', packageJSONDependencies: ['pixi.js'] },
    { name: 'Anime.js', type: 'tool', packageJSONDependencies: ['animejs'] },
    { name: 'React Spring', type: 'tool', packageJSONDependencies: ['react-spring', '@react-spring/web'] },
    { name: 'Motion', type: 'tool', packageJSONDependencies: ['framer-motion', 'motion'], logo: { light: "https://svgl.app/library/motion.svg", dark: "https://svgl.app/library/motion_dark.svg" } },

    // --- CLOUD, ANALYTICS & MONITORING ---
    { name: 'Sentry', type: 'tool', files: ['sentry.properties', 'sentry.client.config.js', 'sentry.server.config.js'], packageJSONDependencies: ['@sentry/browser', '@sentry/node', '@sentry/react', '@sentry/nextjs'], logo: "https://svgl.app/library/sentry.svg" },
    { name: 'Cloudflare', type: 'infrastructure', files: ['wrangler.toml', '_worker.js'], packageJSONDependencies: ['@cloudflare/workers-types'], logo: "https://svgl.app/library/cloudflare.svg" },
    { name: 'Vercel', type: 'infrastructure', files: ['vercel.json'], packageJSONDependencies: ['vercel', '@vercel/analytics', '@vercel/speed-insights'], logo: { light: "https://svgl.app/library/vercel.svg", dark: "https://svgl.app/library/vercel_dark.svg" } },
    { name: 'Netlify', type: 'infrastructure', files: ['netlify.toml'], packageJSONDependencies: ['netlify-cli'], logo: "https://svgl.app/library/netlify.svg" },
    { name: 'AWS', type: 'infrastructure', packageJSONDependencies: ['aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb'], logo: { light: "https://svgl.app/library/aws_light.svg", dark: "https://svgl.app/library/aws_dark.svg" } },
    { name: 'Google Cloud', type: 'infrastructure', packageJSONDependencies: ['googleapis', '@google-cloud/storage'], logo: "https://svgl.app/library/google-cloud.svg" },
    { name: 'Azure', type: 'infrastructure', packageJSONDependencies: ['@azure/storage-blob', '@azure/cosmos'], logo: "https://svgl.app/library/azure.svg" },
    { name: 'Datadog', type: 'tool', packageJSONDependencies: ['dd-trace', '@datadog/browser-logs'], logo: "https://svgl.app/library/datadog.svg" },
    { name: 'PostHog', type: 'tool', packageJSONDependencies: ['posthog-js', 'posthog-node'], logo: "https://svgl.app/library/posthog.svg" },
    { name: 'Mixpanel', type: 'tool', packageJSONDependencies: ['mixpanel-browser'] },
    { name: 'Segment', type: 'tool', packageJSONDependencies: ['@segment/analytics-next'] },
    { name: 'Resend', type: 'tool', packageJSONDependencies: ['resend'], logo: { light: "https://svgl.app/library/resend-icon-black.svg", dark: "https://svgl.app/library/resend-icon-white.svg" } },
    { name: 'LogRocket', type: 'tool', packageJSONDependencies: ['logrocket'] },

    // --- CMS & HEADLESS ---
    { name: 'Strapi', type: 'tool', packageJSONDependencies: ['@strapi/strapi', 'strapi'], logo: "https://svgl.app/library/strapi.svg" },
    { name: 'Sanity', type: 'tool', files: ['sanity.config.ts', 'sanity.cli.ts'], packageJSONDependencies: ['sanity', '@sanity/client'], logo: { light: "https://svgl.app/library/sanity-light.svg", dark: "https://svgl.app/library/sanity-dark.svg" } },
    { name: 'Payload CMS', type: 'tool', files: ['payload.config.ts'], packageJSONDependencies: ['payload'], logo: { light: "https://svgl.app/library/payload.svg", dark: "https://svgl.app/library/payload_dark.svg" } },
    { name: 'Storyblok', type: 'tool', packageJSONDependencies: ['@storyblok/react', 'storyblok-js-client'], logo: "https://svgl.app/library/storyblok.svg" },
    { name: 'WordPress', type: 'framework', files: ['wp-config.php', 'style.css'], packageJSONDependencies: ['@wordpress/scripts'], logo: "https://svgl.app/library/wordpress.svg" },
    { name: 'Directus', type: 'tool', packageJSONDependencies: ['@directus/sdk'], logo: "https://svgl.app/library/directus.svg" },
    { name: 'Ghost', type: 'framework', packageJSONDependencies: ['ghost', '@tryghost/admin-api'] },
    { name: 'Keystone', type: 'framework', packageJSONDependencies: ['@keystone-6/core'] },

    // --- AUTHENTICATION ---
    { name: 'Auth0', type: 'tool', packageJSONDependencies: ['auth0', '@auth0/auth0-react'], logo: "https://svgl.app/library/auth0.svg" },
    { name: 'Better Auth', type: 'tool', packageJSONDependencies: ['better-auth'], logo: { light: "https://svgl.app/library/better-auth_light.svg", dark: "https://svgl.app/library/better-auth_dark.svg" } },
    { name: 'Passport', type: 'tool', packageJSONDependencies: ['passport'] },

    // --- MOBILE & DESKTOP ---
    { name: 'Expo', type: 'framework', files: ['app.json'], packageJSONDependencies: ['expo'], logo: "https://svgl.app/library/expo.svg" },
    { name: 'React Native', type: 'framework', packageJSONDependencies: ['react-native'] },
    { name: 'Flutter', type: 'framework', files: ['pubspec.yaml'], extensions: ['.dart'], logo: "https://svgl.app/library/flutter.svg" },
    { name: 'Electron', type: 'framework', packageJSONDependencies: ['electron'], logo: "https://svgl.app/library/electron.svg" },
    { name: 'Ionic', type: 'framework', packageJSONDependencies: ['@ionic/core', '@ionic/react', '@ionic/vue', '@ionic/angular'] },
    { name: 'Capacitor', type: 'tool', files: ['capacitor.config.ts', 'capacitor.config.json'], packageJSONDependencies: ['@capacitor/core'] },

    // --- SEARCH ---
    { name: 'Algolia', type: 'tool', packageJSONDependencies: ['algoliasearch'], logo: "https://svgl.app/library/algolia.svg" },
    { name: 'Meilisearch', type: 'tool', packageJSONDependencies: ['meilisearch'], logo: "https://svgl.app/library/meilisearch.svg" },
    { name: 'Elasticsearch', type: 'tool', packageJSONDependencies: ['@elastic/elasticsearch'] },

    // --- PAYMENTS ---
    { name: 'Stripe', type: 'tool', packageJSONDependencies: ['stripe', '@stripe/stripe-js'], logo: "https://svgl.app/library/stripe.svg" },
    { name: 'Lemon Squeezy', type: 'tool', packageJSONDependencies: ['@lemonsqueezy/lemonsqueezy.js'], logo: "https://svgl.app/library/lemonsqueezy.svg" },
    { name: 'Paddle', type: 'tool', packageJSONDependencies: ['@paddle/paddle-node-sdk'] },

    // --- ADDITIONAL BACKEND & LANGUAGES ---
    { name: 'Laravel', type: 'framework', files: ['artisan', 'composer.json'], logo: "https://svgl.app/library/laravel.svg" },
    { name: 'Symfony', type: 'framework', files: ['composer.json', 'symfony.lock'] },
    { name: 'Spring Boot', type: 'framework', files: ['pom.xml', 'build.gradle'], logo: "https://svgl.app/library/spring.svg" },
    { name: 'Flask', type: 'framework', packageJSONDependencies: ['flask'], logo: { light: "https://svgl.app/library/flask-light.svg", dark: "https://svgl.app/library/flask-dark.svg" } },
    { name: 'Streamlit', type: 'tool', files: ['streamlit_app.py'] },
    { name: 'Gradio', type: 'tool', packageJSONDependencies: ['gradio'], logo: "https://svgl.app/library/gradio.svg" },
    { name: 'Solidity', type: 'language', extensions: ['.sol'], logo: "https://svgl.app/library/solidity.svg" },

    // --- HOSTING & INFRASTRUCTURE EXTENSIONS ---
    { name: 'Heroku', type: 'infrastructure', files: ['Procfile'], logo: "https://svgl.app/library/heroku.svg" },
    { name: 'Fly.io', type: 'infrastructure', files: ['fly.toml'], logo: "https://svgl.app/library/fly.svg" },
    { name: 'Railway', type: 'infrastructure', files: ['railway.toml', 'railway.json'], logo: { light: "https://svgl.app/library/railway.svg", dark: "https://svgl.app/library/railway_dark.svg" } },
    { name: 'Nginx', type: 'infrastructure', files: ['nginx.conf'], logo: "https://svgl.app/library/nginx.svg" },
    { name: 'Zeabur', type: 'infrastructure', files: ['zeabur.json', 'zeabur.toml'], logo: { light: "https://svgl.app/library/zeabur-light.svg", dark: "https://svgl.app/library/zeabur-dark.svg" } },
    { name: 'Coolify', type: 'infrastructure', files: ['coolify.yaml'] },

    // --- ADDITIONAL LIBRARIES ---
    { name: 'RxJS', type: 'tool', packageJSONDependencies: ['rxjs'], logo: "https://svgl.app/library/rxjs.svg" },
    { name: 'Chart.js', type: 'tool', packageJSONDependencies: ['chart.js'], logo: "https://svgl.app/library/chartjs.svg" },
    { name: 'D3.js', type: 'tool', packageJSONDependencies: ['d3'], logo: "https://svgl.app/library/D3.svg" },
    { name: 'Cloudinary', type: 'tool', packageJSONDependencies: ['cloudinary'], logo: "https://svgl.app/library/cloudinary.svg" },
    { name: 'Discord.js', type: 'tool', packageJSONDependencies: ['discord.js'], logo: "https://svgl.app/library/djs.svg" },
    { name: 'ESLint', type: 'tool', files: ['.eslintrc', '.eslintrc.js', '.eslintrc.json', 'eslint.config.js', 'eslint.config.mjs'], packageJSONDependencies: ['eslint'], logo: { light: "https://svgl.app/library/eslint-icon-light.svg", dark: "https://svgl.app/library/eslint-icon-dark.svg" } },
    { name: 'Prettier', type: 'tool', files: ['.prettierrc', '.prettierrc.json', 'prettier.config.js'], packageJSONDependencies: ['prettier'], logo: { light: "https://svgl.app/library/prettier-icon-light.svg", dark: "https://svgl.app/library/prettier-icon-dark.svg" } },
    { name: 'Nx', type: 'tool', files: ['nx.json'], packageJSONDependencies: ['nx'], logo: { light: "https://svgl.app/library/nx_light.svg", dark: "https://svgl.app/library/nx_dark.svg" } },

    // --- AI SERVICES (Expanded) ---
    { name: 'Groq', type: 'tool', packageJSONDependencies: ['groq-sdk'], logo: "https://svgl.app/library/groq.svg" },
    { name: 'Cohere', type: 'tool', packageJSONDependencies: ['cohere-ai'], logo: "https://svgl.app/library/cohere.svg" },
    { name: 'DeepSeek', type: 'tool', packageJSONDependencies: ['deepseek'], logo: "https://svgl.app/library/deepseek.svg" },
    { name: 'Replicate', type: 'tool', packageJSONDependencies: ['replicate'], logo: { light: "https://svgl.app/library/replicate_light.svg", dark: "https://svgl.app/library/replicate_dark.svg" } },
    { name: 'Stability AI', type: 'tool', packageJSONDependencies: ['stability-client'], logo: "https://svgl.app/library/stability-ai.svg" },
];