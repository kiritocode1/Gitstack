/**
 * Tech detection and categorization logic
 */

/**
 * Check if a path matches a signature file pattern
 */
export function matchesFilePattern(filePaths: string[], pattern: string): boolean {
    // Handle directory patterns like '.github/workflows'
    if (pattern.includes('/')) {
        return filePaths.some(path =>
            path === pattern ||
            path.startsWith(pattern + '/') ||
            path.endsWith('/' + pattern) ||
            path.includes('/' + pattern + '/')
        );
    }

    // Handle simple filename matching (at any depth)
    return filePaths.some(path => {
        const fileName = path.split('/').pop() || '';
        return fileName === pattern;
    });
}

/**
 * Check if any path has a matching extension
 */
export function matchesExtension(filePaths: string[], extension: string): boolean {
    return filePaths.some(path => path.endsWith(extension));
}

/**
 * Determine category for a tech name based on naming patterns and known categories
 */
export function getTechCategory(name: string): string {
    // Effect ecosystem
    if (name.startsWith('Effect')) return 'Effect';

    // Package managers
    if (['pnpm', 'npm', 'Yarn', 'Bun', 'Deno'].includes(name)) return 'Package Manager';

    // Languages
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'Kotlin', 'Swift', 'Dart', 'C', 'C++', 'C#', 'PHP', 'Ruby', 'Elixir', 'Scala', 'Haskell', 'Lua', 'Zig', 'Solidity', 'Mojo', 'Julia', 'HTML', 'Shell', 'PowerShell', 'Perl', 'YAML', 'JSON', 'TOML', 'XML'];
    if (languages.includes(name)) return 'Language';

    // Frameworks
    const frameworks = ['React', 'Vue', 'Svelte', 'Angular', 'Next.js', 'Nuxt', 'Astro', 'Remix', 'SvelteKit', 'SolidJS', 'Qwik', 'Preact', 'Ember.js', 'Express.js', 'Fastify', 'NestJS', 'Hono', 'Elysia', 'Django', 'FastAPI', 'Flask', 'Laravel', 'Spring Boot', 'TanStack Start'];
    if (frameworks.includes(name)) return 'Framework';

    // Styling & UI
    const styling = ['Tailwind CSS v4', 'Tailwind CSS v3', 'shadcn/ui', 'daisyUI', 'Radix UI', 'Mantine', 'Panda CSS', 'UnoCSS', 'Bootstrap', 'Chakra UI', 'Material UI', 'Headless UI', 'Ant Design', 'HeroUI (NextUI)', 'Ark UI', 'Magic UI', 'Flowbite', 'CSS', 'SCSS', 'SASS', 'Less', 'Stylus'];
    if (styling.includes(name)) return 'Styling & UI';

    // Database & ORM
    const database = ['Prisma', 'Drizzle ORM', 'Kysely', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Supabase', 'PlanetScale', 'Neon', 'Convex', 'PocketBase', 'SurrealDB', 'Appwrite', 'SQLx'];
    if (database.includes(name)) return 'Database & ORM';

    // Testing
    const testing = ['Jest', 'Vitest', 'Cypress', 'Playwright', 'Storybook', 'Vitest Browser', 'Vitest Coverage'];
    if (testing.includes(name)) return 'Testing';

    // Build Tools
    const buildTools = ['Vite', 'Webpack', 'Rollup', 'Parcel', 'Esbuild', 'Babel', 'Turbopack', 'Rspack', 'Rsbuild', 'Swc', 'Biome', 'ESLint', 'Prettier', 'Turborepo', 'Nx', 'Changesets', 'Lerna', 'Rush', 'tsx', 'ts-node', 'tsup', 'tstyche', 'Madge', 'jscodeshift', 'Oxc', 'Rolldown', 'Lightning CSS', 'Husky', 'lint-staged', 'commitlint', 'Semantic Release', 'Lefthook', 'Pre-commit'];
    if (buildTools.includes(name)) return 'Build Tools';

    // State Management
    const stateManagement = ['Redux', 'XState', 'Recoil', 'MobX', 'Zustand', 'Jotai', 'TanStack Query'];
    if (stateManagement.includes(name)) return 'State Management';

    // Authentication
    const auth = ['NextAuth.js / Auth.js', 'Lucia Auth', 'Clerk', 'Kinde', 'Auth0', 'Better Auth', 'Passport'];
    if (auth.includes(name)) return 'Authentication';

    // AI & ML (including AI-assisted dev tools)
    const aiml = ['OpenAI', 'Anthropic', 'LangChain', 'LlamaIndex', 'PyTorch', 'TensorFlow', 'Hugging Face', 'Mistral AI', 'Ollama', 'Groq', 'Cohere', 'DeepSeek', 'Replicate', 'Stability AI', 'Pinecone', 'ONNX', 'JAX', 'Keras', 'Scikit-learn', 'Cursor', 'CodeRabbit', 'GitHub Copilot', 'Codeium', 'Windsurf', 'Aider'];
    if (aiml.includes(name)) return 'AI & ML';

    // DevOps & Infrastructure
    const devops = ['Docker', 'Terraform', 'Pulumi', 'GitHub Actions', 'Vercel', 'Netlify', 'Cloudflare', 'AWS', 'Google Cloud', 'Azure', 'Heroku', 'Fly.io', 'Railway', 'Nginx', 'Zeabur', 'Coolify', 'Nix', 'OpenTofu', 'Sentry', 'Datadog', 'PostHog', 'Ansible', 'Kubernetes', 'Helm', 'Jenkins', 'CircleCI', 'Travis CI', 'GitLab CI', 'Blacksmith', 'Vagrant', 'Packer', 'Renovate', 'Dependabot'];
    if (devops.includes(name)) return 'DevOps & Infra';

    // Animation & 3D
    const animation = ['Framer Motion', 'Motion', 'Three.js', 'React Three Fiber', 'GSAP', 'Lottie', 'PixiJS', 'Anime.js', 'React Spring'];
    if (animation.includes(name)) return 'Animation & 3D';

    // CMS
    const cms = ['Strapi', 'Sanity', 'Payload CMS', 'Storyblok', 'WordPress', 'Directus', 'Ghost', 'Keystone'];
    if (cms.includes(name)) return 'CMS';

    // API & Backend
    const api = ['GraphQL', 'Apollo', 'tRPC', 'Socket.IO', 'UploadThing', 'Resend'];
    if (api.includes(name)) return 'API & Backend';

    // Documentation
    const docs = ['VitePress', 'Docusaurus', 'Nextra', 'GitBook', 'MkDocs', 'Sphinx', 'Markdown'];
    if (docs.includes(name)) return 'Documentation';

    // Default to Other
    return 'Other';
}

/**
 * Category display order
 */
export const CATEGORY_ORDER = [
    'Effect',
    'Framework',
    'Language',
    'Styling & UI',
    'Database & ORM',
    'API & Backend',
    'Authentication',
    'State Management',
    'Testing',
    'Build Tools',
    'AI & ML',
    'Animation & 3D',
    'DevOps & Infra',
    'CMS',
    'Documentation',
    'Package Manager',
    'Other'
];
