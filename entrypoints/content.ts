import { signatures } from '../utils/signatures';

// Cache for repository tree to avoid redundant API calls
const treeCache = new Map<string, { paths: string[], timestamp: number }>();
const TREE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch the full repository tree using GitHub API
async function fetchRepoTree(owner: string, repo: string): Promise<string[]> {
  const cacheKey = `${owner}/${repo}`;
  const cached = treeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < TREE_CACHE_TTL) {
    console.log('[GitStack] Using cached tree for', cacheKey);
    return cached.paths;
  }

  try {
    // Try to get the default branch first
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      console.warn('[GitStack] Failed to fetch repo info, falling back to shallow scan');
      return [];
    }
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // Fetch the full tree recursively
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
    );

    if (!treeRes.ok) {
      // Check if rate limited
      const remaining = treeRes.headers.get('X-RateLimit-Remaining');
      if (remaining === '0') {
        console.warn('[GitStack] GitHub API rate limit reached, falling back to shallow scan');
      }
      return [];
    }

    const treeData = await treeRes.json();

    if (treeData.truncated) {
      console.warn('[GitStack] Tree was truncated (large repo), some files may be missed');
    }

    // Extract all file paths
    const paths: string[] = treeData.tree
      .filter((item: any) => item.type === 'blob' || item.type === 'tree')
      .map((item: any) => item.path);

    // Cache the result
    treeCache.set(cacheKey, { paths, timestamp: Date.now() });
    console.log(`[GitStack] Fetched ${paths.length} paths from repo tree`);

    return paths;
  } catch (error) {
    console.warn('[GitStack] Error fetching tree:', error);
    return [];
  }
}

