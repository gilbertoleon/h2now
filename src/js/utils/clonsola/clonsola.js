var clonsola = (function() {
  function log(obj) {
    console.log(_.cloneDeep(obj));
  }

  function dir(obj) {
    console.dir(_.cloneDeep(obj));
  }

  function warn(obj) {
    console.warn(_.cloneDeep(obj));
  }

  function error(obj) {
    console.error(_.cloneDeep(obj));
  }

  function table(obj) {
    console.table(_.cloneDeep(obj));
  }

  function clear() {
    console.clear();
  }

  return {
    log: log,
    dir: dir,
    warn: warn,
    error: error,
    table: table,
    clear: clear
  };
})();
