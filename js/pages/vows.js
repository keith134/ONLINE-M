/**
 * vows.js - Step 2: Choose or write vows
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure draft exists
  if (!App.ensureDraftOrRedirect()) return;

  const form = document.getElementById('vows-form');
  const continueBtn = document.getElementById('continue-btn');
  const defaultVowsDiv = document.getElementById('default-vows');
  const customVowsDiv = document.getElementById('custom-vows');
  const customVowsTextarea = document.getElementById('custom-vows-text');
  const charCount = document.getElementById('char-count');
  const customVowsError = document.getElementById('custom-vows-error');
  const vowModeRadios = form.querySelectorAll('input[name="vowMode"]');

  // Load draft data
  const draft = CeremonyStore.getDraft();
  if (draft.vows?.mode === 'custom') {
    document.querySelector('input[value="custom"]').checked = true;
    defaultVowsDiv.style.display = 'none';
    customVowsDiv.style.display = 'block';
    customVowsTextarea.value = draft.vows.custom || '';
    updateCharCount();
  }

  // Toggle vow mode
  vowModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'custom') {
        defaultVowsDiv.style.display = 'none';
        customVowsDiv.style.display = 'block';
        customVowsTextarea.focus();
      } else {
        defaultVowsDiv.style.display = 'block';
        customVowsDiv.style.display = 'none';
      }
      // Save mode immediately
      CeremonyStore.saveDraft({ vows: { mode: radio.value, custom: customVowsTextarea.value } });
    });
  });

  // Character counter
  function updateCharCount() {
    const len = customVowsTextarea.value.length;
    charCount.textContent = `${len} / 2000 characters`;
    if (len > 1800) {
      charCount.style.color = 'var(--error)';
    } else if (len > 1500) {
      charCount.style.color = 'var(--gold)';
    } else {
      charCount.style.color = 'var(--ink-light)';
    }
  }

  customVowsTextarea.addEventListener('input', () => {
    updateCharCount();
    // Debounced save
    clearTimeout(customVowsTextarea._saveTimer);
    customVowsTextarea._saveTimer = setTimeout(() => {
      CeremonyStore.saveDraft({
        vows: { mode: 'custom', custom: customVowsTextarea.value }
      });
    }, 500);
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const mode = form.querySelector('input[name="vowMode"]:checked').value;

    if (mode === 'custom') {
      const text = customVowsTextarea.value.trim();
      if (!text) {
        customVowsError.textContent = 'You selected custom vows but didn\'t write any. We can\'t marry you to silence.';
        customVowsTextarea.classList.add('input--error');
        customVowsTextarea.focus();
        App.toastError('Write something first. Even "I promise to share fries" counts.');
        return;
      }
      if (text.length < 10) {
        customVowsError.textContent = 'That\'s... really short. Like, suspiciously short. Write a bit more?';
        customVowsTextarea.classList.add('input--error');
        return;
      }
      customVowsError.textContent = '';
      customVowsTextarea.classList.remove('input--error');
      CeremonyStore.saveDraft({ vows: { mode: 'custom', custom: text } });
    } else {
      CeremonyStore.saveDraft({ vows: { mode: 'default', custom: '' } });
    }

    App.toastSuccess('Vows locked in. Witnesses up next.');
    setTimeout(() => {
      window.location.href = 'witnesses.html';
    }, 800);
  });
});