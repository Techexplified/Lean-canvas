/**
 * Safe, serialized, and debounced Trello Power-Up plugin storage manager.
 * 
 * Prevents HTTP 409 (Conflict) errors caused by concurrent or rapid calls to `t.set()`.
 * Trello's pluginData API uses optimistic locking; concurrent writes fail with 409 Conflict.
 * This manager serializes all writes in a queue, debounces rapid updates, and retries on conflict.
 */

// Promise queue to ensure operations run sequentially
let writeQueue = Promise.resolve();

// Debounce timer registry by key: `${scope}:${visibility}:${key}`
const debounceTimers = new Map();

// Local memory cache to prevent redundant writes
const memoryCache = new Map();

function getStorageKey(scope, visibility, key) {
  return `${scope}:${visibility}:${key}`;
}

/**
 * Safely executes a `t.set()` operation with queuing and automatic retry on 409 Conflict.
 *
 * @param {object} t - Trello Power-Up client instance
 * @param {string} scope - 'member' | 'board' | 'card' | 'organization'
 * @param {string} visibility - 'private' | 'shared'
 * @param {string} key - storage key
 * @param {*} value - payload to store
 * @param {number} [debounceMs=0] - optional debounce delay in milliseconds
 * @returns {Promise<void>}
 */
export function safeTrelloSet(t, scope, visibility, key, value, debounceMs = 0) {
  const cacheKey = getStorageKey(scope, visibility, key);

  // Update local memory cache & localStorage immediately for optimistic UI
  try {
    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
    localStorage.setItem(`lc_${cacheKey}`, serialized);
  } catch (_) {}

  // If debouncing is requested, clear existing timer and set a new one
  if (debounceMs > 0) {
    if (debounceTimers.has(cacheKey)) {
      clearTimeout(debounceTimers.get(cacheKey));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        debounceTimers.delete(cacheKey);
        enqueueWrite(t, scope, visibility, key, value).then(resolve).catch(resolve);
      }, debounceMs);

      debounceTimers.set(cacheKey, timer);
    });
  }

  return enqueueWrite(t, scope, visibility, key, value);
}

/**
 * Appends a write operation to the sequential queue with retry logic.
 */
function enqueueWrite(t, scope, visibility, key, value) {
  if (!t || typeof t.set !== "function") {
    return Promise.resolve();
  }

  const op = () => attemptTrelloSet(t, scope, visibility, key, value, 2);

  // Chain onto the write queue
  writeQueue = writeQueue.then(op, op);
  return writeQueue;
}

/**
 * Attempts a single t.set() with retry on 409 Conflict.
 */
async function attemptTrelloSet(t, scope, visibility, key, value, retriesLeft = 2) {
  try {
    await t.set(scope, visibility, key, value);
  } catch (err) {
    // If conflict (409) or temporary network collision, retry after a short pause
    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 200));
      return attemptTrelloSet(t, scope, visibility, key, value, retriesLeft - 1);
    }
    // Silently suppress remaining error to avoid unhandled rejection in console
  }
}

/**
 * Safely reads a value from Trello plugin storage, falling back to localStorage.
 *
 * @param {object} t - Trello Power-Up client instance
 * @param {string} scope - 'member' | 'board' | 'card'
 * @param {string} visibility - 'private' | 'shared'
 * @param {string} key - storage key
 * @returns {Promise<any>}
 */
export async function safeTrelloGet(t, scope, visibility, key) {
  const cacheKey = getStorageKey(scope, visibility, key);

  if (t && typeof t.get === "function") {
    try {
      const val = await t.get(scope, visibility, key);
      if (val !== undefined && val !== null) {
        return val;
      }
    } catch (_) {}
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`lc_${cacheKey}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return raw;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Safely removes a value from Trello plugin storage.
 */
export async function safeTrelloRemove(t, scope, visibility, key) {
  const cacheKey = getStorageKey(scope, visibility, key);

  try {
    localStorage.removeItem(`lc_${cacheKey}`);
  } catch (_) {}

  if (t && typeof t.remove === "function") {
    try {
      await t.remove(scope, visibility, key);
    } catch (_) {}
  }
}
