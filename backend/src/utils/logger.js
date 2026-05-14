function ts() {
  return new Date().toISOString();
}

function fmt(level, tag, msg, data) {
  const base = `[${ts()}] [${level}] [${tag}] ${msg}`;
  return data === undefined ? base : `${base} ${JSON.stringify(data)}`;
}

function info(tag, msg, data) {
  console.log(fmt('INFO', tag, msg, data));
}

function warn(tag, msg, data) {
  console.warn(fmt('WARN', tag, msg, data));
}

function error(tag, msg, data) {
  console.error(fmt('ERROR', tag, msg, data));
}

module.exports = { info, warn, error };