// Check if a path matches a signature file pattern
function matchesFilePattern(filePaths: string[], pattern: string): boolean {
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

// Check if any path has a matching extension
function matchesExtension(filePaths: string[], extension: string): boolean {
  return filePaths.some(path => path.endsWith(extension));
}

// Loading state management
const LOADING_SIDEBAR_ID = 'github-ext-loading-sidebar';

function injectLoadingState(message: string) {
  // Check if already exists
  if (document.getElementById(LOADING_SIDEBAR_ID)) {
    updateLoadingProgress(0, message);
    return;
  }

  const borderGrid = document.querySelector('.Layout-sidebar .BorderGrid');
  if (!borderGrid) return;

  const isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
    (document.documentElement.getAttribute('data-color-mode') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const section = document.createElement('div');
  section.id = LOADING_SIDEBAR_ID;
  section.className = 'BorderGrid-row';

  const cell = document.createElement('div');
  cell.className = 'BorderGrid-cell';

  const heading = document.createElement('h2');
  heading.className = 'h4 mb-3';
  heading.textContent = 'Tech Stack';

  // Progress container
  const progressContainer = document.createElement('div');
  progressContainer.style.marginTop = '12px';

  // Progress bar background
  const progressBg = document.createElement('div');
  progressBg.style.width = '100%';
  progressBg.style.height = '4px';
  progressBg.style.borderRadius = '2px';
  progressBg.style.backgroundColor = isDark ? 'rgba(110, 118, 129, 0.3)' : '#e1e4e8';
  progressBg.style.overflow = 'hidden';

  // Progress bar fill
  const progressFill = document.createElement('div');
  progressFill.id = 'github-ext-progress-fill';
  progressFill.style.width = '0%';
  progressFill.style.height = '100%';
  progressFill.style.borderRadius = '2px';
  progressFill.style.background = 'linear-gradient(90deg, #238636, #2ea043, #238636)';
  progressFill.style.backgroundSize = '200% 100%';
  progressFill.style.animation = 'shimmer 1.5s ease-in-out infinite';
  progressFill.style.transition = 'width 0.3s ease';

  // Status message
  const statusMsg = document.createElement('div');
  statusMsg.id = 'github-ext-status-msg';
  statusMsg.textContent = message;
  statusMsg.style.marginTop = '8px';
  statusMsg.style.fontSize = '12px';
  statusMsg.style.color = isDark ? '#8b949e' : '#586069';

  progressBg.appendChild(progressFill);
  progressContainer.appendChild(progressBg);
  progressContainer.appendChild(statusMsg);

  cell.appendChild(heading);
  cell.appendChild(progressContainer);
  section.appendChild(cell);

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  section.appendChild(style);

  // Insert at the top
  const languageHeader = Array.from(borderGrid.querySelectorAll('h2')).find(h => h.textContent === 'Languages');
  if (languageHeader) {
    const languageRow = languageHeader.closest('.BorderGrid-row');
    if (languageRow && languageRow.nextSibling) {
      borderGrid.insertBefore(section, languageRow.nextSibling);
    } else {
      borderGrid.appendChild(section);
    }
  } else {
    borderGrid.insertBefore(section, borderGrid.firstChild);
  }
}

function updateLoadingProgress(percent: number, message: string) {
  const progressFill = document.getElementById('github-ext-progress-fill');
  const statusMsg = document.getElementById('github-ext-status-msg');

  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }
  if (statusMsg) {
    statusMsg.textContent = message;
  }
}

function removeLoadingState() {
  const loadingSection = document.getElementById(LOADING_SIDEBAR_ID);
  if (loadingSection) {
    loadingSection.remove();
  }
}

export default defineContentScript({
  matches: ['*://github.com/*'],
  main() {
    console.log('GitHub Stack Detector Loaded');

    const scanAndDisplay = async () => {
      // 1. Identify Repo context
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return; // Not a repo view
      const [owner, repo] = pathParts;

      const cacheKey = `gitstack-cache-${owner}-${repo}`;
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      // Check localStorage for cached results
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { techs, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // If cache is fresh enough, show immediately
          if (age < CACHE_TTL && techs.length > 0) {
            console.log('[GitStack] Showing cached results', techs.length, 'technologies');
            injectSidebar(techs);

            // Still refresh in background if cache is older than 2 minutes
            if (age > 2 * 60 * 1000) {
              console.log('[GitStack] Background refresh triggered');
              performScan(owner, repo, cacheKey, false);
            }
            return;
          }
        }
      } catch (e) {
        console.log('[GitStack] Cache read error', e);
      }

      // No valid cache, perform full scan with loading UI
      await performScan(owner, repo, cacheKey, true);
    };

    const performScan = async (owner: string, repo: string, cacheKey: string, showLoading: boolean) => {
      if (showLoading) {
        injectLoadingState('Scanning repository...');
      }

      const detectedSet = new Set<string>();

      // 2. Fetch full repository tree for deep scanning
      if (showLoading) updateLoadingProgress(20, 'Fetching file tree...');
      const allFilePaths = await fetchRepoTree(owner, repo);
      const hasTreeData = allFilePaths.length > 0;
      if (showLoading) updateLoadingProgress(40, `Found ${allFilePaths.length} files...`);

      // 3. Scan using tree data (deep) or fall back to visible files (shallow)
      if (hasTreeData) {
        // Deep scan: Match against all files in the repository
        console.log('[GitStack] Performing deep scan with', allFilePaths.length, 'files');

        signatures.forEach(sig => {
          // Check file patterns
          if (sig.files && sig.files.some(f => matchesFilePattern(allFilePaths, f))) {
            detectedSet.add(sig.name);
          }
          // Check extensions
          if (sig.extensions && sig.extensions.some(ext => matchesExtension(allFilePaths, ext))) {
            detectedSet.add(sig.name);
          }
        });
      } else {
        // Shallow scan: Only check visible files in file explorer (fallback)
        console.log('[GitStack] Falling back to shallow scan');

        const fileElements = document.querySelectorAll('.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a');
        let fileNames = Array.from(fileElements).map(el => el.textContent?.trim() || '');

        if (fileNames.length === 0) {
          const legacyElements = document.querySelectorAll('.js-navigation-item .js-navigation-open');
          fileNames = Array.from(legacyElements).map(el => el.textContent?.trim() || '').filter(Boolean);
        }

        if (fileNames.length === 0) {
          const rowItems = document.querySelectorAll('tr.react-directory-row td.react-directory-row-name-cell-large-screen a');
          fileNames = Array.from(rowItems).map(el => el.textContent?.trim() || '').filter(Boolean);
        }

        signatures.forEach(sig => {
          if (sig.files && sig.files.some(f => fileNames.includes(f))) detectedSet.add(sig.name);
          if (sig.extensions && sig.extensions.some(ext => fileNames.some(f => f.endsWith(ext)))) detectedSet.add(sig.name);
        });
      }

      // 4. Deep Scan: Fetch ALL package.json files for workspace/monorepo support
      // Plus other config files for different ecosystems

      // Find all package.json files in the repository (for monorepo/workspace support)
      const packageJsonPaths = hasTreeData
        ? allFilePaths.filter(p => p.endsWith('package.json'))
        : ['package.json']; // Fallback to root only

      console.log(`[GitStack] Found ${packageJsonPaths.length} package.json files to scan`);
      if (showLoading) updateLoadingProgress(60, `Fetching ${Math.min(packageJsonPaths.length, 20)} package files...`);

      // Other ecosystem config files (root only for these)
      const otherConfigFiles = [
        { name: 'Cargo.toml', parser: 'text' },
        { name: 'go.mod', parser: 'text' },
        { name: 'pyproject.toml', parser: 'text' },
        { name: 'requirements.txt', parser: 'text' },
        { name: 'composer.json', parser: 'json' },
        { name: 'Gemfile', parser: 'text' },
      ];

      // Fetch all package.json files in parallel (limit to first 20 to avoid rate limits)
      const packageJsonsToFetch = packageJsonPaths.slice(0, 20);
      const packageJsonPromises = packageJsonsToFetch.map(async (filePath) => {
        try {
          const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filePath}`;
          const res = await fetch(fileUrl);
          if (!res.ok) return null;
          const text = await res.text();
          return { name: filePath, content: text, parser: 'json' };
        } catch (e) {
          return null;
        }
      });

      // Fetch other config files
      const otherConfigPromises = otherConfigFiles.map(async (file) => {
        try {
          const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.name}`;
          const res = await fetch(fileUrl);
          if (!res.ok) return null;
          const text = await res.text();
          return { name: file.name, content: text, parser: file.parser };
        } catch (e) {
          return null;
        }
      });

      const allFetchPromises = [...packageJsonPromises, ...otherConfigPromises];
      const results = await Promise.allSettled(allFetchPromises);

      const dependencySet = new Set<string>();

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const { name, content, parser } = result.value;

          if (parser === 'json') {
            try {
              const json = JSON.parse(content);
              // Merging common dependency keys
              const deps = {
                ...json.dependencies,
                ...json.devDependencies,
                ...json.peerDependencies,
                ...json.optionalDependencies,
                ...json['require-dev'],
                ...json.require
              };
              Object.keys(deps).forEach(d => dependencySet.add(d));

              // Also check for workspace packages (to detect internal packages)
              if (json.name && json.name.startsWith('@')) {
                dependencySet.add(json.name);
              }
            } catch (e) {/* ignore json error */ }
          } else {
            // For text files like Cargo.toml or requirements.txt, we do a simpler substring/regex check
            // This is a heuristic: if the package name appears in the file, we count it.
            dependencySet.add('__TEXT_CONTENT__' + content);
          }
        }
      });

      console.log(`[GitStack] Collected ${dependencySet.size} unique dependencies from all package.json files`);
      if (showLoading) updateLoadingProgress(80, 'Analyzing dependencies...');

      // Match against signatures
      signatures.forEach(sig => {
        // Check packageJSONDependencies (or generic dependencies for other languages)
        if (sig.packageJSONDependencies) {
          const isMatch = sig.packageJSONDependencies.some(dep => {
            // Check in parsed JSON dependencies
            if (dependencySet.has(dep)) return true;

            // Check in raw text content of other files (fallback for non-JSON configs)
            // We iterate over the text content entries we stored with a prefix
            for (const item of dependencySet) {
              if (item.startsWith('__TEXT_CONTENT__')) {
                // Strict check: assume dep name usually followed by version or used strictly
                if (item.includes(dep)) return true;
              }
            }
            return false;
          });
          if (isMatch) detectedSet.add(sig.name);
        }
      });

      const techsArray = Array.from(detectedSet);

      // Save to localStorage cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          techs: techsArray,
          timestamp: Date.now()
        }));
        console.log('[GitStack] Cached', techsArray.length, 'technologies');
      } catch (e) {
        console.log('[GitStack] Cache write error', e);
      }

      if (showLoading) {
        updateLoadingProgress(100, `Found ${detectedSet.size} technologies!`);
        // Small delay to show the completion message, then replace with actual sidebar
        await new Promise(resolve => setTimeout(resolve, 300));
        removeLoadingState();
      }

      // 4. Inject into Sidebar
      if (detectedSet.size > 0) {
        injectSidebar(techsArray);
      }
    };

    // Debounce/Navigation handling
    let timeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(scanAndDisplay, 1000); // Give React time to render
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    setTimeout(scanAndDisplay, 1000);

    // Start profile page feature
    startProfileFeature();
  },
});

