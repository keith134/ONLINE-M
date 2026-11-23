/**
 * start.js - Step 1: Enter names
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('names-form');
  const continueBtn = document.getElementById('continue-btn');
  const samePersonCheck = document.getElementById('same-person-check');

  // Input elements
  const partner1Name = document.getElementById('partner1-name');
  const partner1City = document.getElementById('partner1-city');
  const partner2Name = document.getElementById('partner2-name');
  const partner2City = document.getElementById('partner2-city');

  // Error elements
  const p1NameError = document.getElementById('partner1-name-error');
  const p2NameError = document.getElementById('partner2-name-error');
  const samePersonError = document.getElementById('same-person-error');

  // Load draft data
  const draft = CeremonyStore.getDraft();
  if (draft.partner1?.name) partner1Name.value = draft.partner1.name;
  if (draft.partner1?.city) partner1City.value = draft.partner1.city;
  if (draft.partner2?.name) partner2Name.value = draft.partner2.name;
  if (draft.partner2?.city) partner2City.value = draft.partner2.city;

  // Validation helpers
  function showError(input, errorEl, message) {
    input.classList.add('input--error');
    errorEl.textContent = message;
  }

  function clearError(input, errorEl) {
    input.classList.remove('input--error');
    errorEl.textContent = '';
  }

  function validateName(input, errorEl, partnerLabel) {
    const value = input.value.trim();
    if (!value) {
      showError(input, errorEl, `You forgot ${partnerLabel}'s name. We can't marry a ghost. (Yet.)`);
      return false;
    }
    if (value.length < 2) {
      showError(input, errorEl, `"${value}"? That's not a name, that's a typo.`);
      return false;
    }
    if (/^\d+$/.test(value)) {
      showError(input, errorEl, 'You typed numbers. We can\'t legally marry a calculator.');
      return false;
    }
    clearError(input, errorEl);
    return true;
  }

  // Real-time validation
  partner1Name.addEventListener('input', () => validateName(partner1Name, p1NameError, 'Partner 1'));
  partner2Name.addEventListener('input', () => validateName(partner2Name, p2NameError, 'Partner 2'));

  // Same person checkbox
  samePersonCheck.addEventListener('change', () => {
    if (samePersonCheck.checked) {
      partner2Name.value = partner1Name.value;
      partner2City.value = partner1City.value;
      partner2Name.disabled = true;
      partner2City.disabled = true;
      samePersonError.textContent = 'Self-marriage ceremony activated. We respect the hustle.';
      samePersonError.style.color = 'var(--gold)';
    } else {
      partner2Name.disabled = false;
      partner2City.disabled = false;
      samePersonError.textContent = '';
    }
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valid1 = validateName(partner1Name, p1NameError, 'Partner 1');
    const valid2 = validateName(partner2Name, p2NameError, 'Partner 2');

    if (!valid1 || !valid2) {
      App.toastError('Fix the errors above, then we\'ll talk.');
      return;
    }

    // Check for duplicate names (unless same person)
    if (!samePersonCheck.checked && partner1Name.value.trim().toLowerCase() === partner2Name.value.trim().toLowerCase()) {
      showError(partner2Name, p2NameError, 'Both partners have the same name? Enter them separately unless you\'re marrying yourself.');
      App.toastError('Two different people, two different names. Unless you checked that box.');
      return;
    }

    // Save draft
    const success = CeremonyStore.saveDraft({
      step: 2,
      partner1: {
        name: partner1Name.value.trim(),
        city: partner1City.value.trim()
      },
      partner2: {
        name: partner2Name.value.trim(),
        city: partner2City.value.trim()
      }
    });

    if (success) {
      App.toastSuccess('Names saved! On to the vows...');
      setTimeout(() => {
        window.location.href = 'vows.html';
      }, 800);
    } else {
      App.toastError('Could not save. Your browser is being difficult.');
    }
  });

  // Enter key on last field submits
  partner2City.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      continueBtn.click();
    }
  });
});