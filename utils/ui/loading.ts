/**
 * Loading state UI for repository scanning
 */

import { isDarkMode } from '../theme';

const LOADING_SIDEBAR_ID = 'github-ext-loading-sidebar';

/**
 * Inject loading state into the repository sidebar
 */
export function injectLoadingState(message: string): void {
    // Check if already exists
    if (document.getElementById(LOADING_SIDEBAR_ID)) {
        updateLoadingProgress(0, message);
        return;
    }

    const borderGrid = document.querySelector('.Layout-sidebar .BorderGrid');
    if (!borderGrid) return;

    const isDark = isDarkMode();

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

/**
 * Update the loading progress bar
 */
export function updateLoadingProgress(percent: number, message: string): void {
    const progressFill = document.getElementById('github-ext-progress-fill');
    const statusMsg = document.getElementById('github-ext-status-msg');

    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
    if (statusMsg) {
        statusMsg.textContent = message;
    }
}

/**
 * Remove the loading state from the sidebar
 */
export function removeLoadingState(): void {
    const loadingSection = document.getElementById(LOADING_SIDEBAR_ID);
    if (loadingSection) {
        loadingSection.remove();
    }
}