// Cache for SVGL results to avoid rate limits
const logoCache = new Map<string, string | null>();

// Determine category for a tech name based on naming patterns and known categories
function getTechCategory(name: string): string {
  // Effect ecosystem
  if (name.startsWith('Effect')) return 'Effect';

  // Package managers
  if (['pnpm', 'npm', 'Yarn', 'Bun', 'Deno'].includes(name)) return 'Package Manager';

  // Languages
  const languages = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'Kotlin', 'Swift', 'Dart', 'C', 'C++', 'C#', 'PHP', 'Ruby', 'Elixir', 'Scala', 'Haskell', 'Lua', 'Zig', 'Solidity', 'Mojo', 'Julia'];
  if (languages.includes(name)) return 'Language';

  // Frameworks
  const frameworks = ['React', 'Vue', 'Svelte', 'Angular', 'Next.js', 'Nuxt', 'Astro', 'Remix', 'SvelteKit', 'SolidJS', 'Qwik', 'Preact', 'Ember.js', 'Express.js', 'Fastify', 'NestJS', 'Hono', 'Elysia', 'Django', 'FastAPI', 'Flask', 'Laravel', 'Spring Boot', 'TanStack Start'];
  if (frameworks.includes(name)) return 'Framework';

  // Styling & UI
  const styling = ['Tailwind CSS v4', 'Tailwind CSS v3', 'shadcn/ui', 'daisyUI', 'Radix UI', 'Mantine', 'Panda CSS', 'UnoCSS', 'Bootstrap', 'Chakra UI', 'Material UI', 'Headless UI', 'Ant Design', 'HeroUI (NextUI)', 'Ark UI', 'Magic UI', 'Flowbite'];
  if (styling.includes(name)) return 'Styling & UI';

  // Database & ORM
  const database = ['Prisma', 'Drizzle ORM', 'Kysely', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Supabase', 'PlanetScale', 'Neon', 'Convex', 'PocketBase', 'SurrealDB', 'Appwrite', 'SQLx'];
  if (database.includes(name)) return 'Database & ORM';

  // Testing
  const testing = ['Jest', 'Vitest', 'Cypress', 'Playwright', 'Storybook', 'Vitest Browser', 'Vitest Coverage'];
  if (testing.includes(name)) return 'Testing';

  // Build Tools
  const buildTools = ['Vite', 'Webpack', 'Rollup', 'Parcel', 'Esbuild', 'Babel', 'Turbopack', 'Rspack', 'Rsbuild', 'Swc', 'Biome', 'ESLint', 'Prettier', 'Turborepo', 'Nx', 'Changesets', 'Lerna', 'Rush', 'tsx', 'ts-node', 'tsup', 'tstyche', 'Madge', 'jscodeshift', 'Oxc', 'Rolldown', 'Lightning CSS'];
  if (buildTools.includes(name)) return 'Build Tools';

  // State Management
  const stateManagement = ['Redux', 'XState', 'Recoil', 'MobX', 'Zustand', 'Jotai', 'TanStack Query'];
  if (stateManagement.includes(name)) return 'State Management';

  // Authentication
  const auth = ['NextAuth.js / Auth.js', 'Lucia Auth', 'Clerk', 'Kinde', 'Auth0', 'Better Auth', 'Passport'];
  if (auth.includes(name)) return 'Authentication';

  // AI & ML
  const aiml = ['OpenAI', 'Anthropic', 'LangChain', 'LlamaIndex', 'PyTorch', 'TensorFlow', 'Hugging Face', 'Mistral AI', 'Ollama', 'Groq', 'Cohere', 'DeepSeek', 'Replicate', 'Stability AI', 'Pinecone', 'ONNX', 'JAX', 'Keras', 'Scikit-learn'];
  if (aiml.includes(name)) return 'AI & ML';

  // DevOps & Infrastructure
  const devops = ['Docker', 'Terraform', 'Pulumi', 'GitHub Actions', 'Vercel', 'Netlify', 'Cloudflare', 'AWS', 'Google Cloud', 'Azure', 'Heroku', 'Fly.io', 'Railway', 'Nginx', 'Zeabur', 'Coolify', 'Nix', 'OpenTofu', 'Sentry', 'Datadog', 'PostHog'];
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

  // Default to Other
  return 'Other';
}

