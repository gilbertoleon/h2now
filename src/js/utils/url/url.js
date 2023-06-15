var url = (function() {
  var _sPageURL = window.location.search.substring(1),
    _sURLVariables = _sPageURL.split("&"),
    _sParameterName,
    i;

  function getParameter(sParam) {
    for (i = 0; i < _sURLVariables.length; i++) {
      _sParameterName = _sURLVariables[i].split("=");

      if (_sParameterName[0] === sParam) {
        return _sParameterName[1] === undefined
          ? true
          : decodeURIComponent(_sParameterName[1]);
      }
    }
  }

  return {
    getParameter: getParameter
  };
})();
