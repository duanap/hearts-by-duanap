const logger = {
  _fmt(level, msg, meta) {
    const ts = new Date().toISOString();
    const room = meta && meta.roomId ? " [room=" + meta.roomId + "]" : "";
    return ts + " [" + level + "]" + room + " " + msg;
  },
  info(msg, meta)  { console.log(this._fmt("INFO", msg, meta)); },
  warn(msg, meta)  { console.warn(this._fmt("WARN", msg, meta)); },
  error(msg, meta) { console.error(this._fmt("ERROR", msg, meta)); }
};

module.exports = logger;
