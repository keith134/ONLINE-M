/**
 * witnesses.js - Step 3: Add witnesses (optional)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure draft exists
  if (!App.ensureDraftOrRedirect()) return;

  const form = document.getElementById('witnesses-form');
  const continueBtn = document.getElementById('continue-btn');
  const skipBtn = document.getElementById('skip-witnesses-btn');
  const addWitnessBtn = document.getElementById('add-witness-btn');
  const witnessesList = document.getElementById('witnesses-list');
  const witnessesError = document.getElementById('witnesses-error');

  // Create a witness row
  function createWitnessRow(data = { name: '', email: '' }, index) {
    const row = document.createElement('div');
    row.className = 'witness-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 1fr auto';
    row.style.gap = 'var(--space-3)';
    row.style.alignItems = 'end';
    row.style.marginBottom = 'var(--space-4)';
    row.style.padding = 'var(--space-4)';
    row.style.background = 'var(--bg)';
    row.style.borderRadius = 'var(--radius-md)';
    row.style.border = '1px solid var(--border)';
    row.dataset.index = index;

    row.innerHTML = `
      <div class="form-group" style="margin-bottom: 0;">
        <label for="witness-name-${index}" class="label">Witness ${index + 1} Name</label>
        <input type="text" id="witness-name-${index}" name="witnessName" class="input" placeholder="e.g., Alex Rivera" value="${App.escapeHtml(data.name)}" autocomplete="given-name" aria-describedby="witness-name-error-${index}">
        <span id="witness-name-error-${index}" class="error-message" aria-live="polite"></span>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label for="witness-email-${index}" class="label">Email (Optional)</label>
        <input type="email" id="witness-email-${index}" name="witnessEmail" class="input" placeholder="e.g., alex@email.com" value="${App.escapeHtml(data.email)}" autocomplete="email" aria-describedby="witness-email-help-${index}">
        <span id="witness-email-help-${index}" class="error-message" style="color: var(--ink-light);">We'll fake-send them an invite</span>
      </div>
      <button type="button" class="btn btn--ghost btn--sm remove-witness" aria-label="Remove witness ${index + 1}" style="height: fit-content;">
        <span aria-hidden="true">🗑️</span> Remove
      </button>
    `;

    return row;
  }

  // Render all witnesses
  function renderWitnesses() {
    witnessesList.innerHTML = '';
    const draft = CeremonyStore.getDraft();
    const witnesses = draft.witnesses || [];

    witnesses.forEach((witness, index) => {
      const row = createWitnessRow(witness, index);
      witnessesList.appendChild(row);
    });

    updateRemoveButtons();
    attachValidation();
  }

  // Update remove button states
  function updateRemoveButtons() {
    const rows = witnessesList.querySelectorAll('.witness-row');
    rows.forEach((row, index) => {
      const btn = row.querySelector('.remove-witness');
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    });
  }

  // Attach validation to inputs
  function attachValidation() {
    witnessesList.querySelectorAll('input[name="witnessName"]').forEach((input, index) => {
      input.addEventListener('input', () => validateWitnessName(input, index));
    });
  }

  function validateWitnessName(input, index) {
    const errorEl = document.getElementById(`witness-name-error-${index}`);
    const value = input.value.trim();

    if (value && value.length < 2) {
      input.classList.add('input--error');
      errorEl.textContent = `"${value}"? That's a typo, not a witness.`;
      return false;
    }
    input.classList.remove('input--error');
    errorEl.textContent = '';
    return true;
  }

  // Collect witness data
  function collectWitnesses() {
    const witnesses = [];
    const rows = witnessesList.querySelectorAll('.witness-row');

    rows.forEach((row, index) => {
      const nameInput = row.querySelector('input[name="witnessName"]');
      const emailInput = row.querySelector('input[name="witnessEmail"]');
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (name || email) {
        witnesses.push({ name, email });
      }
    });

    return witnesses;
  }

  // Add witness button
  addWitnessBtn.addEventListener('click', () => {
    const rows = witnessesList.querySelectorAll('.witness-row');
    if (rows.length >= 4) {
      App.toastError('Maximum 4 witnesses. Even your cat\'s Instagram followers don\'t all need to watch.');
      return;
    }

    const newIndex = rows.length;
    const row = createWitnessRow({ name: '', email: '' }, newIndex);
    witnessesList.appendChild(row);
    updateRemoveButtons();
    attachValidation();

    // Focus the new name input
    setTimeout(() => {
      row.querySelector('input[name="witnessName"]').focus();
    }, 50);
  });

  // Remove witness (event delegation)
  witnessesList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-witness');
    if (!btn || btn.disabled) return;

    const row = btn.closest('.witness-row');
    row.remove();
    updateRemoveButtons();
    reindexWitnesses();
  });

  // Reindex witness rows after removal
  function reindexWitnesses() {
    const rows = witnessesList.querySelectorAll('.witness-row');
    rows.forEach((row, index) => {
      row.dataset.index = index;
      const nameInput = row.querySelector('input[name="witnessName"]');
      const emailInput = row.querySelector('input[name="witnessEmail"]');
      const nameError = row.querySelector('[id^="witness-name-error"]');
      const emailHelp = row.querySelector('[id^="witness-email-help"]');
      const removeBtn = row.querySelector('.remove-witness');

      nameInput.id = `witness-name-${index}`;
      nameInput.setAttribute('aria-describedby', `witness-name-error-${index}`);
      emailInput.id = `witness-email-${index}`;
      emailInput.setAttribute('aria-describedby', `witness-email-help-${index}`);
      if (nameError) nameError.id = `witness-name-error-${index}`;
      if (emailHelp) emailHelp.id = `witness-email-help-${index}`;
      removeBtn.setAttribute('aria-label', `Remove witness ${index + 1}`);

      // Update label text
      const label = row.querySelector('label[for^="witness-name"]');
      if (label) label.textContent = `Witness ${index + 1} Name`;
    });
  }

  // Skip witnesses button
  skipBtn.addEventListener('click', () => {
    // Save empty witnesses and continue
    CeremonyStore.saveDraft({
      step: 4,
      witnesses: []
    });
    App.toastSuccess('Witnesses skipped. On to the signatures.');
    setTimeout(() => {
      window.location.href = 'sign.html';
    }, 800);
  });

  // Form submission (when user adds witnesses and clicks continue)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const witnesses = collectWitnesses();

    witnessesError.textContent = '';

    // Save draft (witnesses can be empty)
    const success = CeremonyStore.saveDraft({
      step: 4,
      witnesses
    });

    if (success) {
      // Show fake email sent toasts
      witnesses.forEach((w, i) => {
        if (w.email) {
          setTimeout(() => {
            App.toastGold(`Invite "sent" to ${w.email}. They'll definitely pretend not to see it.`);
          }, i * 300);
        }
      });

      App.toastSuccess(witnesses.length ? 'Witnesses added. Time for the big moment.' : 'No witnesses. Time for the big moment.');
      setTimeout(() => {
        window.location.href = 'sign.html';
      }, 1200);
    } else {
      App.toastError('Could not save. Your browser is being difficult.');
    }
  });

  // Initial render
  renderWitnesses();
});