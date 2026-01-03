/**
 * GitHub Stack Detector - Content Script
 * 
 * This is the main entry point that orchestrates the tech stack detection
 * for both repository pages and profile pages.
 */

import { signatures } from '../utils/signatures';
import { fetchRepoTree, fetchRawFile } from '../utils/api/github';
import { matchesFilePattern, matchesExtension } from '../utils/detection/tech-detection';
import { injectLoadingState, updateLoadingProgress, removeLoadingState } from '../utils/ui/loading';
import { injectSidebar } from '../utils/ui/sidebar';
import { startProfileFeature, isProfilePageCheck } from '../utils/profile/scanner';

// Reserved GitHub paths that are NOT user profiles or repos
const RESERVED_PATHS = [
  'settings', 'notifications', 'organizations', 'orgs', 'search',
  'marketplace', 'explore', 'topics', 'trending', 'collections',
  'events', 'sponsors', 'about', 'pricing', 'features', 'enterprise',
  'team', 'security', 'customer-stories', 'readme', 'new', 'codespaces',
  'discussions', 'users', 'login', 'signup', 'join', 'pulls', 'issues',
  'stars', 'watching', 'repositories', 'projects', 'packages', 'people'
];

export default defineContentScript({
  matches: ['*://github.com/*'],

  main() {
    console.log('GitHub Stack Detector Loaded');

    // Helper to check if current page is a repository page
    const isRepoPage = (): boolean => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return false;
      const [owner] = pathParts;
      return !RESERVED_PATHS.includes(owner.toLowerCase());
    };

    // Early exit if not on a repository or profile page
    if (!isRepoPage() && !isProfilePageCheck()) {
      console.log('[GitStack] Not a repository or profile page, skipping');
      return;
    }

    const scanAndDisplay = async (): Promise<void> => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return;
      const [owner, repo] = pathParts;

      const cacheKey = `gitstack-cache-${owner}-${repo}`;
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      // Check localStorage for cached results
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { techs, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          if (age < CACHE_TTL && techs.length > 0) {
            console.log('[GitStack] Showing cached results', techs.length, 'technologies');
            injectSidebar(techs);

            // Background refresh if cache is older than 2 minutes
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

      await performScan(owner, repo, cacheKey, true);
    };

    const performScan = async (
      owner: string,
      repo: string,
      cacheKey: string,
      showLoading: boolean
    ): Promise<void> => {
      if (showLoading) {
        injectLoadingState('Scanning repository...');
      }

      const detectedSet = new Set<string>();

      // Fetch full repository tree
      if (showLoading) updateLoadingProgress(20, 'Fetching file tree...');
      const allFilePaths = await fetchRepoTree(owner, repo);
      const hasTreeData = allFilePaths.length > 0;
      if (showLoading) updateLoadingProgress(40, `Found ${allFilePaths.length} files...`);

      // Scan using tree data or visible files
      if (hasTreeData) {
        console.log('[GitStack] Performing deep scan with', allFilePaths.length, 'files');

        signatures.forEach(sig => {
          if (sig.files?.some(f => matchesFilePattern(allFilePaths, f))) {
            detectedSet.add(sig.name);
          }
          if (sig.extensions?.some(ext => matchesExtension(allFilePaths, ext))) {
            detectedSet.add(sig.name);
          }
        });
      } else {
        // Shallow scan fallback
        console.log('[GitStack] Falling back to shallow scan');
        const fileElements = document.querySelectorAll(
          '.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a'
        );
        let fileNames = Array.from(fileElements).map(el => el.textContent?.trim() || '');

        if (fileNames.length === 0) {
          const legacyElements = document.querySelectorAll('.js-navigation-item .js-navigation-open');
          fileNames = Array.from(legacyElements).map(el => el.textContent?.trim() || '').filter(Boolean);
        }

        signatures.forEach(sig => {
          if (sig.files?.some(f => fileNames.includes(f))) detectedSet.add(sig.name);
          if (sig.extensions?.some(ext => fileNames.some(f => f.endsWith(ext)))) detectedSet.add(sig.name);
        });
      }

      // Fetch package.json and other config files
      if (showLoading) updateLoadingProgress(60, 'Fetching package files...');

      const packageJsonPaths = hasTreeData
        ? allFilePaths.filter(p => p.endsWith('package.json')).slice(0, 20)
        : ['package.json'];

      const otherConfigFiles = [
        'Cargo.toml', 'go.mod', 'pyproject.toml', 'requirements.txt', 'composer.json', 'Gemfile'
      ];

      const dependencySet = new Set<string>();

      // Fetch and parse config files
      const allFiles = [...packageJsonPaths, ...otherConfigFiles];
      const results = await Promise.allSettled(
        allFiles.map(filePath => fetchRawFile(owner, repo, filePath))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const content = result.value;
          const filePath = allFiles[index];

          if (filePath.endsWith('.json')) {
            try {
              const json = JSON.parse(content);
              const deps = {
                ...json.dependencies,
                ...json.devDependencies,
                ...json.peerDependencies,
                ...json.optionalDependencies,
              };
              Object.keys(deps).forEach(d => dependencySet.add(d));
            } catch { /* ignore */ }
          } else {
            dependencySet.add('__TEXT_CONTENT__' + content);
          }
        }
      });

      if (showLoading) updateLoadingProgress(80, 'Analyzing dependencies...');

      // Match dependencies against signatures
      signatures.forEach(sig => {
        if (sig.packageJSONDependencies) {
          const isMatch = sig.packageJSONDependencies.some(dep => {
            if (dependencySet.has(dep)) return true;
            for (const item of dependencySet) {
              if (item.startsWith('__TEXT_CONTENT__') && item.includes(dep)) return true;
            }
            return false;
          });
          if (isMatch) detectedSet.add(sig.name);
        }
      });

      const techsArray = Array.from(detectedSet);

      // Cache results
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
        await new Promise(resolve => setTimeout(resolve, 300));
        removeLoadingState();
      }

      if (detectedSet.size > 0) {
        injectSidebar(techsArray);
      }
    };

    // Navigation observer
    let timeout: NodeJS.Timeout;
    let lastPath = window.location.pathname;

    const observer = new MutationObserver(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        clearTimeout(timeout);
        timeout = setTimeout(scanAndDisplay, 1000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    setTimeout(scanAndDisplay, 1000);

    // Start profile feature
    startProfileFeature();
  },
});