// Category display order
const CATEGORY_ORDER = [
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
  'Package Manager',
  'Other'
];

function injectSidebar(techNames: string[]) {
  const sidebarId = 'github-ext-stack-sidebar';
  // Check typical GitHub theme state
  const isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
    (document.documentElement.getAttribute('data-color-mode') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Group tech names by category
  const grouped = new Map<string, string[]>();
  techNames.forEach(name => {
    const category = getTechCategory(name);
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(name);
  });

  // Sort categories by predefined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => grouped.has(cat));

  // Remove existing sidebar if present
  const existing = document.getElementById(sidebarId);
  if (existing) {
    existing.remove();
  }

  const borderGrid = document.querySelector('.Layout-sidebar .BorderGrid');
  if (!borderGrid) return;

  const section = document.createElement('div');
  section.id = sidebarId;
  section.className = 'BorderGrid-row';

  const cell = document.createElement('div');
  cell.className = 'BorderGrid-cell';

  const heading = document.createElement('h2');
  heading.className = 'h4 mb-3';
  heading.textContent = 'Tech Stack';
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.gap = '8px';

  // Add total count badge
  const countBadge = document.createElement('span');
  countBadge.textContent = `${techNames.length}`;
  countBadge.style.fontSize = '12px';
  countBadge.style.padding = '2px 8px';
  countBadge.style.borderRadius = '10px';
  countBadge.style.backgroundColor = isDark ? 'rgba(110, 118, 129, 0.4)' : '#e1e4e8';
  countBadge.style.color = isDark ? '#8b949e' : '#586069';
  heading.appendChild(countBadge);

  cell.appendChild(heading);

  // Create grouped sections
  sortedCategories.forEach(category => {
    const items = grouped.get(category)!;

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.display = 'flex';
    categoryHeader.style.alignItems = 'center';
    categoryHeader.style.justifyContent = 'space-between';
    categoryHeader.style.marginTop = '12px';
    categoryHeader.style.marginBottom = '8px';
    categoryHeader.style.cursor = 'pointer';
    categoryHeader.style.userSelect = 'none';

    const categoryTitle = document.createElement('span');
    categoryTitle.textContent = category;
    categoryTitle.style.fontSize = '12px';
    categoryTitle.style.fontWeight = '600';
    categoryTitle.style.textTransform = 'uppercase';
    categoryTitle.style.letterSpacing = '0.5px';
    categoryTitle.style.color = isDark ? '#8b949e' : '#586069';

    const categoryCount = document.createElement('span');
    categoryCount.textContent = `${items.length}`;
    categoryCount.style.fontSize = '11px';
    categoryCount.style.padding = '1px 6px';
    categoryCount.style.borderRadius = '8px';
    categoryCount.style.backgroundColor = isDark ? 'rgba(110, 118, 129, 0.2)' : '#f1f3f5';
    categoryCount.style.color = isDark ? '#8b949e' : '#586069';

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(categoryCount);

    // Items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'stack-list';
    itemsContainer.style.display = 'flex';
    itemsContainer.style.flexWrap = 'wrap';
    itemsContainer.style.gap = '6px';

    items.forEach(name => {
      const item = createSidebarItem(name, isDark);
      itemsContainer.appendChild(item);
    });

    // Toggle collapse on header click
    let isCollapsed = false;
    categoryHeader.onclick = () => {
      isCollapsed = !isCollapsed;
      itemsContainer.style.display = isCollapsed ? 'none' : 'flex';
      categoryTitle.style.opacity = isCollapsed ? '0.6' : '1';
    };

    cell.appendChild(categoryHeader);
    cell.appendChild(itemsContainer);
  });

  section.appendChild(cell);

  const languageHeader = Array.from(borderGrid.querySelectorAll('h2')).find(h => h.textContent === 'Languages');
  if (languageHeader) {
    const languageRow = languageHeader.closest('.BorderGrid-row');
    if (languageRow && languageRow.nextSibling) {
      borderGrid.insertBefore(section, languageRow.nextSibling);
    } else {
      borderGrid.appendChild(section);
    }
  } else {
    borderGrid.insertBefore(section, borderGrid.firstChild);
  }
}

function createSidebarItem(text: string, isDark: boolean) {
  const span = document.createElement('span');

  // Base styles
  span.style.padding = '6px 12px 6px 8px'; // Increased padding
  span.style.minHeight = '32px'; // Taller
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.gap = '8px'; // More space between icon and text
  span.style.borderRadius = '100px';
  span.style.fontSize = '13px'; // Slightly larger text
  span.style.fontWeight = '500';
  span.style.cursor = 'default';
  span.style.transition = 'all 0.2s ease';
  span.style.border = '1px solid transparent';
  span.style.userSelect = 'none';

  // Icon container (placeholder initially)
  const icon = document.createElement('img');
  icon.style.width = '16px'; // Larger icon
  icon.style.height = '16px';
  icon.style.objectFit = 'contain';
  icon.style.display = 'none'; // Hidden until loaded

  const label = document.createElement('span');
  label.textContent = text;
  label.style.lineHeight = '16px';

  span.appendChild(icon);
  span.appendChild(label);

  if (isDark) {
    // Dark Mode: Neutral/Gray-ish look
    span.style.backgroundColor = 'rgba(110, 118, 129, 0.1)'; // Subtle gray
    span.style.color = '#c9d1d9'; // GitHub text main
    span.style.border = '1px solid rgba(110, 118, 129, 0.4)';
    span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.5)';

    span.onmouseenter = () => {
      span.style.backgroundColor = 'rgba(110, 118, 129, 0.25)';
      span.style.borderColor = '#8b949e';
      span.style.transform = 'translateY(-1px)';
    };
    span.onmouseleave = () => {
      span.style.backgroundColor = 'rgba(110, 118, 129, 0.1)';
      span.style.borderColor = 'rgba(110, 118, 129, 0.4)';
      span.style.transform = 'translateY(0)';
    };
  } else {
    // Light Mode: Neutral/Gray-ish look
    span.style.backgroundColor = '#f6f8fa';
    span.style.color = '#24292f';
    span.style.border = '1px solid #d0d7de';

    span.onmouseenter = () => {
      span.style.backgroundColor = '#eaeef2';
      span.style.borderColor = '#0969da'; // Hint of blue on hover
      span.style.transform = 'translateY(-1px)';
    };
    span.onmouseleave = () => {
      span.style.backgroundColor = '#f6f8fa';
      span.style.borderColor = '#d0d7de';
      span.style.transform = 'translateY(0)';
    };
  }

  // Click handler for modal
  span.style.cursor = 'pointer';
  span.onclick = (e) => {
    e.stopPropagation();
    showTechModal(text, isDark, icon.src);
  };

  // Async fetch logo
  fetchLogo(text, isDark).then(url => {
    if (url) {
      icon.src = url;
      icon.style.display = 'block';
    }
  });

  return span;
}

