var windowReady = (function () {
  function ready(fn) {
    if (document.readyState != "loading") {
      fn();
    } else if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      document.attachEvent("onreadystatechange", function () {
        if (document.readyState != "loading") fn();
      });
    }
  }

  return {
    ready: ready,
  };
})();
