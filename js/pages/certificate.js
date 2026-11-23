/**
 * certificate.js - Display the sealed ceremony certificate
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check for a specific ceremony passed from dashboard
  let ceremony = null;
  try {
    const stored = localStorage.getItem('ldr_current_certificate');
    if (stored) {
      ceremony = JSON.parse(stored);
      localStorage.removeItem('ldr_current_certificate'); // Clear after reading
    }
  } catch (e) {
    console.warn('Could not read current certificate:', e);
  }

  // Fallback to most recent sealed ceremony
  if (!ceremony) {
    const sealed = CeremonyStore.getSealed();
    ceremony = sealed[0];
  }

  if (!ceremony) {
    App.toastError('No ceremony found. You can\'t frame a wedding that never happened.');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }

  // Populate certificate
  document.getElementById('cert-name1').textContent = ceremony.partner1?.name || '';
  document.getElementById('cert-name2').textContent = ceremony.partner2?.name || '';
  document.getElementById('cert-date').textContent = ceremony.date || App.formatDate(ceremony.sealedAt);
  document.getElementById('cert-id').textContent = ceremony.id || 'Unknown';
  document.getElementById('cert-id-footer').textContent = ceremony.id || 'Unknown';

  // Signatures
  const signaturesContainer = document.getElementById('cert-signatures');
  const sig1 = ceremony.signatures?.partner1;
  const sig2 = ceremony.signatures?.partner2;

  function createSignatureBlock(partnerLabel, signature, partnerName) {
    const block = document.createElement('div');
    block.className = 'signature-block';

    if (signature?.mode === 'type' && signature.data) {
      block.innerHTML = `
        <div class="signature-typed">${App.escapeHtml(signature.data)}</div>
        <div class="signature-label">${App.escapeHtml(partnerName)}</div>
      `;
    } else if (signature?.mode === 'draw' && signature.data) {
      block.innerHTML = `
        <img src="${signature.data}" alt="${App.escapeHtml(partnerName)}'s signature" class="signature-image">
        <div class="signature-label">${App.escapeHtml(partnerName)}</div>
      `;
    } else {
      block.innerHTML = `
        <div class="signature-typed" style="border: none; color: var(--ink-light);">(no signature)</div>
        <div class="signature-label">${App.escapeHtml(partnerName)}</div>
      `;
    }

    return block;
  }

  signaturesContainer.appendChild(createSignatureBlock('Partner 1', sig1, ceremony.partner1?.name));
  signaturesContainer.appendChild(createSignatureBlock('Partner 2', sig2, ceremony.partner2?.name));

  // Location line
  const locationEl = document.getElementById('cert-location');
  const city1 = ceremony.partner1?.city;
  const city2 = ceremony.partner2?.city;
  if (city1 || city2) {
    let locationText = '';
    if (city1 && city2) {
      locationText = `${city1} 💕 ${city2} • Your 3am is their 3pm. Love finds a way.`;
    } else if (city1) {
      locationText = `${city1} 💕 somewhere far away`;
    } else if (city2) {
      locationText = `somewhere far away 💕 ${city2}`;
    }
    locationEl.textContent = locationText;
    locationEl.style.display = 'block';
  }

  // Confetti burst on load
  App.burstConfetti();

  // Print button
  document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
  });

  // Copy button
  document.getElementById('copy-btn').addEventListener('click', () => {
    const summary = App.generateCertificateSummary(ceremony);
    App.copyToClipboard(summary);
  });

  // Start another button
  document.getElementById('another-btn').addEventListener('click', () => {
    // Draft is already cleared, just navigate
    window.location.href = 'start.html';
  });
});