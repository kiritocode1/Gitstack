/**
 * Theme detection utility for GitHub pages
 */

export function isDarkMode(): boolean {
    return (
        document.documentElement.getAttribute('data-color-mode') === 'dark' ||
        (document.documentElement.getAttribute('data-color-mode') === 'auto' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
}
