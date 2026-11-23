/**
 * Ceremony Store - localStorage state manager
 * Handles draft (in-progress) and sealed (completed) ceremonies
 */

const CeremonyStore = (function() {
  const KEY_DRAFT = 'ldr_ceremony_draft';
  const KEY_SEALED = 'ldr_ceremonies_sealed';
  const KEY_COUNTER = 'ldr_couples_counter';

  // Seed counter for the "X couples sealed" display
  const SEED_COUNTER = 847;

  function safeGet(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage:`, e);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Failed to write ${key} to localStorage:`, e);
      return false;
    }
  }

  function generateId() {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LDR-${year}-${result}`;
  }

  function getCounter() {
    return safeGet(KEY_COUNTER, SEED_COUNTER);
  }

  function incrementCounter() {
    const current = getCounter();
    const next = current + 1;
    safeSet(KEY_COUNTER, next);
    return next;
  }

  return {
    // Draft methods (in-progress ceremony)
    getDraft() {
      return safeGet(KEY_DRAFT, {
        step: 1,
        partner1: { name: '', city: '' },
        partner2: { name: '', city: '' },
        vows: { mode: 'default', custom: '' },
        witnesses: [{ name: '', email: '' }],
        signatures: { partner1: null, partner2: null },
        createdAt: Date.now()
      });
    },

    saveDraft(patch) {
      const draft = this.getDraft();
      const updated = { ...draft, ...patch, updatedAt: Date.now() };
      return safeSet(KEY_DRAFT, updated);
    },

    clearDraft() {
      return safeSet(KEY_DRAFT, {
        step: 1,
        partner1: { name: '', city: '' },
        partner2: { name: '', city: '' },
        vows: { mode: 'default', custom: '' },
        witnesses: [{ name: '', email: '' }],
        signatures: { partner1: null, partner2: null },
        createdAt: Date.now()
      });
    },

    // Sealed methods (completed ceremonies)
    getSealed() {
      return safeGet(KEY_SEALED, []);
    },

    addSealed(ceremony) {
      const sealed = this.getSealed();
      const withId = {
        ...ceremony,
        id: ceremony.id || generateId(),
        sealedAt: ceremony.sealedAt || Date.now()
      };
      sealed.unshift(withId); // Newest first
      const success = safeSet(KEY_SEALED, sealed);
      if (success) incrementCounter();
      return success ? withId : null;
    },

    deleteSealed(id) {
      const sealed = this.getSealed();
      const filtered = sealed.filter(c => c.id !== id);
      return safeSet(KEY_SEALED, filtered);
    },

    // Utility
    generateId,
    getCounter,
    incrementCounter
  };
})();