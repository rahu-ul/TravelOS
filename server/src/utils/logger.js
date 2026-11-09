const ts = () => new Date().toISOString();
const isTest = process.env.NODE_ENV === 'test';

export const logger = {
  info: (...a) => !isTest && console.log(ts(), 'INFO ', ...a),
  warn: (...a) => !isTest && console.warn(ts(), 'WARN ', ...a),
  error: (...a) => !isTest && console.error(ts(), 'ERROR', ...a),
  stream: { write: (msg) => !isTest && console.log(msg.trim()) },
};
