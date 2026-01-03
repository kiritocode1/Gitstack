/**
 * Repository sidebar injection
 */

import { isDarkMode } from '../theme';
import { getTechCategory, CATEGORY_ORDER } from '../detection/tech-detection';
import { fetchLogo } from './logo';
import { showTechModal } from './modal';

const SIDEBAR_ID = 'github-ext-stack-sidebar';

/**
 * Inject the tech stack sidebar into the repository page
 */
export function injectSidebar(techNames: string[]): void {
    const isDark = isDarkMode();

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
    const existing = document.getElementById(SIDEBAR_ID);
    if (existing) {
        existing.remove();
    }

    const borderGrid = document.querySelector('.Layout-sidebar .BorderGrid');
    if (!borderGrid) return;

    const section = document.createElement('div');
    section.id = SIDEBAR_ID;
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

/**
 * Create a single sidebar item (tech badge)
 */
function createSidebarItem(text: string, isDark: boolean): HTMLElement {
    const span = document.createElement('span');

    // Base styles
    span.style.padding = '6px 12px 6px 8px';
    span.style.minHeight = '32px';
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    span.style.gap = '8px';
    span.style.borderRadius = '100px';
    span.style.fontSize = '13px';
    span.style.fontWeight = '500';
    span.style.cursor = 'default';
    span.style.transition = 'all 0.2s ease';
    span.style.border = '1px solid transparent';
    span.style.userSelect = 'none';

    // Icon container (placeholder initially)
    const icon = document.createElement('img');
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.objectFit = 'contain';
    icon.style.display = 'none';

    const label = document.createElement('span');
    label.textContent = text;
    label.style.lineHeight = '16px';

    span.appendChild(icon);
    span.appendChild(label);

    if (isDark) {
        span.style.backgroundColor = 'rgba(110, 118, 129, 0.1)';
        span.style.color = '#c9d1d9';
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
        span.style.backgroundColor = '#f6f8fa';
        span.style.color = '#24292f';
        span.style.border = '1px solid #d0d7de';

        span.onmouseenter = () => {
            span.style.backgroundColor = '#eaeef2';
            span.style.borderColor = '#0969da';
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
