/**
 * dashboard.js - Display all sealed ceremonies
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('dashboard-grid');
  const emptyState = document.getElementById('empty-state');

  function renderDashboard() {
    const sealed = CeremonyStore.getSealed();

    if (sealed.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';

    sealed.forEach(ceremony => {
      const card = createCeremonyCard(ceremony);
      grid.appendChild(card);
    });
  }

  function createCeremonyCard(ceremony) {
    const card = document.createElement('article');
    card.className = 'dashboard-card';
    card.setAttribute('role', 'listitem');

    const date = ceremony.date || App.formatDate(ceremony.sealedAt);
    const id = ceremony.id || 'Unknown';

    card.innerHTML = `
      <div class="dashboard-card-header">
        <div class="dashboard-names">${App.escapeHtml(ceremony.partner1?.name)} & ${App.escapeHtml(ceremony.partner2?.name)}</div>
        <div class="dashboard-meta">
          <span>${date}</span>
          <span>ID: ${id}</span>
        </div>
      </div>
      <div class="dashboard-actions">
        <button type="button" class="btn-icon view-btn" aria-label="View certificate for ${App.escapeHtml(ceremony.partner1?.name)} & ${App.escapeHtml(ceremony.partner2?.name)}" title="View Certificate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button type="button" class="btn-icon delete-btn" aria-label="Delete ceremony for ${App.escapeHtml(ceremony.partner1?.name)} & ${App.escapeHtml(ceremony.partner2?.name)}" title="Delete">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    // View button
    card.querySelector('.view-btn').addEventListener('click', () => {
      // Store this ceremony as the "current" one for certificate view
      // We'll use a temporary key to pass it
      try {
        localStorage.setItem('ldr_current_certificate', JSON.stringify(ceremony));
      } catch (e) {
        console.warn('Could not store current certificate:', e);
      }
      window.location.href = 'certificate.html';
    });

    // Delete button
    card.querySelector('.delete-btn').addEventListener('click', () => {
      const confirmMsg = `Delete the ceremony for ${ceremony.partner1?.name} & ${ceremony.partner2?.name}? This can't be undone (unless you do it again).`;
      if (confirm(confirmMsg)) {
        CeremonyStore.deleteSealed(ceremony.id);
        App.toastSuccess('Ceremony deleted. The memories remain.');
        renderDashboard();
      }
    });

    return card;
  }

  // Initial render
  renderDashboard();
});