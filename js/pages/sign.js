/**
 * sign.js - Step 4: Signatures and seal
 * Canvas-based signature pads with draw/type toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure draft exists
  if (!App.ensureDraftOrRedirect()) return;

  const form = document.getElementById('sign-form');
  const sealBtn = document.getElementById('seal-btn');
  const signError = document.getElementById('sign-error');
  const partner1NameEl = document.getElementById('decl-name1');
  const partner2NameEl = document.getElementById('decl-name2');
  const dateInput = document.getElementById('ceremony-date');

  // Load draft data
  const draft = CeremonyStore.getDraft();
  partner1NameEl.textContent = draft.partner1?.name || '';
  partner2NameEl.textContent = draft.partner2?.name || '';

  // Set today's date
  const today = new Date();
  dateInput.value = App.formatDate(today);

  // Signature state
  const signatures = {
    partner1: { mode: 'draw', data: draft.signatures?.partner1 || null },
    partner2: { mode: 'draw', data: draft.signatures?.partner2 || null }
  };

  // Initialize signature pads
  initSignaturePad('partner1-signature', 'partner1');
  initSignaturePad('partner2-signature', 'partner2');

  function initSignaturePad(containerId, partnerKey) {
    const container = document.getElementById(containerId);
    const stored = signatures[partnerKey].data;

    container.innerHTML = `
      <div class="signature-type-toggle" role="group" aria-label="${partnerKey === 'partner1' ? 'Partner 1' : 'Partner 2'} signature mode">
        <button type="button" class="btn btn--sm mode-btn" data-mode="draw" ${signatures[partnerKey].mode === 'draw' ? 'aria-pressed="true"' : ''}>Draw</button>
        <button type="button" class="btn btn--sm mode-btn" data-mode="type" ${signatures[partnerKey].mode === 'type' ? 'aria-pressed="true"' : ''}>Type</button>
      </div>
      <div class="signature-draw-area" style="display: ${signatures[partnerKey].mode === 'draw' ? 'block' : 'none'};">
        <canvas class="signature-pad" aria-label="${partnerKey === 'partner1' ? 'Partner 1' : 'Partner 2'} signature canvas"></canvas>
        <div class="signature-pad-toolbar">
          <button type="button" class="btn btn--ghost btn--sm clear-btn">Clear</button>
          <span style="margin-left: auto; font-size: 0.75rem; color: var(--ink-light);">Draw with mouse, finger, or stylus</span>
        </div>
      </div>
      <div class="signature-type-area" style="display: ${signatures[partnerKey].mode === 'type' ? 'block' : 'none'};">
        <input type="text" class="signature-typed-input" placeholder="Type your name" aria-label="${partnerKey === 'partner1' ? 'Partner 1' : 'Partner 2'} typed signature" value="${stored && stored.mode === 'type' ? App.escapeHtml(stored.data) : ''}">
      </div>
    `;

    const modeBtns = container.querySelectorAll('.mode-btn');
    const drawArea = container.querySelector('.signature-draw-area');
    const typeArea = container.querySelector('.signature-type-area');
    const canvas = container.querySelector('.signature-pad');
    const clearBtn = container.querySelector('.clear-btn');
    const typedInput = container.querySelector('.signature-typed-input');

    // Mode toggle
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        signatures[partnerKey].mode = mode;

        modeBtns.forEach(b => {
          b.setAttribute('aria-pressed', b.dataset.mode === mode);
          b.classList.toggle('btn--primary', b.dataset.mode === mode);
          b.classList.toggle('btn--secondary', b.dataset.mode !== mode);
        });

        drawArea.style.display = mode === 'draw' ? 'block' : 'none';
        typeArea.style.display = mode === 'type' ? 'block' : 'none';

        if (mode === 'draw' && canvas) {
          resizeCanvas(canvas);
          redrawStoredSignature(canvas, partnerKey);
        } else if (mode === 'type') {
          typedInput.focus();
        }
      });
    });

    // Canvas drawing
    if (canvas) {
      setupCanvas(canvas, partnerKey);
      resizeCanvas(canvas);
      redrawStoredSignature(canvas, partnerKey);

      // Handle resize
      window.addEventListener('resize', () => {
        const savedImage = canvas.toDataURL();
        resizeCanvas(canvas);
        if (savedImage !== canvas.toDataURL('image/png', 0.1)) { // Only redraw if there was content
          redrawStoredSignature(canvas, partnerKey);
        }
      });
    }

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signatures[partnerKey].data = null;
        // Save cleared state
        CeremonyStore.saveDraft({
          signatures: {
            partner1: signatures.partner1.data ? { mode: signatures.partner1.mode, data: signatures.partner1.data } : null,
            partner2: signatures.partner2.data ? { mode: signatures.partner2.mode, data: signatures.partner2.data } : null
          }
        });
      });
    }

    // Typed input
    if (typedInput) {
      typedInput.addEventListener('input', App.debounce(() => {
        signatures[partnerKey].data = typedInput.value.trim();
        CeremonyStore.saveDraft({
          signatures: {
            partner1: signatures.partner1.data ? { mode: signatures.partner1.mode, data: signatures.partner1.data } : null,
            partner2: signatures.partner2.data ? { mode: signatures.partner2.mode, data: signatures.partner2.data } : null
          }
        });
      }, 300));
    }
  }

  function setupCanvas(canvas, partnerKey) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3A2E2A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function startDrawing(e) {
      if (signatures[partnerKey].mode !== 'draw') return;
      e.preventDefault();
      isDrawing = true;
      const coords = getCoords(e);
      lastX = coords.x;
      lastY = coords.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
      if (!isDrawing || signatures[partnerKey].mode !== 'draw') return;
      e.preventDefault();
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      lastX = coords.x;
      lastY = coords.y;
    }

    function stopDrawing() {
      if (!isDrawing) return;
      isDrawing = false;
      // Save signature as data URL
      signatures[partnerKey].data = canvas.toDataURL();
      CeremonyStore.saveDraft({
        signatures: {
          partner1: signatures.partner1.data ? { mode: signatures.partner1.mode, data: signatures.partner1.data } : null,
          partner2: signatures.partner2.data ? { mode: signatures.partner2.mode, data: signatures.partner2.data } : null
        }
      });
    }

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#3A2E2A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function redrawStoredSignature(canvas, partnerKey) {
    const stored = signatures[partnerKey].data;
    if (stored && stored.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
      };
      img.src = stored;
    }
  }

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate both signatures exist
    const sig1 = signatures.partner1.data;
    const sig2 = signatures.partner2.data;

    if (!sig1 || !sig2) {
      signError.textContent = 'Both signatures are required. You can\'t marry yourself with one hand. (Unless you checked that box earlier.)';
      App.toastError('Sign both, then seal.');
      return;
    }

    signError.textContent = '';

    // Prepare final ceremony object
    const ceremony = {
      ...draft,
      step: 5,
      signatures: {
        partner1: { mode: signatures.partner1.mode, data: sig1 },
        partner2: { mode: signatures.partner2.mode, data: sig2 }
      },
      sealedAt: Date.now(),
      date: App.formatDate(today)
    };

    // Add to sealed ceremonies
    const sealed = CeremonyStore.addSealed(ceremony);

    if (sealed) {
      // Clear draft
      CeremonyStore.clearDraft();

      // Confetti!
      App.burstConfetti();

      App.toastSuccess('Sealed. Signed. Slightly unhinged. Congratulations, you two.');

      setTimeout(() => {
        window.location.href = 'certificate.html';
      }, 1200);
    } else {
      App.toastError('Could not save ceremony. Your browser is being difficult.');
    }
  });
});