/*
Funciona como el modelo de cajas con box-sizing: border-box
O sea, el ancho y alto INCLUYEN el padding
https://developer.mozilla.org/en-US/docs/Learn/CSS/Introduction_to_CSS/Box_model#Advanced_box_manipulation
*/

var Box = function (options) {
  options = options || {};
  var content = options.content || {};
  var padding = options.padding || {};
  var margin = options.margin || {};
  var inner = {};
  var outer = {};
  var box = {};

  if (Number.isInteger(content)) {
    var valor = content;
    content = {};
    content.width = valor;
    content.height = valor;
  } else {
    content.width = content.width || 0;
    content.height = content.height || 0;
  }

  if (Number.isInteger(padding)) {
    var valor = padding;
    padding = {};
    padding.top = valor;
    padding.right = valor;
    padding.bottom = valor;
    padding.left = valor;
  } else {
    padding.top = padding.top || 0;
    padding.right = padding.right || 0;
    padding.bottom = padding.bottom || 0;
    padding.left = padding.left || 0;
  }

  if (Number.isInteger(margin)) {
    var valor = margin;
    margin = {};
    margin.top = valor;
    margin.right = valor;
    margin.bottom = valor;
    margin.left = valor;
  } else {
    margin.top = margin.top || 0;
    margin.right = margin.right || 0;
    margin.bottom = margin.bottom || 0;
    margin.left = margin.left || 0;
  }

  inner.width = content.width + padding.left + padding.right;
  inner.height = content.height + padding.top + padding.bottom;

  outer.width = inner.width + margin.left + margin.right;
  outer.height = inner.height + margin.top + margin.bottom;

  box.margin = margin;
  box.padding = padding;
  box.content = content;
  box.inner = inner;
  box.outer = outer;

  return box;
};
