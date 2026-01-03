/**
 * Profile page UI components
 */

import { isDarkMode } from '../theme';
import { fetchLogo } from '../ui/logo';
import { showTechModal } from '../ui/modal';

const PROFILE_SIDEBAR_ID = 'github-ext-profile-stack';

/**
 * Get the profile sidebar element
 */
export function getProfileSidebar(): Element | null {
    const sidebars = document.querySelectorAll('.Layout-sidebar');
    for (const sidebar of sidebars) {
        if (sidebar.querySelector('.h-card')) {
            return sidebar;
        }
    }
    return sidebars[sidebars.length - 1] || null;
}

/**
 * Inject loading state on profile page
 */
export function injectProfileLoadingState(username: string): void {
    if (document.getElementById(PROFILE_SIDEBAR_ID)) return;

    const sidebar = getProfileSidebar();
    if (!sidebar) return;

    const isDark = isDarkMode();

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

    const loadingText = document.createElement('div');
    loadingText.textContent = `Scanning ${username}'s repositories...`;
    loadingText.style.fontSize = '12px';
    loadingText.style.color = isDark ? '#8b949e' : '#586069';
    loadingText.style.marginTop = '8px';

    container.appendChild(heading);
    container.appendChild(loadingText);

    // Insert AFTER the h-card to prevent profile picture from jumping up
    const hCard = sidebar.querySelector('.h-card');
    if (hCard) {
        hCard.insertAdjacentElement('afterend', container);
    } else {
        sidebar.appendChild(container);
    }
}

/**
 * Remove profile loading state
 */
export function removeProfileLoadingState(): void {
    const existing = document.getElementById(PROFILE_SIDEBAR_ID);
    if (existing) existing.remove();
}

/**
 * Inject empty state when no technologies found
 */
export function injectProfileEmptyState(username: string, repoCount: number): void {
    removeProfileLoadingState();

    const sidebar = getProfileSidebar();
    if (!sidebar) return;

    const isDark = isDarkMode();

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

    const emptyText = document.createElement('div');
    emptyText.textContent = 'No technologies detected';
    emptyText.style.fontSize = '13px';
    emptyText.style.color = isDark ? '#8b949e' : '#586069';
    emptyText.style.marginTop = '8px';

    const subtitle = document.createElement('div');
    subtitle.textContent = repoCount > 0 ? `Scanned ${repoCount} repositories` : 'No public repositories found';
    subtitle.style.fontSize = '12px';
    subtitle.style.color = isDark ? '#6e7681' : '#8b949e';
    subtitle.style.marginTop = '4px';

    container.appendChild(heading);
    container.appendChild(emptyText);
    container.appendChild(subtitle);

    // Insert AFTER the h-card to prevent profile picture from jumping up
    const hCard = sidebar.querySelector('.h-card');
    if (hCard) {
        hCard.insertAdjacentElement('afterend', container);
    } else {
        sidebar.appendChild(container);
    }
}

/**
 * Inject profile sidebar with tech stack
 */
export function injectProfileSidebar(
    techNames: string[],
    repoCount: number,
    username: string,
    hasMore: boolean,
    onScanMore: () => Promise<void>
): void {
    removeProfileLoadingState();

    const sidebar = getProfileSidebar();
    if (!sidebar) return;

    const isDark = isDarkMode();

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

    const allItems = document.createElement('div');
    allItems.style.display = 'flex';
    allItems.style.flexWrap = 'wrap';
    allItems.style.gap = '6px';

    const topTechs = techNames.slice(0, 20);
    topTechs.forEach(name => {
        const item = createProfileSidebarItem(name, isDark);
        allItems.appendChild(item);
    });

    container.appendChild(allItems);

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
                allItems.appendChild(createProfileSidebarItem(name, isDark));
            });
            showMoreBtn.remove();
        };

        container.appendChild(showMoreBtn);
    }

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
            await onScanMore();
        };

        container.appendChild(scanMoreBtn);
    }

    // Insert AFTER the h-card to prevent profile picture from jumping up
    const hCard = sidebar.querySelector('.h-card');
    if (hCard) {
        hCard.insertAdjacentElement('afterend', container);
    } else {
        sidebar.appendChild(container);
    }
}

/**
 * Create a profile sidebar item (tech badge) with hover effects and modal
 */
function createProfileSidebarItem(text: string, isDark: boolean): HTMLElement {
    const span = document.createElement('span');

    // Base styles
    span.style.padding = '5px 12px 5px 8px';
    span.style.minHeight = '28px';
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    span.style.gap = '6px';
    span.style.borderRadius = '100px';
    span.style.fontSize = '12px';
    span.style.fontWeight = '500';
    span.style.cursor = 'pointer';
    span.style.transition = 'all 0.2s ease';
    span.style.userSelect = 'none';

    const icon = document.createElement('img');
    icon.style.width = '14px';
    icon.style.height = '14px';
    icon.style.objectFit = 'contain';
    icon.style.display = 'none';

    const label = document.createElement('span');
    label.textContent = text;
    label.style.lineHeight = '14px';

    span.appendChild(icon);
    span.appendChild(label);

    if (isDark) {
        span.style.backgroundColor = 'rgba(110, 118, 129, 0.1)';
        span.style.color = '#c9d1d9';
        span.style.border = '1px solid rgba(110, 118, 129, 0.4)';
        span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';

        span.onmouseenter = () => {
            span.style.backgroundColor = 'rgba(110, 118, 129, 0.25)';
            span.style.borderColor = '#8b949e';
            span.style.transform = 'translateY(-1px)';
            span.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
        };
        span.onmouseleave = () => {
            span.style.backgroundColor = 'rgba(110, 118, 129, 0.1)';
            span.style.borderColor = 'rgba(110, 118, 129, 0.4)';
            span.style.transform = 'translateY(0)';
            span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
        };
    } else {
        span.style.backgroundColor = '#f6f8fa';
        span.style.color = '#24292f';
        span.style.border = '1px solid #d0d7de';
        span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

        span.onmouseenter = () => {
            span.style.backgroundColor = '#eaeef2';
            span.style.borderColor = '#0969da';
            span.style.transform = 'translateY(-1px)';
            span.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        };
        span.onmouseleave = () => {
            span.style.backgroundColor = '#f6f8fa';
            span.style.borderColor = '#d0d7de';
            span.style.transform = 'translateY(0)';
            span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        };
    }

    // Click handler for modal
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