// Global modal reference
let activeModal: HTMLElement | null = null;

async function showTechModal(techName: string, isDark: boolean, logoUrl?: string) {
  if (activeModal) activeModal.remove();

  // Create Overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.onclick = () => overlay.remove(); // Close on background click

  // Create Modal Card
  const modal = document.createElement('div');
  modal.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking inside
  modal.style.width = '400px';
  modal.style.maxWidth = '90%';
  modal.style.borderRadius = '12px';
  modal.style.padding = '24px';
  modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.gap = '16px';

  if (isDark) {
    modal.style.backgroundColor = '#0d1117';
    modal.style.color = '#c9d1d9';
    modal.style.border = '1px solid #30363d';
  } else {
    modal.style.backgroundColor = '#ffffff';
    modal.style.color = '#24292f';
    modal.style.border = '1px solid #d0d7de';
  }

  // Content
  // 1. Header with Logo & Title
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '12px';

  if (logoUrl) {
    const img = document.createElement('img');
    img.src = logoUrl;
    img.style.width = '48px';
    img.style.height = '48px';
    img.style.objectFit = 'contain';
    header.appendChild(img);
  }

  const title = document.createElement('h2');
  title.textContent = techName;
  title.style.margin = '0';
  title.style.fontSize = '24px';
  header.appendChild(title);

  // Fetch extra details if possible (using SVGL primarily)
  // We can reuse the cache or fetch fresh if needed, but we likely already have it.
  // For this generic "details", we will assume basic SVGL data is all we have unless we add a dictionary.

  const cacheKey = `${techName}-${isDark ? 'dark' : 'light'}`;
  let websiteUrl = `https://google.com/search?q=${encodeURIComponent(techName)}`;
  let category = 'Unknown';

  // Try to recover data from cache or re-fetch for details
  // Note: Better to cache the whole object, but for now we just re-fetch quickly since it's likely cached by browser or we can just fetch.
  // We'll show a loading state if we want, but let's just make it fast.
  const infoCtn = document.createElement('div');
  infoCtn.innerHTML = `<p style="opacity: 0.7;">Loading details...</p>`;

  modal.appendChild(header);
  modal.appendChild(infoCtn);

  // Close Button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '8px 16px';
  closeBtn.style.marginTop = '8px';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.alignSelf = 'flex-end';
  closeBtn.style.fontWeight = '600';

  if (isDark) {
    closeBtn.style.backgroundColor = '#238636'; // GitHub Green
    closeBtn.style.color = '#ffffff';
  } else {
    closeBtn.style.backgroundColor = '#1f883d';
    closeBtn.style.color = '#ffffff';
  }
  closeBtn.onclick = () => overlay.remove();

  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  activeModal = overlay;

  // Fetch details to populate
  try {
    const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(techName)}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const match = data.find((item: any) => item.title.toLowerCase() === techName.toLowerCase()) || data[0];
      websiteUrl = match.url;
      category = Array.isArray(match.category) ? match.category.join(', ') : match.category;

      infoCtn.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div><strong>Category:</strong> ${category}</div>
            <div><strong>Website:</strong> <a href="${websiteUrl}" target="_blank" style="color: #0969da; text-decoration: none;">${websiteUrl}</a></div>
            <div style="font-size: 0.9em; opacity: 0.8; margin-top: 8px;">
              Check out official documentation or resources to learn more about ${techName}.
            </div>
          </div>
        `;
    } else {
      infoCtn.innerHTML = `<p>No specific details found. <a href="${websiteUrl}" target="_blank" style="color: #0969da;">Search on Google</a></p>`;
    }
  } catch (e) {
    infoCtn.innerHTML = `<p>Failed to load details. <a href="${websiteUrl}" target="_blank" style="color: #0969da;">Search on Google</a></p>`;
  }
}


// Fetch logo from SVGL or local signatures
async function fetchLogo(techName: string, isDark: boolean): Promise<string | null> {
  const cacheKey = `${techName}-${isDark ? 'dark' : 'light'}`;
  if (logoCache.has(cacheKey)) return logoCache.get(cacheKey) || null;

  // 1. Check local signatures first
  const localSig = signatures.find(s => s.name === techName);
  if (localSig?.logo) {
    let url: string | undefined;
    if (typeof localSig.logo === 'string') {
      url = localSig.logo;
    } else {
      url = isDark ? localSig.logo.dark : localSig.logo.light;
    }

    if (url) {
      logoCache.set(cacheKey, url);
      return url;
    }
  }

  // 2. Fallback to API if not defined in signatures.ts
  try {
    const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(techName)}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Find exact match first, then fallback
      const match = data.find((item: any) => item.title.toLowerCase() === techName.toLowerCase()) || data[0];

      let url = match.route;
      if (typeof url === 'object') {
        url = isDark ? (url.dark || url.light) : (url.light || url.dark);
      } else if (typeof url === 'string') {
        // If it's a single string, it's the url
      }

      logoCache.set(cacheKey, url);
      return url;
    }
  } catch (e) {
    console.warn('Failed to fetch logo for', techName, e);
  }

  logoCache.set(cacheKey, null); // Cache miss to prevent retry
  return null;
}

// ============================================================================
// PROFILE PAGE FEATURE - Aggregate tech stack across user's repositories
// ============================================================================

const PROFILE_SIDEBAR_ID = 'github-ext-profile-stack';
const PROFILE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_QUICK_SCAN_REPOS = 5;

// Reserved GitHub paths that are NOT user profiles
const RESERVED_PATHS = [
  'explore', 'topics', 'trending', 'collections', 'events',
  'sponsors', 'about', 'pricing', 'features', 'enterprise',
  'team', 'security', 'customer-stories', 'readme', 'new',
  'organizations', 'settings', 'notifications', 'pulls', 'issues',
  'marketplace', 'apps', 'codespaces', 'discussions', 'orgs', 'users',
  'search', 'login', 'signup', 'join', 'stars', 'watching', 'repositories'
];

function isProfilePage(): boolean {
  const parts = location.pathname.split('/').filter(Boolean);
  // Profile: exactly one segment, not a reserved path, not containing special chars
  if (parts.length !== 1) return false;
  const username = parts[0];
  if (RESERVED_PATHS.includes(username.toLowerCase())) return false;
  if (username.startsWith('.') || username.includes('?')) return false;
  return true;
}

function getProfileUsername(): string | null {
  if (!isProfilePage()) return null;
  return location.pathname.split('/').filter(Boolean)[0];
}

interface RepoInfo {
  name: string;
  owner: { login: string };
  full_name: string;
  default_branch: string;
  stargazers_count: number;
  pushed_at: string;
}

async function fetchUserRepos(username: string): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];
  let page = 1;
  const maxPages = 3; // Limit to 300 repos max

  try {
    while (page <= maxPages) {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      repos.push(...data);
      if (data.length < 100) break; // Last page
      page++;
    }
  } catch (e) {
    console.warn('[GitStack] Failed to fetch repos for', username, e);
  }

  console.log(`[GitStack] Found ${repos.length} repos for ${username}`);
  return repos;
}

function aggregateFromCache(repos: RepoInfo[]): { techs: string[], cachedCount: number } {
  const allTechs = new Set<string>();
  let cachedCount = 0;

  for (const repo of repos) {
    const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { techs, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        // Use cache if less than 1 hour old
        if (age < 60 * 60 * 1000 && Array.isArray(techs)) {
          techs.forEach((t: string) => allTechs.add(t));
          cachedCount++;
        }
      }
    } catch (e) {
      // Ignore cache read errors
    }
  }

  return { techs: Array.from(allTechs), cachedCount };
}

function getUncachedRepos(repos: RepoInfo[]): RepoInfo[] {
  return repos.filter(repo => {
    const cacheKey = `gitstack-cache-${repo.owner.login}-${repo.name}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return Date.now() - timestamp > 60 * 60 * 1000; // Stale if > 1 hour
      }
    } catch (e) { }
    return true; // Not cached
  });
}

