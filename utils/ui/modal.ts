/**
 * Tech detail modal component
 */

import { fetchTechDetails } from './logo';

// Global modal reference
let activeModal: HTMLElement | null = null;

/**
 * Show a modal with tech details
 */
export async function showTechModal(techName: string, isDark: boolean, logoUrl?: string): Promise<void> {
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

    // Content: Header with Logo & Title
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
        closeBtn.style.backgroundColor = '#238636';
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
    const defaultSearchUrl = `https://google.com/search?q=${encodeURIComponent(techName)}`;
    const details = await fetchTechDetails(techName);

    if (details) {
        infoCtn.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div><strong>Category:</strong> ${details.category}</div>
        <div><strong>Website:</strong> <a href="${details.websiteUrl}" target="_blank" style="color: #0969da; text-decoration: none;">${details.websiteUrl}</a></div>
        <div style="font-size: 0.9em; opacity: 0.8; margin-top: 8px;">
          Check out official documentation or resources to learn more about ${techName}.
        </div>
      </div>
    `;
    } else {
        infoCtn.innerHTML = `<p>No specific details found. <a href="${defaultSearchUrl}" target="_blank" style="color: #0969da;">Search on Google</a></p>`;
    }
}
