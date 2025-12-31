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

export default defineContentScript({
  matches: ['*://github.com/*'],
  main() {
    console.log('GitHub Stack Detector Loaded');

    const scanAndDisplay = async () => {
      // 1. Identify Repo context
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return; // Not a repo view
      const [owner, repo] = pathParts;

      const detectedSet = new Set<string>();

      // 2. Fetch full repository tree for deep scanning
      const allFilePaths = await fetchRepoTree(owner, repo);
      const hasTreeData = allFilePaths.length > 0;

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

      // 4. Deep Scan: Fetch key config files in parallel for dependency analysis
      // We define a list of files to check and how to parse them
      const configFiles = [
        { name: 'package.json', parser: 'json', key: 'dependencies' }, // & devDependencies
        { name: 'Cargo.toml', parser: 'text' },
        { name: 'go.mod', parser: 'text' },
        { name: 'pyproject.toml', parser: 'text' },
        { name: 'requirements.txt', parser: 'text' },
        { name: 'composer.json', parser: 'json' },
        { name: 'Gemfile', parser: 'text' },
      ];

      const fetchPromises = configFiles.map(async (file) => {
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

      const results = await Promise.allSettled(fetchPromises);

      const dependencySet = new Set<string>();

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const { name, content, parser } = result.value;

          if (parser === 'json') {
            try {
              const json = JSON.parse(content);
              // Merging common dependency keys
              const deps = { ...json.dependencies, ...json.devDependencies, ...json.peerDependencies, ...json['require-dev'], ...json.require };
              Object.keys(deps).forEach(d => dependencySet.add(d));
            } catch (e) {/* ignore json error */ }
          } else {
            // For text files like Cargo.toml or requirements.txt, we do a simpler substring/regex check
            // This is a heuristic: if the package name appears in the file, we count it.
            // We can be stricter (e.g., regex for `name = "..."` in toml), but for now simple inclusion is robust enough for detection.
            dependencySet.add('__TEXT_CONTENT__' + content);
          }
        }
      });

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

      // 4. Inject into Sidebar
      if (detectedSet.size > 0) {
        injectSidebar(Array.from(detectedSet));
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
  },
});

// Cache for SVGL results to avoid rate limits
const logoCache = new Map<string, string | null>();

function injectSidebar(techNames: string[]) {
  const sidebarId = 'github-ext-stack-sidebar';
  // Check typical GitHub theme state
  const isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
    (document.documentElement.getAttribute('data-color-mode') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (document.getElementById(sidebarId)) {
    const container = document.getElementById(sidebarId)!;
    const list = container.querySelector('.stack-list');
    if (list) {
      list.innerHTML = '';
      techNames.forEach(name => {
        const item = createSidebarItem(name, isDark);
        list.appendChild(item);
      });
    }
    return;
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

  const list = document.createElement('div');
  list.className = 'stack-list';
  list.style.display = 'flex';
  list.style.flexWrap = 'wrap';
  list.style.gap = '6px';

  techNames.forEach(name => {
    const item = createSidebarItem(name, isDark);
    list.appendChild(item);
  });

  cell.appendChild(heading);
  cell.appendChild(list);
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
