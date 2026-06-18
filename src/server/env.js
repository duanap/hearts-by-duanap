function readNumberEnv(name, fallback, options = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;

  const normalized = options.integer ? Math.round(value) : value;
  if (typeof options.min === 'number' && normalized < options.min) return fallback;
  if (typeof options.max === 'number' && normalized > options.max) return fallback;
  return normalized;
}

module.exports = { readNumberEnv };
