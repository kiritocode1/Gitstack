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
 * @param reason - 'no_repos' | 'scanned_nothing' | 'api_error'
 */
export function injectProfileEmptyState(
    username: string,
    repoCount: number,
    reason: 'no_repos' | 'scanned_nothing' | 'api_error' = 'scanned_nothing'
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

    const emptyText = document.createElement('div');
    emptyText.style.fontSize = '13px';
    emptyText.style.color = isDark ? '#8b949e' : '#586069';
    emptyText.style.marginTop = '8px';

    const subtitle = document.createElement('div');
    subtitle.style.fontSize = '12px';
    subtitle.style.color = isDark ? '#6e7681' : '#8b949e';
    subtitle.style.marginTop = '4px';

    // Set messages based on reason
    switch (reason) {
        case 'no_repos':
            emptyText.textContent = 'No public repositories';
            subtitle.textContent = 'This user has no public repositories to scan';
            break;
        case 'api_error':
            emptyText.textContent = 'Could not scan repositories';
            subtitle.textContent = 'API request failed - try again later';
            break;
        case 'scanned_nothing':
        default:
            emptyText.textContent = 'No technologies detected';
            subtitle.textContent = repoCount > 0
                ? `Scanned ${repoCount} repositories`
                : 'No recognizable tech signatures found';
            break;
    }

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
 * Inject rate limit error state when GitHub API is exhausted
 */
export function injectProfileRateLimitError(username: string): void {
    removeProfileLoadingState();

    const sidebar = getProfileSidebar();
    if (!sidebar) return;

    const isDark = isDarkMode();

    const container = document.createElement('div');
    container.id = PROFILE_SIDEBAR_ID;
    container.style.cssText = `
        margin-top: 16px;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid ${isDark ? '#1a1a1a' : '#d0d7de'};
        background: ${isDark ? '#0a0a0a' : '#ffffff'};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    `;

    // Header label
    const sectionLabel = document.createElement('div');
    sectionLabel.textContent = '[RATE LIMIT] 制限';
    sectionLabel.style.cssText = `
        font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
        font-size: 10px;
        color: ${isDark ? '#666' : '#8b949e'};
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
    `;

    const heading = document.createElement('h2');
    heading.textContent = 'Tech Stack';
    heading.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: ${isDark ? '#ffffff' : '#1f2328'};
    `;

    const errorTitle = document.createElement('div');
    errorTitle.innerHTML = '<span style="color: #f85149;">●</span> Rate limit exceeded';
    errorTitle.style.cssText = `
        font-size: 12px;
        color: ${isDark ? '#8b949e' : '#656d76'};
        margin-bottom: 12px;
    `;

    // Token section
    const tokenSection = document.createElement('div');
    tokenSection.style.cssText = `
        background: ${isDark ? '#000' : '#f6f8fa'};
        border: 1px solid ${isDark ? '#1a1a1a' : '#d0d7de'};
        border-radius: 6px;
        padding: 12px;
    `;

    const tokenTitle = document.createElement('div');
    tokenTitle.textContent = 'GitHub Token';
    tokenTitle.style.cssText = `
        font-size: 12px;
        font-weight: 500;
        color: ${isDark ? '#ffffff' : '#1f2328'};
        margin-bottom: 4px;
    `;

    const tokenDesc = document.createElement('div');
    tokenDesc.textContent = 'Increases rate limit from 60 to 5,000 requests/hour';
    tokenDesc.style.cssText = `
        font-size: 10px;
        color: ${isDark ? '#666' : '#8b949e'};
        margin-bottom: 10px;
    `;

    const tokenInput = document.createElement('input');
    tokenInput.type = 'password';
    tokenInput.placeholder = 'ghp_xxxxxxxxxxxx';
    tokenInput.style.cssText = `
        width: 100%;
        padding: 8px 10px;
        font-size: 11px;
        font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
        border: 1px solid ${isDark ? '#333' : '#d0d7de'};
        border-radius: 4px;
        background: ${isDark ? '#000' : '#ffffff'};
        color: ${isDark ? '#ffffff' : '#1f2328'};
        outline: none;
        box-sizing: border-box;
        margin-bottom: 8px;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save & Retry';
    saveBtn.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        font-size: 11px;
        font-weight: 500;
        border: none;
        border-radius: 4px;
        background: #22c55e;
        color: #000;
        cursor: pointer;
        transition: background 0.2s;
    `;

    const statusMsg = document.createElement('div');
    statusMsg.style.cssText = `
        font-size: 10px;
        margin-top: 6px;
        display: none;
    `;

    saveBtn.onclick = async () => {
        const token = tokenInput.value.trim();
        if (!token) {
            statusMsg.textContent = 'Please enter a token';
            statusMsg.style.color = '#f85149';
            statusMsg.style.display = 'block';
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        saveBtn.style.opacity = '0.5';
        statusMsg.style.display = 'none';

        try {
            await browser.storage.sync.set({ githubToken: token });
            statusMsg.textContent = '✓ Token saved! Reloading...';
            statusMsg.style.color = '#22c55e';
            statusMsg.style.display = 'block';
            setTimeout(() => location.reload(), 500);
        } catch (e) {
            statusMsg.textContent = 'Failed to save token';
            statusMsg.style.color = '#f85149';
            statusMsg.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save & Retry';
            saveBtn.style.opacity = '1';
        }
    };

    tokenInput.onkeydown = (e) => {
        if (e.key === 'Enter') saveBtn.click();
    };

    const tokenLink = document.createElement('a');
    tokenLink.href = 'https://github.com/settings/tokens?type=beta';
    tokenLink.target = '_blank';
    tokenLink.textContent = 'Create a token →';
    tokenLink.style.cssText = `
        display: block;
        margin-top: 8px;
        font-size: 10px;
        color: ${isDark ? '#666' : '#8b949e'};
        text-decoration: none;
        transition: color 0.2s;
    `;

    tokenSection.appendChild(tokenTitle);
    tokenSection.appendChild(tokenDesc);
    tokenSection.appendChild(tokenInput);
    tokenSection.appendChild(saveBtn);
    tokenSection.appendChild(statusMsg);
    tokenSection.appendChild(tokenLink);

    // Help section
    const helpSection = document.createElement('div');
    helpSection.style.cssText = `
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid ${isDark ? '#1a1a1a' : '#d0d7de'};
    `;

    const helpLabel = document.createElement('div');
    helpLabel.textContent = '[HELP] ヘルプ';
    helpLabel.style.cssText = `
        font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
        font-size: 9px;
        color: ${isDark ? '#444' : '#8b949e'};
        text-transform: uppercase;
        margin-bottom: 4px;
    `;

    const helpLink = document.createElement('a');
    helpLink.href = 'https://x.com/blank_spacets';
    helpLink.target = '_blank';
    helpLink.textContent = 'DM for suggestions';
    helpLink.style.cssText = `
        font-size: 11px;
        color: ${isDark ? '#666' : '#656d76'};
        text-decoration: none;
    `;

    helpSection.appendChild(helpLabel);
    helpSection.appendChild(helpLink);

    container.appendChild(sectionLabel);
    container.appendChild(heading);
    container.appendChild(errorTitle);
    container.appendChild(tokenSection);
    container.appendChild(helpSection);

    // Insert AFTER the h-card
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