async function scanRepoQuick(repo: RepoInfo): Promise<string[]> {
  const { owner, name } = repo;
  const detectedSet = new Set<string>();

  try {
    // Fetch tree
    const treePaths = await fetchRepoTree(owner.login, name);

    if (treePaths.length > 0) {
      signatures.forEach(sig => {
        if (sig.files && sig.files.some(f => matchesFilePattern(treePaths, f))) {
          detectedSet.add(sig.name);
        }
        if (sig.extensions && sig.extensions.some(ext => matchesExtension(treePaths, ext))) {
          detectedSet.add(sig.name);
        }
      });

      // Quick package.json check (root only for speed)
      const packageJsonPaths = treePaths.filter(p => p === 'package.json' || p.endsWith('/package.json')).slice(0, 3);
      for (const filePath of packageJsonPaths) {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/${owner.login}/${name}/HEAD/${filePath}`);
          if (res.ok) {
            const text = await res.text();
            const json = JSON.parse(text);
            const deps = { ...json.dependencies, ...json.devDependencies };
            signatures.forEach(sig => {
              if (sig.packageJSONDependencies?.some(dep => deps[dep])) {
                detectedSet.add(sig.name);
              }
            });
          }
        } catch (e) { }
      }
    }

    // Cache result
    const techsArray = Array.from(detectedSet);
    const cacheKey = `gitstack-cache-${owner.login}-${name}`;
    localStorage.setItem(cacheKey, JSON.stringify({ techs: techsArray, timestamp: Date.now() }));

    return techsArray;
  } catch (e) {
    console.warn('[GitStack] Quick scan failed for', repo.full_name, e);
    return [];
  }
}

async function scanAndDisplayProfile(username: string) {
  const profileCacheKey = `gitstack-profile-${username}`;

  // Check profile-level cache
  try {
    const cached = localStorage.getItem(profileCacheKey);
    if (cached) {
      const { techs, timestamp, repoCount } = JSON.parse(cached);
      if (Date.now() - timestamp < PROFILE_CACHE_TTL && techs.length > 0) {
        console.log('[GitStack] Using cached profile data for', username);
        injectProfileSidebar(techs, repoCount, username, false);
        return;
      }
    }
  } catch (e) { }

  // Show loading state
  injectProfileLoadingState(username);

  // Fetch repos
  const repos = await fetchUserRepos(username);
  if (repos.length === 0) {
    removeProfileLoadingState();
    return;
  }

  // Get cached results
  const { techs: cachedTechs, cachedCount } = aggregateFromCache(repos);

  // Show cached results immediately if we have any
  if (cachedTechs.length > 0) {
    removeProfileLoadingState();
    injectProfileSidebar(cachedTechs, cachedCount, username, true);
  }

  // Select repos to scan: top 5 starred + 5 most recently pushed (deduped)
  const uncached = getUncachedRepos(repos);

  // Sort by stars (descending)
  const byStars = [...uncached].sort((a, b) => b.stargazers_count - a.stargazers_count);
  const topStarred = byStars.slice(0, 5);

  // Sort by recent push (descending)
  const byRecent = [...uncached].sort((a, b) =>
    new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
  );
  const topRecent = byRecent.slice(0, 5);

  // Merge and dedupe
  const toScanSet = new Set<string>();
  const toScan: RepoInfo[] = [];
  [...topStarred, ...topRecent].forEach(repo => {
    if (!toScanSet.has(repo.full_name)) {
      toScanSet.add(repo.full_name);
      toScan.push(repo);
    }
  });

  if (toScan.length > 0) {
    console.log(`[GitStack] Quick scanning ${toScan.length} uncached repos`);

    const newTechs = new Set<string>(cachedTechs);
    let scannedCount = cachedCount;

    for (const repo of toScan) {
      const techs = await scanRepoQuick(repo);
      techs.forEach(t => newTechs.add(t));
      scannedCount++;

      // Update UI progressively
      removeProfileLoadingState();
      injectProfileSidebar(Array.from(newTechs), scannedCount, username, uncached.length > toScan.length);

      // Rate limit protection
      await new Promise(r => setTimeout(r, 300));
    }

    // Cache aggregated profile result
    localStorage.setItem(profileCacheKey, JSON.stringify({
      techs: Array.from(newTechs),
      timestamp: Date.now(),
      repoCount: scannedCount
    }));
  } else if (cachedTechs.length === 0) {
    removeProfileLoadingState();
  }
}

function injectProfileLoadingState(username: string) {
  if (document.getElementById(PROFILE_SIDEBAR_ID)) return;

  const sidebar = document.querySelector('.Layout-sidebar');
  if (!sidebar) return;

  const isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
    (document.documentElement.getAttribute('data-color-mode') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const container = document.createElement('div');
  container.id = PROFILE_SIDEBAR_ID;
  container.style.marginTop = '16px';
  container.style.padding = '16px';
  container.style.borderRadius = '6px';
  container.style.border = `1px solid ${isDark ? '#30363d' : '#d0d7de'}`;
  container.style.backgroundColor = isDark ? '#0d1117' : '#ffffff';

  const heading = document.createElement('h2');
  heading.className = 'h4 mb-2';
  heading.textContent = 'Tech Stack';
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.gap = '8px';

  const loadingText = document.createElement('div');
  loadingText.textContent = `Scanning ${username}'s repositories...`;
  loadingText.style.fontSize = '12px';
  loadingText.style.color = isDark ? '#8b949e' : '#586069';
  loadingText.style.marginTop = '8px';

  container.appendChild(heading);
  container.appendChild(loadingText);

  // Insert after vcard or at sidebar start
  const vcard = sidebar.querySelector('.vcard-details, .js-profile-editable-area');
  if (vcard && vcard.parentElement) {
    vcard.parentElement.insertBefore(container, vcard.nextSibling);
  } else {
    sidebar.insertBefore(container, sidebar.firstChild);
  }
}

function removeProfileLoadingState() {
  const existing = document.getElementById(PROFILE_SIDEBAR_ID);
  if (existing) existing.remove();
}

function injectProfileSidebar(techNames: string[], repoCount: number, username: string, hasMore: boolean) {
  removeProfileLoadingState();

  const sidebar = document.querySelector('.Layout-sidebar');
  if (!sidebar) return;

  const isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
    (document.documentElement.getAttribute('data-color-mode') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Group by category
  const grouped = new Map<string, string[]>();
  techNames.forEach(name => {
    const category = getTechCategory(name);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(name);
  });

  const sortedCategories = CATEGORY_ORDER.filter(cat => grouped.has(cat));

  const container = document.createElement('div');
  container.id = PROFILE_SIDEBAR_ID;
  container.style.marginTop = '16px';
  container.style.padding = '16px';
  container.style.borderRadius = '6px';
  container.style.border = `1px solid ${isDark ? '#30363d' : '#d0d7de'}`;
  container.style.backgroundColor = isDark ? '#0d1117' : '#ffffff';

  // Header
  const heading = document.createElement('h2');
  heading.className = 'h4 mb-2';
  heading.textContent = 'Tech Stack';
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.gap = '8px';

  const countBadge = document.createElement('span');
  countBadge.textContent = `${techNames.length}`;
  countBadge.style.fontSize = '12px';
  countBadge.style.padding = '2px 8px';
  countBadge.style.borderRadius = '10px';
  countBadge.style.backgroundColor = isDark ? 'rgba(110, 118, 129, 0.4)' : '#e1e4e8';
  countBadge.style.color = isDark ? '#8b949e' : '#586069';
  heading.appendChild(countBadge);

  const subtitle = document.createElement('div');
  subtitle.textContent = `Based on ${repoCount} repositories`;
  subtitle.style.fontSize = '12px';
  subtitle.style.color = isDark ? '#8b949e' : '#586069';
  subtitle.style.marginBottom = '12px';

  container.appendChild(heading);
  container.appendChild(subtitle);

  // Tech items (simplified view - top techs only)
  const allItems = document.createElement('div');
  allItems.style.display = 'flex';
  allItems.style.flexWrap = 'wrap';
  allItems.style.gap = '6px';

  // Show top 20 techs max initially
  const topTechs = techNames.slice(0, 20);
  topTechs.forEach(name => {
    const item = createSidebarItem(name, isDark);
    allItems.appendChild(item);
  });

  container.appendChild(allItems);

  // Show more button if needed
  if (techNames.length > 20) {
    const showMoreBtn = document.createElement('button');
    showMoreBtn.textContent = `Show all ${techNames.length} technologies`;
    showMoreBtn.style.marginTop = '12px';
    showMoreBtn.style.padding = '6px 12px';
    showMoreBtn.style.fontSize = '12px';
    showMoreBtn.style.border = `1px solid ${isDark ? '#30363d' : '#d0d7de'}`;
    showMoreBtn.style.borderRadius = '6px';
    showMoreBtn.style.backgroundColor = 'transparent';
    showMoreBtn.style.color = isDark ? '#58a6ff' : '#0969da';
    showMoreBtn.style.cursor = 'pointer';
    showMoreBtn.style.width = '100%';

    showMoreBtn.onclick = () => {
      allItems.innerHTML = '';
      techNames.forEach(name => {
        allItems.appendChild(createSidebarItem(name, isDark));
      });
      showMoreBtn.remove();
    };

    container.appendChild(showMoreBtn);
  }

  // Scan more button if there are uncached repos
  if (hasMore) {
    const scanMoreBtn = document.createElement('button');
    scanMoreBtn.textContent = 'Scan more repositories';
    scanMoreBtn.style.marginTop = '8px';
    scanMoreBtn.style.padding = '6px 12px';
    scanMoreBtn.style.fontSize = '12px';
    scanMoreBtn.style.border = 'none';
    scanMoreBtn.style.borderRadius = '6px';
    scanMoreBtn.style.backgroundColor = isDark ? '#238636' : '#1f883d';
    scanMoreBtn.style.color = '#ffffff';
    scanMoreBtn.style.cursor = 'pointer';
    scanMoreBtn.style.width = '100%';
    scanMoreBtn.style.fontWeight = '500';

    scanMoreBtn.onclick = async () => {
      scanMoreBtn.disabled = true;
      scanMoreBtn.textContent = 'Scanning...';

      const repos = await fetchUserRepos(username);
      const uncached = getUncachedRepos(repos);
      const toScan = uncached.slice(0, 10); // Scan 10 more

      const currentTechs = new Set(techNames);
      for (const repo of toScan) {
        const techs = await scanRepoQuick(repo);
        techs.forEach(t => currentTechs.add(t));
        await new Promise(r => setTimeout(r, 300));
      }

      // Refresh UI
      injectProfileSidebar(Array.from(currentTechs), repoCount + toScan.length, username, uncached.length > toScan.length);
    };

    container.appendChild(scanMoreBtn);
  }

  // Insert into sidebar
  const vcard = sidebar.querySelector('.vcard-details, .js-profile-editable-area');
  if (vcard && vcard.parentElement) {
    vcard.parentElement.insertBefore(container, vcard.nextSibling);
  } else {
    sidebar.insertBefore(container, sidebar.firstChild);
  }
}

// Initialize profile scanning
function initProfileScanner() {
  const username = getProfileUsername();
  if (username) {
    console.log('[GitStack] Detected profile page for:', username);
    setTimeout(() => scanAndDisplayProfile(username), 500);
  }
}

// Start profile feature (called from content script main)
function startProfileFeature() {
  // Add profile scanner observer
  const profileObserver = new MutationObserver(() => {
    if (isProfilePage() && !document.getElementById(PROFILE_SIDEBAR_ID)) {
      const username = getProfileUsername();
      if (username) {
        setTimeout(() => scanAndDisplayProfile(username), 500);
      }
    }
  });

  profileObserver.observe(document.body, { childList: true, subtree: true });

  // Initial check
  setTimeout(initProfileScanner, 1000);
}
