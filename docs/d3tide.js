// https://d3js.org Version 4.4.0. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var version = "4.4.0";

var ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;

var descending = function(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var number = function(x) {
  return x === null ? NaN : +x;
};

var variance = function(array, f) {
  var n = array.length,
      m = 0,
      a,
      d,
      s = 0,
      i = -1,
      j = 0;

  if (f == null) {
    while (++i < n) {
      if (!isNaN(a = number(array[i]))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  }

  else {
    while (++i < n) {
      if (!isNaN(a = number(f(array[i], i, array)))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  }

  if (j > 1) return s / (j - 1);
};

var deviation = function(array, f) {
  var v = variance(array, f);
  return v ? Math.sqrt(v) : v;
};

var extent = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  return [a, c];
};

var array = Array.prototype;

var slice = array.slice;
var map = array.map;

var constant$1 = function(x) {
  return function() {
    return x;
  };
};

var identity = function(x) {
  return x;
};

var range = function(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function(start, stop, count) {
  var step = tickStep(start, stop, count);
  return range(
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  );
};

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

var sturges = function(values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
};

var histogram = function() {
  var value = identity,
      domain = extent,
      threshold = sturges;

  function histogram(data) {
    var i,
        n = data.length,
        x,
        values = new Array(n);

    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data);
    }

    var xz = domain(values),
        x0 = xz[0],
        x1 = xz[1],
        tz = threshold(values, x0, x1);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) tz = ticks(x0, x1, tz);

    // Remove any thresholds outside the domain.
    var m = tz.length;
    while (tz[0] <= x0) tz.shift(), --m;
    while (tz[m - 1] >= x1) tz.pop(), --m;

    var bins = new Array(m + 1),
        bin;

    // Initialize bins.
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = [];
      bin.x0 = i > 0 ? tz[i - 1] : x0;
      bin.x1 = i < m ? tz[i] : x1;
    }

    // Assign data to bins by value, ignoring any outside the domain.
    for (i = 0; i < n; ++i) {
      x = values[i];
      if (x0 <= x && x <= x1) {
        bins[bisectRight(tz, x, 0, m)].push(data[i]);
      }
    }

    return bins;
  }

  histogram.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$1(_), histogram) : value;
  };

  histogram.domain = function(_) {
    return arguments.length ? (domain = typeof _ === "function" ? _ : constant$1([_[0], _[1]]), histogram) : domain;
  };

  histogram.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant$1(slice.call(_)) : constant$1(_), histogram) : threshold;
  };

  return histogram;
};

var threshold = function(array, p, f) {
  if (f == null) f = number;
  if (!(n = array.length)) return;
  if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
  if (p >= 1) return +f(array[n - 1], n - 1, array);
  var n,
      h = (n - 1) * p,
      i = Math.floor(h),
      a = +f(array[i], i, array),
      b = +f(array[i + 1], i + 1, array);
  return a + (b - a) * (h - i);
};

var freedmanDiaconis = function(values, min, max) {
  values = map.call(values, number).sort(ascending);
  return Math.ceil((max - min) / (2 * (threshold(values, 0.75) - threshold(values, 0.25)) * Math.pow(values.length, -1 / 3)));
};

var scott = function(values, min, max) {
  return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(values.length, -1 / 3)));
};

var max = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && b > a) a = b;
  }

  return a;
};

var mean = function(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1,
      j = n;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) s += a; else --j;
  }

  else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) s += a; else --j;
  }

  if (j) return s / j;
};

var median = function(array, f) {
  var numbers = [],
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  }

  else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }

  return threshold(numbers.sort(ascending), 0.5);
};

var merge = function(arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

var min = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && a > b) a = b;
  }

  return a;
};

var pairs = function(array) {
  var i = 0, n = array.length - 1, p = array[0], pairs = new Array(n < 0 ? 0 : n);
  while (i < n) pairs[i] = [p, p = array[++i]];
  return pairs;
};

var permute = function(array, indexes) {
  var i = indexes.length, permutes = new Array(i);
  while (i--) permutes[i] = array[indexes[i]];
  return permutes;
};

var scan = function(array, compare) {
  if (!(n = array.length)) return;
  var i = 0,
      n,
      j = 0,
      xi,
      xj = array[j];

  if (!compare) compare = ascending;

  while (++i < n) if (compare(xi = array[i], xj) < 0 || compare(xj, xj) !== 0) xj = xi, j = i;

  if (compare(xj, xj) === 0) return j;
};

var shuffle = function(array, i0, i1) {
  var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
      t,
      i;

  while (m) {
    i = Math.random() * m-- | 0;
    t = array[m + i0];
    array[m + i0] = array[i + i0];
    array[i + i0] = t;
  }

  return array;
};

var sum = function(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) if (a = +array[i]) s += a; // Note: zero and null are equivalent.
  }

  else {
    while (++i < n) if (a = +f(array[i], i, array)) s += a;
  }

  return s;
};

var transpose = function(matrix) {
  if (!(n = matrix.length)) return [];
  for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
    for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
      row[j] = matrix[j][i];
    }
  }
  return transpose;
};

function length(d) {
  return d.length;
}

var zip = function() {
  return transpose(arguments);
};

var prefix = "$";

function Map() {}

Map.prototype = map$1.prototype = {
  constructor: Map,
  has: function(key) {
    return (prefix + key) in this;
  },
  get: function(key) {
    return this[prefix + key];
  },
  set: function(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function() {
    for (var property in this) if (property[0] === prefix) delete this[property];
  },
  keys: function() {
    var keys = [];
    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
    return keys;
  },
  values: function() {
    var values = [];
    for (var property in this) if (property[0] === prefix) values.push(this[property]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
    return entries;
  },
  size: function() {
    var size = 0;
    for (var property in this) if (property[0] === prefix) ++size;
    return size;
  },
  empty: function() {
    for (var property in this) if (property[0] === prefix) return false;
    return true;
  },
  each: function(f) {
    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
  }
};

function map$1(object, f) {
  var map = new Map;

  // Copy constructor.
  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;

    if (f == null) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f(o = object[i], i, object), o);
  }

  // Convert object to map.
  else if (object) for (var key in object) map.set(key, object[key]);

  return map;
}

var nest = function() {
  var keys = [],
      sortKeys = [],
      sortValues,
      rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) return rollup != null
        ? rollup(array) : (sortValues != null
        ? array.sort(sortValues)
        : array);

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$1(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function(values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function entries(map, depth) {
    if (++depth > keys.length) return map;
    var array, sortKey = sortKeys[depth - 1];
    if (rollup != null && depth >= keys.length) array = map.entries();
    else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
    return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
  }

  return nest = {
    object: function(array) { return apply(array, 0, createObject, setObject); },
    map: function(array) { return apply(array, 0, createMap, setMap); },
    entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
    key: function(d) { keys.push(d); return nest; },
    sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
    sortValues: function(order) { sortValues = order; return nest; },
    rollup: function(f) { rollup = f; return nest; }
  };
};

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$1();
}

function setMap(map, key, value) {
  map.set(key, value);
}

function Set() {}

var proto = map$1.prototype;

Set.prototype = set.prototype = {
  constructor: Set,
  has: proto.has,
  add: function(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function set(object, f) {
  var set = new Set;

  // Copy constructor.
  if (object instanceof Set) object.each(function(value) { set.add(value); });

  // Otherwise, assume it’s an array.
  else if (object) {
    var i = -1, n = object.length;
    if (f == null) while (++i < n) set.add(object[i]);
    else while (++i < n) set.add(f(object[i], i, object));
  }

  return set;
}

var keys = function(map) {
  var keys = [];
  for (var key in map) keys.push(key);
  return keys;
};

var values = function(map) {
  var values = [];
  for (var key in map) values.push(map[key]);
  return values;
};

var entries = function(map) {
  var entries = [];
  for (var key in map) entries.push({key: key, value: map[key]});
  return entries;
};

var uniform = function(min, max) {
  min = min == null ? 0 : +min;
  max = max == null ? 1 : +max;
  if (arguments.length === 1) max = min, min = 0;
  else max -= min;
  return function() {
    return Math.random() * max + min;
  };
};

var normal = function(mu, sigma) {
  var x, r;
  mu = mu == null ? 0 : +mu;
  sigma = sigma == null ? 1 : +sigma;
  return function() {
    var y;

    // If available, use the second previously-generated uniform random.
    if (x != null) y = x, x = null;

    // Otherwise, generate a new x and y.
    else do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      r = x * x + y * y;
    } while (!r || r > 1);

    return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
  };
};

var logNormal = function() {
  var randomNormal = normal.apply(this, arguments);
  return function() {
    return Math.exp(randomNormal());
  };
};

var irwinHall = function(n) {
  return function() {
    for (var sum = 0, i = 0; i < n; ++i) sum += Math.random();
    return sum;
  };
};

var bates = function(n) {
  var randomIrwinHall = irwinHall(n);
  return function() {
    return randomIrwinHall() / n;
  };
};

var exponential = function(lambda) {
  return function() {
    return -Math.log(1 - Math.random()) / lambda;
  };
};

function linear(t) {
  return +t;
}

function quadIn(t) {
  return t * t;
}

function quadOut(t) {
  return t * (2 - t);
}

function quadInOut(t) {
  return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}

function cubicIn(t) {
  return t * t * t;
}

function cubicOut(t) {
  return --t * t * t + 1;
}

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent = 3;

var polyIn = (function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
})(exponent);

var polyOut = (function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
})(exponent);

var polyInOut = (function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
})(exponent);

var pi = Math.PI;
var halfPi = pi / 2;

function sinIn(t) {
  return 1 - Math.cos(t * halfPi);
}

function sinOut(t) {
  return Math.sin(t * halfPi);
}

function sinInOut(t) {
  return (1 - Math.cos(pi * t)) / 2;
}

function expIn(t) {
  return Math.pow(2, 10 * t - 10);
}

function expOut(t) {
  return 1 - Math.pow(2, -10 * t);
}

function expInOut(t) {
  return ((t *= 2) <= 1 ? Math.pow(2, 10 * t - 10) : 2 - Math.pow(2, 10 - 10 * t)) / 2;
}

function circleIn(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function circleOut(t) {
  return Math.sqrt(1 - --t * t);
}

function circleInOut(t) {
  return ((t *= 2) <= 1 ? 1 - Math.sqrt(1 - t * t) : Math.sqrt(1 - (t -= 2) * t) + 1) / 2;
}

var b1 = 4 / 11;
var b2 = 6 / 11;
var b3 = 8 / 11;
var b4 = 3 / 4;
var b5 = 9 / 11;
var b6 = 10 / 11;
var b7 = 15 / 16;
var b8 = 21 / 22;
var b9 = 63 / 64;
var b0 = 1 / b1 / b1;

function bounceIn(t) {
  return 1 - bounceOut(1 - t);
}

function bounceOut(t) {
  return (t = +t) < b1 ? b0 * t * t : t < b3 ? b0 * (t -= b2) * t + b4 : t < b6 ? b0 * (t -= b5) * t + b7 : b0 * (t -= b8) * t + b9;
}

function bounceInOut(t) {
  return ((t *= 2) <= 1 ? 1 - bounceOut(1 - t) : bounceOut(t - 1) + 1) / 2;
}

var overshoot = 1.70158;

var backIn = (function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
})(overshoot);

var backOut = (function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
})(overshoot);

var backInOut = (function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
})(overshoot);

var tau = 2 * Math.PI;
var amplitude = 1;
var period = 0.3;

var elasticIn = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function(a) { return custom(a, p * tau); };
  elasticIn.period = function(p) { return custom(a, p); };

  return elasticIn;
})(amplitude, period);

var elasticOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticOut.period = function(p) { return custom(a, p); };

  return elasticOut;
})(amplitude, period);

var elasticInOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0
        ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p)
        : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticInOut.period = function(p) { return custom(a, p); };

  return elasticInOut;
})(amplitude, period);

var area = function(polygon) {
  var i = -1,
      n = polygon.length,
      a,
      b = polygon[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = polygon[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area / 2;
};

var centroid = function(polygon) {
  var i = -1,
      n = polygon.length,
      x = 0,
      y = 0,
      a,
      b = polygon[n - 1],
      c,
      k = 0;

  while (++i < n) {
    a = b;
    b = polygon[i];
    k += c = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  return k *= 3, [x / k, y / k];
};

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
var cross = function(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
};

function lexicographicOrder(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

// Computes the upper convex hull per the monotone chain algorithm.
// Assumes points.length >= 3, is sorted by x, unique in y.
// Returns an array of indices into points in left-to-right order.
function computeUpperHullIndexes(points) {
  var n = points.length,
      indexes = [0, 1],
      size = 2;

  for (var i = 2; i < n; ++i) {
    while (size > 1 && cross(points[indexes[size - 2]], points[indexes[size - 1]], points[i]) <= 0) --size;
    indexes[size++] = i;
  }

  return indexes.slice(0, size); // remove popped points
}

var hull = function(points) {
  if ((n = points.length) < 3) return null;

  var i,
      n,
      sortedPoints = new Array(n),
      flippedPoints = new Array(n);

  for (i = 0; i < n; ++i) sortedPoints[i] = [+points[i][0], +points[i][1], i];
  sortedPoints.sort(lexicographicOrder);
  for (i = 0; i < n; ++i) flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]];

  var upperIndexes = computeUpperHullIndexes(sortedPoints),
      lowerIndexes = computeUpperHullIndexes(flippedPoints);

  // Construct the hull polygon, removing possible duplicate endpoints.
  var skipLeft = lowerIndexes[0] === upperIndexes[0],
      skipRight = lowerIndexes[lowerIndexes.length - 1] === upperIndexes[upperIndexes.length - 1],
      hull = [];

  // Add upper hull in right-to-l order.
  // Then add lower hull in left-to-right order.
  for (i = upperIndexes.length - 1; i >= 0; --i) hull.push(points[sortedPoints[upperIndexes[i]][2]]);
  for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i) hull.push(points[sortedPoints[lowerIndexes[i]][2]]);

  return hull;
};

var contains = function(polygon, point) {
  var n = polygon.length,
      p = polygon[n - 1],
      x = point[0], y = point[1],
      x0 = p[0], y0 = p[1],
      x1, y1,
      inside = false;

  for (var i = 0; i < n; ++i) {
    p = polygon[i], x1 = p[0], y1 = p[1];
    if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside;
    x0 = x1, y0 = y1;
  }

  return inside;
};

var length$1 = function(polygon) {
  var i = -1,
      n = polygon.length,
      b = polygon[n - 1],
      xa,
      ya,
      xb = b[0],
      yb = b[1],
      perimeter = 0;

  while (++i < n) {
    xa = xb;
    ya = yb;
    b = polygon[i];
    xb = b[0];
    yb = b[1];
    xa -= xb;
    ya -= yb;
    perimeter += Math.sqrt(xa * xa + ya * ya);
  }

  return perimeter;
};

var pi$1 = Math.PI;
var tau$1 = 2 * pi$1;
var epsilon = 1e-6;
var tauEpsilon = tau$1 - epsilon;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path;
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function(x1, y1, x, y) {
    this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) {
    this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon)) {}

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Otherwise, draw an arc!
    else {
      var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon) {
        this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
      }

      this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
    }
  },
  arc: function(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._ += "L" + x0 + "," + y0;
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Otherwise, draw an arc!
    else {
      if (da < 0) da = da % tau$1 + tau$1;
      this._ += "A" + r + "," + r + ",0," + (+(da >= pi$1)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
    }
  },
  rect: function(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
  },
  toString: function() {
    return this._;
  }
};

var tree_add = function(d) {
  var x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
};

function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = {data: d},
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d, i, n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, inherit the existing extent.
  if (x1 < x0) x0 = this._x0, x1 = this._x1;
  if (y1 < y0) y0 = this._y0, y1 = this._y1;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }

  return this;
}

var tree_cover = function(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else if (x0 > x || x > x1 || y0 > y || y > y1) {
    var z = x1 - x0,
        node = this._root,
        parent,
        i;

    switch (i = (y < (y0 + y1) / 2) << 1 | (x < (x0 + x1) / 2)) {
      case 0: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1);
        break;
      }
      case 1: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1);
        break;
      }
      case 2: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y);
        break;
      }
      case 3: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y);
        break;
      }
    }

    if (this._root && this._root.length) this._root = node;
  }

  // If the quadtree covers the point already, just return.
  else return this;

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
};

var tree_data = function() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do data.push(node.data); while (node = node.next)
  });
  return data;
};

var tree_extent = function(_) {
  return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
};

var Quad = function(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
};

var tree_find = function(x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node)
        || (x1 = q.x0) > x3
        || (y1 = q.y0) > y3
        || (x2 = q.x1) < x0
        || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(
        new Quad(node[3], xm, ym, x2, y2),
        new Quad(node[2], x1, ym, xm, y2),
        new Quad(node[1], xm, y1, x2, ym),
        new Quad(node[0], x1, y1, xm, ym)
      );

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | (x >= xm)) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }

  return data;
};

var tree_remove = function(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return (next ? previous.next = next : delete previous.next), this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
      && node === (parent[3] || parent[2] || parent[1] || parent[0])
      && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }

  return this;
};

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

var tree_root = function() {
  return this._root;
};

var tree_size = function() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do ++size; while (node = node.next)
  });
  return size;
};

var tree_visit = function(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
};

var tree_visitAfter = function(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
};

function defaultX(d) {
  return d[0];
}

var tree_x = function(_) {
  return arguments.length ? (this._x = _, this) : this._x;
};

function defaultY(d) {
  return d[1];
}

var tree_y = function(_) {
  return arguments.length ? (this._y = _, this) : this._y;
};

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = {data: leaf.data}, next = copy;
  while (leaf = leaf.next) next = next.next = {data: leaf.data};
  return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{source: node, target: copy._root = new Array(4)}];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
        else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

var slice$1 = [].slice;

var noabort = {};

function Queue(size) {
  if (!(size >= 1)) throw new Error;
  this._size = size;
  this._call =
  this._error = null;
  this._tasks = [];
  this._data = [];
  this._waiting =
  this._active =
  this._ended =
  this._start = 0; // inside a synchronous task callback?
}

Queue.prototype = queue.prototype = {
  constructor: Queue,
  defer: function(callback) {
    if (typeof callback !== "function" || this._call) throw new Error;
    if (this._error != null) return this;
    var t = slice$1.call(arguments, 1);
    t.push(callback);
    ++this._waiting, this._tasks.push(t);
    poke(this);
    return this;
  },
  abort: function() {
    if (this._error == null) abort(this, new Error("abort"));
    return this;
  },
  await: function(callback) {
    if (typeof callback !== "function" || this._call) throw new Error;
    this._call = function(error, results) { callback.apply(null, [error].concat(results)); };
    maybeNotify(this);
    return this;
  },
  awaitAll: function(callback) {
    if (typeof callback !== "function" || this._call) throw new Error;
    this._call = callback;
    maybeNotify(this);
    return this;
  }
};

function poke(q) {
  if (!q._start) {
    try { start(q); } // let the current task complete
    catch (e) {
      if (q._tasks[q._ended + q._active - 1]) abort(q, e); // task errored synchronously
      else if (!q._data) throw e; // await callback errored synchronously
    }
  }
}

function start(q) {
  while (q._start = q._waiting && q._active < q._size) {
    var i = q._ended + q._active,
        t = q._tasks[i],
        j = t.length - 1,
        c = t[j];
    t[j] = end(q, i);
    --q._waiting, ++q._active;
    t = c.apply(null, t);
    if (!q._tasks[i]) continue; // task finished synchronously
    q._tasks[i] = t || noabort;
  }
}

function end(q, i) {
  return function(e, r) {
    if (!q._tasks[i]) return; // ignore multiple callbacks
    --q._active, ++q._ended;
    q._tasks[i] = null;
    if (q._error != null) return; // ignore secondary errors
    if (e != null) {
      abort(q, e);
    } else {
      q._data[i] = r;
      if (q._waiting) poke(q);
      else maybeNotify(q);
    }
  };
}

function abort(q, e) {
  var i = q._tasks.length, t;
  q._error = e; // ignore active callbacks
  q._data = undefined; // allow gc
  q._waiting = NaN; // prevent starting

  while (--i >= 0) {
    if (t = q._tasks[i]) {
      q._tasks[i] = null;
      if (t.abort) {
        try { t.abort(); }
        catch (e) { /* ignore */ }
      }
    }
  }

  q._active = NaN; // allow notification
  maybeNotify(q);
}

function maybeNotify(q) {
  if (!q._active && q._call) {
    var d = q._data;
    q._data = undefined; // allow gc
    q._call(q._error, d);
  }
}

function queue(concurrency) {
  return new Queue(arguments.length ? +concurrency : Infinity);
}

var constant$2 = function(x) {
  return function constant() {
    return x;
  };
};

var epsilon$1 = 1e-12;
var pi$2 = Math.PI;
var halfPi$1 = pi$2 / 2;
var tau$2 = 2 * pi$2;

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function asin(x) {
  return x >= 1 ? halfPi$1 : x <= -1 ? -halfPi$1 : Math.asin(x);
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0, y10 = y1 - y0,
      x32 = x3 - x2, y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

var arc = function() {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$2(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi$1,
        a1 = endAngle.apply(this, arguments) - halfPi$1,
        da = Math.abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$1)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$2 - epsilon$1) {
      context.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > epsilon$1) {
        context.moveTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    }

    // Or is it a circular or annular sector?
    else {
      var a01 = a0,
          a11 = a1,
          a00 = a0,
          a10 = a1,
          da0 = da,
          da1 = da,
          ap = padAngle.apply(this, arguments) / 2,
          rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : Math.sqrt(r0 * r0 + r1 * r1)),
          rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
          rc0 = rc,
          rc1 = rc,
          t0,
          t1;

      // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
      if (rp > epsilon$1) {
        var p0 = asin(rp / r0 * Math.sin(ap)),
            p1 = asin(rp / r1 * Math.sin(ap));
        if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
        else da0 = 0, a00 = a10 = (a0 + a1) / 2;
        if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
        else da1 = 0, a01 = a11 = (a0 + a1) / 2;
      }

      var x01 = r1 * Math.cos(a01),
          y01 = r1 * Math.sin(a01),
          x10 = r0 * Math.cos(a10),
          y10 = r0 * Math.sin(a10);

      // Apply rounded corners?
      if (rc > epsilon$1) {
        var x11 = r1 * Math.cos(a11),
            y11 = r1 * Math.sin(a11),
            x00 = r0 * Math.cos(a00),
            y00 = r0 * Math.sin(a00);

        // Restrict the corner radius according to the sector angle.
        if (da < pi$2) {
          var oc = da0 > epsilon$1 ? intersect(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
              ax = x01 - oc[0],
              ay = y01 - oc[1],
              bx = x11 - oc[0],
              by = y11 - oc[1],
              kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2),
              lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
          rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
        }
      }

      // Is the sector collapsed to a line?
      if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

      // Does the sector’s outer ring have rounded corners?
      else if (rc1 > epsilon$1) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the outer ring just a circular arc?
      else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

      // Is there no inner ring, and it’s a circular sector?
      // Or perhaps it’s an annular sector collapsed due to padding?
      if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

      // Does the sector’s inner ring (or point) have rounded corners?
      else if (rc0 > epsilon$1) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the inner ring just a circular arc?
      else context.arc(0, 0, r0, a10, a00, cw);
    }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function() {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$2 / 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  arc.innerRadius = function(_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : innerRadius;
  };

  arc.outerRadius = function(_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : cornerRadius;
  };

  arc.padRadius = function(_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), arc) : padRadius;
  };

  arc.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : startAngle;
  };

  arc.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : endAngle;
  };

  arc.padAngle = function(_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : padAngle;
  };

  arc.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), arc) : context;
  };

  return arc;
};

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: this._context.lineTo(x, y); break;
    }
  }
};

var curveLinear = function(context) {
  return new Linear(context);
};

function x(p) {
  return p[0];
}

function y(p) {
  return p[1];
}

var line = function() {
  var x$$1 = x,
      y$$1 = y,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x$$1(d, i, data), +y$$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function(_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$2(+_), line) : x$$1;
  };

  line.y = function(_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$2(+_), line) : y$$1;
  };

  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), line) : defined;
  };

  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area$1 = function() {
  var x0 = x,
      x1 = null,
      y0 = constant$2(0),
      y1 = y,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line().defined(defined).curve(curve).context(context);
  }

  area.x = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), x1 = null, area) : x0;
  };

  area.x0 = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), area) : x0;
  };

  area.x1 = function(_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : x1;
  };

  area.y = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), y1 = null, area) : y0;
  };

  area.y0 = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), area) : y0;
  };

  area.y1 = function(_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : y1;
  };

  area.lineX0 =
  area.lineY0 = function() {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function() {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function() {
    return arealine().x(x1).y(y0);
  };

  area.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), area) : defined;
  };

  area.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

var descending$1 = function(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var identity$1 = function(d) {
  return d;
};

var pie = function() {
  var value = identity$1,
      sortValues = descending$1,
      sort = null,
      startAngle = constant$2(0),
      endAngle = constant$2(tau$2),
      padAngle = constant$2(0);

  function pie(data) {
    var i,
        n = data.length,
        j,
        k,
        sum = 0,
        index = new Array(n),
        arcs = new Array(n),
        a0 = +startAngle.apply(this, arguments),
        da = Math.min(tau$2, Math.max(-tau$2, endAngle.apply(this, arguments) - a0)),
        a1,
        p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
        pa = p * (da < 0 ? -1 : 1),
        v;

    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (sortValues != null) index.sort(function(i, j) { return sortValues(arcs[i], arcs[j]); });
    else if (sort != null) index.sort(function(i, j) { return sort(data[i], data[j]); });

    // Compute the arcs! They are stored in the original data's order.
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      };
    }

    return arcs;
  }

  pie.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$2(+_), pie) : value;
  };

  pie.sortValues = function(_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };

  pie.sort = function(_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };

  pie.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : startAngle;
  };

  pie.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : endAngle;
  };

  pie.padAngle = function(_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : padAngle;
  };

  return pie;
};

var curveRadialLinear = curveRadial(curveLinear);

function Radial(curve) {
  this._curve = curve;
}

Radial.prototype = {
  areaStart: function() {
    this._curve.areaStart();
  },
  areaEnd: function() {
    this._curve.areaEnd();
  },
  lineStart: function() {
    this._curve.lineStart();
  },
  lineEnd: function() {
    this._curve.lineEnd();
  },
  point: function(a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};

function curveRadial(curve) {

  function radial(context) {
    return new Radial(curve(context));
  }

  radial._curve = curve;

  return radial;
}

function radialLine(l) {
  var c = l.curve;

  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;

  l.curve = function(_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return l;
}

var radialLine$1 = function() {
  return radialLine(line().curve(curveRadialLinear));
};

var radialArea = function() {
  var a = area$1().curve(curveRadialLinear),
      c = a.curve,
      x0 = a.lineX0,
      x1 = a.lineX1,
      y0 = a.lineY0,
      y1 = a.lineY1;

  a.angle = a.x, delete a.x;
  a.startAngle = a.x0, delete a.x0;
  a.endAngle = a.x1, delete a.x1;
  a.radius = a.y, delete a.y;
  a.innerRadius = a.y0, delete a.y0;
  a.outerRadius = a.y1, delete a.y1;
  a.lineStartAngle = function() { return radialLine(x0()); }, delete a.lineX0;
  a.lineEndAngle = function() { return radialLine(x1()); }, delete a.lineX1;
  a.lineInnerRadius = function() { return radialLine(y0()); }, delete a.lineY0;
  a.lineOuterRadius = function() { return radialLine(y1()); }, delete a.lineY1;

  a.curve = function(_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return a;
};

var circle = {
  draw: function(context, size) {
    var r = Math.sqrt(size / pi$2);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau$2);
  }
};

var cross$1 = {
  draw: function(context, size) {
    var r = Math.sqrt(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};

var tan30 = Math.sqrt(1 / 3);
var tan30_2 = tan30 * 2;

var diamond = {
  draw: function(context, size) {
    var y = Math.sqrt(size / tan30_2),
        x = y * tan30;
    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);
    context.closePath();
  }
};

var ka = 0.89081309152928522810;
var kr = Math.sin(pi$2 / 10) / Math.sin(7 * pi$2 / 10);
var kx = Math.sin(tau$2 / 10) * kr;
var ky = -Math.cos(tau$2 / 10) * kr;

var star = {
  draw: function(context, size) {
    var r = Math.sqrt(size * ka),
        x = kx * r,
        y = ky * r;
    context.moveTo(0, -r);
    context.lineTo(x, y);
    for (var i = 1; i < 5; ++i) {
      var a = tau$2 * i / 5,
          c = Math.cos(a),
          s = Math.sin(a);
      context.lineTo(s * r, -c * r);
      context.lineTo(c * x - s * y, s * x + c * y);
    }
    context.closePath();
  }
};

var square = {
  draw: function(context, size) {
    var w = Math.sqrt(size),
        x = -w / 2;
    context.rect(x, x, w, w);
  }
};

var sqrt3 = Math.sqrt(3);

var triangle = {
  draw: function(context, size) {
    var y = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
};

var c = -0.5;
var s = Math.sqrt(3) / 2;
var k = 1 / Math.sqrt(12);
var a = (k / 2 + 1) * 3;

var wye = {
  draw: function(context, size) {
    var r = Math.sqrt(size / a),
        x0 = r / 2,
        y0 = r * k,
        x1 = x0,
        y1 = r * k + r,
        x2 = -x1,
        y2 = y1;
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
    context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
    context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
    context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
    context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
    context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
    context.closePath();
  }
};

var symbols = [
  circle,
  cross$1,
  diamond,
  square,
  star,
  triangle,
  wye
];

var symbol = function() {
  var type = constant$2(circle),
      size = constant$2(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function(_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant$2(_), symbol) : type;
  };

  symbol.size = function(_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant$2(+_), symbol) : size;
  };

  symbol.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
};

var noop = function() {};

function point(that, x, y) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  );
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3: point(this, this._x1, this._y1); // proceed
      case 2: this._context.lineTo(this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basis = function(context) {
  return new Basis(context);
};

function BasisClosed(context) {
  this._context = context;
}

BasisClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x2, this._y2);
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._x2 = x, this._y2 = y; break;
      case 1: this._point = 2; this._x3 = x, this._y3 = y; break;
      case 2: this._point = 3; this._x4 = x, this._y4 = y; this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6); break;
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisClosed = function(context) {
  return new BasisClosed(context);
};

function BasisOpen(context) {
  this._context = context;
}

BasisOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; var x0 = (this._x0 + 4 * this._x1 + x) / 6, y0 = (this._y0 + 4 * this._y1 + y) / 6; this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0); break;
      case 3: this._point = 4; // proceed
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisOpen = function(context) {
  return new BasisOpen(context);
};

function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}

Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(
          this._beta * x[i] + (1 - this._beta) * (x0 + t * dx),
          this._beta * y[i] + (1 - this._beta) * (y0 + t * dy)
        );
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var bundle = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }

  bundle.beta = function(beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function point$1(that, x, y) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  );
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: point$1(this, this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
      case 2: this._point = 3; // proceed
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinal = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalClosed = (function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalOpen = (function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function point$2(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$1) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$1) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: this.point(this._x2, this._y2); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; // proceed
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomClosed = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomOpen = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function LinearClosed(context) {
  this._context = context;
}

LinearClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._point) this._context.closePath();
  },
  point: function(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);
    else this._point = 1, this._context.moveTo(x, y);
  }
};

var linearClosed = function(context) {
  return new LinearClosed(context);
};

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function point$3(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 =
    this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x1, this._y1); break;
      case 3: point$3(this, this._t0, slope2(this, this._t0)); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; point$3(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
      default: point$3(this, this._t0, t1 = slope3(this, x, y)); break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function(x, y) { this._context.moveTo(y, x); },
  closePath: function() { this._context.closePath(); },
  lineTo: function(x, y) { this._context.lineTo(y, x); },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
};

function monotoneX(context) {
  return new MonotoneX(context);
}

function monotoneY(context) {
  return new MonotoneY(context);
}

function Natural(context) {
  this._context = context;
}

Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
            py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || (this._line !== 0 && n === 1)) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}

var natural = function(context) {
  return new Natural(context);
};

function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y);
          this._context.lineTo(x, y);
        } else {
          var x1 = this._x * (1 - this._t) + x * this._t;
          this._context.lineTo(x1, this._y);
          this._context.lineTo(x1, y);
        }
        break;
      }
    }
    this._x = x, this._y = y;
  }
};

var step = function(context) {
  return new Step(context, 0.5);
};

function stepBefore(context) {
  return new Step(context, 0);
}

function stepAfter(context) {
  return new Step(context, 1);
}

var slice$2 = Array.prototype.slice;

var none = function(series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (var j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
};

var none$1 = function(series) {
  var n = series.length, o = new Array(n);
  while (--n >= 0) o[n] = n;
  return o;
};

function stackValue(d, key) {
  return d[key];
}

var stack = function() {
  var keys = constant$2([]),
      order = none$1,
      offset = none,
      value = stackValue;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function(_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant$2(slice$2.call(_)), stack) : keys;
  };

  stack.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$2(+_), stack) : value;
  };

  stack.order = function(_) {
    return arguments.length ? (order = _ == null ? none$1 : typeof _ === "function" ? _ : constant$2(slice$2.call(_)), stack) : order;
  };

  stack.offset = function(_) {
    return arguments.length ? (offset = _ == null ? none : _, stack) : offset;
  };

  return stack;
};

var expand = function(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) y += series[i][j][1] || 0;
    if (y) for (i = 0; i < n; ++i) series[i][j][1] /= y;
  }
  none(series, order);
};

var silhouette = function(series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
    s0[j][1] += s0[j][0] = -y / 2;
  }
  none(series, order);
};

var wiggle = function(series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      s1 += sij0, s2 += s3 * sij0;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  none(series, order);
};

var ascending$1 = function(series) {
  var sums = series.map(sum$1);
  return none$1(series).sort(function(a, b) { return sums[a] - sums[b]; });
};

function sum$1(series) {
  var s = 0, i = -1, n = series.length, v;
  while (++i < n) if (v = +series[i][1]) s += v;
  return s;
}

var descending$2 = function(series) {
  return ascending$1(series).reverse();
};

var insideOut = function(series) {
  var n = series.length,
      i,
      j,
      sums = series.map(sum$1),
      order = none$1(series).sort(function(a, b) { return sums[b] - sums[a]; }),
      top = 0,
      bottom = 0,
      tops = [],
      bottoms = [];

  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }

  return bottoms.reverse().concat(tops);
};

var reverse = function(series) {
  return none$1(series).reverse();
};

var define = function(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

function basis$1(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

var basis$2 = function(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis$1((t - i / n) * n, v0, v1, v2, v3);
  };
};

var basisClosed$1 = function(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
        v0 = values[(i + n - 1) % n],
        v1 = values[i % n],
        v2 = values[(i + 1) % n],
        v3 = values[(i + 2) % n];
    return basis$1((t - i / n) * n, v0, v1, v2, v3);
  };
};

var constant$3 = function(x) {
  return function() {
    return x;
  };
};

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential$1(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$3(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential$1(a, b, y) : constant$3(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$3(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color$$1;
    for (i = 0; i < n; ++i) {
      color$$1 = rgb(colors[i]);
      r[i] = color$$1.r || 0;
      g[i] = color$$1.g || 0;
      b[i] = color$$1.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color$$1.opacity = 1;
    return function(t) {
      color$$1.r = r(t);
      color$$1.g = g(t);
      color$$1.b = b(t);
      return color$$1 + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$2);
var rgbBasisClosed = rgbSpline(basisClosed$1);

var array$1 = function(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
};

var date = function(a, b) {
  var d = new Date;
  return a = +a, b -= a, function(t) {
    return d.setTime(a + b * t), d;
  };
};

var interpolateNumber = function(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
};

var object = function(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

var interpolateString = function(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
};

var interpolate = function(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$3(b)
      : (t === "number" ? interpolateNumber
      : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
      : b instanceof color ? interpolateRgb
      : b instanceof Date ? date
      : Array.isArray(b) ? array$1
      : isNaN(b) ? object
      : interpolateNumber)(a, b);
};

var interpolateRound = function(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
};

var degrees = 180 / Math.PI;

var identity$2 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose = function(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode;
var cssRoot;
var cssView;
var svgNode;

function parseCss(value) {
  if (value === "none") return identity$2;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$2;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var rho = Math.SQRT2;
var rho2 = 2;
var rho4 = 4;
var epsilon2 = 1e-12;

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]
var interpolateZoom = function(p0, p1) {
  var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
      ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S;

  // Special case for u0 ≅ u1.
  if (d2 < epsilon2) {
    S = Math.log(w1 / w0) / rho;
    i = function(t) {
      return [
        ux0 + t * dx,
        uy0 + t * dy,
        w0 * Math.exp(rho * t * S)
      ];
    };
  }

  // General case.
  else {
    var d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    i = function(t) {
      var s = t * S,
          coshr0 = cosh(r0),
          u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
      return [
        ux0 + u * dx,
        uy0 + u * dy,
        w0 * coshr0 / cosh(rho * s + r0)
      ];
    };
  }

  i.duration = S * 1000;

  return i;
};

function hsl$1(hue$$1) {
  return function(start, end) {
    var h = hue$$1((start = hsl(start)).h, (end = hsl(end)).h),
        s = nogamma(start.s, end.s),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.s = s(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
}

var hsl$2 = hsl$1(hue);
var hslLong = hsl$1(nogamma);

function lab$1(start, end) {
  var l = nogamma((start = lab(start)).l, (end = lab(end)).l),
      a = nogamma(start.a, end.a),
      b = nogamma(start.b, end.b),
      opacity = nogamma(start.opacity, end.opacity);
  return function(t) {
    start.l = l(t);
    start.a = a(t);
    start.b = b(t);
    start.opacity = opacity(t);
    return start + "";
  };
}

function hcl$1(hue$$1) {
  return function(start, end) {
    var h = hue$$1((start = hcl(start)).h, (end = hcl(end)).h),
        c = nogamma(start.c, end.c),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.c = c(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
}

var hcl$2 = hcl$1(hue);
var hclLong = hcl$1(nogamma);

function cubehelix$1(hue$$1) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  })(1);
}

var cubehelix$2 = cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var quantize = function(interpolator, n) {
  var samples = new Array(n);
  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
  return samples;
};

var noop$1 = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$2(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$2(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$2(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "]";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

var dsv = function(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n]"),
      delimiterCode = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns;
    return rows;
  }

  function parseRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        N = text.length,
        I = 0, // current character index
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    function token() {
      if (I >= N) return EOF; // special case: end of file
      if (eol) return eol = false, EOL; // special case: end of line

      // special case: quotes
      var j = I, c;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < N) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            ++i;
          }
        }
        I = i + 2;
        c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) ++I;
        } else if (c === 10) {
          eol = true;
        }
        return text.slice(j + 1, i).replace(/""/g, "\"");
      }

      // common case: find next delimiter or newline
      while (I < N) {
        var k = 1;
        c = text.charCodeAt(I++);
        if (c === 10) eol = true; // \n
        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
        else if (c !== delimiterCode) continue;
        return text.slice(j, I - k);
      }

      // special case: last token before EOF
      return text.slice(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
      if (f && (a = f(a, n++)) == null) continue;
      rows.push(a);
    }

    return rows;
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    })).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(text) {
    return text == null ? ""
        : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
        : text;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatRows: formatRows
  };
};

var csv = dsv(",");

var csvParse = csv.parse;
var csvParseRows = csv.parseRows;
var csvFormat = csv.format;
var csvFormatRows = csv.formatRows;

var tsv = dsv("\t");

var tsvParse = tsv.parse;
var tsvParseRows = tsv.parseRows;
var tsvFormat = tsv.format;
var tsvFormatRows = tsv.formatRows;

var request = function(url, callback) {
  var request,
      event = dispatch("beforesend", "progress", "load", "error"),
      mimeType,
      headers = map$1(),
      xhr = new XMLHttpRequest,
      user = null,
      password = null,
      response,
      responseType,
      timeout = 0;

  // If IE does not support CORS, use XDomainRequest.
  if (typeof XDomainRequest !== "undefined"
      && !("withCredentials" in xhr)
      && /^(http(s)?:)?\/\//.test(url)) xhr = new XDomainRequest;

  "onload" in xhr
      ? xhr.onload = xhr.onerror = xhr.ontimeout = respond
      : xhr.onreadystatechange = function(o) { xhr.readyState > 3 && respond(o); };

  function respond(o) {
    var status = xhr.status, result;
    if (!status && hasResponse(xhr)
        || status >= 200 && status < 300
        || status === 304) {
      if (response) {
        try {
          result = response.call(request, xhr);
        } catch (e) {
          event.call("error", request, e);
          return;
        }
      } else {
        result = xhr;
      }
      event.call("load", request, result);
    } else {
      event.call("error", request, o);
    }
  }

  xhr.onprogress = function(e) {
    event.call("progress", request, e);
  };

  request = {
    header: function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers.get(name);
      if (value == null) headers.remove(name);
      else headers.set(name, value + "");
      return request;
    },

    // If mimeType is non-null and no Accept header is set, a default is used.
    mimeType: function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return request;
    },

    // Specifies what type the response value should take;
    // for instance, arraybuffer, blob, document, or text.
    responseType: function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return request;
    },

    timeout: function(value) {
      if (!arguments.length) return timeout;
      timeout = +value;
      return request;
    },

    user: function(value) {
      return arguments.length < 1 ? user : (user = value == null ? null : value + "", request);
    },

    password: function(value) {
      return arguments.length < 1 ? password : (password = value == null ? null : value + "", request);
    },

    // Specify how to convert the response content to a specific type;
    // changes the callback value on "load" events.
    response: function(value) {
      response = value;
      return request;
    },

    // Alias for send("GET", …).
    get: function(data, callback) {
      return request.send("GET", data, callback);
    },

    // Alias for send("POST", …).
    post: function(data, callback) {
      return request.send("POST", data, callback);
    },

    // If callback is non-null, it will be used for error and load events.
    send: function(method, data, callback) {
      xhr.open(method, url, true, user, password);
      if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
      if (xhr.setRequestHeader) headers.each(function(value, name) { xhr.setRequestHeader(name, value); });
      if (mimeType != null && xhr.overrideMimeType) xhr.overrideMimeType(mimeType);
      if (responseType != null) xhr.responseType = responseType;
      if (timeout > 0) xhr.timeout = timeout;
      if (callback == null && typeof data === "function") callback = data, data = null;
      if (callback != null && callback.length === 1) callback = fixCallback(callback);
      if (callback != null) request.on("error", callback).on("load", function(xhr) { callback(null, xhr); });
      event.call("beforesend", request, xhr);
      xhr.send(data == null ? null : data);
      return request;
    },

    abort: function() {
      xhr.abort();
      return request;
    },

    on: function() {
      var value = event.on.apply(event, arguments);
      return value === event ? request : value;
    }
  };

  if (callback != null) {
    if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
    return request.get(callback);
  }

  return request;
};

function fixCallback(callback) {
  return function(error, xhr) {
    callback(error == null ? xhr : null);
  };
}

function hasResponse(xhr) {
  var type = xhr.responseType;
  return type && type !== "text"
      ? xhr.response // null on error
      : xhr.responseText; // "" on error
}

var type = function(defaultMimeType, response) {
  return function(url, callback) {
    var r = request(url).mimeType(defaultMimeType).response(response);
    if (callback != null) {
      if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
      return r.get(callback);
    }
    return r;
  };
};

var html = type("text/html", function(xhr) {
  return document.createRange().createContextualFragment(xhr.responseText);
});

var json = type("application/json", function(xhr) {
  return JSON.parse(xhr.responseText);
});

var text = type("text/plain", function(xhr) {
  return xhr.responseText;
});

var xml = type("application/xml", function(xhr) {
  var xml = xhr.responseXML;
  if (!xml) throw new Error("parse error");
  return xml;
});

var dsv$1 = function(defaultMimeType, parse) {
  return function(url, row, callback) {
    if (arguments.length < 3) callback = row, row = null;
    var r = request(url).mimeType(defaultMimeType);
    r.row = function(_) { return arguments.length ? r.response(responseOf(parse, row = _)) : row; };
    r.row(row);
    return callback ? r.get(callback) : r;
  };
};

function responseOf(parse, row) {
  return function(request$$1) {
    return parse(request$$1.responseText, row);
  };
}

var csv$1 = dsv$1("text/csv", csvParse);

var tsv$1 = dsv$1("text/tab-separated-values", tsvParse);

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke$1() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) interval = setInterval(poke$1, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

var timeout$1 = function(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(function(elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var interval$1 = function(callback, delay, time) {
  var t = new Timer, total = delay;
  if (delay == null) return t.restart(callback, delay, time), t;
  delay = +delay, time = time == null ? now() : +time;
  t.restart(function tick(elapsed) {
    elapsed += total;
    t.restart(tick, total += delay, time);
    callback(elapsed);
  }, delay, time);
  return t;
};

var t0$1 = new Date;
var t1$1 = new Date;

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function(date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function(date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function(date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function(start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
    return range;
  };

  interval.filter = function(test) {
    return newInterval(function(date) {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, function(date, step) {
      if (date >= date) while (--step >= 0) while (offseti(date, 1), !test(date)) {} // eslint-disable-line no-empty
    });
  };

  if (count) {
    interval.count = function(start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? function(d) { return field(d) % step === 0; }
              : function(d) { return interval.count(0, d) % step === 0; });
    };
  }

  return interval;
}

var millisecond = newInterval(function() {
  // noop
}, function(date, step) {
  date.setTime(+date + step);
}, function(start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function(k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function(date) {
    date.setTime(Math.floor(date / k) * k);
  }, function(date, step) {
    date.setTime(+date + step * k);
  }, function(start, end) {
    return (end - start) / k;
  });
};

var milliseconds = millisecond.range;

var durationSecond = 1e3;
var durationMinute = 6e4;
var durationHour = 36e5;
var durationDay = 864e5;
var durationWeek = 6048e5;

var second = newInterval(function(date) {
  date.setTime(Math.floor(date / durationSecond) * durationSecond);
}, function(date, step) {
  date.setTime(+date + step * durationSecond);
}, function(start, end) {
  return (end - start) / durationSecond;
}, function(date) {
  return date.getUTCSeconds();
});

var seconds = second.range;

var minute = newInterval(function(date) {
  date.setTime(Math.floor(date / durationMinute) * durationMinute);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getMinutes();
});

var minutes = minute.range;

var hour = newInterval(function(date) {
  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
  if (offset < 0) offset += durationHour;
  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getHours();
});

var hours = hour.range;

var day = newInterval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
}, function(date) {
  return date.getDate() - 1;
});

var days = day.range;

function weekday(i) {
  return newInterval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var sundays = sunday.range;
var mondays = monday.range;
var tuesdays = tuesday.range;
var wednesdays = wednesday.range;
var thursdays = thursday.range;
var fridays = friday.range;
var saturdays = saturday.range;

var month = newInterval(function(date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setMonth(date.getMonth() + step);
}, function(start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function(date) {
  return date.getMonth();
});

var months = month.range;

var year = newInterval(function(date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function(start, end) {
  return end.getFullYear() - start.getFullYear();
}, function(date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var years = year.range;

var utcMinute = newInterval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getUTCMinutes();
});

var utcMinutes = utcMinute.range;

var utcHour = newInterval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getUTCHours();
});

var utcHours = utcHour.range;

var utcDay = newInterval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay;
}, function(date) {
  return date.getUTCDate() - 1;
});

var utcDays = utcDay.range;

function utcWeekday(i) {
  return newInterval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcSundays = utcSunday.range;
var utcMondays = utcMonday.range;
var utcTuesdays = utcTuesday.range;
var utcWednesdays = utcWednesday.range;
var utcThursdays = utcThursday.range;
var utcFridays = utcFriday.range;
var utcSaturdays = utcSaturday.range;

var utcMonth = newInterval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

var utcMonths = utcMonth.range;

var utcYear = newInterval(function(date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function(start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function(date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

var utcYears = utcYear.range;

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
};

var exponent$1 = function(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatDefault = function(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) i0 = 0; break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

var formatSpecifier = function(specifier) {
  return new FormatSpecifier(specifier);
};

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

var prefixes = ["y","z","a","f","p","n","\xB5","m","","k","M","G","T","P","E","Z","Y"];

function identity$3(x) {
  return x;
}

var formatLocale = function(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
      currency = locale.currency,
      decimal = locale.decimal;

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // If the original value was negative, it may be rounded to zero during
        // formatting; treat this as (positive) zero.
        if (valueNegative) {
          i = -1, n = value.length;
          valueNegative = false;
          while (++i < n) {
            if (c = value.charCodeAt(i), (48 < c && c < 58)
                || (type === "x" && 96 < c && c < 103)
                || (type === "X" && 64 < c && c < 71)) {
              valueNegative = true;
              break;
            }
          }
        }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": return valuePrefix + value + valueSuffix + padding;
        case "=": return valuePrefix + padding + value + valueSuffix;
        case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale$1;



defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale$1 = formatLocale(definition);
  exports.format = locale$1.format;
  exports.formatPrefix = locale$1.formatPrefix;
  return locale$1;
}

var precisionFixed = function(step) {
  return Math.max(0, -exponent$1(Math.abs(step)));
};

var precisionPrefix = function(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3 - exponent$1(Math.abs(step)));
};

var precisionRound = function(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent$1(max) - exponent$1(step)) + 1;
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
          else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function(string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"};
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {}, i = -1, n = names.length;
  while (++i < n) map[names[i].toLowerCase()] = i;
  return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad(z / 60 | 0, "0", 2)
      + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$2;





defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$2 = formatLocale$1(definition);
  exports.timeFormat = locale$2.format;
  exports.timeParse = locale$2.parse;
  exports.utcFormat = locale$2.utcFormat;
  exports.utcParse = locale$2.utcParse;
  return locale$2;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : exports.utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : exports.utcParse(isoSpecifier);

var array$2 = Array.prototype;

var map$3 = array$2.map;
var slice$3 = array$2.slice;

var implicit = {name: "implicit"};

function ordinal(range) {
  var index = map$1(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$3.call(range);

  function scale(d) {
    var key = d + "", i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$1();
    var i = -1, n = _.length, d, key;
    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$3.call(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal()
        .domain(domain)
        .range(range)
        .unknown(unknown);
  };

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$1 = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$1[1] < range$$1[0],
        start = range$$1[reverse - 0],
        stop = range$$1[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
  };

  scale.rangeRound = function(_) {
    return range$$1 = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range$$1)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point$4() {
  return pointish(band().paddingInner(1));
}

var constant$4 = function(x) {
  return function() {
    return x;
  };
};

var number$1 = function(x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$4(b);
}

function deinterpolateClamp(deinterpolate) {
  return function(a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function(a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
  };
}

function bimap(domain, range$$1, deinterpolate, reinterpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range$$1[0], r1 = range$$1[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
  else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range$$1, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range$$1.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range$$1 = range$$1.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range$$1[i], range$$1[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate) {
  var domain = unit,
      range$$1 = unit,
      interpolate$$1 = interpolate,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range$$1.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range$$1, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function(y) {
    return (input || (input = piecewise(range$$1, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map$3.call(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range$$1 = slice$3.call(_), rescale()) : range$$1.slice();
  };

  scale.rangeRound = function(_) {
    return range$$1 = slice$3.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

var tickFormat = function(domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return exports.formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return exports.format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function(count) {
    var d = domain(),
        i = d.length - 1,
        n = count == null ? 10 : count,
        start = d[0],
        stop = d[i],
        step = tickStep(start, stop, n);

    if (step) {
      step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
      d[0] = Math.floor(start / step) * step;
      d[i] = Math.ceil(stop / step) * step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear$2() {
  var scale = continuous(deinterpolateLinear, interpolateNumber);

  scale.copy = function() {
    return copy(scale, linear$2());
  };

  return linearish(scale);
}

function identity$4() {
  var domain = [0, 1];

  function scale(x) {
    return +x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function(_) {
    return arguments.length ? (domain = map$3.call(_, number$1), scale) : domain.slice();
  };

  scale.copy = function() {
    return identity$4().domain(domain);
  };

  return linearish(scale);
}

var nice = function(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
};

function deinterpolate(a, b) {
  return (b = Math.log(b / a))
      ? function(x) { return Math.log(x / a) / b; }
      : constant$4(b);
}

function reinterpolate(a, b) {
  return a < 0
      ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
      : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : function(x) { return Math.pow(base, x); };
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
}

function reflect(f) {
  return function(x) {
    return -f(-x);
  };
}

function log() {
  var scale = continuous(deinterpolate, reinterpolate).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp(10),
      pows = powp(10);

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function(count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function(count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = exports.format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function(d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function() {
    return domain(nice(domain(), {
      floor: function(x) { return pows(Math.floor(logs(x))); },
      ceil: function(x) { return pows(Math.ceil(logs(x))); }
    }));
  };

  scale.copy = function() {
    return copy(scale, log().base(base));
  };

  return scale;
}

function raise(x, exponent) {
  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
}

function pow() {
  var exponent = 1,
      scale = continuous(deinterpolate, reinterpolate),
      domain = scale.domain;

  function deinterpolate(a, b) {
    return (b = raise(b, exponent) - (a = raise(a, exponent)))
        ? function(x) { return (raise(x, exponent) - a) / b; }
        : constant$4(b);
  }

  function reinterpolate(a, b) {
    b = raise(b, exponent) - (a = raise(a, exponent));
    return function(t) { return raise(a + b * t, 1 / exponent); };
  }

  scale.exponent = function(_) {
    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
  };

  scale.copy = function() {
    return copy(scale, pow().exponent(exponent));
  };

  return linearish(scale);
}

function sqrt() {
  return pow().exponent(0.5);
}

function quantile$$1() {
  var domain = [],
      range$$1 = [],
      thresholds = [];

  function rescale() {
    var i = 0, n = Math.max(1, range$$1.length);
    thresholds = new Array(n - 1);
    while (++i < n) thresholds[i - 1] = threshold(domain, i / n);
    return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range$$1[bisectRight(thresholds, x)];
  }

  scale.invertExtent = function(y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN] : [
      i > 0 ? thresholds[i - 1] : domain[0],
      i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
    ];
  };

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    domain.sort(ascending);
    return rescale();
  };

  scale.range = function(_) {
    return arguments.length ? (range$$1 = slice$3.call(_), rescale()) : range$$1.slice();
  };

  scale.quantiles = function() {
    return thresholds.slice();
  };

  scale.copy = function() {
    return quantile$$1()
        .domain(domain)
        .range(range$$1);
  };

  return scale;
}

function quantize$1() {
  var x0 = 0,
      x1 = 1,
      n = 1,
      domain = [0.5],
      range$$1 = [0, 1];

  function scale(x) {
    if (x <= x) return range$$1[bisectRight(domain, x, 0, n)];
  }

  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    return scale;
  }

  scale.domain = function(_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
  };

  scale.range = function(_) {
    return arguments.length ? (n = (range$$1 = slice$3.call(_)).length - 1, rescale()) : range$$1.slice();
  };

  scale.invertExtent = function(y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN]
        : i < 1 ? [x0, domain[0]]
        : i >= n ? [domain[n - 1], x1]
        : [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return quantize$1()
        .domain([x0, x1])
        .range(range$$1);
  };

  return linearish(scale);
}

function threshold$1() {
  var domain = [0.5],
      range$$1 = [0, 1],
      n = 1;

  function scale(x) {
    if (x <= x) return range$$1[bisectRight(domain, x, 0, n)];
  }

  scale.domain = function(_) {
    return arguments.length ? (domain = slice$3.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range$$1 = slice$3.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : range$$1.slice();
  };

  scale.invertExtent = function(y) {
    var i = range$$1.indexOf(y);
    return [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return threshold$1()
        .domain(domain)
        .range(range$$1);
  };

  return scale;
}

var durationSecond$1 = 1000;
var durationMinute$1 = durationSecond$1 * 60;
var durationHour$1 = durationMinute$1 * 60;
var durationDay$1 = durationHour$1 * 24;
var durationWeek$1 = durationDay$1 * 7;
var durationMonth = durationDay$1 * 30;
var durationYear = durationDay$1 * 365;

function date$1(t) {
  return new Date(t);
}

function number$2(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format) {
  var scale = continuous(deinterpolateLinear, interpolateNumber),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [
    [second$$1,  1,      durationSecond$1],
    [second$$1,  5,  5 * durationSecond$1],
    [second$$1, 15, 15 * durationSecond$1],
    [second$$1, 30, 30 * durationSecond$1],
    [minute$$1,  1,      durationMinute$1],
    [minute$$1,  5,  5 * durationMinute$1],
    [minute$$1, 15, 15 * durationMinute$1],
    [minute$$1, 30, 30 * durationMinute$1],
    [  hour$$1,  1,      durationHour$1  ],
    [  hour$$1,  3,  3 * durationHour$1  ],
    [  hour$$1,  6,  6 * durationHour$1  ],
    [  hour$$1, 12, 12 * durationHour$1  ],
    [   day$$1,  1,      durationDay$1   ],
    [   day$$1,  2,  2 * durationDay$1   ],
    [  week,  1,      durationWeek$1  ],
    [ month$$1,  1,      durationMonth ],
    [ month$$1,  3,  3 * durationMonth ],
    [  year$$1,  1,      durationYear  ]
  ];

  function tickFormat(date) {
    return (second$$1(date) < date ? formatMillisecond
        : minute$$1(date) < date ? formatSecond
        : hour$$1(date) < date ? formatMinute
        : day$$1(date) < date ? formatHour
        : month$$1(date) < date ? (week(date) < date ? formatDay : formatWeek)
        : year$$1(date) < date ? formatMonth
        : formatYear)(date);
  }

  function tickInterval(interval, start, stop, step) {
    if (interval == null) interval = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval === "number") {
      var target = Math.abs(stop - start) / interval,
          i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep(start / durationYear, stop / durationYear, interval);
        interval = year$$1;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval = i[0];
      } else {
        step = tickStep(start, stop, interval);
        interval = millisecond$$1;
      }
    }

    return step == null ? interval : interval.every(step);
  }

  scale.invert = function(y) {
    return new Date(invert(y));
  };

  scale.domain = function(_) {
    return arguments.length ? domain(map$3.call(_, number$2)) : domain().map(date$1);
  };

  scale.ticks = function(interval, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function(count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function(interval, step) {
    var d = domain();
    return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
        ? domain(nice(d, interval))
        : scale;
  };

  scale.copy = function() {
    return copy(scale, calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format));
  };

  return scale;
}

var time = function() {
  return calendar(year, month, sunday, day, hour, minute, second, millisecond, exports.timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
};

var utcTime = function() {
  return calendar(utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, millisecond, exports.utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
};

var colors = function(s) {
  return s.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
};

var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var category20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var category20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var category20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

var cubehelix$3 = cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

var rainbow$1 = function(t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  rainbow.h = 360 * t - 100;
  rainbow.s = 1.5 - 1.5 * ts;
  rainbow.l = 0.8 - 0.9 * ts;
  return rainbow + "";
};

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function sequential(interpolator) {
  var x0 = 0,
      x1 = 1,
      clamp = false;

  function scale(x) {
    var t = (x - x0) / (x1 - x0);
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.domain = function(_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.interpolator = function(_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function() {
    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
  };

  return linearish(scale);
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
};

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
};

var nextId = 0;

function local() {
  return new Local;
}

function Local() {
  this._ = "@" + (++nextId).toString(36);
}

Local.prototype = local.prototype = {
  constructor: Local,
  get: function(node) {
    var id = this._;
    while (!(id in node)) if (!(node = node.parentNode)) return;
    return node[id];
  },
  set: function(node, value) {
    return node[this._] = value;
  },
  remove: function(node) {
    return this._ in node && delete node[this._];
  },
  toString: function() {
    return this._;
  }
};

var matcher = function(selector) {
  return function() {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector
        || element.msMatchesSelector
        || element.mozMatchesSelector
        || element.oMatchesSelector;
    matcher = function(selector) {
      return function() {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

exports.event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function(event) {
    var related = event.relatedTarget;
    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function(event1) {
    var event0 = exports.event; // Events can be reentrant (e.g., focus).
    exports.event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      exports.event = event0;
    }
  };
}

function parseTypenames$1(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function(d, i, group) {
    var on = this.__on, o, listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

var selection_on = function(typename, value, capture) {
  var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
  return this;
};

function customEvent(event1, listener, that, args) {
  var event0 = exports.event;
  event1.sourceEvent = exports.event;
  exports.event = event1;
  try {
    return listener.apply(that, args);
  } finally {
    exports.event = event0;
  }
}

var sourceEvent = function() {
  var current = exports.event, source;
  while (source = current.sourceEvent) current = source;
  return current;
};

var point$5 = function(node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

var mouse = function(node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point$5(node, event);
};

function none$2() {}

var selector = function(selector) {
  return selector == null ? none$2 : function() {
    return this.querySelector(selector);
  };
};

var selection_select = function(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty() {
  return [];
}

var selectorAll = function(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function(select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function(update) {
  return new Array(update.length);
};

var selection_enter = function() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

var constant$5 = function(x) {
  return function() {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
      exit[i] = node;
    }
  }
}

var selection_data = function(value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function(d) { data[++j] = d; });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$5(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function(selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function(compare) {
  if (!compare) compare = ascending$2;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending$2(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function() {
  var nodes = new Array(this.size()), i = -1;
  this.each(function() { nodes[++i] = this; });
  return nodes;
};

var selection_node = function() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size = function() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
};

var selection_empty = function() {
  return !this.node();
};

var selection_each = function(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr = function(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
};

var window = function(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

var selection_style = function(name, value, priority) {
  var node;
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : window(node = this.node())
          .getComputedStyle(node, null)
          .getPropertyValue(name);
};

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

var selection_property = function(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
};

function raise$1() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise = function() {
  return this.each(raise$1);
};

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower = function() {
  return this.each(lower);
};

var selection_append = function(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove = function() {
  return this.each(remove);
};

var selection_datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window$$1 = window(node),
      event = window$$1.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window$$1.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
};

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select = function(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
};

var selectAll = function(selector) {
  return typeof selector === "string"
      ? new Selection([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection([selector == null ? [] : selector], root);
};

var touch = function(node, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return point$5(node, touch);
    }
  }

  return null;
};

var touches = function(node, touches) {
  if (touches == null) touches = sourceEvent().touches;

  for (var i = 0, n = touches ? touches.length : 0, points = new Array(n); i < n; ++i) {
    points[i] = point$5(node, touches[i]);
  }

  return points;
};

var emptyOn = dispatch("start", "end", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

var schedule = function(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
};

function init(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
  return schedule;
}

function set$3(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
  return schedule;
}

function get$1(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout$1(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$1(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt = function(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt = function(name) {
  return this.each(function() {
    interrupt(this, name);
  });
};

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set$3(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set$3(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

var transition_tween = function(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$1(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
};

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set$3(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get$1(node, id).value[name];
  };
}

var interpolate$1 = function(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
};

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$1(fullname, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$1(name, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$1(fullname, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr = function(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate$1;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
};

function attrTweenNS(fullname, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween = function(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
};

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

var transition_delay = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get$1(this.node(), id).delay;
};

function durationFunction(id, value) {
  return function() {
    set$3(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set$3(this, id).duration = value;
  };
}

var transition_duration = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get$1(this.node(), id).duration;
};

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set$3(this, id).ease = value;
  };
}

var transition_ease = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get$1(this.node(), id).ease;
};

var transition_filter = function(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
};

var transition_merge = function(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
};

function start$1(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start$1(name) ? init : set$3;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

var transition_on = function(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get$1(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
};

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

var transition_remove = function() {
  return this.on("end.remove", removeFunction(this._id));
};

var transition_select = function(select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
};

var transition_selectAll = function(select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
};

var Selection$1 = selection.prototype.constructor;

var transition_selection = function() {
  return new Selection$1(this._groups, this._parents);
};

function styleRemove$1(name, interpolate$$1) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var style = window(this).getComputedStyle(this, null),
        value0 = style.getPropertyValue(name),
        value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function styleRemoveEnd(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = window(this).getComputedStyle(this, null).getPropertyValue(name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function styleFunction$1(name, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var style = window(this).getComputedStyle(this, null),
        value0 = style.getPropertyValue(name),
        value1 = value(this);
    if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_style = function(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate$1;
  return value == null ? this
          .styleTween(name, styleRemove$1(name, i))
          .on("end.style." + name, styleRemoveEnd(name))
      : this.styleTween(name, typeof value === "function"
          ? styleFunction$1(name, i, tweenValue(this, "style." + name, value))
          : styleConstant$1(name, i, value), priority);
};

function styleTween(name, value, priority) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween = function(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
};

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text = function(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction$1(tweenValue(this, "text", value))
      : textConstant$1(value == null ? "" : value + ""));
};

var transition_transition = function() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$1(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
};

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

var selection_transition = function(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
};

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

var root$1 = [null];

var active = function(node, name) {
  var schedules = node.__transition,
      schedule,
      i;

  if (schedules) {
    name = name == null ? null : name + "";
    for (i in schedules) {
      if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
        return new Transition([[node]], root$1, name, +i);
      }
    }
  }

  return null;
};

var slice$4 = Array.prototype.slice;

var identity$5 = function(x) {
  return x;
};

var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon$2 = 1e-6;

function translateX(scale0, scale1, d) {
  var x = scale0(d);
  return "translate(" + (isFinite(x) ? x : scale1(d)) + ",0)";
}

function translateY(scale0, scale1, d) {
  var y = scale0(d);
  return "translate(0," + (isFinite(y) ? y : scale1(d)) + ")";
}

function center(scale) {
  var offset = scale.bandwidth() / 2;
  if (scale.round()) offset = Math.round(offset);
  return function(d) {
    return scale(d) + offset;
  };
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3;

  function axis(context) {
    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$5) : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        transform = orient === top || orient === bottom ? translateX : translateY,
        range = scale.range(),
        range0 = range[0] + 0.5,
        range1 = range[range.length - 1] + 0.5,
        position = (scale.bandwidth ? center : identity$5)(scale.copy()),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text"),
        k = orient === top || orient === left ? -1 : 1,
        x, y = orient === left || orient === right ? (x = "x", "y") : (x = "y", "x");

    path = path.merge(path.enter().insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "#000"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line")
        .attr("stroke", "#000")
        .attr(x + "2", k * tickSizeInner)
        .attr(y + "1", 0.5)
        .attr(y + "2", 0.5));

    text = text.merge(tickEnter.append("text")
        .attr("fill", "#000")
        .attr(x, k * spacing)
        .attr(y, 0.5)
        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context)
          .attr("opacity", epsilon$2)
          .attr("transform", function(d) { return transform(position, this.parentNode.__axis || position, d); });

      tickEnter
          .attr("opacity", epsilon$2)
          .attr("transform", function(d) { return transform(this.parentNode.__axis || position, position, d); });
    }

    tickExit.remove();

    path
        .attr("d", orient === left || orient == right
            ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter
            : "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter);

    tick
        .attr("opacity", 1)
        .attr("transform", function(d) { return transform(position, position, d); });

    line
        .attr(x + "2", k * tickSizeInner);

    text
        .attr(x, k * spacing)
        .text(format);

    selection.filter(entering)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

    selection
        .each(function() { this.__axis = position; });
  }

  axis.scale = function(_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function() {
    return tickArguments = slice$4.call(arguments), axis;
  };

  axis.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : slice$4.call(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : slice$4.call(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function(_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  return axis;
}

function axisTop(scale) {
  return axis(top, scale);
}

function axisRight(scale) {
  return axis(right, scale);
}

function axisBottom(scale) {
  return axis(bottom, scale);
}

function axisLeft(scale) {
  return axis(left, scale);
}

function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length;
}

function meanXReduce(x, c) {
  return x + c.x;
}

function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0);
}

function maxYReduce(y, c) {
  return Math.max(y, c.y);
}

function leafLeft(node) {
  var children;
  while (children = node.children) node = children[0];
  return node;
}

function leafRight(node) {
  var children;
  while (children = node.children) node = children[children.length - 1];
  return node;
}

var cluster = function() {
  var separation = defaultSeparation,
      dx = 1,
      dy = 1,
      nodeSize = false;

  function cluster(root) {
    var previousNode,
        x = 0;

    // First walk, computing the initial x & y values.
    root.eachAfter(function(node) {
      var children = node.children;
      if (children) {
        node.x = meanX(children);
        node.y = maxY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });

    var left = leafLeft(root),
        right = leafRight(root),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2;

    // Second walk, normalizing x & y to the desired size.
    return root.eachAfter(nodeSize ? function(node) {
      node.x = (node.x - root.x) * dx;
      node.y = (root.y - node.y) * dy;
    } : function(node) {
      node.x = (node.x - x0) / (x1 - x0) * dx;
      node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
    });
  }

  cluster.separation = function(x) {
    return arguments.length ? (separation = x, cluster) : separation;
  };

  cluster.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? null : [dx, dy]);
  };

  cluster.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? [dx, dy] : null);
  };

  return cluster;
};

var node_each = function(callback) {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      callback(node), children = node.children;
      if (children) for (i = 0, n = children.length; i < n; ++i) {
        next.push(children[i]);
      }
    }
  } while (next.length);
  return this;
};

var node_eachBefore = function(callback) {
  var node = this, nodes = [node], children, i;
  while (node = nodes.pop()) {
    callback(node), children = node.children;
    if (children) for (i = children.length - 1; i >= 0; --i) {
      nodes.push(children[i]);
    }
  }
  return this;
};

var node_eachAfter = function(callback) {
  var node = this, nodes = [node], next = [], children, i, n;
  while (node = nodes.pop()) {
    next.push(node), children = node.children;
    if (children) for (i = 0, n = children.length; i < n; ++i) {
      nodes.push(children[i]);
    }
  }
  while (node = next.pop()) {
    callback(node);
  }
  return this;
};

var node_sum = function(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0,
        children = node.children,
        i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
};

var node_sort = function(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
};

var node_path = function(end) {
  var start = this,
      ancestor = leastCommonAncestor(start, end),
      nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
};

function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
      bNodes = b.ancestors(),
      c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

var node_ancestors = function() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
};

var node_descendants = function() {
  var nodes = [];
  this.each(function(node) {
    nodes.push(node);
  });
  return nodes;
};

var node_leaves = function() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
};

var node_links = function() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) { // Don’t include the root’s parent, if any.
      links.push({source: node.parent, target: node});
    }
  });
  return links;
};

function hierarchy(data, children) {
  var root = new Node(data),
      valued = +data.value && (root.value = data.value),
      node,
      nodes = [root],
      child,
      childs,
      i,
      n;

  if (children == null) children = defaultChildren;

  while (node = nodes.pop()) {
    if (valued) node.value = +node.data.value;
    if ((childs = children(node.data)) && (n = childs.length)) {
      node.children = new Array(n);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }

  return root.eachBefore(computeHeight);
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}

function defaultChildren(d) {
  return d.children;
}

function copyData(node) {
  node.data = node.data.data;
}

function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && (node.height < ++height));
}

function Node(data) {
  this.data = data;
  this.depth =
  this.height = 0;
  this.parent = null;
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy
};

function Node$2(value) {
  this._ = value;
  this.next = null;
}

var shuffle$1 = function(array) {
  var i,
      n = (array = array.slice()).length,
      head = null,
      node = head;

  while (n) {
    var next = new Node$2(array[n - 1]);
    if (node) node = node.next = next;
    else node = head = next;
    array[i] = array[--n];
  }

  return {
    head: head,
    tail: node
  };
};

var enclose = function(circles) {
  return encloseN(shuffle$1(circles), []);
};

function encloses(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r - b.r;
  return dr * dr + 1e-6 > dx * dx + dy * dy;
}

// Returns the smallest circle that contains circles L and intersects circles B.
function encloseN(L, B) {
  var circle,
      l0 = null,
      l1 = L.head,
      l2,
      p1;

  switch (B.length) {
    case 1: circle = enclose1(B[0]); break;
    case 2: circle = enclose2(B[0], B[1]); break;
    case 3: circle = enclose3(B[0], B[1], B[2]); break;
  }

  while (l1) {
    p1 = l1._, l2 = l1.next;
    if (!circle || !encloses(circle, p1)) {

      // Temporarily truncate L before l1.
      if (l0) L.tail = l0, l0.next = null;
      else L.head = L.tail = null;

      B.push(p1);
      circle = encloseN(L, B); // Note: reorders L!
      B.pop();

      // Move l1 to the front of L and reconnect the truncated list L.
      if (L.head) l1.next = L.head, L.head = l1;
      else l1.next = null, L.head = L.tail = l1;
      l0 = L.tail, l0.next = l2;

    } else {
      l0 = l1;
    }
    l1 = l2;
  }

  L.tail = l0;
  return circle;
}

function enclose1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r
  };
}

function enclose2(a, b) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1,
      l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + x21 / l * r21) / 2,
    y: (y1 + y2 + y21 / l * r21) / 2,
    r: (l + r1 + r2) / 2
  };
}

function enclose3(a, b, c) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x3 = c.x, y3 = c.y, r3 = c.r,
      a2 = 2 * (x1 - x2),
      b2 = 2 * (y1 - y2),
      c2 = 2 * (r2 - r1),
      d2 = x1 * x1 + y1 * y1 - r1 * r1 - x2 * x2 - y2 * y2 + r2 * r2,
      a3 = 2 * (x1 - x3),
      b3 = 2 * (y1 - y3),
      c3 = 2 * (r3 - r1),
      d3 = x1 * x1 + y1 * y1 - r1 * r1 - x3 * x3 - y3 * y3 + r3 * r3,
      ab = a3 * b2 - a2 * b3,
      xa = (b2 * d3 - b3 * d2) / ab - x1,
      xb = (b3 * c2 - b2 * c3) / ab,
      ya = (a3 * d2 - a2 * d3) / ab - y1,
      yb = (a2 * c3 - a3 * c2) / ab,
      A = xb * xb + yb * yb - 1,
      B = 2 * (xa * xb + ya * yb + r1),
      C = xa * xa + ya * ya - r1 * r1,
      r = (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  return {
    x: xa + xb * r + x1,
    y: ya + yb * r + y1,
    r: r
  };
}

function place(a, b, c) {
  var ax = a.x,
      ay = a.y,
      da = b.r + c.r,
      db = a.r + c.r,
      dx = b.x - ax,
      dy = b.y - ay,
      dc = dx * dx + dy * dy;
  if (dc) {
    var x = 0.5 + ((db *= db) - (da *= da)) / (2 * dc),
        y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
    c.x = ax + x * dx + y * dy;
    c.y = ay + x * dy - y * dx;
  } else {
    c.x = ax + db;
    c.y = ay;
  }
}

function intersects(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r + b.r;
  return dr * dr > dx * dx + dy * dy;
}

function distance2(circle, x, y) {
  var dx = circle.x - x,
      dy = circle.y - y;
  return dx * dx + dy * dy;
}

function Node$1(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}

function packEnclose(circles) {
  if (!(n = circles.length)) return 0;

  var a, b, c, n;

  // Place the first circle.
  a = circles[0], a.x = 0, a.y = 0;
  if (!(n > 1)) return a.r;

  // Place the second circle.
  b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
  if (!(n > 2)) return a.r + b.r;

  // Place the third circle.
  place(b, a, c = circles[2]);

  // Initialize the weighted centroid.
  var aa = a.r * a.r,
      ba = b.r * b.r,
      ca = c.r * c.r,
      oa = aa + ba + ca,
      ox = aa * a.x + ba * b.x + ca * c.x,
      oy = aa * a.y + ba * b.y + ca * c.y,
      cx, cy, i, j, k, sj, sk;

  // Initialize the front-chain using the first three circles a, b and c.
  a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;

  // Attempt to place each remaining circle…
  pack: for (i = 3; i < n; ++i) {
    place(a._, b._, c = circles[i]), c = new Node$1(c);

    // If there are only three elements in the front-chain…
    if ((k = a.previous) === (j = b.next)) {
      // If the new circle intersects the third circle,
      // rotate the front chain to try the next position.
      if (intersects(j._, c._)) {
        a = b, b = j, --i;
        continue pack;
      }
    }

    // Find the closest intersecting circle on the front-chain, if any.
    else {
      sj = j._.r, sk = k._.r;
      do {
        if (sj <= sk) {
          if (intersects(j._, c._)) {
            b = j, a.next = b, b.previous = a, --i;
            continue pack;
          }
          j = j.next, sj += j._.r;
        } else {
          if (intersects(k._, c._)) {
            a = k, a.next = b, b.previous = a, --i;
            continue pack;
          }
          k = k.previous, sk += k._.r;
        }
      } while (j !== k.next);
    }

    // Success! Insert the new circle c between a and b.
    c.previous = a, c.next = b, a.next = b.previous = b = c;

    // Update the weighted centroid.
    oa += ca = c._.r * c._.r;
    ox += ca * c._.x;
    oy += ca * c._.y;

    // Compute the new closest circle a to centroid.
    aa = distance2(a._, cx = ox / oa, cy = oy / oa);
    while ((c = c.next) !== b) {
      if ((ca = distance2(c._, cx, cy)) < aa) {
        a = c, aa = ca;
      }
    }
    b = a.next;
  }

  // Compute the enclosing circle of the front chain.
  a = [b._], c = b; while ((c = c.next) !== b) a.push(c._); c = enclose(a);

  // Translate the circles to put the enclosing circle around the origin.
  for (i = 0; i < n; ++i) a = circles[i], a.x -= c.x, a.y -= c.y;

  return c.r;
}

var siblings = function(circles) {
  packEnclose(circles);
  return circles;
};

function optional(f) {
  return f == null ? null : required(f);
}

function required(f) {
  if (typeof f !== "function") throw new Error;
  return f;
}

function constantZero() {
  return 0;
}

var constant$6 = function(x) {
  return function() {
    return x;
  };
};

function defaultRadius(d) {
  return Math.sqrt(d.value);
}

var index = function() {
  var radius = null,
      dx = 1,
      dy = 1,
      padding = constantZero;

  function pack(root) {
    root.x = dx / 2, root.y = dy / 2;
    if (radius) {
      root.eachBefore(radiusLeaf(radius))
          .eachAfter(packChildren(padding, 0.5))
          .eachBefore(translateChild(1));
    } else {
      root.eachBefore(radiusLeaf(defaultRadius))
          .eachAfter(packChildren(constantZero, 1))
          .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
          .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }

  pack.radius = function(x) {
    return arguments.length ? (radius = optional(x), pack) : radius;
  };

  pack.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };

  pack.padding = function(x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant$6(+x), pack) : padding;
  };

  return pack;
};

function radiusLeaf(radius) {
  return function(node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}

function packChildren(padding, k) {
  return function(node) {
    if (children = node.children) {
      var children,
          i,
          n = children.length,
          r = padding(node) * k || 0,
          e;

      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      e = packEnclose(children);
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      node.r = e + r;
    }
  };
}

function translateChild(k) {
  return function(node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}

var roundNode = function(node) {
  node.x0 = Math.round(node.x0);
  node.y0 = Math.round(node.y0);
  node.x1 = Math.round(node.x1);
  node.y1 = Math.round(node.y1);
};

var treemapDice = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (x1 - x0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
};

var partition = function() {
  var dx = 1,
      dy = 1,
      padding = 0,
      round = false;

  function partition(root) {
    var n = root.height + 1;
    root.x0 =
    root.y0 = padding;
    root.x1 = dx;
    root.y1 = dy / n;
    root.eachBefore(positionNode(dy, n));
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(dy, n) {
    return function(node) {
      if (node.children) {
        treemapDice(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
      }
      var x0 = node.x0,
          y0 = node.y0,
          x1 = node.x1 - padding,
          y1 = node.y1 - padding;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      node.x0 = x0;
      node.y0 = y0;
      node.x1 = x1;
      node.y1 = y1;
    };
  }

  partition.round = function(x) {
    return arguments.length ? (round = !!x, partition) : round;
  };

  partition.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
  };

  partition.padding = function(x) {
    return arguments.length ? (padding = +x, partition) : padding;
  };

  return partition;
};

var keyPrefix$1 = "$";
var preroot = {depth: -1};
var ambiguous = {};

function defaultId(d) {
  return d.id;
}

function defaultParentId(d) {
  return d.parentId;
}

var stratify = function() {
  var id = defaultId,
      parentId = defaultParentId;

  function stratify(data) {
    var d,
        i,
        n = data.length,
        root,
        parent,
        node,
        nodes = new Array(n),
        nodeId,
        nodeKey,
        nodeByKey = {};

    for (i = 0; i < n; ++i) {
      d = data[i], node = nodes[i] = new Node(d);
      if ((nodeId = id(d, i, data)) != null && (nodeId += "")) {
        nodeKey = keyPrefix$1 + (node.id = nodeId);
        nodeByKey[nodeKey] = nodeKey in nodeByKey ? ambiguous : node;
      }
    }

    for (i = 0; i < n; ++i) {
      node = nodes[i], nodeId = parentId(data[i], i, data);
      if (nodeId == null || !(nodeId += "")) {
        if (root) throw new Error("multiple roots");
        root = node;
      } else {
        parent = nodeByKey[keyPrefix$1 + nodeId];
        if (!parent) throw new Error("missing: " + nodeId);
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
        if (parent.children) parent.children.push(node);
        else parent.children = [node];
        node.parent = parent;
      }
    }

    if (!root) throw new Error("no root");
    root.parent = preroot;
    root.eachBefore(function(node) { node.depth = node.parent.depth + 1; --n; }).eachBefore(computeHeight);
    root.parent = null;
    if (n > 0) throw new Error("cycle");

    return root;
  }

  stratify.id = function(x) {
    return arguments.length ? (id = required(x), stratify) : id;
  };

  stratify.parentId = function(x) {
    return arguments.length ? (parentId = required(x), stratify) : parentId;
  };

  return stratify;
};

function defaultSeparation$1(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

// function radialSeparation(a, b) {
//   return (a.parent === b.parent ? 1 : 2) / a.depth;
// }

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v.t;
}

// This function works analogously to nextLeft.
function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v) {
  var shift = 0,
      change = 0,
      children = v.children,
      i = children.length,
      w;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}

// If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}

function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null; // default ancestor
  this.a = this; // ancestor
  this.z = 0; // prelim
  this.m = 0; // mod
  this.c = 0; // change
  this.s = 0; // shift
  this.t = null; // thread
  this.i = i; // number
}

TreeNode.prototype = Object.create(Node.prototype);

function treeRoot(root) {
  var tree = new TreeNode(root, 0),
      node,
      nodes = [tree],
      child,
      children,
      i,
      n;

  while (node = nodes.pop()) {
    if (children = node._.children) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }

  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
var tree = function() {
  var separation = defaultSeparation$1,
      dx = 1,
      dy = 1,
      nodeSize = null;

  function tree(root) {
    var t = treeRoot(root);

    // Compute the layout using Buchheim et al.’s algorithm.
    t.eachAfter(firstWalk), t.parent.m = -t.z;
    t.eachBefore(secondWalk);

    // If a fixed node size is specified, scale x and y.
    if (nodeSize) root.eachBefore(sizeNode);

    // If a fixed tree size is specified, scale x and y based on the extent.
    // Compute the left-most, right-most, and depth-most nodes for extents.
    else {
      var left = root,
          right = root,
          bottom = root;
      root.eachBefore(function(node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2,
          tx = s - left.x,
          kx = dx / (right.x + s + tx),
          ky = dy / (bottom.depth || 1);
      root.eachBefore(function(node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }

    return root;
  }

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v) {
    var children = v.children,
        siblings = v.parent.children,
        w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      var midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }

  // The core of the algorithm. Here, a new subtree is combined with the
  // previous subtrees. Threads are used to traverse the inside and outside
  // contours of the left and right subtree up to the highest common level. The
  // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
  // superscript o means outside and i means inside, the subscript - means left
  // subtree and + means right subtree. For summing up the modifiers along the
  // contour, we use respective variables si+, si-, so-, and so+. Whenever two
  // nodes of the inside contours conflict, we compute the left one of the
  // greatest uncommon ancestors using the function ANCESTOR and call MOVE
  // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
  // Finally, we add a new thread (if necessary).
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
          vop = v,
          vim = w,
          vom = vip.parent.children[0],
          sip = vip.m,
          sop = vop.m,
          sim = vim.m,
          som = vom.m,
          shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }

  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }

  tree.separation = function(x) {
    return arguments.length ? (separation = x, tree) : separation;
  };

  tree.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
  };

  tree.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
  };

  return tree;
};

var treemapSlice = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (y1 - y0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.x0 = x0, node.x1 = x1;
    node.y0 = y0, node.y1 = y0 += node.value * k;
  }
};

var phi = (1 + Math.sqrt(5)) / 2;

function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [],
      nodes = parent.children,
      row,
      nodeValue,
      i0 = 0,
      i1 = 0,
      n = nodes.length,
      dx, dy,
      value = parent.value,
      sumValue,
      minValue,
      maxValue,
      newRatio,
      minRatio,
      alpha,
      beta;

  while (i0 < n) {
    dx = x1 - x0, dy = y1 - y0;

    // Find the next non-empty node.
    do sumValue = nodes[i1++].value; while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);

    // Keep adding nodes while the aspect ratio maintains or improves.
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) { sumValue -= nodeValue; break; }
      minRatio = newRatio;
    }

    // Position and record the row orientation.
    rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
    if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
    else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
    value -= sumValue, i0 = i1;
  }

  return rows;
}

var squarify = (function custom(ratio) {

  function squarify(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1);
  }

  squarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return squarify;
})(phi);

var index$1 = function() {
  var tile = squarify,
      round = false,
      dx = 1,
      dy = 1,
      paddingStack = [0],
      paddingInner = constantZero,
      paddingTop = constantZero,
      paddingRight = constantZero,
      paddingBottom = constantZero,
      paddingLeft = constantZero;

  function treemap(root) {
    root.x0 =
    root.y0 = 0;
    root.x1 = dx;
    root.y1 = dy;
    root.eachBefore(positionNode);
    paddingStack = [0];
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(node) {
    var p = paddingStack[node.depth],
        x0 = node.x0 + p,
        y0 = node.y0 + p,
        x1 = node.x1 - p,
        y1 = node.y1 - p;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    node.x0 = x0;
    node.y0 = y0;
    node.x1 = x1;
    node.y1 = y1;
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
      x0 += paddingLeft(node) - p;
      y0 += paddingTop(node) - p;
      x1 -= paddingRight(node) - p;
      y1 -= paddingBottom(node) - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      tile(node, x0, y0, x1, y1);
    }
  }

  treemap.round = function(x) {
    return arguments.length ? (round = !!x, treemap) : round;
  };

  treemap.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
  };

  treemap.tile = function(x) {
    return arguments.length ? (tile = required(x), treemap) : tile;
  };

  treemap.padding = function(x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
  };

  treemap.paddingInner = function(x) {
    return arguments.length ? (paddingInner = typeof x === "function" ? x : constant$6(+x), treemap) : paddingInner;
  };

  treemap.paddingOuter = function(x) {
    return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
  };

  treemap.paddingTop = function(x) {
    return arguments.length ? (paddingTop = typeof x === "function" ? x : constant$6(+x), treemap) : paddingTop;
  };

  treemap.paddingRight = function(x) {
    return arguments.length ? (paddingRight = typeof x === "function" ? x : constant$6(+x), treemap) : paddingRight;
  };

  treemap.paddingBottom = function(x) {
    return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant$6(+x), treemap) : paddingBottom;
  };

  treemap.paddingLeft = function(x) {
    return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant$6(+x), treemap) : paddingLeft;
  };

  return treemap;
};

var binary = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      i, n = nodes.length,
      sum, sums = new Array(n + 1);

  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value;
  }

  partition(0, n, parent.value, x0, y0, x1, y1);

  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      var node = nodes[i];
      node.x0 = x0, node.y0 = y0;
      node.x1 = x1, node.y1 = y1;
      return;
    }

    var valueOffset = sums[i],
        valueTarget = (value / 2) + valueOffset,
        k = i + 1,
        hi = j - 1;

    while (k < hi) {
      var mid = k + hi >>> 1;
      if (sums[mid] < valueTarget) k = mid + 1;
      else hi = mid;
    }

    var valueLeft = sums[k] - valueOffset,
        valueRight = value - valueLeft;

    if ((y1 - y0) > (x1 - x0)) {
      var yk = (y0 * valueRight + y1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, x1, yk);
      partition(k, j, valueRight, x0, yk, x1, y1);
    } else {
      var xk = (x0 * valueRight + x1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, xk, y1);
      partition(k, j, valueRight, xk, y0, x1, y1);
    }
  }
};

var sliceDice = function(parent, x0, y0, x1, y1) {
  (parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1);
};

var resquarify = (function custom(ratio) {

  function resquarify(parent, x0, y0, x1, y1) {
    if ((rows = parent._squarify) && (rows.ratio === ratio)) {
      var rows,
          row,
          nodes,
          i,
          j = -1,
          n,
          m = rows.length,
          value = parent.value;

      while (++j < m) {
        row = rows[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) treemapDice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
        else treemapSlice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
        value -= row.value;
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
      rows.ratio = ratio;
    }
  }

  resquarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return resquarify;
})(phi);

var center$1 = function(x, y) {
  var nodes;

  if (x == null) x = 0;
  if (y == null) y = 0;

  function force() {
    var i,
        n = nodes.length,
        node,
        sx = 0,
        sy = 0;

    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }

    for (sx = sx / n - x, sy = sy / n - y, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  return force;
};

var constant$7 = function(x) {
  return function() {
    return x;
  };
};

var jiggle = function() {
  return (Math.random() - 0.5) * 1e-6;
};

function x$1(d) {
  return d.x + d.vx;
}

function y$1(d) {
  return d.y + d.vy;
}

var collide = function(radius) {
  var nodes,
      radii,
      strength = 1,
      iterations = 1;

  if (typeof radius !== "function") radius = constant$7(radius == null ? 1 : +radius);

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : radius;
  };

  return force;
};

function index$2(d) {
  return d.index;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

var link = function(links) {
  var id = index$2,
      strength = defaultStrength,
      strengths,
      distance = constant$7(30),
      distances,
      nodes,
      count,
      bias,
      iterations = 1;

  if (links == null) links = [];

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle();
        y = target.y + target.vy - source.y - source.vy || jiggle();
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
        n = nodes.length,
        m = links.length,
        nodeById = map$1(nodes, id),
        link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$7(+_), initializeStrength(), force) : strength;
  };

  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant$7(+_), initializeDistance(), force) : distance;
  };

  return force;
};

function x$2(d) {
  return d.x;
}

function y$2(d) {
  return d.y;
}

var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));

var simulation = function(nodes) {
  var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = map$1(),
      stepper = timer(step),
      event = dispatch("tick", "end");

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick() {
    var i, n = nodes.length, node;

    alpha += (alphaTarget - alpha) * alphaDecay;

    forces.each(function(force) {
      force(alpha);
    });

    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (node.fx == null) node.x += node.vx *= velocityDecay;
      else node.x = node.fx, node.vx = 0;
      if (node.fy == null) node.y += node.vy *= velocityDecay;
      else node.y = node.fy, node.vy = 0;
    }
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }

  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart: function() {
      return stepper.restart(step), simulation;
    },

    stop: function() {
      return stepper.stop(), simulation;
    },

    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
    },

    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    find: function(x, y, radius) {
      var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;

      if (radius == null) radius = Infinity;
      else radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
};

var manyBody = function() {
  var nodes,
      node,
      alpha,
      strength = constant$7(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;

  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x$2, y$2).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }

  function accumulate(quad) {
    var strength = 0, q, c, x$$1, y$$1, i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x$$1 = y$$1 = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = q.value)) {
          strength += c, x$$1 += c * q.x, y$$1 += c * q.y;
        }
      }
      quad.x = x$$1 / strength;
      quad.y = y$$1 / strength;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    quad.value = strength;
  }

  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;

    var x$$1 = quad.x - node.x,
        y$$1 = quad.y - node.y,
        w = x2 - x1,
        l = x$$1 * x$$1 + y$$1 * y$$1;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x$$1 === 0) x$$1 = jiggle(), l += x$$1 * x$$1;
        if (y$$1 === 0) y$$1 = jiggle(), l += y$$1 * y$$1;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x$$1 * quad.value * alpha / l;
        node.vy += y$$1 * quad.value * alpha / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x$$1 === 0) x$$1 = jiggle(), l += x$$1 * x$$1;
      if (y$$1 === 0) y$$1 = jiggle(), l += y$$1 * y$$1;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do if (quad.data !== node) {
      w = strengths[quad.data.index] * alpha / l;
      node.vx += x$$1 * w;
      node.vy += y$$1 * w;
    } while (quad = quad.next);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : strength;
  };

  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  return force;
};

var x$3 = function(x) {
  var strength = constant$7(0.1),
      nodes,
      strengths,
      xz;

  if (typeof x !== "function") x = constant$7(x == null ? 0 : +x);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : strength;
  };

  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : x;
  };

  return force;
};

var y$3 = function(y) {
  var strength = constant$7(0.1),
      nodes,
      strengths,
      yz;

  if (typeof y !== "function") y = constant$7(y == null ? 0 : +y);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : strength;
  };

  force.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$7(+_), initialize(), force) : y;
  };

  return force;
};

function nopropagation() {
  exports.event.stopImmediatePropagation();
}

var noevent = function() {
  exports.event.preventDefault();
  exports.event.stopImmediatePropagation();
};

var dragDisable = function(view) {
  var root = view.document.documentElement,
      selection$$1 = select(view).on("dragstart.drag", noevent, true);
  if ("onselectstart" in root) {
    selection$$1.on("selectstart.drag", noevent, true);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
};

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection$$1 = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection$$1.on("click.drag", noevent, true);
    setTimeout(function() { selection$$1.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection$$1.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

var constant$8 = function(x) {
  return function() {
    return x;
  };
};

function DragEvent(target, type, subject, id, active, x, y, dx, dy, dispatch) {
  this.target = target;
  this.type = type;
  this.subject = subject;
  this.identifier = id;
  this.active = active;
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this._ = dispatch;
}

DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// Ignore right-click, since that should open the context menu.
function defaultFilter() {
  return !exports.event.button;
}

function defaultContainer() {
  return this.parentNode;
}

function defaultSubject(d) {
  return d == null ? {x: exports.event.x, y: exports.event.y} : d;
}

var drag = function() {
  var filter = defaultFilter,
      container = defaultContainer,
      subject = defaultSubject,
      gestures = {},
      listeners = dispatch("start", "drag", "end"),
      active = 0,
      mousemoving,
      touchending;

  function drag(selection$$1) {
    selection$$1
        .on("mousedown.drag", mousedowned)
        .on("touchstart.drag", touchstarted)
        .on("touchmove.drag", touchmoved)
        .on("touchend.drag touchcancel.drag", touchended)
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  function mousedowned() {
    if (touchending || !filter.apply(this, arguments)) return;
    var gesture = beforestart("mouse", container.apply(this, arguments), mouse, this, arguments);
    if (!gesture) return;
    select(exports.event.view).on("mousemove.drag", mousemoved, true).on("mouseup.drag", mouseupped, true);
    dragDisable(exports.event.view);
    nopropagation();
    mousemoving = false;
    gesture("start");
  }

  function mousemoved() {
    noevent();
    mousemoving = true;
    gestures.mouse("drag");
  }

  function mouseupped() {
    select(exports.event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(exports.event.view, mousemoving);
    noevent();
    gestures.mouse("end");
  }

  function touchstarted() {
    if (!filter.apply(this, arguments)) return;
    var touches$$1 = exports.event.changedTouches,
        c = container.apply(this, arguments),
        n = touches$$1.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(touches$$1[i].identifier, c, touch, this, arguments)) {
        nopropagation();
        gesture("start");
      }
    }
  }

  function touchmoved() {
    var touches$$1 = exports.event.changedTouches,
        n = touches$$1.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches$$1[i].identifier]) {
        noevent();
        gesture("drag");
      }
    }
  }

  function touchended() {
    var touches$$1 = exports.event.changedTouches,
        n = touches$$1.length, i, gesture;

    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches$$1[i].identifier]) {
        nopropagation();
        gesture("end");
      }
    }
  }

  function beforestart(id, container, point, that, args) {
    var p = point(container, id), s, dx, dy,
        sublisteners = listeners.copy();

    if (!customEvent(new DragEvent(drag, "beforestart", s, id, active, p[0], p[1], 0, 0, sublisteners), function() {
      if ((exports.event.subject = s = subject.apply(that, args)) == null) return false;
      dx = s.x - p[0] || 0;
      dy = s.y - p[1] || 0;
      return true;
    })) return;

    return function gesture(type) {
      var p0 = p, n;
      switch (type) {
        case "start": gestures[id] = gesture, n = active++; break;
        case "end": delete gestures[id], --active; // nobreak
        case "drag": p = point(container, id), n = active; break;
      }
      customEvent(new DragEvent(drag, type, s, id, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], sublisteners), sublisteners.apply, sublisteners, [type, that, args]);
    };
  }

  drag.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$8(!!_), drag) : filter;
  };

  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$8(_), drag) : container;
  };

  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$8(_), drag) : subject;
  };

  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };

  return drag;
};

var constant$9 = function(x) {
  return function() {
    return x;
  };
};

function x$4(d) {
  return d[0];
}

function y$4(d) {
  return d[1];
}

function RedBlackTree() {
  this._ = null; // root node
}

function RedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

RedBlackTree.prototype = {
  constructor: RedBlackTree,

  insert: function(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) after = after.L;
        after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = RedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            RedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            RedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;
    else if (!right) next = left;
    else next = RedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;
      else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) { node.C = false; return; }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            RedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          RedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if ((sibling.L && sibling.L.C)
          || (sibling.R && sibling.R.C)) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            RedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          RedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }
};

function RedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function RedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function RedBlackFirst(node) {
  while (node.L) node = node.L;
  return node;
}

function createEdge(left, right, v0, v1) {
  var edge = [null, null],
      index = edges.push(edge) - 1;
  edge.left = left;
  edge.right = right;
  if (v0) setEdgeEnd(edge, left, right, v0);
  if (v1) setEdgeEnd(edge, right, left, v1);
  cells[left.index].halfedges.push(index);
  cells[right.index].halfedges.push(index);
  return edge;
}

function createBorderEdge(left, v0, v1) {
  var edge = [v0, v1];
  edge.left = left;
  return edge;
}

function setEdgeEnd(edge, left, right, vertex) {
  if (!edge[0] && !edge[1]) {
    edge[0] = vertex;
    edge.left = left;
    edge.right = right;
  } else if (edge.left === right) {
    edge[1] = vertex;
  } else {
    edge[0] = vertex;
  }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1) {
  var a = edge[0],
      b = edge[1],
      ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

  if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
  if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
  return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
  var v1 = edge[1];
  if (v1) return true;

  var v0 = edge[0],
      left = edge.left,
      right = edge.right,
      lx = left[0],
      ly = left[1],
      rx = right[0],
      ry = right[1],
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!v0) v0 = [fx, y0];
      else if (v0[1] >= y1) return;
      v1 = [fx, y1];
    } else {
      if (!v0) v0 = [fx, y1];
      else if (v0[1] < y0) return;
      v1 = [fx, y0];
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!v0) v0 = [(y0 - fb) / fm, y0];
        else if (v0[1] >= y1) return;
        v1 = [(y1 - fb) / fm, y1];
      } else {
        if (!v0) v0 = [(y1 - fb) / fm, y1];
        else if (v0[1] < y0) return;
        v1 = [(y0 - fb) / fm, y0];
      }
    } else {
      if (ly < ry) {
        if (!v0) v0 = [x0, fm * x0 + fb];
        else if (v0[0] >= x1) return;
        v1 = [x1, fm * x1 + fb];
      } else {
        if (!v0) v0 = [x1, fm * x1 + fb];
        else if (v0[0] < x0) return;
        v1 = [x0, fm * x0 + fb];
      }
    }
  }

  edge[0] = v0;
  edge[1] = v1;
  return true;
}

function clipEdges(x0, y0, x1, y1) {
  var i = edges.length,
      edge;

  while (i--) {
    if (!connectEdge(edge = edges[i], x0, y0, x1, y1)
        || !clipEdge(edge, x0, y0, x1, y1)
        || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon$3
            || Math.abs(edge[0][1] - edge[1][1]) > epsilon$3)) {
      delete edges[i];
    }
  }
}

function createCell(site) {
  return cells[site.index] = {
    site: site,
    halfedges: []
  };
}

function cellHalfedgeAngle(cell, edge) {
  var site = cell.site,
      va = edge.left,
      vb = edge.right;
  if (site === vb) vb = va, va = site;
  if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
  if (site === va) va = edge[1], vb = edge[0];
  else va = edge[0], vb = edge[1];
  return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

function cellHalfedgeStart(cell, edge) {
  return edge[+(edge.left !== cell.site)];
}

function cellHalfedgeEnd(cell, edge) {
  return edge[+(edge.left === cell.site)];
}

function sortCellHalfedges() {
  for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
    if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
      var index = new Array(m),
          array = new Array(m);
      for (j = 0; j < m; ++j) index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
      index.sort(function(i, j) { return array[j] - array[i]; });
      for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
      for (j = 0; j < m; ++j) halfedges[j] = array[j];
    }
  }
}

function clipCells(x0, y0, x1, y1) {
  var nCells = cells.length,
      iCell,
      cell,
      site,
      iHalfedge,
      halfedges,
      nHalfedges,
      start,
      startX,
      startY,
      end,
      endX,
      endY,
      cover = true;

  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      site = cell.site;
      halfedges = cell.halfedges;
      iHalfedge = halfedges.length;

      // Remove any dangling clipped edges.
      while (iHalfedge--) {
        if (!edges[halfedges[iHalfedge]]) {
          halfedges.splice(iHalfedge, 1);
        }
      }

      // Insert any border edges as necessary.
      iHalfedge = 0, nHalfedges = halfedges.length;
      while (iHalfedge < nHalfedges) {
        end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
        start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
        if (Math.abs(endX - startX) > epsilon$3 || Math.abs(endY - startY) > epsilon$3) {
          halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end,
              Math.abs(endX - x0) < epsilon$3 && y1 - endY > epsilon$3 ? [x0, Math.abs(startX - x0) < epsilon$3 ? startY : y1]
              : Math.abs(endY - y1) < epsilon$3 && x1 - endX > epsilon$3 ? [Math.abs(startY - y1) < epsilon$3 ? startX : x1, y1]
              : Math.abs(endX - x1) < epsilon$3 && endY - y0 > epsilon$3 ? [x1, Math.abs(startX - x1) < epsilon$3 ? startY : y0]
              : Math.abs(endY - y0) < epsilon$3 && endX - x0 > epsilon$3 ? [Math.abs(startY - y0) < epsilon$3 ? startX : x0, y0]
              : null)) - 1);
          ++nHalfedges;
        }
      }

      if (nHalfedges) cover = false;
    }
  }

  // If there weren’t any edges, have the closest site cover the extent.
  // It doesn’t matter which corner of the extent we measure!
  if (cover) {
    var dx, dy, d2, dc = Infinity;

    for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        dx = site[0] - x0;
        dy = site[1] - y0;
        d2 = dx * dx + dy * dy;
        if (d2 < dc) dc = d2, cover = cell;
      }
    }

    if (cover) {
      var v00 = [x0, y0], v01 = [x0, y1], v11 = [x1, y1], v10 = [x1, y0];
      cover.halfedges.push(
        edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
        edges.push(createBorderEdge(site, v01, v11)) - 1,
        edges.push(createBorderEdge(site, v11, v10)) - 1,
        edges.push(createBorderEdge(site, v10, v00)) - 1
      );
    }
  }

  // Lastly delete any cells with no edges; these were entirely clipped.
  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      if (!cell.halfedges.length) {
        delete cells[iCell];
      }
    }
  }
}

var circlePool = [];

var firstCircle;

function Circle() {
  RedBlackNode(this);
  this.x =
  this.y =
  this.arc =
  this.site =
  this.cy = null;
}

function attachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite[0],
      by = cSite[1],
      ax = lSite[0] - bx,
      ay = lSite[1] - by,
      cx = rSite[0] - bx,
      cy = rSite[1] - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -epsilon2$1) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d;

  var circle = circlePool.pop() || new Circle;
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

  arc.circle = circle;

  var before = null,
      node = circles._;

  while (node) {
    if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
      if (node.L) node = node.L;
      else { before = node.P; break; }
    } else {
      if (node.R) node = node.R;
      else { before = node; break; }
    }
  }

  circles.insert(before, circle);
  if (!before) firstCircle = circle;
}

function detachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) firstCircle = circle.N;
    circles.remove(circle);
    circlePool.push(circle);
    RedBlackNode(circle);
    arc.circle = null;
  }
}

var beachPool = [];

function Beach() {
  RedBlackNode(this);
  this.edge =
  this.site =
  this.circle = null;
}

function createBeach(site) {
  var beach = beachPool.pop() || new Beach;
  beach.site = site;
  return beach;
}

function detachBeach(beach) {
  detachCircle(beach);
  beaches.remove(beach);
  beachPool.push(beach);
  RedBlackNode(beach);
}

function removeBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = [x, y],
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  detachBeach(beach);

  var lArc = previous;
  while (lArc.circle
      && Math.abs(x - lArc.circle.x) < epsilon$3
      && Math.abs(y - lArc.circle.cy) < epsilon$3) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    detachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  detachCircle(lArc);

  var rArc = next;
  while (rArc.circle
      && Math.abs(x - rArc.circle.x) < epsilon$3
      && Math.abs(y - rArc.circle.cy) < epsilon$3) {
    next = rArc.N;
    disappearing.push(rArc);
    detachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  detachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

  attachCircle(lArc);
  attachCircle(rArc);
}

function addBeach(site) {
  var x = site[0],
      directrix = site[1],
      lArc,
      rArc,
      dxl,
      dxr,
      node = beaches._;

  while (node) {
    dxl = leftBreakPoint(node, directrix) - x;
    if (dxl > epsilon$3) node = node.L; else {
      dxr = x - rightBreakPoint(node, directrix);
      if (dxr > epsilon$3) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -epsilon$3) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -epsilon$3) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  createCell(site);
  var newArc = createBeach(site);
  beaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    detachCircle(lArc);
    rArc = createBeach(lArc.site);
    beaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
    attachCircle(lArc);
    attachCircle(rArc);
    return;
  }

  if (!rArc) { // && lArc
    newArc.edge = createEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  detachCircle(lArc);
  detachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite[0],
      ay = lSite[1],
      bx = site[0] - ax,
      by = site[1] - ay,
      rSite = rArc.site,
      cx = rSite[0] - ax,
      cy = rSite[1] - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

  setEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = createEdge(lSite, site, null, vertex);
  rArc.edge = createEdge(site, rSite, null, vertex);
  attachCircle(lArc);
  attachCircle(rArc);
}

function leftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site[0],
      rfocy = site[1],
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site[0],
      lfocy = site[1],
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return leftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site[1] === directrix ? site[0] : Infinity;
}

var epsilon$3 = 1e-6;
var epsilon2$1 = 1e-12;
var beaches;
var cells;
var circles;
var edges;

function triangleArea(a, b, c) {
  return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b) {
  return b[1] - a[1]
      || b[0] - a[0];
}

function Diagram(sites, extent) {
  var site = sites.sort(lexicographic).pop(),
      x,
      y,
      circle;

  edges = [];
  cells = new Array(sites.length);
  beaches = new RedBlackTree;
  circles = new RedBlackTree;

  while (true) {
    circle = firstCircle;
    if (site && (!circle || site[1] < circle.y || (site[1] === circle.y && site[0] < circle.x))) {
      if (site[0] !== x || site[1] !== y) {
        addBeach(site);
        x = site[0], y = site[1];
      }
      site = sites.pop();
    } else if (circle) {
      removeBeach(circle.arc);
    } else {
      break;
    }
  }

  sortCellHalfedges();

  if (extent) {
    var x0 = +extent[0][0],
        y0 = +extent[0][1],
        x1 = +extent[1][0],
        y1 = +extent[1][1];
    clipEdges(x0, y0, x1, y1);
    clipCells(x0, y0, x1, y1);
  }

  this.edges = edges;
  this.cells = cells;

  beaches =
  circles =
  edges =
  cells = null;
}

Diagram.prototype = {
  constructor: Diagram,

  polygons: function() {
    var edges = this.edges;

    return this.cells.map(function(cell) {
      var polygon = cell.halfedges.map(function(i) { return cellHalfedgeStart(cell, edges[i]); });
      polygon.data = cell.site.data;
      return polygon;
    });
  },

  triangles: function() {
    var triangles = [],
        edges = this.edges;

    this.cells.forEach(function(cell, i) {
      var site = cell.site,
          halfedges = cell.halfedges,
          j = -1,
          m = halfedges.length,
          s0,
          e1 = edges[halfedges[m - 1]],
          s1 = e1.left === site ? e1.right : e1.left;

      while (++j < m) {
        s0 = s1;
        e1 = edges[halfedges[j]];
        s1 = e1.left === site ? e1.right : e1.left;
        if (s0 && s1 && i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
          triangles.push([site.data, s0.data, s1.data]);
        }
      }
    });

    return triangles;
  },

  links: function() {
    return this.edges.filter(function(edge) {
      return edge.right;
    }).map(function(edge) {
      return {
        source: edge.left.data,
        target: edge.right.data
      };
    });
  },

  find: function(x, y, radius) {
    var that = this,
        i0, i1 = that._found || 0,
        cell = that.cells[i1] || that.cells[i1 = 0],
        dx = x - cell.site[0],
        dy = y - cell.site[1],
        d2 = dx * dx + dy * dy;

    do {
      cell = that.cells[i0 = i1], i1 = null;
      cell.halfedges.forEach(function(e) {
        var edge = that.edges[e], v = edge.left;
        if ((v === cell.site || !v) && !(v = edge.right)) return;
        var vx = x - v[0],
            vy = y - v[1],
            v2 = vx * vx + vy * vy;
        if (v2 < d2) d2 = v2, i1 = v.index;
      });
    } while (i1 !== null);

    that._found = i0;

    return radius == null || d2 <= radius * radius ? cell.site : null;
  }
};

var voronoi = function() {
  var x$$1 = x$4,
      y$$1 = y$4,
      extent = null;

  function voronoi(data) {
    return new Diagram(data.map(function(d, i) {
      var s = [Math.round(x$$1(d, i, data) / epsilon$3) * epsilon$3, Math.round(y$$1(d, i, data) / epsilon$3) * epsilon$3];
      s.index = i;
      s.data = d;
      return s;
    }), extent);
  }

  voronoi.polygons = function(data) {
    return voronoi(data).polygons();
  };

  voronoi.links = function(data) {
    return voronoi(data).links();
  };

  voronoi.triangles = function(data) {
    return voronoi(data).triangles();
  };

  voronoi.x = function(_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$9(+_), voronoi) : x$$1;
  };

  voronoi.y = function(_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$9(+_), voronoi) : y$$1;
  };

  voronoi.extent = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]], voronoi) : extent && [[extent[0][0], extent[0][1]], [extent[1][0], extent[1][1]]];
  };

  voronoi.size = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[0, 0], [+_[0], +_[1]]], voronoi) : extent && [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]];
  };

  return voronoi;
};

var constant$10 = function(x) {
  return function() {
    return x;
  };
};

function ZoomEvent(target, type, transform) {
  this.target = target;
  this.type = type;
  this.transform = transform;
}

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

var identity$6 = new Transform(1, 0, 0);

transform.prototype = Transform.prototype;

function transform(node) {
  return node.__zoom || identity$6;
}

function nopropagation$1() {
  exports.event.stopImmediatePropagation();
}

var noevent$1 = function() {
  exports.event.preventDefault();
  exports.event.stopImmediatePropagation();
};

// Ignore right-click, since that should open the context menu.
function defaultFilter$1() {
  return !exports.event.button;
}

function defaultExtent() {
  var e = this, w, h;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    w = e.width.baseVal.value;
    h = e.height.baseVal.value;
  } else {
    w = e.clientWidth;
    h = e.clientHeight;
  }
  return [[0, 0], [w, h]];
}

function defaultTransform() {
  return this.__zoom || identity$6;
}

var zoom = function() {
  var filter = defaultFilter$1,
      extent = defaultExtent,
      k0 = 0,
      k1 = Infinity,
      x0 = -k1,
      x1 = k1,
      y0 = x0,
      y1 = x1,
      duration = 250,
      interpolate$$1 = interpolateZoom,
      gestures = [],
      listeners = dispatch("start", "zoom", "end"),
      touchstarting,
      touchending,
      touchDelay = 500,
      wheelDelay = 150;

  function zoom(selection$$1) {
    selection$$1
        .on("wheel.zoom", wheeled)
        .on("mousedown.zoom", mousedowned)
        .on("dblclick.zoom", dblclicked)
        .on("touchstart.zoom", touchstarted)
        .on("touchmove.zoom", touchmoved)
        .on("touchend.zoom touchcancel.zoom", touchended)
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
        .property("__zoom", defaultTransform);
  }

  zoom.transform = function(collection, transform) {
    var selection$$1 = collection.selection ? collection.selection() : collection;
    selection$$1.property("__zoom", defaultTransform);
    if (collection !== selection$$1) {
      schedule(collection, transform);
    } else {
      selection$$1.interrupt().each(function() {
        gesture(this, arguments)
            .start()
            .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
            .end();
      });
    }
  };

  zoom.scaleBy = function(selection$$1, k) {
    zoom.scaleTo(selection$$1, function() {
      var k0 = this.__zoom.k,
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    });
  };

  zoom.scaleTo = function(selection$$1, k) {
    zoom.transform(selection$$1, function() {
      var e = extent.apply(this, arguments),
          t0 = this.__zoom,
          p0 = centroid(e),
          p1 = t0.invert(p0),
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e);
    });
  };

  zoom.translateBy = function(selection$$1, x, y) {
    zoom.transform(selection$$1, function() {
      return constrain(this.__zoom.translate(
        typeof x === "function" ? x.apply(this, arguments) : x,
        typeof y === "function" ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments));
    });
  };

  function scale(transform, k) {
    k = Math.max(k0, Math.min(k1, k));
    return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
  }

  function translate(transform, p0, p1) {
    var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
  }

  function constrain(transform, extent) {
    var dx0 = transform.invertX(extent[0][0]) - x0,
        dx1 = transform.invertX(extent[1][0]) - x1,
        dy0 = transform.invertY(extent[0][1]) - y0,
        dy1 = transform.invertY(extent[1][1]) - y1;
    return transform.translate(
      dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
      dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
    );
  }

  function centroid(extent) {
    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
  }

  function schedule(transition$$1, transform, center) {
    transition$$1
        .on("start.zoom", function() { gesture(this, arguments).start(); })
        .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).end(); })
        .tween("zoom", function() {
          var that = this,
              args = arguments,
              g = gesture(that, args),
              e = extent.apply(that, args),
              p = center || centroid(e),
              w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
              a = that.__zoom,
              b = typeof transform === "function" ? transform.apply(that, args) : transform,
              i = interpolate$$1(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
          return function(t) {
            if (t === 1) t = b; // Avoid rounding error on end.
            else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
            g.zoom(null, t);
          };
        });
  }

  function gesture(that, args) {
    for (var i = 0, n = gestures.length, g; i < n; ++i) {
      if ((g = gestures[i]).that === that) {
        return g;
      }
    }
    return new Gesture(that, args);
  }

  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.index = -1;
    this.active = 0;
    this.extent = extent.apply(that, args);
  }

  Gesture.prototype = {
    start: function() {
      if (++this.active === 1) {
        this.index = gestures.push(this) - 1;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
      this.that.__zoom = transform;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        gestures.splice(this.index, 1);
        this.index = -1;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      customEvent(new ZoomEvent(zoom, type, this.that.__zoom), listeners.apply, listeners, [type, this.that, this.args]);
    }
  };

  function wheeled() {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, arguments),
        t = this.__zoom,
        k = Math.max(k0, Math.min(k1, t.k * Math.pow(2, -exports.event.deltaY * (exports.event.deltaMode ? 120 : 1) / 500))),
        p = mouse(this);

    // If the mouse is in the same location as before, reuse it.
    // If there were recent wheel events, reset the wheel idle timeout.
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    }

    // If this wheel event won’t trigger a transform change, ignore it.
    else if (t.k === k) return;

    // Otherwise, capture the mouse point and location at the start.
    else {
      g.mouse = [p, t.invert(p)];
      interrupt(this);
      g.start();
    }

    noevent$1();
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent));

    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }

  function mousedowned() {
    if (touchending || !filter.apply(this, arguments)) return;
    var g = gesture(this, arguments),
        v = select(exports.event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
        p = mouse(this);

    dragDisable(exports.event.view);
    nopropagation$1();
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt(this);
    g.start();

    function mousemoved() {
      noevent$1();
      g.moved = true;
      g.zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = mouse(g.that), g.mouse[1]), g.extent));
    }

    function mouseupped() {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(exports.event.view, g.moved);
      noevent$1();
      g.end();
    }
  }

  function dblclicked() {
    if (!filter.apply(this, arguments)) return;
    var t0 = this.__zoom,
        p0 = mouse(this),
        p1 = t0.invert(p0),
        k1 = t0.k * (exports.event.shiftKey ? 0.5 : 2),
        t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments));

    noevent$1();
    if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0);
    else select(this).call(zoom.transform, t1);
  }

  function touchstarted() {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, arguments),
        touches$$1 = exports.event.changedTouches,
        n = touches$$1.length, i, t, p;

    nopropagation$1();
    for (i = 0; i < n; ++i) {
      t = touches$$1[i], p = touch(this, touches$$1, t.identifier);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0) g.touch0 = p;
      else if (!g.touch1) g.touch1 = p;
    }

    // If this is a dbltap, reroute to the (optional) dblclick.zoom handler.
    if (touchstarting) {
      touchstarting = clearTimeout(touchstarting);
      if (!g.touch1) {
        g.end();
        p = select(this).on("dblclick.zoom");
        if (p) p.apply(this, arguments);
        return;
      }
    }

    if (exports.event.touches.length === n) {
      touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
      interrupt(this);
      g.start();
    }
  }

  function touchmoved() {
    var g = gesture(this, arguments),
        touches$$1 = exports.event.changedTouches,
        n = touches$$1.length, i, t, p, l;

    noevent$1();
    if (touchstarting) touchstarting = clearTimeout(touchstarting);
    for (i = 0; i < n; ++i) {
      t = touches$$1[i], p = touch(this, touches$$1, t.identifier);
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1],
          p1 = g.touch1[0], l1 = g.touch1[1],
          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    }
    else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
    else return;
    g.zoom("touch", constrain(translate(t, p, l), g.extent));
  }

  function touchended() {
    var g = gesture(this, arguments),
        touches$$1 = exports.event.changedTouches,
        n = touches$$1.length, i, t;

    nopropagation$1();
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches$$1[i];
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
    }
    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
    if (!g.touch0) g.end();
  }

  zoom.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$10(!!_), zoom) : filter;
  };

  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant$10([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };

  zoom.scaleExtent = function(_) {
    return arguments.length ? (k0 = +_[0], k1 = +_[1], zoom) : [k0, k1];
  };

  zoom.translateExtent = function(_) {
    return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], zoom) : [[x0, y0], [x1, y1]];
  };

  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };

  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate$$1 = _, zoom) : interpolate$$1;
  };

  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };

  return zoom;
};

var constant$11 = function(x) {
  return function() {
    return x;
  };
};

var BrushEvent = function(target, type, selection) {
  this.target = target;
  this.type = type;
  this.selection = selection;
};

function nopropagation$2() {
  exports.event.stopImmediatePropagation();
}

var noevent$2 = function() {
  exports.event.preventDefault();
  exports.event.stopImmediatePropagation();
};

var MODE_DRAG = {name: "drag"};
var MODE_SPACE = {name: "space"};
var MODE_HANDLE = {name: "handle"};
var MODE_CENTER = {name: "center"};

var X = {
  name: "x",
  handles: ["e", "w"].map(type$1),
  input: function(x, e) { return x && [[x[0], e[0][1]], [x[1], e[1][1]]]; },
  output: function(xy) { return xy && [xy[0][0], xy[1][0]]; }
};

var Y = {
  name: "y",
  handles: ["n", "s"].map(type$1),
  input: function(y, e) { return y && [[e[0][0], y[0]], [e[1][0], y[1]]]; },
  output: function(xy) { return xy && [xy[0][1], xy[1][1]]; }
};

var XY = {
  name: "xy",
  handles: ["n", "e", "s", "w", "nw", "ne", "se", "sw"].map(type$1),
  input: function(xy) { return xy; },
  output: function(xy) { return xy; }
};

var cursors = {
  overlay: "crosshair",
  selection: "move",
  n: "ns-resize",
  e: "ew-resize",
  s: "ns-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize"
};

var flipX = {
  e: "w",
  w: "e",
  nw: "ne",
  ne: "nw",
  se: "sw",
  sw: "se"
};

var flipY = {
  n: "s",
  s: "n",
  nw: "sw",
  ne: "se",
  se: "ne",
  sw: "nw"
};

var signsX = {
  overlay: +1,
  selection: +1,
  n: null,
  e: +1,
  s: null,
  w: -1,
  nw: -1,
  ne: +1,
  se: +1,
  sw: -1
};

var signsY = {
  overlay: +1,
  selection: +1,
  n: -1,
  e: null,
  s: +1,
  w: null,
  nw: -1,
  ne: -1,
  se: +1,
  sw: +1
};

function type$1(t) {
  return {type: t};
}

// Ignore right-click, since that should open the context menu.
function defaultFilter$2() {
  return !exports.event.button;
}

function defaultExtent$1() {
  var svg = this.ownerSVGElement || this;
  return [[0, 0], [svg.width.baseVal.value, svg.height.baseVal.value]];
}

// Like d3.local, but with the name “__brush” rather than auto-generated.
function local$1(node) {
  while (!node.__brush) if (!(node = node.parentNode)) return;
  return node.__brush;
}

function empty$1(extent) {
  return extent[0][0] === extent[1][0]
      || extent[0][1] === extent[1][1];
}

function brushSelection(node) {
  var state = node.__brush;
  return state ? state.dim.output(state.selection) : null;
}

function brushX() {
  return brush$1(X);
}

function brushY() {
  return brush$1(Y);
}

var brush = function() {
  return brush$1(XY);
};

function brush$1(dim) {
  var extent = defaultExtent$1,
      filter = defaultFilter$2,
      listeners = dispatch(brush, "start", "brush", "end"),
      handleSize = 6,
      touchending;

  function brush(group) {
    var overlay = group
        .property("__brush", initialize)
      .selectAll(".overlay")
      .data([type$1("overlay")]);

    overlay.enter().append("rect")
        .attr("class", "overlay")
        .attr("pointer-events", "all")
        .attr("cursor", cursors.overlay)
      .merge(overlay)
        .each(function() {
          var extent = local$1(this).extent;
          select(this)
              .attr("x", extent[0][0])
              .attr("y", extent[0][1])
              .attr("width", extent[1][0] - extent[0][0])
              .attr("height", extent[1][1] - extent[0][1]);
        });

    group.selectAll(".selection")
      .data([type$1("selection")])
      .enter().append("rect")
        .attr("class", "selection")
        .attr("cursor", cursors.selection)
        .attr("fill", "#777")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#fff")
        .attr("shape-rendering", "crispEdges");

    var handle = group.selectAll(".handle")
      .data(dim.handles, function(d) { return d.type; });

    handle.exit().remove();

    handle.enter().append("rect")
        .attr("class", function(d) { return "handle handle--" + d.type; })
        .attr("cursor", function(d) { return cursors[d.type]; });

    group
        .each(redraw)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
        .on("mousedown.brush touchstart.brush", started);
  }

  brush.move = function(group, selection$$1) {
    if (group.selection) {
      group
          .on("start.brush", function() { emitter(this, arguments).beforestart().start(); })
          .on("interrupt.brush end.brush", function() { emitter(this, arguments).end(); })
          .tween("brush", function() {
            var that = this,
                state = that.__brush,
                emit = emitter(that, arguments),
                selection0 = state.selection,
                selection1 = dim.input(typeof selection$$1 === "function" ? selection$$1.apply(this, arguments) : selection$$1, state.extent),
                i = interpolate(selection0, selection1);

            function tween(t) {
              state.selection = t === 1 && empty$1(selection1) ? null : i(t);
              redraw.call(that);
              emit.brush();
            }

            return selection0 && selection1 ? tween : tween(1);
          });
    } else {
      group
          .each(function() {
            var that = this,
                args = arguments,
                state = that.__brush,
                selection1 = dim.input(typeof selection$$1 === "function" ? selection$$1.apply(that, args) : selection$$1, state.extent),
                emit = emitter(that, args).beforestart();

            interrupt(that);
            state.selection = selection1 == null || empty$1(selection1) ? null : selection1;
            redraw.call(that);
            emit.start().brush().end();
          });
    }
  };

  function redraw() {
    var group = select(this),
        selection$$1 = local$1(this).selection;

    if (selection$$1) {
      group.selectAll(".selection")
          .style("display", null)
          .attr("x", selection$$1[0][0])
          .attr("y", selection$$1[0][1])
          .attr("width", selection$$1[1][0] - selection$$1[0][0])
          .attr("height", selection$$1[1][1] - selection$$1[0][1]);

      group.selectAll(".handle")
          .style("display", null)
          .attr("x", function(d) { return d.type[d.type.length - 1] === "e" ? selection$$1[1][0] - handleSize / 2 : selection$$1[0][0] - handleSize / 2; })
          .attr("y", function(d) { return d.type[0] === "s" ? selection$$1[1][1] - handleSize / 2 : selection$$1[0][1] - handleSize / 2; })
          .attr("width", function(d) { return d.type === "n" || d.type === "s" ? selection$$1[1][0] - selection$$1[0][0] + handleSize : handleSize; })
          .attr("height", function(d) { return d.type === "e" || d.type === "w" ? selection$$1[1][1] - selection$$1[0][1] + handleSize : handleSize; });
    }

    else {
      group.selectAll(".selection,.handle")
          .style("display", "none")
          .attr("x", null)
          .attr("y", null)
          .attr("width", null)
          .attr("height", null);
    }
  }

  function emitter(that, args) {
    return that.__brush.emitter || new Emitter(that, args);
  }

  function Emitter(that, args) {
    this.that = that;
    this.args = args;
    this.state = that.__brush;
    this.active = 0;
  }

  Emitter.prototype = {
    beforestart: function() {
      if (++this.active === 1) this.state.emitter = this, this.starting = true;
      return this;
    },
    start: function() {
      if (this.starting) this.starting = false, this.emit("start");
      return this;
    },
    brush: function() {
      this.emit("brush");
      return this;
    },
    end: function() {
      if (--this.active === 0) delete this.state.emitter, this.emit("end");
      return this;
    },
    emit: function(type) {
      customEvent(new BrushEvent(brush, type, dim.output(this.state.selection)), listeners.apply, listeners, [type, this.that, this.args]);
    }
  };

  function started() {
    if (exports.event.touches) { if (exports.event.changedTouches.length < exports.event.touches.length) return noevent$2(); }
    else if (touchending) return;
    if (!filter.apply(this, arguments)) return;

    var that = this,
        type = exports.event.target.__data__.type,
        mode = (exports.event.metaKey ? type = "overlay" : type) === "selection" ? MODE_DRAG : (exports.event.altKey ? MODE_CENTER : MODE_HANDLE),
        signX = dim === Y ? null : signsX[type],
        signY = dim === X ? null : signsY[type],
        state = local$1(that),
        extent = state.extent,
        selection$$1 = state.selection,
        W = extent[0][0], w0, w1,
        N = extent[0][1], n0, n1,
        E = extent[1][0], e0, e1,
        S = extent[1][1], s0, s1,
        dx,
        dy,
        moving,
        shifting = signX && signY && exports.event.shiftKey,
        lockX,
        lockY,
        point0 = mouse(that),
        point = point0,
        emit = emitter(that, arguments).beforestart();

    if (type === "overlay") {
      state.selection = selection$$1 = [
        [w0 = dim === Y ? W : point0[0], n0 = dim === X ? N : point0[1]],
        [e0 = dim === Y ? E : w0, s0 = dim === X ? S : n0]
      ];
    } else {
      w0 = selection$$1[0][0];
      n0 = selection$$1[0][1];
      e0 = selection$$1[1][0];
      s0 = selection$$1[1][1];
    }

    w1 = w0;
    n1 = n0;
    e1 = e0;
    s1 = s0;

    var group = select(that)
        .attr("pointer-events", "none");

    var overlay = group.selectAll(".overlay")
        .attr("cursor", cursors[type]);

    if (exports.event.touches) {
      group
          .on("touchmove.brush", moved, true)
          .on("touchend.brush touchcancel.brush", ended, true);
    } else {
      var view = select(exports.event.view)
          .on("keydown.brush", keydowned, true)
          .on("keyup.brush", keyupped, true)
          .on("mousemove.brush", moved, true)
          .on("mouseup.brush", ended, true);

      dragDisable(exports.event.view);
    }

    nopropagation$2();
    interrupt(that);
    redraw.call(that);
    emit.start();

    function moved() {
      var point1 = mouse(that);
      if (shifting && !lockX && !lockY) {
        if (Math.abs(point1[0] - point[0]) > Math.abs(point1[1] - point[1])) lockY = true;
        else lockX = true;
      }
      point = point1;
      moving = true;
      noevent$2();
      move();
    }

    function move() {
      var t;

      dx = point[0] - point0[0];
      dy = point[1] - point0[1];

      switch (mode) {
        case MODE_SPACE:
        case MODE_DRAG: {
          if (signX) dx = Math.max(W - w0, Math.min(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
          if (signY) dy = Math.max(N - n0, Math.min(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
          break;
        }
        case MODE_HANDLE: {
          if (signX < 0) dx = Math.max(W - w0, Math.min(E - w0, dx)), w1 = w0 + dx, e1 = e0;
          else if (signX > 0) dx = Math.max(W - e0, Math.min(E - e0, dx)), w1 = w0, e1 = e0 + dx;
          if (signY < 0) dy = Math.max(N - n0, Math.min(S - n0, dy)), n1 = n0 + dy, s1 = s0;
          else if (signY > 0) dy = Math.max(N - s0, Math.min(S - s0, dy)), n1 = n0, s1 = s0 + dy;
          break;
        }
        case MODE_CENTER: {
          if (signX) w1 = Math.max(W, Math.min(E, w0 - dx * signX)), e1 = Math.max(W, Math.min(E, e0 + dx * signX));
          if (signY) n1 = Math.max(N, Math.min(S, n0 - dy * signY)), s1 = Math.max(N, Math.min(S, s0 + dy * signY));
          break;
        }
      }

      if (e1 < w1) {
        signX *= -1;
        t = w0, w0 = e0, e0 = t;
        t = w1, w1 = e1, e1 = t;
        if (type in flipX) overlay.attr("cursor", cursors[type = flipX[type]]);
      }

      if (s1 < n1) {
        signY *= -1;
        t = n0, n0 = s0, s0 = t;
        t = n1, n1 = s1, s1 = t;
        if (type in flipY) overlay.attr("cursor", cursors[type = flipY[type]]);
      }

      if (state.selection) selection$$1 = state.selection; // May be set by brush.move!
      if (lockX) w1 = selection$$1[0][0], e1 = selection$$1[1][0];
      if (lockY) n1 = selection$$1[0][1], s1 = selection$$1[1][1];

      if (selection$$1[0][0] !== w1
          || selection$$1[0][1] !== n1
          || selection$$1[1][0] !== e1
          || selection$$1[1][1] !== s1) {
        state.selection = [[w1, n1], [e1, s1]];
        redraw.call(that);
        emit.brush();
      }
    }

    function ended() {
      nopropagation$2();
      if (exports.event.touches) {
        if (exports.event.touches.length) return;
        if (touchending) clearTimeout(touchending);
        touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
        group.on("touchmove.brush touchend.brush touchcancel.brush", null);
      } else {
        yesdrag(exports.event.view, moving);
        view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null);
      }
      group.attr("pointer-events", "all");
      overlay.attr("cursor", cursors.overlay);
      if (state.selection) selection$$1 = state.selection; // May be set by brush.move (on start)!
      if (empty$1(selection$$1)) state.selection = null, redraw.call(that);
      emit.end();
    }

    function keydowned() {
      switch (exports.event.keyCode) {
        case 16: { // SHIFT
          shifting = signX && signY;
          break;
        }
        case 18: { // ALT
          if (mode === MODE_HANDLE) {
            if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
            if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
            mode = MODE_CENTER;
            move();
          }
          break;
        }
        case 32: { // SPACE; takes priority over ALT
          if (mode === MODE_HANDLE || mode === MODE_CENTER) {
            if (signX < 0) e0 = e1 - dx; else if (signX > 0) w0 = w1 - dx;
            if (signY < 0) s0 = s1 - dy; else if (signY > 0) n0 = n1 - dy;
            mode = MODE_SPACE;
            overlay.attr("cursor", cursors.selection);
            move();
          }
          break;
        }
        default: return;
      }
      noevent$2();
    }

    function keyupped() {
      switch (exports.event.keyCode) {
        case 16: { // SHIFT
          if (shifting) {
            lockX = lockY = shifting = false;
            move();
          }
          break;
        }
        case 18: { // ALT
          if (mode === MODE_CENTER) {
            if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
            if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
            mode = MODE_HANDLE;
            move();
          }
          break;
        }
        case 32: { // SPACE
          if (mode === MODE_SPACE) {
            if (exports.event.altKey) {
              if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
              if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
              mode = MODE_CENTER;
            } else {
              if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
              if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
              mode = MODE_HANDLE;
            }
            overlay.attr("cursor", cursors[type]);
            move();
          }
          break;
        }
        default: return;
      }
      noevent$2();
    }
  }

  function initialize() {
    var state = this.__brush || {selection: null};
    state.extent = extent.apply(this, arguments);
    state.dim = dim;
    return state;
  }

  brush.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant$11([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), brush) : extent;
  };

  brush.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$11(!!_), brush) : filter;
  };

  brush.handleSize = function(_) {
    return arguments.length ? (handleSize = +_, brush) : handleSize;
  };

  brush.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? brush : value;
  };

  return brush;
}

var cos = Math.cos;
var sin = Math.sin;
var pi$3 = Math.PI;
var halfPi$2 = pi$3 / 2;
var tau$3 = pi$3 * 2;
var max$1 = Math.max;

function compareValue(compare) {
  return function(a, b) {
    return compare(
      a.source.value + a.target.value,
      b.source.value + b.target.value
    );
  };
}

var chord = function() {
  var padAngle = 0,
      sortGroups = null,
      sortSubgroups = null,
      sortChords = null;

  function chord(matrix) {
    var n = matrix.length,
        groupSums = [],
        groupIndex = range(n),
        subgroupIndex = [],
        chords = [],
        groups = chords.groups = new Array(n),
        subgroups = new Array(n * n),
        k,
        x,
        x0,
        dx,
        i,
        j;

    // Compute the sum.
    k = 0, i = -1; while (++i < n) {
      x = 0, j = -1; while (++j < n) {
        x += matrix[i][j];
      }
      groupSums.push(x);
      subgroupIndex.push(range(n));
      k += x;
    }

    // Sort groups…
    if (sortGroups) groupIndex.sort(function(a, b) {
      return sortGroups(groupSums[a], groupSums[b]);
    });

    // Sort subgroups…
    if (sortSubgroups) subgroupIndex.forEach(function(d, i) {
      d.sort(function(a, b) {
        return sortSubgroups(matrix[i][a], matrix[i][b]);
      });
    });

    // Convert the sum to scaling factor for [0, 2pi].
    // TODO Allow start and end angle to be specified?
    // TODO Allow padding to be specified as percentage?
    k = max$1(0, tau$3 - padAngle * n) / k;
    dx = k ? padAngle : tau$3 / n;

    // Compute the start and end angle for each group and subgroup.
    // Note: Opera has a bug reordering object literal properties!
    x = 0, i = -1; while (++i < n) {
      x0 = x, j = -1; while (++j < n) {
        var di = groupIndex[i],
            dj = subgroupIndex[di][j],
            v = matrix[di][dj],
            a0 = x,
            a1 = x += v * k;
        subgroups[dj * n + di] = {
          index: di,
          subindex: dj,
          startAngle: a0,
          endAngle: a1,
          value: v
        };
      }
      groups[di] = {
        index: di,
        startAngle: x0,
        endAngle: x,
        value: groupSums[di]
      };
      x += dx;
    }

    // Generate chords for each (non-empty) subgroup-subgroup link.
    i = -1; while (++i < n) {
      j = i - 1; while (++j < n) {
        var source = subgroups[j * n + i],
            target = subgroups[i * n + j];
        if (source.value || target.value) {
          chords.push(source.value < target.value
              ? {source: target, target: source}
              : {source: source, target: target});
        }
      }
    }

    return sortChords ? chords.sort(sortChords) : chords;
  }

  chord.padAngle = function(_) {
    return arguments.length ? (padAngle = max$1(0, _), chord) : padAngle;
  };

  chord.sortGroups = function(_) {
    return arguments.length ? (sortGroups = _, chord) : sortGroups;
  };

  chord.sortSubgroups = function(_) {
    return arguments.length ? (sortSubgroups = _, chord) : sortSubgroups;
  };

  chord.sortChords = function(_) {
    return arguments.length ? (_ == null ? sortChords = null : (sortChords = compareValue(_))._ = _, chord) : sortChords && sortChords._;
  };

  return chord;
};

var slice$5 = Array.prototype.slice;

var constant$12 = function(x) {
  return function() {
    return x;
  };
};

function defaultSource(d) {
  return d.source;
}

function defaultTarget(d) {
  return d.target;
}

function defaultRadius$1(d) {
  return d.radius;
}

function defaultStartAngle(d) {
  return d.startAngle;
}

function defaultEndAngle(d) {
  return d.endAngle;
}

var ribbon = function() {
  var source = defaultSource,
      target = defaultTarget,
      radius = defaultRadius$1,
      startAngle = defaultStartAngle,
      endAngle = defaultEndAngle,
      context = null;

  function ribbon() {
    var buffer,
        argv = slice$5.call(arguments),
        s = source.apply(this, argv),
        t = target.apply(this, argv),
        sr = +radius.apply(this, (argv[0] = s, argv)),
        sa0 = startAngle.apply(this, argv) - halfPi$2,
        sa1 = endAngle.apply(this, argv) - halfPi$2,
        sx0 = sr * cos(sa0),
        sy0 = sr * sin(sa0),
        tr = +radius.apply(this, (argv[0] = t, argv)),
        ta0 = startAngle.apply(this, argv) - halfPi$2,
        ta1 = endAngle.apply(this, argv) - halfPi$2;

    if (!context) context = buffer = path();

    context.moveTo(sx0, sy0);
    context.arc(0, 0, sr, sa0, sa1);
    if (sa0 !== ta0 || sa1 !== ta1) { // TODO sr !== tr?
      context.quadraticCurveTo(0, 0, tr * cos(ta0), tr * sin(ta0));
      context.arc(0, 0, tr, ta0, ta1);
    }
    context.quadraticCurveTo(0, 0, sx0, sy0);
    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  ribbon.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$12(+_), ribbon) : radius;
  };

  ribbon.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$12(+_), ribbon) : startAngle;
  };

  ribbon.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$12(+_), ribbon) : endAngle;
  };

  ribbon.source = function(_) {
    return arguments.length ? (source = _, ribbon) : source;
  };

  ribbon.target = function(_) {
    return arguments.length ? (target = _, ribbon) : target;
  };

  ribbon.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), ribbon) : context;
  };

  return ribbon;
};

// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/

var adder = function() {
  return new Adder;
};

function Adder() {
  this.reset();
}

Adder.prototype = {
  constructor: Adder,
  reset: function() {
    this.s = // rounded value
    this.t = 0; // exact error
  },
  add: function(y) {
    add$1(temp, y, this.t);
    add$1(this, temp.s, this.s);
    if (this.s) this.t += temp.t;
    else this.s = temp.t;
  },
  valueOf: function() {
    return this.s;
  }
};

var temp = new Adder;

function add$1(adder, a, b) {
  var x = adder.s = a + b,
      bv = x - a,
      av = x - bv;
  adder.t = (a - av) + (b - bv);
}

var epsilon$4 = 1e-6;
var epsilon2$2 = 1e-12;
var pi$4 = Math.PI;
var halfPi$3 = pi$4 / 2;
var quarterPi = pi$4 / 4;
var tau$4 = pi$4 * 2;

var degrees$1 = 180 / pi$4;
var radians = pi$4 / 180;

var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var cos$1 = Math.cos;
var ceil = Math.ceil;
var exp = Math.exp;

var log$1 = Math.log;
var pow$1 = Math.pow;
var sin$1 = Math.sin;
var sign$1 = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
var sqrt$1 = Math.sqrt;
var tan = Math.tan;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi$4 : Math.acos(x);
}

function asin$1(x) {
  return x > 1 ? halfPi$3 : x < -1 ? -halfPi$3 : Math.asin(x);
}

function haversin(x) {
  return (x = sin$1(x / 2)) * x;
}

function noop$2() {}

function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream);
  }
}

var streamObjectType = {
  Feature: function(feature, stream) {
    streamGeometry(feature.geometry, stream);
  },
  FeatureCollection: function(object, stream) {
    var features = object.features, i = -1, n = features.length;
    while (++i < n) streamGeometry(features[i].geometry, stream);
  }
};

var streamGeometryType = {
  Sphere: function(object, stream) {
    stream.sphere();
  },
  Point: function(object, stream) {
    object = object.coordinates;
    stream.point(object[0], object[1], object[2]);
  },
  MultiPoint: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
  },
  LineString: function(object, stream) {
    streamLine(object.coordinates, stream, 0);
  },
  MultiLineString: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamLine(coordinates[i], stream, 0);
  },
  Polygon: function(object, stream) {
    streamPolygon(object.coordinates, stream);
  },
  MultiPolygon: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamPolygon(coordinates[i], stream);
  },
  GeometryCollection: function(object, stream) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) streamGeometry(geometries[i], stream);
  }
};

function streamLine(coordinates, stream, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  stream.lineStart();
  while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
  stream.lineEnd();
}

function streamPolygon(coordinates, stream) {
  var i = -1, n = coordinates.length;
  stream.polygonStart();
  while (++i < n) streamLine(coordinates[i], stream, 1);
  stream.polygonEnd();
}

var geoStream = function(object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream);
  } else {
    streamGeometry(object, stream);
  }
};

var areaRingSum = adder();

var areaSum = adder();
var lambda00;
var phi00;
var lambda0;
var cosPhi0;
var sinPhi0;

var areaStream = {
  point: noop$2,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: function() {
    areaRingSum.reset();
    areaStream.lineStart = areaRingStart;
    areaStream.lineEnd = areaRingEnd;
  },
  polygonEnd: function() {
    var areaRing = +areaRingSum;
    areaSum.add(areaRing < 0 ? tau$4 + areaRing : areaRing);
    this.lineStart = this.lineEnd = this.point = noop$2;
  },
  sphere: function() {
    areaSum.add(tau$4);
  }
};

function areaRingStart() {
  areaStream.point = areaPointFirst;
}

function areaRingEnd() {
  areaPoint(lambda00, phi00);
}

function areaPointFirst(lambda, phi) {
  areaStream.point = areaPoint;
  lambda00 = lambda, phi00 = phi;
  lambda *= radians, phi *= radians;
  lambda0 = lambda, cosPhi0 = cos$1(phi = phi / 2 + quarterPi), sinPhi0 = sin$1(phi);
}

function areaPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  phi = phi / 2 + quarterPi; // half the angular distance from south pole

  // Spherical excess E for a spherical triangle with vertices: south pole,
  // previous point, current point.  Uses a formula derived from Cagnoli’s
  // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
  var dLambda = lambda - lambda0,
      sdLambda = dLambda >= 0 ? 1 : -1,
      adLambda = sdLambda * dLambda,
      cosPhi = cos$1(phi),
      sinPhi = sin$1(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * cos$1(adLambda),
      v = k * sdLambda * sin$1(adLambda);
  areaRingSum.add(atan2(v, u));

  // Advance the previous points.
  lambda0 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
}

var area$2 = function(object) {
  areaSum.reset();
  geoStream(object, areaStream);
  return areaSum * 2;
};

function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]), asin$1(cartesian[2])];
}

function cartesian(spherical) {
  var lambda = spherical[0], phi = spherical[1], cosPhi = cos$1(phi);
  return [cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi)];
}

function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// TODO return a
function cartesianAddInPlace(a, b) {
  a[0] += b[0], a[1] += b[1], a[2] += b[2];
}

function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k];
}

// TODO return d
function cartesianNormalizeInPlace(d) {
  var l = sqrt$1(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}

var lambda0$1;
var phi0;
var lambda1;
var phi1;
var lambda2;
var lambda00$1;
var phi00$1;
var p0;
var deltaSum = adder();
var ranges;
var range$1;

var boundsStream = {
  point: boundsPoint,
  lineStart: boundsLineStart,
  lineEnd: boundsLineEnd,
  polygonStart: function() {
    boundsStream.point = boundsRingPoint;
    boundsStream.lineStart = boundsRingStart;
    boundsStream.lineEnd = boundsRingEnd;
    deltaSum.reset();
    areaStream.polygonStart();
  },
  polygonEnd: function() {
    areaStream.polygonEnd();
    boundsStream.point = boundsPoint;
    boundsStream.lineStart = boundsLineStart;
    boundsStream.lineEnd = boundsLineEnd;
    if (areaRingSum < 0) lambda0$1 = -(lambda1 = 180), phi0 = -(phi1 = 90);
    else if (deltaSum > epsilon$4) phi1 = 90;
    else if (deltaSum < -epsilon$4) phi0 = -90;
    range$1[0] = lambda0$1, range$1[1] = lambda1;
  }
};

function boundsPoint(lambda, phi) {
  ranges.push(range$1 = [lambda0$1 = lambda, lambda1 = lambda]);
  if (phi < phi0) phi0 = phi;
  if (phi > phi1) phi1 = phi;
}

function linePoint(lambda, phi) {
  var p = cartesian([lambda * radians, phi * radians]);
  if (p0) {
    var normal = cartesianCross(p0, p),
        equatorial = [normal[1], -normal[0], 0],
        inflection = cartesianCross(equatorial, normal);
    cartesianNormalizeInPlace(inflection);
    inflection = spherical(inflection);
    var delta = lambda - lambda2,
        sign$$1 = delta > 0 ? 1 : -1,
        lambdai = inflection[0] * degrees$1 * sign$$1,
        phii,
        antimeridian = abs(delta) > 180;
    if (antimeridian ^ (sign$$1 * lambda2 < lambdai && lambdai < sign$$1 * lambda)) {
      phii = inflection[1] * degrees$1;
      if (phii > phi1) phi1 = phii;
    } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign$$1 * lambda2 < lambdai && lambdai < sign$$1 * lambda)) {
      phii = -inflection[1] * degrees$1;
      if (phii < phi0) phi0 = phii;
    } else {
      if (phi < phi0) phi0 = phi;
      if (phi > phi1) phi1 = phi;
    }
    if (antimeridian) {
      if (lambda < lambda2) {
        if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
      } else {
        if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
      }
    } else {
      if (lambda1 >= lambda0$1) {
        if (lambda < lambda0$1) lambda0$1 = lambda;
        if (lambda > lambda1) lambda1 = lambda;
      } else {
        if (lambda > lambda2) {
          if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
        } else {
          if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
        }
      }
    }
  } else {
    boundsPoint(lambda, phi);
  }
  p0 = p, lambda2 = lambda;
}

function boundsLineStart() {
  boundsStream.point = linePoint;
}

function boundsLineEnd() {
  range$1[0] = lambda0$1, range$1[1] = lambda1;
  boundsStream.point = boundsPoint;
  p0 = null;
}

function boundsRingPoint(lambda, phi) {
  if (p0) {
    var delta = lambda - lambda2;
    deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
  } else {
    lambda00$1 = lambda, phi00$1 = phi;
  }
  areaStream.point(lambda, phi);
  linePoint(lambda, phi);
}

function boundsRingStart() {
  areaStream.lineStart();
}

function boundsRingEnd() {
  boundsRingPoint(lambda00$1, phi00$1);
  areaStream.lineEnd();
  if (abs(deltaSum) > epsilon$4) lambda0$1 = -(lambda1 = 180);
  range$1[0] = lambda0$1, range$1[1] = lambda1;
  p0 = null;
}

// Finds the left-right distance between two longitudes.
// This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
// the distance between ±180° to be 360°.
function angle(lambda0, lambda1) {
  return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1;
}

function rangeCompare(a, b) {
  return a[0] - b[0];
}

function rangeContains(range, x) {
  return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
}

var bounds = function(feature) {
  var i, n, a, b, merged, deltaMax, delta;

  phi1 = lambda1 = -(lambda0$1 = phi0 = Infinity);
  ranges = [];
  geoStream(feature, boundsStream);

  // First, sort ranges by their minimum longitudes.
  if (n = ranges.length) {
    ranges.sort(rangeCompare);

    // Then, merge any ranges that overlap.
    for (i = 1, a = ranges[0], merged = [a]; i < n; ++i) {
      b = ranges[i];
      if (rangeContains(a, b[0]) || rangeContains(a, b[1])) {
        if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
        if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
      } else {
        merged.push(a = b);
      }
    }

    // Finally, find the largest gap between the merged ranges.
    // The final bounding box will be the inverse of this gap.
    for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
      b = merged[i];
      if ((delta = angle(a[1], b[0])) > deltaMax) deltaMax = delta, lambda0$1 = b[0], lambda1 = a[1];
    }
  }

  ranges = range$1 = null;

  return lambda0$1 === Infinity || phi0 === Infinity
      ? [[NaN, NaN], [NaN, NaN]]
      : [[lambda0$1, phi0], [lambda1, phi1]];
};

var W0;
var W1;
var X0;
var Y0;
var Z0;
var X1;
var Y1;
var Z1;
var X2;
var Y2;
var Z2;
var lambda00$2;
var phi00$2;
var x0;
var y0;
var z0; // previous point

var centroidStream = {
  sphere: noop$2,
  point: centroidPoint,
  lineStart: centroidLineStart,
  lineEnd: centroidLineEnd,
  polygonStart: function() {
    centroidStream.lineStart = centroidRingStart;
    centroidStream.lineEnd = centroidRingEnd;
  },
  polygonEnd: function() {
    centroidStream.lineStart = centroidLineStart;
    centroidStream.lineEnd = centroidLineEnd;
  }
};

// Arithmetic mean of Cartesian vectors.
function centroidPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos$1(phi);
  centroidPointCartesian(cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi));
}

function centroidPointCartesian(x, y, z) {
  ++W0;
  X0 += (x - X0) / W0;
  Y0 += (y - Y0) / W0;
  Z0 += (z - Z0) / W0;
}

function centroidLineStart() {
  centroidStream.point = centroidLinePointFirst;
}

function centroidLinePointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos$1(phi);
  x0 = cosPhi * cos$1(lambda);
  y0 = cosPhi * sin$1(lambda);
  z0 = sin$1(phi);
  centroidStream.point = centroidLinePoint;
  centroidPointCartesian(x0, y0, z0);
}

function centroidLinePoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos$1(phi),
      x = cosPhi * cos$1(lambda),
      y = cosPhi * sin$1(lambda),
      z = sin$1(phi),
      w = atan2(sqrt$1((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
  W1 += w;
  X1 += w * (x0 + (x0 = x));
  Y1 += w * (y0 + (y0 = y));
  Z1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0, y0, z0);
}

function centroidLineEnd() {
  centroidStream.point = centroidPoint;
}

// See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
// J. Applied Mechanics 42, 239 (1975).
function centroidRingStart() {
  centroidStream.point = centroidRingPointFirst;
}

function centroidRingEnd() {
  centroidRingPoint(lambda00$2, phi00$2);
  centroidStream.point = centroidPoint;
}

function centroidRingPointFirst(lambda, phi) {
  lambda00$2 = lambda, phi00$2 = phi;
  lambda *= radians, phi *= radians;
  centroidStream.point = centroidRingPoint;
  var cosPhi = cos$1(phi);
  x0 = cosPhi * cos$1(lambda);
  y0 = cosPhi * sin$1(lambda);
  z0 = sin$1(phi);
  centroidPointCartesian(x0, y0, z0);
}

function centroidRingPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos$1(phi),
      x = cosPhi * cos$1(lambda),
      y = cosPhi * sin$1(lambda),
      z = sin$1(phi),
      cx = y0 * z - z0 * y,
      cy = z0 * x - x0 * z,
      cz = x0 * y - y0 * x,
      m = sqrt$1(cx * cx + cy * cy + cz * cz),
      u = x0 * x + y0 * y + z0 * z,
      v = m && -acos(u) / m, // area weight
      w = atan2(m, u); // line weight
  X2 += v * cx;
  Y2 += v * cy;
  Z2 += v * cz;
  W1 += w;
  X1 += w * (x0 + (x0 = x));
  Y1 += w * (y0 + (y0 = y));
  Z1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0, y0, z0);
}

var centroid$1 = function(object) {
  W0 = W1 =
  X0 = Y0 = Z0 =
  X1 = Y1 = Z1 =
  X2 = Y2 = Z2 = 0;
  geoStream(object, centroidStream);

  var x = X2,
      y = Y2,
      z = Z2,
      m = x * x + y * y + z * z;

  // If the area-weighted ccentroid is undefined, fall back to length-weighted ccentroid.
  if (m < epsilon2$2) {
    x = X1, y = Y1, z = Z1;
    // If the feature has zero length, fall back to arithmetic mean of point vectors.
    if (W1 < epsilon$4) x = X0, y = Y0, z = Z0;
    m = x * x + y * y + z * z;
    // If the feature still has an undefined ccentroid, then return.
    if (m < epsilon2$2) return [NaN, NaN];
  }

  return [atan2(y, x) * degrees$1, asin$1(z / sqrt$1(m)) * degrees$1];
};

var constant$13 = function(x) {
  return function() {
    return x;
  };
};

var compose = function(a, b) {

  function compose(x, y) {
    return x = a(x, y), b(x[0], x[1]);
  }

  if (a.invert && b.invert) compose.invert = function(x, y) {
    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
  };

  return compose;
};

function rotationIdentity(lambda, phi) {
  return [lambda > pi$4 ? lambda - tau$4 : lambda < -pi$4 ? lambda + tau$4 : lambda, phi];
}

rotationIdentity.invert = rotationIdentity;

function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= tau$4) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
    : rotationLambda(deltaLambda))
    : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
    : rotationIdentity);
}

function forwardRotationLambda(deltaLambda) {
  return function(lambda, phi) {
    return lambda += deltaLambda, [lambda > pi$4 ? lambda - tau$4 : lambda < -pi$4 ? lambda + tau$4 : lambda, phi];
  };
}

function rotationLambda(deltaLambda) {
  var rotation = forwardRotationLambda(deltaLambda);
  rotation.invert = forwardRotationLambda(-deltaLambda);
  return rotation;
}

function rotationPhiGamma(deltaPhi, deltaGamma) {
  var cosDeltaPhi = cos$1(deltaPhi),
      sinDeltaPhi = sin$1(deltaPhi),
      cosDeltaGamma = cos$1(deltaGamma),
      sinDeltaGamma = sin$1(deltaGamma);

  function rotation(lambda, phi) {
    var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi;
    return [
      atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
      asin$1(k * cosDeltaGamma + y * sinDeltaGamma)
    ];
  }

  rotation.invert = function(lambda, phi) {
    var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma;
    return [
      atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
      asin$1(k * cosDeltaPhi - x * sinDeltaPhi)
    ];
  };

  return rotation;
}

var rotation = function(rotate) {
  rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);

  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
    return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
  }

  forward.invert = function(coordinates) {
    coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
    return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
  };

  return forward;
};

// Generates a circle centered at [0°, 0°], with a given radius and precision.
function circleStream(stream, radius, delta, direction, t0, t1) {
  if (!delta) return;
  var cosRadius = cos$1(radius),
      sinRadius = sin$1(radius),
      step = direction * delta;
  if (t0 == null) {
    t0 = radius + direction * tau$4;
    t1 = radius - step / 2;
  } else {
    t0 = circleRadius(cosRadius, t0);
    t1 = circleRadius(cosRadius, t1);
    if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau$4;
  }
  for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
    point = spherical([cosRadius, -sinRadius * cos$1(t), -sinRadius * sin$1(t)]);
    stream.point(point[0], point[1]);
  }
}

// Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
function circleRadius(cosRadius, point) {
  point = cartesian(point), point[0] -= cosRadius;
  cartesianNormalizeInPlace(point);
  var radius = acos(-point[1]);
  return ((-point[2] < 0 ? -radius : radius) + tau$4 - epsilon$4) % tau$4;
}

var circle$1 = function() {
  var center = constant$13([0, 0]),
      radius = constant$13(90),
      precision = constant$13(6),
      ring,
      rotate,
      stream = {point: point};

  function point(x, y) {
    ring.push(x = rotate(x, y));
    x[0] *= degrees$1, x[1] *= degrees$1;
  }

  function circle() {
    var c = center.apply(this, arguments),
        r = radius.apply(this, arguments) * radians,
        p = precision.apply(this, arguments) * radians;
    ring = [];
    rotate = rotateRadians(-c[0] * radians, -c[1] * radians, 0).invert;
    circleStream(stream, r, p, 1);
    c = {type: "Polygon", coordinates: [ring]};
    ring = rotate = null;
    return c;
  }

  circle.center = function(_) {
    return arguments.length ? (center = typeof _ === "function" ? _ : constant$13([+_[0], +_[1]]), circle) : center;
  };

  circle.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$13(+_), circle) : radius;
  };

  circle.precision = function(_) {
    return arguments.length ? (precision = typeof _ === "function" ? _ : constant$13(+_), circle) : precision;
  };

  return circle;
};

var clipBuffer = function() {
  var lines = [],
      line;
  return {
    point: function(x, y) {
      line.push([x, y]);
    },
    lineStart: function() {
      lines.push(line = []);
    },
    lineEnd: noop$2,
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    },
    result: function() {
      var result = lines;
      lines = [];
      line = null;
      return result;
    }
  };
};

var clipLine = function(a, b, x0, y0, x1, y1) {
  var ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
  if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
  return true;
};

var pointEqual = function(a, b) {
  return abs(a[0] - b[0]) < epsilon$4 && abs(a[1] - b[1]) < epsilon$4;
};

function Intersection(point, points, other, entry) {
  this.x = point;
  this.z = points;
  this.o = other; // another intersection
  this.e = entry; // is an entry?
  this.v = false; // visited
  this.n = this.p = null; // next & previous
}

// A generalized polygon clipping algorithm: given a polygon that has been cut
// into its visible line segments, and rejoins the segments by interpolating
// along the clip edge.
var clipPolygon = function(segments, compareIntersection, startInside, interpolate, stream) {
  var subject = [],
      clip = [],
      i,
      n;

  segments.forEach(function(segment) {
    if ((n = segment.length - 1) <= 0) return;
    var n, p0 = segment[0], p1 = segment[n], x;

    // If the first and last points of a segment are coincident, then treat as a
    // closed ring. TODO if all rings are closed, then the winding order of the
    // exterior ring should be checked.
    if (pointEqual(p0, p1)) {
      stream.lineStart();
      for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
      stream.lineEnd();
      return;
    }

    subject.push(x = new Intersection(p0, segment, null, true));
    clip.push(x.o = new Intersection(p0, null, x, false));
    subject.push(x = new Intersection(p1, segment, null, false));
    clip.push(x.o = new Intersection(p1, null, x, true));
  });

  if (!subject.length) return;

  clip.sort(compareIntersection);
  link$1(subject);
  link$1(clip);

  for (i = 0, n = clip.length; i < n; ++i) {
    clip[i].e = startInside = !startInside;
  }

  var start = subject[0],
      points,
      point;

  while (1) {
    // Find first unvisited intersection.
    var current = start,
        isSubject = true;
    while (current.v) if ((current = current.n) === start) return;
    points = current.z;
    stream.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.n.x, 1, stream);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.p.x, -1, stream);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    stream.lineEnd();
  }
};

function link$1(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.n = b = array[i];
    b.p = a;
    a = b;
  }
  a.n = b = array[0];
  b.p = a;
}

var clipMax = 1e9;
var clipMin = -clipMax;

// TODO Use d3-polygon’s polygonContains here for the ring check?
// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

function clipExtent(x0, y0, x1, y1) {

  function visible(x, y) {
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function interpolate(from, to, direction, stream) {
    var a = 0, a1 = 0;
    if (from == null
        || (a = corner(from, direction)) !== (a1 = corner(to, direction))
        || comparePoint(from, to) < 0 ^ direction > 0) {
      do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
      while ((a = (a + direction + 4) % 4) !== a1);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function corner(p, direction) {
    return abs(p[0] - x0) < epsilon$4 ? direction > 0 ? 0 : 3
        : abs(p[0] - x1) < epsilon$4 ? direction > 0 ? 2 : 1
        : abs(p[1] - y0) < epsilon$4 ? direction > 0 ? 1 : 0
        : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
  }

  function compareIntersection(a, b) {
    return comparePoint(a.x, b.x);
  }

  function comparePoint(a, b) {
    var ca = corner(a, 1),
        cb = corner(b, 1);
    return ca !== cb ? ca - cb
        : ca === 0 ? b[1] - a[1]
        : ca === 1 ? a[0] - b[0]
        : ca === 2 ? a[1] - b[1]
        : b[0] - a[0];
  }

  return function(stream) {
    var activeStream = stream,
        bufferStream = clipBuffer(),
        segments,
        polygon,
        ring,
        x__, y__, v__, // first point
        x_, y_, v_, // previous point
        first,
        clean;

    var clipStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: polygonStart,
      polygonEnd: polygonEnd
    };

    function point(x, y) {
      if (visible(x, y)) activeStream.point(x, y);
    }

    function polygonInside() {
      var winding = 0;

      for (var i = 0, n = polygon.length; i < n; ++i) {
        for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
          a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
          if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
          else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
        }
      }

      return winding;
    }

    // Buffer geometry within a polygon and then clip it en masse.
    function polygonStart() {
      activeStream = bufferStream, segments = [], polygon = [], clean = true;
    }

    function polygonEnd() {
      var startInside = polygonInside(),
          cleanInside = clean && startInside,
          visible = (segments = merge(segments)).length;
      if (cleanInside || visible) {
        stream.polygonStart();
        if (cleanInside) {
          stream.lineStart();
          interpolate(null, null, 1, stream);
          stream.lineEnd();
        }
        if (visible) {
          clipPolygon(segments, compareIntersection, startInside, interpolate, stream);
        }
        stream.polygonEnd();
      }
      activeStream = stream, segments = polygon = ring = null;
    }

    function lineStart() {
      clipStream.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first = true;
      v_ = false;
      x_ = y_ = NaN;
    }

    // TODO rather than special-case polygons, simply handle them separately.
    // Ideally, coincident intersection points should be jittered to avoid
    // clipping issues.
    function lineEnd() {
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferStream.rejoin();
        segments.push(bufferStream.result());
      }
      clipStream.point = point;
      if (v_) activeStream.lineEnd();
    }

    function linePoint(x, y) {
      var v = visible(x, y);
      if (polygon) ring.push([x, y]);
      if (first) {
        x__ = x, y__ = y, v__ = v;
        first = false;
        if (v) {
          activeStream.lineStart();
          activeStream.point(x, y);
        }
      } else {
        if (v && v_) activeStream.point(x, y);
        else {
          var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
              b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
          if (clipLine(a, b, x0, y0, x1, y1)) {
            if (!v_) {
              activeStream.lineStart();
              activeStream.point(a[0], a[1]);
            }
            activeStream.point(b[0], b[1]);
            if (!v) activeStream.lineEnd();
            clean = false;
          } else if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
            clean = false;
          }
        }
      }
      x_ = x, y_ = y, v_ = v;
    }

    return clipStream;
  };
}

var extent$1 = function() {
  var x0 = 0,
      y0 = 0,
      x1 = 960,
      y1 = 500,
      cache,
      cacheStream,
      clip;

  return clip = {
    stream: function(stream) {
      return cache && cacheStream === stream ? cache : cache = clipExtent(x0, y0, x1, y1)(cacheStream = stream);
    },
    extent: function(_) {
      return arguments.length ? (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1], cache = cacheStream = null, clip) : [[x0, y0], [x1, y1]];
    }
  };
};

var lengthSum = adder();
var lambda0$2;
var sinPhi0$1;
var cosPhi0$1;

var lengthStream = {
  sphere: noop$2,
  point: noop$2,
  lineStart: lengthLineStart,
  lineEnd: noop$2,
  polygonStart: noop$2,
  polygonEnd: noop$2
};

function lengthLineStart() {
  lengthStream.point = lengthPointFirst;
  lengthStream.lineEnd = lengthLineEnd;
}

function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop$2;
}

function lengthPointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  lambda0$2 = lambda, sinPhi0$1 = sin$1(phi), cosPhi0$1 = cos$1(phi);
  lengthStream.point = lengthPoint;
}

function lengthPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var sinPhi = sin$1(phi),
      cosPhi = cos$1(phi),
      delta = abs(lambda - lambda0$2),
      cosDelta = cos$1(delta),
      sinDelta = sin$1(delta),
      x = cosPhi * sinDelta,
      y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
      z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
  lengthSum.add(atan2(sqrt$1(x * x + y * y), z));
  lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
}

var length$2 = function(object) {
  lengthSum.reset();
  geoStream(object, lengthStream);
  return +lengthSum;
};

var coordinates = [null, null];
var object$1 = {type: "LineString", coordinates: coordinates};

var distance = function(a, b) {
  coordinates[0] = a;
  coordinates[1] = b;
  return length$2(object$1);
};

function graticuleX(y0, y1, dy) {
  var y = range(y0, y1 - epsilon$4, dy).concat(y1);
  return function(x) { return y.map(function(y) { return [x, y]; }); };
}

function graticuleY(x0, x1, dx) {
  var x = range(x0, x1 - epsilon$4, dx).concat(x1);
  return function(y) { return x.map(function(x) { return [x, y]; }); };
}

function graticule() {
  var x1, x0, X1, X0,
      y1, y0, Y1, Y0,
      dx = 10, dy = dx, DX = 90, DY = 360,
      x, y, X, Y,
      precision = 2.5;

  function graticule() {
    return {type: "MultiLineString", coordinates: lines()};
  }

  function lines() {
    return range(ceil(X0 / DX) * DX, X1, DX).map(X)
        .concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
        .concat(range(ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return abs(x % DX) > epsilon$4; }).map(x))
        .concat(range(ceil(y0 / dy) * dy, y1, dy).filter(function(y) { return abs(y % DY) > epsilon$4; }).map(y));
  }

  graticule.lines = function() {
    return lines().map(function(coordinates) { return {type: "LineString", coordinates: coordinates}; });
  };

  graticule.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        X(X0).concat(
        Y(Y1).slice(1),
        X(X1).reverse().slice(1),
        Y(Y0).reverse().slice(1))
      ]
    };
  };

  graticule.extent = function(_) {
    if (!arguments.length) return graticule.extentMinor();
    return graticule.extentMajor(_).extentMinor(_);
  };

  graticule.extentMajor = function(_) {
    if (!arguments.length) return [[X0, Y0], [X1, Y1]];
    X0 = +_[0][0], X1 = +_[1][0];
    Y0 = +_[0][1], Y1 = +_[1][1];
    if (X0 > X1) _ = X0, X0 = X1, X1 = _;
    if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
    return graticule.precision(precision);
  };

  graticule.extentMinor = function(_) {
    if (!arguments.length) return [[x0, y0], [x1, y1]];
    x0 = +_[0][0], x1 = +_[1][0];
    y0 = +_[0][1], y1 = +_[1][1];
    if (x0 > x1) _ = x0, x0 = x1, x1 = _;
    if (y0 > y1) _ = y0, y0 = y1, y1 = _;
    return graticule.precision(precision);
  };

  graticule.step = function(_) {
    if (!arguments.length) return graticule.stepMinor();
    return graticule.stepMajor(_).stepMinor(_);
  };

  graticule.stepMajor = function(_) {
    if (!arguments.length) return [DX, DY];
    DX = +_[0], DY = +_[1];
    return graticule;
  };

  graticule.stepMinor = function(_) {
    if (!arguments.length) return [dx, dy];
    dx = +_[0], dy = +_[1];
    return graticule;
  };

  graticule.precision = function(_) {
    if (!arguments.length) return precision;
    precision = +_;
    x = graticuleX(y0, y1, 90);
    y = graticuleY(x0, x1, precision);
    X = graticuleX(Y0, Y1, 90);
    Y = graticuleY(X0, X1, precision);
    return graticule;
  };

  return graticule
      .extentMajor([[-180, -90 + epsilon$4], [180, 90 - epsilon$4]])
      .extentMinor([[-180, -80 - epsilon$4], [180, 80 + epsilon$4]]);
}

function graticule10() {
  return graticule()();
}

var interpolate$2 = function(a, b) {
  var x0 = a[0] * radians,
      y0 = a[1] * radians,
      x1 = b[0] * radians,
      y1 = b[1] * radians,
      cy0 = cos$1(y0),
      sy0 = sin$1(y0),
      cy1 = cos$1(y1),
      sy1 = sin$1(y1),
      kx0 = cy0 * cos$1(x0),
      ky0 = cy0 * sin$1(x0),
      kx1 = cy1 * cos$1(x1),
      ky1 = cy1 * sin$1(x1),
      d = 2 * asin$1(sqrt$1(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
      k = sin$1(d);

  var interpolate = d ? function(t) {
    var B = sin$1(t *= d) / k,
        A = sin$1(d - t) / k,
        x = A * kx0 + B * kx1,
        y = A * ky0 + B * ky1,
        z = A * sy0 + B * sy1;
    return [
      atan2(y, x) * degrees$1,
      atan2(z, sqrt$1(x * x + y * y)) * degrees$1
    ];
  } : function() {
    return [x0 * degrees$1, y0 * degrees$1];
  };

  interpolate.distance = d;

  return interpolate;
};

var identity$7 = function(x) {
  return x;
};

var areaSum$1 = adder();
var areaRingSum$1 = adder();
var x00;
var y00;
var x0$1;
var y0$1;

var areaStream$1 = {
  point: noop$2,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: function() {
    areaStream$1.lineStart = areaRingStart$1;
    areaStream$1.lineEnd = areaRingEnd$1;
  },
  polygonEnd: function() {
    areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$2;
    areaSum$1.add(abs(areaRingSum$1));
    areaRingSum$1.reset();
  },
  result: function() {
    var area = areaSum$1 / 2;
    areaSum$1.reset();
    return area;
  }
};

function areaRingStart$1() {
  areaStream$1.point = areaPointFirst$1;
}

function areaPointFirst$1(x, y) {
  areaStream$1.point = areaPoint$1;
  x00 = x0$1 = x, y00 = y0$1 = y;
}

function areaPoint$1(x, y) {
  areaRingSum$1.add(y0$1 * x - x0$1 * y);
  x0$1 = x, y0$1 = y;
}

function areaRingEnd$1() {
  areaPoint$1(x00, y00);
}

var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;

var boundsStream$1 = {
  point: boundsPoint$1,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: noop$2,
  polygonEnd: noop$2,
  result: function() {
    var bounds = [[x0$2, y0$2], [x1, y1]];
    x1 = y1 = -(y0$2 = x0$2 = Infinity);
    return bounds;
  }
};

function boundsPoint$1(x, y) {
  if (x < x0$2) x0$2 = x;
  if (x > x1) x1 = x;
  if (y < y0$2) y0$2 = y;
  if (y > y1) y1 = y;
}

// TODO Enforce positive area for exterior, negative area for interior?

var X0$1 = 0;
var Y0$1 = 0;
var Z0$1 = 0;
var X1$1 = 0;
var Y1$1 = 0;
var Z1$1 = 0;
var X2$1 = 0;
var Y2$1 = 0;
var Z2$1 = 0;
var x00$1;
var y00$1;
var x0$3;
var y0$3;

var centroidStream$1 = {
  point: centroidPoint$1,
  lineStart: centroidLineStart$1,
  lineEnd: centroidLineEnd$1,
  polygonStart: function() {
    centroidStream$1.lineStart = centroidRingStart$1;
    centroidStream$1.lineEnd = centroidRingEnd$1;
  },
  polygonEnd: function() {
    centroidStream$1.point = centroidPoint$1;
    centroidStream$1.lineStart = centroidLineStart$1;
    centroidStream$1.lineEnd = centroidLineEnd$1;
  },
  result: function() {
    var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
        : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
        : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
        : [NaN, NaN];
    X0$1 = Y0$1 = Z0$1 =
    X1$1 = Y1$1 = Z1$1 =
    X2$1 = Y2$1 = Z2$1 = 0;
    return centroid;
  }
};

function centroidPoint$1(x, y) {
  X0$1 += x;
  Y0$1 += y;
  ++Z0$1;
}

function centroidLineStart$1() {
  centroidStream$1.point = centroidPointFirstLine;
}

function centroidPointFirstLine(x, y) {
  centroidStream$1.point = centroidPointLine;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidPointLine(x, y) {
  var dx = x - x0$3, dy = y - y0$3, z = sqrt$1(dx * dx + dy * dy);
  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidLineEnd$1() {
  centroidStream$1.point = centroidPoint$1;
}

function centroidRingStart$1() {
  centroidStream$1.point = centroidPointFirstRing;
}

function centroidRingEnd$1() {
  centroidPointRing(x00$1, y00$1);
}

function centroidPointFirstRing(x, y) {
  centroidStream$1.point = centroidPointRing;
  centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
}

function centroidPointRing(x, y) {
  var dx = x - x0$3,
      dy = y - y0$3,
      z = sqrt$1(dx * dx + dy * dy);

  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;

  z = y0$3 * x - x0$3 * y;
  X2$1 += z * (x0$3 + x);
  Y2$1 += z * (y0$3 + y);
  Z2$1 += z * 3;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function PathContext(context) {
  this._context = context;
}

PathContext.prototype = {
  _radius: 4.5,
  pointRadius: function(_) {
    return this._radius = _, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._context.closePath();
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(x, y);
        this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(x, y);
        break;
      }
      default: {
        this._context.moveTo(x + this._radius, y);
        this._context.arc(x, y, this._radius, 0, tau$4);
        break;
      }
    }
  },
  result: noop$2
};

function PathString() {
  this._string = [];
}

PathString.prototype = {
  _circle: circle$2(4.5),
  pointRadius: function(_) {
    return this._circle = circle$2(_), this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._string.push("Z");
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._string.push("M", x, ",", y);
        this._point = 1;
        break;
      }
      case 1: {
        this._string.push("L", x, ",", y);
        break;
      }
      default: {
        this._string.push("M", x, ",", y, this._circle);
        break;
      }
    }
  },
  result: function() {
    if (this._string.length) {
      var result = this._string.join("");
      this._string = [];
      return result;
    }
  }
};

function circle$2(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}

var index$3 = function(projection, context) {
  var pointRadius = 4.5,
      projectionStream,
      contextStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      geoStream(object, projectionStream(contextStream));
    }
    return contextStream.result();
  }

  path.area = function(object) {
    geoStream(object, projectionStream(areaStream$1));
    return areaStream$1.result();
  };

  path.bounds = function(object) {
    geoStream(object, projectionStream(boundsStream$1));
    return boundsStream$1.result();
  };

  path.centroid = function(object) {
    geoStream(object, projectionStream(centroidStream$1));
    return centroidStream$1.result();
  };

  path.projection = function(_) {
    return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$7) : (projection = _).stream, path) : projection;
  };

  path.context = function(_) {
    if (!arguments.length) return context;
    contextStream = _ == null ? (context = null, new PathString) : new PathContext(context = _);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return path;
  };

  path.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  return path.projection(projection).context(context);
};

var sum$2 = adder();

var polygonContains = function(polygon, point) {
  var lambda = point[0],
      phi = point[1],
      normal = [sin$1(lambda), -cos$1(lambda), 0],
      angle = 0,
      winding = 0;

  sum$2.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue;
    var ring,
        m,
        point0 = ring[m - 1],
        lambda0 = point0[0],
        phi0 = point0[1] / 2 + quarterPi,
        sinPhi0 = sin$1(phi0),
        cosPhi0 = cos$1(phi0);

    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
          lambda1 = point1[0],
          phi1 = point1[1] / 2 + quarterPi,
          sinPhi1 = sin$1(phi1),
          cosPhi1 = cos$1(phi1),
          delta = lambda1 - lambda0,
          sign$$1 = delta >= 0 ? 1 : -1,
          absDelta = sign$$1 * delta,
          antimeridian = absDelta > pi$4,
          k = sinPhi0 * sinPhi1;

      sum$2.add(atan2(k * sign$$1 * sin$1(absDelta), cosPhi0 * cosPhi1 + k * cos$1(absDelta)));
      angle += antimeridian ? delta + sign$$1 * tau$4 : delta;

      // Are the longitudes either side of the point’s meridian (lambda),
      // and are the latitudes smaller than the parallel (phi)?
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection = cartesianCross(normal, arc);
        cartesianNormalizeInPlace(intersection);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin$1(intersection[2]);
        if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon winds around it in a clockwise direction.
  // * the polygon does not (cumulatively) wind around it, but has a negative
  //   (counter-clockwise) area.
  //
  // Second, count the (signed) number of times a segment crosses a lambda
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (angle < -epsilon$4 || angle < epsilon$4 && sum$2 < -epsilon$4) ^ (winding & 1);
};

var clip = function(pointVisible, clipLine, interpolate, start) {
  return function(rotate, sink) {
    var line = clipLine(sink),
        rotatedStart = rotate.invert(start[0], start[1]),
        ringBuffer = clipBuffer(),
        ringSink = clipLine(ringBuffer),
        polygonStarted = false,
        polygon,
        segments,
        ring;

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip.point = point;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;
        segments = merge(segments);
        var startInside = polygonContains(polygon, rotatedStart);
        if (segments.length) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          clipPolygon(segments, compareIntersection, startInside, interpolate, sink);
        } else if (startInside) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
        }
        if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        sink.polygonStart();
        sink.lineStart();
        interpolate(null, null, 1, sink);
        sink.lineEnd();
        sink.polygonEnd();
      }
    };

    function point(lambda, phi) {
      var point = rotate(lambda, phi);
      if (pointVisible(lambda = point[0], phi = point[1])) sink.point(lambda, phi);
    }

    function pointLine(lambda, phi) {
      var point = rotate(lambda, phi);
      line.point(point[0], point[1]);
    }

    function lineStart() {
      clip.point = pointLine;
      line.lineStart();
    }

    function lineEnd() {
      clip.point = point;
      line.lineEnd();
    }

    function pointRing(lambda, phi) {
      ring.push([lambda, phi]);
      var point = rotate(lambda, phi);
      ringSink.point(point[0], point[1]);
    }

    function ringStart() {
      ringSink.lineStart();
      ring = [];
    }

    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringSink.lineEnd();

      var clean = ringSink.clean(),
          ringSegments = ringBuffer.result(),
          i, n = ringSegments.length, m,
          segment,
          point;

      ring.pop();
      polygon.push(ring);
      ring = null;

      if (!n) return;

      // No intersections.
      if (clean & 1) {
        segment = ringSegments[0];
        if ((m = segment.length - 1) > 0) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
          sink.lineEnd();
        }
        return;
      }

      // Rejoin connected segments.
      // TODO reuse ringBuffer.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

      segments.push(ringSegments.filter(validSegment));
    }

    return clip;
  };
};

function validSegment(segment) {
  return segment.length > 1;
}

// Intersections are sorted along the clip edge. For both antimeridian cutting
// and circle clipping, the same comparison is used.
function compareIntersection(a, b) {
  return ((a = a.x)[0] < 0 ? a[1] - halfPi$3 - epsilon$4 : halfPi$3 - a[1])
       - ((b = b.x)[0] < 0 ? b[1] - halfPi$3 - epsilon$4 : halfPi$3 - b[1]);
}

var clipAntimeridian = clip(
  function() { return true; },
  clipAntimeridianLine,
  clipAntimeridianInterpolate,
  [-pi$4, -halfPi$3]
);

// Takes a line and cuts into visible segments. Return values: 0 - there were
// intersections or the line was empty; 1 - no intersections; 2 - there were
// intersections, and the first and last segments should be rejoined.
function clipAntimeridianLine(stream) {
  var lambda0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      stream.lineStart();
      clean = 1;
    },
    point: function(lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi$4 : -pi$4,
          delta = abs(lambda1 - lambda0);
      if (abs(delta - pi$4) < epsilon$4) { // line crosses a pole
        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi$3 : -halfPi$3);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        stream.point(lambda1, phi0);
        clean = 0;
      } else if (sign0 !== sign1 && delta >= pi$4) { // line crosses antimeridian
        if (abs(lambda0 - sign0) < epsilon$4) lambda0 -= sign0 * epsilon$4; // handle degeneracies
        if (abs(lambda1 - sign1) < epsilon$4) lambda1 -= sign1 * epsilon$4;
        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        clean = 0;
      }
      stream.point(lambda0 = lambda1, phi0 = phi1);
      sign0 = sign1;
    },
    lineEnd: function() {
      stream.lineEnd();
      lambda0 = phi0 = NaN;
    },
    clean: function() {
      return 2 - clean; // if intersections, rejoin first and last segments
    }
  };
}

function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
  var cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin$1(lambda0 - lambda1);
  return abs(sinLambda0Lambda1) > epsilon$4
      ? atan((sin$1(phi0) * (cosPhi1 = cos$1(phi1)) * sin$1(lambda1)
          - sin$1(phi1) * (cosPhi0 = cos$1(phi0)) * sin$1(lambda0))
          / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
      : (phi0 + phi1) / 2;
}

function clipAntimeridianInterpolate(from, to, direction, stream) {
  var phi;
  if (from == null) {
    phi = direction * halfPi$3;
    stream.point(-pi$4, phi);
    stream.point(0, phi);
    stream.point(pi$4, phi);
    stream.point(pi$4, 0);
    stream.point(pi$4, -phi);
    stream.point(0, -phi);
    stream.point(-pi$4, -phi);
    stream.point(-pi$4, 0);
    stream.point(-pi$4, phi);
  } else if (abs(from[0] - to[0]) > epsilon$4) {
    var lambda = from[0] < to[0] ? pi$4 : -pi$4;
    phi = direction * lambda / 2;
    stream.point(-lambda, phi);
    stream.point(0, phi);
    stream.point(lambda, phi);
  } else {
    stream.point(to[0], to[1]);
  }
}

var clipCircle = function(radius, delta) {
  var cr = cos$1(radius),
      smallRadius = cr > 0,
      notHemisphere = abs(cr) > epsilon$4; // TODO optimise for this common case

  function interpolate(from, to, direction, stream) {
    circleStream(stream, radius, delta, direction, from, to);
  }

  function visible(lambda, phi) {
    return cos$1(lambda) * cos$1(phi) > cr;
  }

  // Takes a line and cuts into visible segments. Return values used for polygon
  // clipping: 0 - there were intersections or the line was empty; 1 - no
  // intersections 2 - there were intersections, and the first and last segments
  // should be rejoined.
  function clipLine(stream) {
    var point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean; // no intersections
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(lambda, phi) {
        var point1 = [lambda, phi],
            point2,
            v = visible(lambda, phi),
            c = smallRadius
              ? v ? 0 : code(lambda, phi)
              : v ? code(lambda + (lambda < 0 ? pi$4 : -pi$4), phi) : 0;
        if (!point0 && (v00 = v0 = v)) stream.lineStart();
        // Handle degeneracies.
        // TODO ignore if not clipping polygons.
        if (v !== v0) {
          point2 = intersect(point0, point1);
          if (pointEqual(point0, point2) || pointEqual(point1, point2)) {
            point1[0] += epsilon$4;
            point1[1] += epsilon$4;
            v = visible(point1[0], point1[1]);
          }
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            // outside going in
            stream.lineStart();
            point2 = intersect(point1, point0);
            stream.point(point2[0], point2[1]);
          } else {
            // inside going out
            point2 = intersect(point0, point1);
            stream.point(point2[0], point2[1]);
            stream.lineEnd();
          }
          point0 = point2;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
          if (!(c & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
            } else {
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
            }
          }
        }
        if (v && (!point0 || !pointEqual(point0, point1))) {
          stream.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c;
      },
      lineEnd: function() {
        if (v0) stream.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return clean | ((v00 && v0) << 1);
      }
    };
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = cartesian(a),
        pb = cartesian(b);

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

    // Two polar points.
    if (!determinant) return !two && a;

    var c1 =  cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2);
    cartesianAddInPlace(A, B);

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
        w = cartesianDot(A, u),
        uu = cartesianDot(u, u),
        t2 = w * w - uu * (cartesianDot(A, A) - 1);

    if (t2 < 0) return;

    var t = sqrt$1(t2),
        q = cartesianScale(u, (-w - t) / uu);
    cartesianAddInPlace(q, A);
    q = spherical(q);

    if (!two) return q;

    // Two intersection points.
    var lambda0 = a[0],
        lambda1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z;

    if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

    var delta = lambda1 - lambda0,
        polar = abs(delta - pi$4) < epsilon$4,
        meridian = polar || delta < epsilon$4;

    if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

    // Check that the first point is between a and b.
    if (meridian
        ? polar
          ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon$4 ? phi0 : phi1)
          : phi0 <= q[1] && q[1] <= phi1
        : delta > pi$4 ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
      var q1 = cartesianScale(u, (-w + t) / uu);
      cartesianAddInPlace(q1, A);
      return [q, spherical(q1)];
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(lambda, phi) {
    var r = smallRadius ? radius : pi$4 - radius,
        code = 0;
    if (lambda < -r) code |= 1; // left
    else if (lambda > r) code |= 2; // right
    if (phi < -r) code |= 4; // below
    else if (phi > r) code |= 8; // above
    return code;
  }

  return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi$4, radius - pi$4]);
};

var transform$1 = function(methods) {
  return {
    stream: transformer(methods)
  };
};

function transformer(methods) {
  return function(stream) {
    var s = new TransformStream;
    for (var key in methods) s[key] = methods[key];
    s.stream = stream;
    return s;
  };
}

function TransformStream() {}

TransformStream.prototype = {
  constructor: TransformStream,
  point: function(x, y) { this.stream.point(x, y); },
  sphere: function() { this.stream.sphere(); },
  lineStart: function() { this.stream.lineStart(); },
  lineEnd: function() { this.stream.lineEnd(); },
  polygonStart: function() { this.stream.polygonStart(); },
  polygonEnd: function() { this.stream.polygonEnd(); }
};

function fitExtent(projection, extent, object) {
  var w = extent[1][0] - extent[0][0],
      h = extent[1][1] - extent[0][1],
      clip = projection.clipExtent && projection.clipExtent();

  projection
      .scale(150)
      .translate([0, 0]);

  if (clip != null) projection.clipExtent(null);

  geoStream(object, projection.stream(boundsStream$1));

  var b = boundsStream$1.result(),
      k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
      x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
      y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;

  if (clip != null) projection.clipExtent(clip);

  return projection
      .scale(k * 150)
      .translate([x, y]);
}

function fitSize(projection, size, object) {
  return fitExtent(projection, [[0, 0], size], object);
}

var maxDepth = 16;
var cosMinDistance = cos$1(30 * radians); // cos(minimum angular distance)

var resample = function(project, delta2) {
  return +delta2 ? resample$1(project, delta2) : resampleNone(project);
};

function resampleNone(project) {
  return transformer({
    point: function(x, y) {
      x = project(x, y);
      this.stream.point(x[0], x[1]);
    }
  });
}

function resample$1(project, delta2) {

  function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
    if (d2 > 4 * delta2 && depth--) {
      var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = sqrt$1(a * a + b * b + c * c),
          phi2 = asin$1(c /= m),
          lambda2 = abs(abs(c) - 1) < epsilon$4 || abs(lambda0 - lambda1) < epsilon$4 ? (lambda0 + lambda1) / 2 : atan2(b, a),
          p = project(lambda2, phi2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > delta2 // perpendicular projected distance
          || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda00, x00, y00, a00, b00, c00, // first point
        lambda0, x0, y0, a0, b0, c0; // previous point

    var resampleStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      x0 = NaN;
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lambda, phi) {
      var c = cartesian([lambda, phi]), p = project(lambda, phi);
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
    }

    function lineEnd() {
      resampleStream.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resampleStream.point = ringPoint;
      resampleStream.lineEnd = ringEnd;
    }

    function ringPoint(lambda, phi) {
      linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}

var transformRadians = transformer({
  point: function(x, y) {
    this.stream.point(x * radians, y * radians);
  }
});

function projection(project) {
  return projectionMutator(function() { return project; })();
}

function projectionMutator(projectAt) {
  var project,
      k = 150, // scale
      x = 480, y = 250, // translate
      dx, dy, lambda = 0, phi = 0, // center
      deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, projectRotate, // rotate
      theta = null, preclip = clipAntimeridian, // clip angle
      x0 = null, y0, x1, y1, postclip = identity$7, // clip extent
      delta2 = 0.5, projectResample = resample(projectTransform, delta2), // precision
      cache,
      cacheStream;

  function projection(point) {
    point = projectRotate(point[0] * radians, point[1] * radians);
    return [point[0] * k + dx, dy - point[1] * k];
  }

  function invert(point) {
    point = projectRotate.invert((point[0] - dx) / k, (dy - point[1]) / k);
    return point && [point[0] * degrees$1, point[1] * degrees$1];
  }

  function projectTransform(x, y) {
    return x = project(x, y), [x[0] * k + dx, dy - x[1] * k];
  }

  projection.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = transformRadians(preclip(rotate, projectResample(postclip(cacheStream = stream))));
  };

  projection.clipAngle = function(_) {
    return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians, 6 * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
  };

  projection.clipExtent = function(_) {
    return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$7) : clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
  };

  projection.scale = function(_) {
    return arguments.length ? (k = +_, recenter()) : k;
  };

  projection.translate = function(_) {
    return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
  };

  projection.center = function(_) {
    return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees$1, phi * degrees$1];
  };

  projection.rotate = function(_) {
    return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
  };

  projection.precision = function(_) {
    return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$1(delta2);
  };

  projection.fitExtent = function(extent, object) {
    return fitExtent(projection, extent, object);
  };

  projection.fitSize = function(size, object) {
    return fitSize(projection, size, object);
  };

  function recenter() {
    projectRotate = compose(rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma), project);
    var center = project(lambda, phi);
    dx = x - center[0] * k;
    dy = y + center[1] * k;
    return reset();
  }

  function reset() {
    cache = cacheStream = null;
    return projection;
  }

  return function() {
    project = projectAt.apply(this, arguments);
    projection.invert = project.invert && invert;
    return recenter();
  };
}

function conicProjection(projectAt) {
  var phi0 = 0,
      phi1 = pi$4 / 3,
      m = projectionMutator(projectAt),
      p = m(phi0, phi1);

  p.parallels = function(_) {
    return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees$1, phi1 * degrees$1];
  };

  return p;
}

function cylindricalEqualAreaRaw(phi0) {
  var cosPhi0 = cos$1(phi0);

  function forward(lambda, phi) {
    return [lambda * cosPhi0, sin$1(phi) / cosPhi0];
  }

  forward.invert = function(x, y) {
    return [x / cosPhi0, asin$1(y * cosPhi0)];
  };

  return forward;
}

function conicEqualAreaRaw(y0, y1) {
  var sy0 = sin$1(y0), n = (sy0 + sin$1(y1)) / 2;

  // Are the parallels symmetrical around the Equator?
  if (abs(n) < epsilon$4) return cylindricalEqualAreaRaw(y0);

  var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt$1(c) / n;

  function project(x, y) {
    var r = sqrt$1(c - 2 * n * sin$1(y)) / n;
    return [r * sin$1(x *= n), r0 - r * cos$1(x)];
  }

  project.invert = function(x, y) {
    var r0y = r0 - y;
    return [atan2(x, abs(r0y)) / n * sign$1(r0y), asin$1((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
  };

  return project;
}

var conicEqualArea = function() {
  return conicProjection(conicEqualAreaRaw)
      .scale(155.424)
      .center([0, 33.6442]);
};

var albers = function() {
  return conicEqualArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7]);
};

// The projections must have mutually exclusive clip regions on the sphere,
// as this will avoid emitting interleaving lines and polygons.
function multiplex(streams) {
  var n = streams.length;
  return {
    point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
    sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
    lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
    lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
    polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
    polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
  };
}

// A composite projection for the United States, configured by default for
// 960×500. The projection also works quite well at 960×600 if you change the
// scale to 1285 and adjust the translate accordingly. The set of standard
// parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
var albersUsa = function() {
  var cache,
      cacheStream,
      lower48 = albers(), lower48Point,
      alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
      hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
      point, pointStream = {point: function(x, y) { point = [x, y]; }};

  function albersUsa(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    return point = null,
        (lower48Point.point(x, y), point)
        || (alaskaPoint.point(x, y), point)
        || (hawaiiPoint.point(x, y), point);
  }

  albersUsa.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
        : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
        : lower48).invert(coordinates);
  };

  albersUsa.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
  };

  albersUsa.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_), alaska.precision(_), hawaii.precision(_);
    return reset();
  };

  albersUsa.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];

    lower48Point = lower48
        .translate(_)
        .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
        .stream(pointStream);

    alaskaPoint = alaska
        .translate([x - 0.307 * k, y + 0.201 * k])
        .clipExtent([[x - 0.425 * k + epsilon$4, y + 0.120 * k + epsilon$4], [x - 0.214 * k - epsilon$4, y + 0.234 * k - epsilon$4]])
        .stream(pointStream);

    hawaiiPoint = hawaii
        .translate([x - 0.205 * k, y + 0.212 * k])
        .clipExtent([[x - 0.214 * k + epsilon$4, y + 0.166 * k + epsilon$4], [x - 0.115 * k - epsilon$4, y + 0.234 * k - epsilon$4]])
        .stream(pointStream);

    return reset();
  };

  albersUsa.fitExtent = function(extent, object) {
    return fitExtent(albersUsa, extent, object);
  };

  albersUsa.fitSize = function(size, object) {
    return fitSize(albersUsa, size, object);
  };

  function reset() {
    cache = cacheStream = null;
    return albersUsa;
  }

  return albersUsa.scale(1070);
};

function azimuthalRaw(scale) {
  return function(x, y) {
    var cx = cos$1(x),
        cy = cos$1(y),
        k = scale(cx * cy);
    return [
      k * cy * sin$1(x),
      k * sin$1(y)
    ];
  }
}

function azimuthalInvert(angle) {
  return function(x, y) {
    var z = sqrt$1(x * x + y * y),
        c = angle(z),
        sc = sin$1(c),
        cc = cos$1(c);
    return [
      atan2(x * sc, z * cc),
      asin$1(z && y * sc / z)
    ];
  }
}

var azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
  return sqrt$1(2 / (1 + cxcy));
});

azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
  return 2 * asin$1(z / 2);
});

var azimuthalEqualArea = function() {
  return projection(azimuthalEqualAreaRaw)
      .scale(124.75)
      .clipAngle(180 - 1e-3);
};

var azimuthalEquidistantRaw = azimuthalRaw(function(c) {
  return (c = acos(c)) && c / sin$1(c);
});

azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
  return z;
});

var azimuthalEquidistant = function() {
  return projection(azimuthalEquidistantRaw)
      .scale(79.4188)
      .clipAngle(180 - 1e-3);
};

function mercatorRaw(lambda, phi) {
  return [lambda, log$1(tan((halfPi$3 + phi) / 2))];
}

mercatorRaw.invert = function(x, y) {
  return [x, 2 * atan(exp(y)) - halfPi$3];
};

var mercator = function() {
  return mercatorProjection(mercatorRaw)
      .scale(961 / tau$4);
};

function mercatorProjection(project) {
  var m = projection(project),
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      clipAuto;

  m.scale = function(_) {
    return arguments.length ? (scale(_), clipAuto && m.clipExtent(null), m) : scale();
  };

  m.translate = function(_) {
    return arguments.length ? (translate(_), clipAuto && m.clipExtent(null), m) : translate();
  };

  m.clipExtent = function(_) {
    if (!arguments.length) return clipAuto ? null : clipExtent();
    if (clipAuto = _ == null) {
      var k = pi$4 * scale(),
          t = translate();
      _ = [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]];
    }
    clipExtent(_);
    return m;
  };

  return m.clipExtent(null);
}

function tany(y) {
  return tan((halfPi$3 + y) / 2);
}

function conicConformalRaw(y0, y1) {
  var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : log$1(cy0 / cos$1(y1)) / log$1(tany(y1) / tany(y0)),
      f = cy0 * pow$1(tany(y0), n) / n;

  if (!n) return mercatorRaw;

  function project(x, y) {
    if (f > 0) { if (y < -halfPi$3 + epsilon$4) y = -halfPi$3 + epsilon$4; }
    else { if (y > halfPi$3 - epsilon$4) y = halfPi$3 - epsilon$4; }
    var r = f / pow$1(tany(y), n);
    return [r * sin$1(n * x), f - r * cos$1(n * x)];
  }

  project.invert = function(x, y) {
    var fy = f - y, r = sign$1(n) * sqrt$1(x * x + fy * fy);
    return [atan2(x, abs(fy)) / n * sign$1(fy), 2 * atan(pow$1(f / r, 1 / n)) - halfPi$3];
  };

  return project;
}

var conicConformal = function() {
  return conicProjection(conicConformalRaw)
      .scale(109.5)
      .parallels([30, 30]);
};

function equirectangularRaw(lambda, phi) {
  return [lambda, phi];
}

equirectangularRaw.invert = equirectangularRaw;

var equirectangular = function() {
  return projection(equirectangularRaw)
      .scale(152.63);
};

function conicEquidistantRaw(y0, y1) {
  var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : (cy0 - cos$1(y1)) / (y1 - y0),
      g = cy0 / n + y0;

  if (abs(n) < epsilon$4) return equirectangularRaw;

  function project(x, y) {
    var gy = g - y, nx = n * x;
    return [gy * sin$1(nx), g - gy * cos$1(nx)];
  }

  project.invert = function(x, y) {
    var gy = g - y;
    return [atan2(x, abs(gy)) / n * sign$1(gy), g - sign$1(n) * sqrt$1(x * x + gy * gy)];
  };

  return project;
}

var conicEquidistant = function() {
  return conicProjection(conicEquidistantRaw)
      .scale(131.154)
      .center([0, 13.9389]);
};

function gnomonicRaw(x, y) {
  var cy = cos$1(y), k = cos$1(x) * cy;
  return [cy * sin$1(x) / k, sin$1(y) / k];
}

gnomonicRaw.invert = azimuthalInvert(atan);

var gnomonic = function() {
  return projection(gnomonicRaw)
      .scale(144.049)
      .clipAngle(60);
};

function scaleTranslate(kx, ky, tx, ty) {
  return kx === 1 && ky === 1 && tx === 0 && ty === 0 ? identity$7 : transformer({
    point: function(x, y) {
      this.stream.point(x * kx + tx, y * ky + ty);
    }
  });
}

var identity$8 = function() {
  var k = 1, tx = 0, ty = 0, sx = 1, sy = 1, transform = identity$7, // scale, translate and reflect
      x0 = null, y0, x1, y1, clip = identity$7, // clip extent
      cache,
      cacheStream,
      projection;

  function reset() {
    cache = cacheStream = null;
    return projection;
  }

  return projection = {
    stream: function(stream) {
      return cache && cacheStream === stream ? cache : cache = transform(clip(cacheStream = stream));
    },
    clipExtent: function(_) {
      return arguments.length ? (clip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$7) : clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    },
    scale: function(_) {
      return arguments.length ? (transform = scaleTranslate((k = +_) * sx, k * sy, tx, ty), reset()) : k;
    },
    translate: function(_) {
      return arguments.length ? (transform = scaleTranslate(k * sx, k * sy, tx = +_[0], ty = +_[1]), reset()) : [tx, ty];
    },
    reflectX: function(_) {
      return arguments.length ? (transform = scaleTranslate(k * (sx = _ ? -1 : 1), k * sy, tx, ty), reset()) : sx < 0;
    },
    reflectY: function(_) {
      return arguments.length ? (transform = scaleTranslate(k * sx, k * (sy = _ ? -1 : 1), tx, ty), reset()) : sy < 0;
    },
    fitExtent: function(extent, object) {
      return fitExtent(projection, extent, object);
    },
    fitSize: function(size, object) {
      return fitSize(projection, size, object);
    }
  };
};

function orthographicRaw(x, y) {
  return [cos$1(y) * sin$1(x), sin$1(y)];
}

orthographicRaw.invert = azimuthalInvert(asin$1);

var orthographic = function() {
  return projection(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon$4);
};

function stereographicRaw(x, y) {
  var cy = cos$1(y), k = 1 + cos$1(x) * cy;
  return [cy * sin$1(x) / k, sin$1(y) / k];
}

stereographicRaw.invert = azimuthalInvert(function(z) {
  return 2 * atan(z);
});

var stereographic = function() {
  return projection(stereographicRaw)
      .scale(250)
      .clipAngle(142);
};

function transverseMercatorRaw(lambda, phi) {
  return [log$1(tan((halfPi$3 + phi) / 2)), -lambda];
}

transverseMercatorRaw.invert = function(x, y) {
  return [-y, 2 * atan(exp(x)) - halfPi$3];
};

var transverseMercator = function() {
  var m = mercatorProjection(transverseMercatorRaw),
      center = m.center,
      rotate = m.rotate;

  m.center = function(_) {
    return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
  };

  m.rotate = function(_) {
    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
  };

  return rotate([0, 0, 90])
      .scale(159.155);
};

exports.version = version;
exports.bisect = bisectRight;
exports.bisectRight = bisectRight;
exports.bisectLeft = bisectLeft;
exports.ascending = ascending;
exports.bisector = bisector;
exports.descending = descending;
exports.deviation = deviation;
exports.extent = extent;
exports.histogram = histogram;
exports.thresholdFreedmanDiaconis = freedmanDiaconis;
exports.thresholdScott = scott;
exports.thresholdSturges = sturges;
exports.max = max;
exports.mean = mean;
exports.median = median;
exports.merge = merge;
exports.min = min;
exports.pairs = pairs;
exports.permute = permute;
exports.quantile = threshold;
exports.range = range;
exports.scan = scan;
exports.shuffle = shuffle;
exports.sum = sum;
exports.ticks = ticks;
exports.tickStep = tickStep;
exports.transpose = transpose;
exports.variance = variance;
exports.zip = zip;
exports.entries = entries;
exports.keys = keys;
exports.values = values;
exports.map = map$1;
exports.set = set;
exports.nest = nest;
exports.randomUniform = uniform;
exports.randomNormal = normal;
exports.randomLogNormal = logNormal;
exports.randomBates = bates;
exports.randomIrwinHall = irwinHall;
exports.randomExponential = exponential;
exports.easeLinear = linear;
exports.easeQuad = quadInOut;
exports.easeQuadIn = quadIn;
exports.easeQuadOut = quadOut;
exports.easeQuadInOut = quadInOut;
exports.easeCubic = cubicInOut;
exports.easeCubicIn = cubicIn;
exports.easeCubicOut = cubicOut;
exports.easeCubicInOut = cubicInOut;
exports.easePoly = polyInOut;
exports.easePolyIn = polyIn;
exports.easePolyOut = polyOut;
exports.easePolyInOut = polyInOut;
exports.easeSin = sinInOut;
exports.easeSinIn = sinIn;
exports.easeSinOut = sinOut;
exports.easeSinInOut = sinInOut;
exports.easeExp = expInOut;
exports.easeExpIn = expIn;
exports.easeExpOut = expOut;
exports.easeExpInOut = expInOut;
exports.easeCircle = circleInOut;
exports.easeCircleIn = circleIn;
exports.easeCircleOut = circleOut;
exports.easeCircleInOut = circleInOut;
exports.easeBounce = bounceOut;
exports.easeBounceIn = bounceIn;
exports.easeBounceOut = bounceOut;
exports.easeBounceInOut = bounceInOut;
exports.easeBack = backInOut;
exports.easeBackIn = backIn;
exports.easeBackOut = backOut;
exports.easeBackInOut = backInOut;
exports.easeElastic = elasticOut;
exports.easeElasticIn = elasticIn;
exports.easeElasticOut = elasticOut;
exports.easeElasticInOut = elasticInOut;
exports.polygonArea = area;
exports.polygonCentroid = centroid;
exports.polygonHull = hull;
exports.polygonContains = contains;
exports.polygonLength = length$1;
exports.path = path;
exports.quadtree = quadtree;
exports.queue = queue;
exports.arc = arc;
exports.area = area$1;
exports.line = line;
exports.pie = pie;
exports.radialArea = radialArea;
exports.radialLine = radialLine$1;
exports.symbol = symbol;
exports.symbols = symbols;
exports.symbolCircle = circle;
exports.symbolCross = cross$1;
exports.symbolDiamond = diamond;
exports.symbolSquare = square;
exports.symbolStar = star;
exports.symbolTriangle = triangle;
exports.symbolWye = wye;
exports.curveBasisClosed = basisClosed;
exports.curveBasisOpen = basisOpen;
exports.curveBasis = basis;
exports.curveBundle = bundle;
exports.curveCardinalClosed = cardinalClosed;
exports.curveCardinalOpen = cardinalOpen;
exports.curveCardinal = cardinal;
exports.curveCatmullRomClosed = catmullRomClosed;
exports.curveCatmullRomOpen = catmullRomOpen;
exports.curveCatmullRom = catmullRom;
exports.curveLinearClosed = linearClosed;
exports.curveLinear = curveLinear;
exports.curveMonotoneX = monotoneX;
exports.curveMonotoneY = monotoneY;
exports.curveNatural = natural;
exports.curveStep = step;
exports.curveStepAfter = stepAfter;
exports.curveStepBefore = stepBefore;
exports.stack = stack;
exports.stackOffsetExpand = expand;
exports.stackOffsetNone = none;
exports.stackOffsetSilhouette = silhouette;
exports.stackOffsetWiggle = wiggle;
exports.stackOrderAscending = ascending$1;
exports.stackOrderDescending = descending$2;
exports.stackOrderInsideOut = insideOut;
exports.stackOrderNone = none$1;
exports.stackOrderReverse = reverse;
exports.color = color;
exports.rgb = rgb;
exports.hsl = hsl;
exports.lab = lab;
exports.hcl = hcl;
exports.cubehelix = cubehelix;
exports.interpolate = interpolate;
exports.interpolateArray = array$1;
exports.interpolateDate = date;
exports.interpolateNumber = interpolateNumber;
exports.interpolateObject = object;
exports.interpolateRound = interpolateRound;
exports.interpolateString = interpolateString;
exports.interpolateTransformCss = interpolateTransformCss;
exports.interpolateTransformSvg = interpolateTransformSvg;
exports.interpolateZoom = interpolateZoom;
exports.interpolateRgb = interpolateRgb;
exports.interpolateRgbBasis = rgbBasis;
exports.interpolateRgbBasisClosed = rgbBasisClosed;
exports.interpolateHsl = hsl$2;
exports.interpolateHslLong = hslLong;
exports.interpolateLab = lab$1;
exports.interpolateHcl = hcl$2;
exports.interpolateHclLong = hclLong;
exports.interpolateCubehelix = cubehelix$2;
exports.interpolateCubehelixLong = cubehelixLong;
exports.interpolateBasis = basis$2;
exports.interpolateBasisClosed = basisClosed$1;
exports.quantize = quantize;
exports.dispatch = dispatch;
exports.dsvFormat = dsv;
exports.csvParse = csvParse;
exports.csvParseRows = csvParseRows;
exports.csvFormat = csvFormat;
exports.csvFormatRows = csvFormatRows;
exports.tsvParse = tsvParse;
exports.tsvParseRows = tsvParseRows;
exports.tsvFormat = tsvFormat;
exports.tsvFormatRows = tsvFormatRows;
exports.request = request;
exports.html = html;
exports.json = json;
exports.text = text;
exports.xml = xml;
exports.csv = csv$1;
exports.tsv = tsv$1;
exports.now = now;
exports.timer = timer;
exports.timerFlush = timerFlush;
exports.timeout = timeout$1;
exports.interval = interval$1;
exports.timeInterval = newInterval;
exports.timeMillisecond = millisecond;
exports.timeMilliseconds = milliseconds;
exports.timeSecond = second;
exports.timeSeconds = seconds;
exports.timeMinute = minute;
exports.timeMinutes = minutes;
exports.timeHour = hour;
exports.timeHours = hours;
exports.timeDay = day;
exports.timeDays = days;
exports.timeWeek = sunday;
exports.timeWeeks = sundays;
exports.timeSunday = sunday;
exports.timeSundays = sundays;
exports.timeMonday = monday;
exports.timeMondays = mondays;
exports.timeTuesday = tuesday;
exports.timeTuesdays = tuesdays;
exports.timeWednesday = wednesday;
exports.timeWednesdays = wednesdays;
exports.timeThursday = thursday;
exports.timeThursdays = thursdays;
exports.timeFriday = friday;
exports.timeFridays = fridays;
exports.timeSaturday = saturday;
exports.timeSaturdays = saturdays;
exports.timeMonth = month;
exports.timeMonths = months;
exports.timeYear = year;
exports.timeYears = years;
exports.utcMillisecond = millisecond;
exports.utcMilliseconds = milliseconds;
exports.utcSecond = second;
exports.utcSeconds = seconds;
exports.utcMinute = utcMinute;
exports.utcMinutes = utcMinutes;
exports.utcHour = utcHour;
exports.utcHours = utcHours;
exports.utcDay = utcDay;
exports.utcDays = utcDays;
exports.utcWeek = utcSunday;
exports.utcWeeks = utcSundays;
exports.utcSunday = utcSunday;
exports.utcSundays = utcSundays;
exports.utcMonday = utcMonday;
exports.utcMondays = utcMondays;
exports.utcTuesday = utcTuesday;
exports.utcTuesdays = utcTuesdays;
exports.utcWednesday = utcWednesday;
exports.utcWednesdays = utcWednesdays;
exports.utcThursday = utcThursday;
exports.utcThursdays = utcThursdays;
exports.utcFriday = utcFriday;
exports.utcFridays = utcFridays;
exports.utcSaturday = utcSaturday;
exports.utcSaturdays = utcSaturdays;
exports.utcMonth = utcMonth;
exports.utcMonths = utcMonths;
exports.utcYear = utcYear;
exports.utcYears = utcYears;
exports.formatLocale = formatLocale;
exports.formatDefaultLocale = defaultLocale;
exports.formatSpecifier = formatSpecifier;
exports.precisionFixed = precisionFixed;
exports.precisionPrefix = precisionPrefix;
exports.precisionRound = precisionRound;
exports.isoFormat = formatIso;
exports.isoParse = parseIso;
exports.timeFormatLocale = formatLocale$1;
exports.timeFormatDefaultLocale = defaultLocale$1;
exports.scaleBand = band;
exports.scalePoint = point$4;
exports.scaleIdentity = identity$4;
exports.scaleLinear = linear$2;
exports.scaleLog = log;
exports.scaleOrdinal = ordinal;
exports.scaleImplicit = implicit;
exports.scalePow = pow;
exports.scaleSqrt = sqrt;
exports.scaleQuantile = quantile$$1;
exports.scaleQuantize = quantize$1;
exports.scaleThreshold = threshold$1;
exports.scaleTime = time;
exports.scaleUtc = utcTime;
exports.schemeCategory10 = category10;
exports.schemeCategory20b = category20b;
exports.schemeCategory20c = category20c;
exports.schemeCategory20 = category20;
exports.scaleSequential = sequential;
exports.interpolateCubehelixDefault = cubehelix$3;
exports.interpolateRainbow = rainbow$1;
exports.interpolateWarm = warm;
exports.interpolateCool = cool;
exports.interpolateViridis = viridis;
exports.interpolateMagma = magma;
exports.interpolateInferno = inferno;
exports.interpolatePlasma = plasma;
exports.creator = creator;
exports.customEvent = customEvent;
exports.local = local;
exports.matcher = matcher$1;
exports.mouse = mouse;
exports.namespace = namespace;
exports.namespaces = namespaces;
exports.select = select;
exports.selectAll = selectAll;
exports.selection = selection;
exports.selector = selector;
exports.selectorAll = selectorAll;
exports.touch = touch;
exports.touches = touches;
exports.window = window;
exports.active = active;
exports.interrupt = interrupt;
exports.transition = transition;
exports.axisTop = axisTop;
exports.axisRight = axisRight;
exports.axisBottom = axisBottom;
exports.axisLeft = axisLeft;
exports.cluster = cluster;
exports.hierarchy = hierarchy;
exports.pack = index;
exports.packSiblings = siblings;
exports.packEnclose = enclose;
exports.partition = partition;
exports.stratify = stratify;
exports.tree = tree;
exports.treemap = index$1;
exports.treemapBinary = binary;
exports.treemapDice = treemapDice;
exports.treemapSlice = treemapSlice;
exports.treemapSliceDice = sliceDice;
exports.treemapSquarify = squarify;
exports.treemapResquarify = resquarify;
exports.forceCenter = center$1;
exports.forceCollide = collide;
exports.forceLink = link;
exports.forceManyBody = manyBody;
exports.forceSimulation = simulation;
exports.forceX = x$3;
exports.forceY = y$3;
exports.drag = drag;
exports.dragDisable = dragDisable;
exports.dragEnable = yesdrag;
exports.voronoi = voronoi;
exports.zoom = zoom;
exports.zoomIdentity = identity$6;
exports.zoomTransform = transform;
exports.brush = brush;
exports.brushX = brushX;
exports.brushY = brushY;
exports.brushSelection = brushSelection;
exports.chord = chord;
exports.ribbon = ribbon;
exports.geoAlbers = albers;
exports.geoAlbersUsa = albersUsa;
exports.geoArea = area$2;
exports.geoAzimuthalEqualArea = azimuthalEqualArea;
exports.geoAzimuthalEqualAreaRaw = azimuthalEqualAreaRaw;
exports.geoAzimuthalEquidistant = azimuthalEquidistant;
exports.geoAzimuthalEquidistantRaw = azimuthalEquidistantRaw;
exports.geoBounds = bounds;
exports.geoCentroid = centroid$1;
exports.geoCircle = circle$1;
exports.geoClipExtent = extent$1;
exports.geoConicConformal = conicConformal;
exports.geoConicConformalRaw = conicConformalRaw;
exports.geoConicEqualArea = conicEqualArea;
exports.geoConicEqualAreaRaw = conicEqualAreaRaw;
exports.geoConicEquidistant = conicEquidistant;
exports.geoConicEquidistantRaw = conicEquidistantRaw;
exports.geoDistance = distance;
exports.geoEquirectangular = equirectangular;
exports.geoEquirectangularRaw = equirectangularRaw;
exports.geoGnomonic = gnomonic;
exports.geoGnomonicRaw = gnomonicRaw;
exports.geoGraticule = graticule;
exports.geoGraticule10 = graticule10;
exports.geoIdentity = identity$8;
exports.geoInterpolate = interpolate$2;
exports.geoLength = length$2;
exports.geoMercator = mercator;
exports.geoMercatorRaw = mercatorRaw;
exports.geoOrthographic = orthographic;
exports.geoOrthographicRaw = orthographicRaw;
exports.geoPath = index$3;
exports.geoProjection = projection;
exports.geoProjectionMutator = projectionMutator;
exports.geoRotation = rotation;
exports.geoStereographic = stereographic;
exports.geoStereographicRaw = stereographicRaw;
exports.geoStream = geoStream;
exports.geoTransform = transform$1;
exports.geoTransverseMercator = transverseMercator;
exports.geoTransverseMercatorRaw = transverseMercatorRaw;

Object.defineProperty(exports, '__esModule', { value: true });

})));

/* global d3, d3tide */

// グローバルに独自の名前空間を定義する
(function() {
  // このthisはグローバル空間
  this.d3tide = this.d3tide || (function() {
    // アプリのデータを取り込む場合、appdata配下にぶら下げる
    var appdata = {};

    // ヒアドキュメント経由で静的データを取り込む場合、テキストデータをheredoc配下にぶら下げる
    var heredoc = {};

    // 地図データを取り込む場合、geodata配下にぶら下げる
    var geodata = {};

    // SVGアイコンを取り込む場合、icon配下にぶら下げる
    var icondata = {};

    // 公開するオブジェクト
    return {
      appdata: appdata,
      heredoc: heredoc,
      geodata: geodata,
      icondata: icondata
    };
  })();
  //
})();

// メイン関数
(function() {
  d3tide.main = function() {
    // HTMLのコンテナを取得する
    var container = d3.select('#tideChart');

    // データマネージャのインスタンス
    // データの入手はデータマネージャ経由で実施
    var dm = d3tide.dataManager();

    // 現在表示している日
    var currentDate = new Date();

    //
    // 全体で共有するsvgを一つ作成する
    //

    var svg = container
      .append('svg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 800)
      .attr('height', 1000);

    // NextPrevボタン
    var np = d3tide.npButton().width(800).height(300);
    svg
      .append('g')
      .call(np);

    //
    // d3tide.Chart.js
    //

    // コンテナを作成
    var chartContainer = svg
      .append('g')
      .attr('width', 800)
      .attr('height', 300);

    // チャートをインスタンス化
    var chart = d3tide.tideChart();

    np
      .on('prev', function() {
        var cd = currentDate.getDate();
        currentDate.setDate(cd - 1);
        drawChart();
      })
      .on('next', function() {
        var cd = currentDate.getDate();
        currentDate.setDate(cd + 1);
        drawChart();
      });

    // チャートを描画
    function drawChart() {
      // 日付けをチャートにセットする(文字列なので日付けフォーマットは適当に)
      var day = (currentDate.getMonth() + 1) + '/' + currentDate.getDate();
      chart.day(day);

      // 月齢をチャートにセット
      var moon = dm.getMoonDataByDate(currentDate);
      chart.moon(moon);

      var sun = dm.getSunriseDataByDate(currentDate);
      if (sun) {
        chart.sunrise(sun.sunrise);
        chart.sunset(sun.sunset);
      } else {
        chart.sunrise(0);
        chart.sunset(0);
      }

      // コンテナに潮汐データを紐付けてcall()する
      var tideDatas = dm.getTideDataByDate(currentDate);
      chartContainer.datum(tideDatas).call(chart);
    }

    // 現在時で表示
    drawChart();

    //
    // d3tide.monthCalendar.js
    //

    // カレンダ用のコンテナを作成
    var mcContainer = svg
      .append('g')
      .attr('width', 800)
      .attr('height', 600)
      .attr('transform', 'translate(0,300)');

    // カレンダをインスタンス化
    var mc = d3tide.monthCalendar();

    // clickイベントはDateオブジェクトを返してくるので、それを指定してチャートを再描画
    mc.on('click', function(d) {
      currentDate = d;
      drawChart();
    });

    // コンテナに紐付けてcall()する
    mcContainer.call(mc);
  };
  //
})();

/* global d3tide */

// データマネージャモジュール
(function() {
  d3tide.dataManager = function module() {
    // このモジュールは関数ではなくマップを返す
    var exports = {};

    //
    // 潮汐データ
    //

    exports.parseTideLines = function(lines) {
      return parseTideLines(lines);
    };

    function parseTideLines(lines) {
      lines = [].concat(lines);

      // 潮汐データの保管場所
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        d3tide.appdata.tidedata = {};
      }
      var data = d3tide.appdata.tidedata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var dateStr = line.substr(72, 6);

        var tideDatas = [];
        var m;
        var str;
        var num;
        for (m = 0; m < 24; m++) {
          str = line.substr(m * 3, 3);
          num = parseInt(str, 10) || 0;
          tideDatas.push([m, num]);
        }

        // 1日のデータは23時で終わってしまうので、次の行の先頭のデータを読んで24時の値とする
        if (i === lines.length - 1) {
          tideDatas.push([24, 0]);
        } else {
          line = lines[i + 1];
          str = line.substr(0, 3);
          num = parseInt(str, 10) || 0;
          tideDatas.push([24, num]);
        }

        // dateStrすなわち'16 1 1'のような日付けの文字列をキーにして取り出せるようにする
        data[dateStr] = tideDatas;
      }

      return data;
    }

    // 潮汐データの取得
    // 潮汐データにおける日付けは'16 1 1'のように、6文字固定で、0埋めではなく空白が使われている

    exports.getTideDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        console.log('tide data not found');
        return null;
      }

      // 年は2桁
      var year = date.getFullYear();
      year = (year % 100).toString();

      // 月は空白埋めの2桁
      var month = date.getMonth() + 1;
      month = (month < 10) ? ' ' + month : month.toString();

      // 日は空白埋めの2桁
      var day = date.getDate();
      day = (day < 10) ? ' ' + day : day.toString();

      // 全部を連結して6文字にしたものが、データ取得用のキーになる
      var key = year + month + day;

      // 潮汐データの保管場所
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        d3tide.appdata.tidedata = {};
      }

      return d3tide.appdata.tidedata[key];
    };

    exports.getTideDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        console.log('tide data not found');
        return null;
      }

      // 年は2桁
      var year = (d.year % 100).toString();

      // 月は空白埋めの2桁
      var month = d.month + 1;
      month = (month < 10) ? ' ' + month : month.toString();

      // 日は空白埋めの2桁
      var day = d.day;
      day = (day < 10) ? ' ' + day : day.toString();

      // 全部を連結して6文字にしたものが、データ取得用のキーになる
      var key = year + month + day;

      return d3tide.appdata.tidedata[key];
    };

    //
    // 月齢
    //

    exports.parseMoonLines = function(year, lines) {
      return parseMoonLines(year, lines);
    };

    function parseMoonLines(year, lines) {
      lines = [].concat(lines);

      // 月齢データの保管場所
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        d3tide.appdata.moondata = {};
      }
      var data = d3tide.appdata.moondata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var arr = line.split(',');
        if (arr.length !== 2) {
          continue;
        }

        var date = arr[0];
        var moon = arr[1];

        // 2016/1/1
        date = year + '/' + date;

        data[date] = moon;
      }

      return data;
    }

    // 月齢データの取得
    // 月齢データにアクセスするためのキーは'2016/1/1'のようになっている

    exports.getMoonDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        console.log('moon data not found');
        return null;
      }

      // 年・月・日
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      return d3tide.appdata.moondata[key];
    };

    exports.getMoonDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        console.log('moon data not found');
        return null;
      }

      // 年・月・日
      var year = d.year;
      var month = d.month + 1;
      var day = d.day;

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      return d3tide.appdata.moondata[key];
    };

    //
    // 日の出・日の入
    //

    exports.parseSunriseLines = function(lines) {
      return parseSunriseLines(lines);
    };

    function parseSunriseLines(lines) {
      lines = [].concat(lines);

      // 日の出データの保管場所
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        d3tide.appdata.sunrisedata = {};
      }
      var data = d3tide.appdata.sunrisedata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var arr = line.split(',');
        if (arr.length !== 3) {
          continue;
        }

        var date = arr[0];
        var sunrise = arr[1];
        var sunset = arr[2];

        data[date] = {sunrise: sunrise, sunset: sunset};
      }

      return data;
    }

    // 日の出データの取得
    // 日の出データにアクセスするためのキーは'2016/01/01'のようになっている

    exports.getSunriseDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        console.log('sunrise data not found');
        return null;
      }

      // 年・月・日
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      month = (month < 10) ? '0' + month : month.toString();
      var day = date.getDate();
      day = (day < 10) ? '0' + day : day.toString();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      var data = d3tide.appdata.sunrisedata[key];
      data = data ? data : {sunrise: 0, sunset: 0};

      return data;
    };

    exports.getSunriseDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        console.log('sunrise data not found');
        return null;
      }

      // 年・月・日
      var year = d.year;
      var month = d.month + 1;
      month = (month < 10) ? '0' + month : month.toString();
      var day = d.day;
      day = (day < 10) ? '0' + day : day.toString();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      var data = d3tide.appdata.sunrisedata[key];
      data = data ? data : {sunrise: 0, sunset: 0};

      return data;
    };

    return exports;
  };
  //
})();

/* global d3, d3tide */

// 2016.12.02
// Takamitsu IIDA

// NextとPrevのSVGボタンモジュール
(function() {
  d3tide.npButton = function module() {
    var CLASS_BASE_LAYER = 'd3tide-npbutton-base-layer';
    var CLASS_PREV_LAYER = 'd3tide-npbutton-prev-layer'; // CSS参照
    var CLASS_NEXT_LAYER = 'd3tide-npbutton-next-layer'; // CSS参照
    var CLASS_BUTTON_PREV_RECT = 'd3tide-npbutton-prev-rect';
    var CLASS_BUTTON_NEXT_RECT = 'd3tide-npbutton-next-rect';
    var CLASS_BUTTON_PREV_PATH = 'd3tide-npbutton-prev-path';
    var CLASS_BUTTON_NEXT_PATH = 'd3tide-npbutton-next-path';

    // 12x12で作成したNextとPrevのアイコン
    // これをscale(4.0)で4倍にトランスフォームして使うと48x48になる

    // >|
    var nextPathData = [
      'M0,0v12l8.5-6L0,0zM10,0v12h2v-12h-2z'
    ];

    // |<
    var prevPathData = [
      'M0,0h2v12H0zM3.5,6l8.5,6V0z'
    ];

    // 外枠の大きさ(初期値)
    var width = 800;
    var height = 300;

    // 描画領域のマージン
    var margin = {
      top: 10,
      right: 0,
      bottom: 10,
      left: 0
    };

    // 描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    var buttonWidth = 150;
    var buttonHeight = h;

    // ダミーデータ
    var dummy = [0];

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('prev', 'next');

    // 公開関数
    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      // 最下層のレイヤ'g'を作成する
      var baseLayerAll = _selection.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
      var baseLayer = baseLayerAll
        .enter()
        .append('g')
        .classed(CLASS_BASE_LAYER, true)
        .merge(baseLayerAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', w)
        .attr('height', h);

      // Prevボタンを配置するレイヤ'g'を作成する
      var prevLayerALl = baseLayer.selectAll('.' + CLASS_PREV_LAYER).data(dummy);
      var prevLayer = prevLayerALl
        .enter()
        .append('g')
        .classed(CLASS_PREV_LAYER, true)
        .merge(prevLayerALl);

      // Prevボタンになる'rectを作成する
      var prevRectAll = prevLayer.selectAll('.' + CLASS_BUTTON_PREV_RECT).data(dummy);
      prevRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_PREV_RECT, true)
        .on('mousedown', function() {
          // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する。クリックよりも前！
          d3.event.preventDefault();
          d3.event.stopPropagation();
          // マウスダウンした瞬間だけ色を変える
          prevLayer.classed('mousedown', true);
          d3.select(window).on('mouseup', function() {
            prevLayer.classed('mousedown', false);
          });
        })
        .on('click', function(d) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call('prev', this, d);
        })
        .merge(prevRectAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight);

      var prevPathAll = prevLayer.selectAll('.' + CLASS_BUTTON_PREV_PATH).data(prevPathData);
      prevPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_PREV_PATH, true)
        .merge(prevPathAll)
        .attr('d', function(d) {
          return d;
        })
        .attr('transform', 'translate(10,' + (buttonHeight / 2 - 24) + ')scale(4.0)');

      // Nextボタンを配置するレイヤ'g'を作成する
      var nextLayerALl = baseLayer.selectAll('.' + CLASS_NEXT_LAYER).data(dummy);
      var nextLayer = nextLayerALl
        .enter()
        .append('g')
        .classed(CLASS_NEXT_LAYER, true)
        .merge(nextLayerALl)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .attr('transform', 'translate(' + (w - buttonWidth) + ',0)');

      // Nextボタンになる'rectを作成する
      var nextRectAll = nextLayer.selectAll('.' + CLASS_BUTTON_NEXT_RECT).data(dummy);
      nextRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_NEXT_RECT, true)
        .on('mousedown', function() {
          // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する
          d3.event.preventDefault();
          d3.event.stopPropagation();
          // マウスダウンした瞬間だけ色を変える
          nextLayer.classed('mousedown', true);
          d3.select(window).on('mouseup', function() {
            nextLayer.classed('mousedown', false);
          });
        })
        .on('click', function(d) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call('next', this, d);
        })
        .merge(nextRectAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight);

      var nextPathAll = nextLayer.selectAll('.' + CLASS_BUTTON_NEXT_PATH).data(nextPathData);
      nextPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_NEXT_PATH, true)
        .merge(nextPathAll)
        .attr('d', function(d) {
          return d;
        })
        .attr('transform', 'translate(' + (buttonWidth - 48 - 10) + ',' + (buttonHeight / 2 - 24) + ')scale(4.0)');
      //
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      buttonHeight = h;
      return this;
    };

    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
    //
  };
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 潮位データ
// http://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php

// 油壺
// 2021年

(function () {
  var lines = [
    " -6  4 28 59 92120137142136123107 95 91 95107123137145142127101 69 37 1121 1 1Z1 65614217161469999999999999912 2 91999999999999999999999",
    " -3 -3 13 40 72102125138138129115101 91 90 97111126138143136117 90 59 3021 1 2Z1 733139175414399999999999999 027 -51239 8999999999999999",
    "  9  1  7 26 53 84111129137133122107 94 87 89 98111125134135126107 82 5421 1 3Z1 8 9137183813699999999999999 1 5  11320 8799999999999999",
    " 29 14 11 20 41 67 95117131134127114100 89 84 86 95107119126126117 99 7721 1 4Z1 847134192812799999999999999 145 101410 8399999999999999",
    " 54 35 25 26 37 57 81104122131130121108 93 83 78 80 87 98108115115108 9521 1 5Z1 924131203311699999999999999 227 241512 7899999999999999",
    " 78 61 47 41 43 55 72 93112125130126116102 87 76 70 70 76 85 9510310610421 1 6Z110 413022 610699999999999999 313 401629 6999999999999999",
    " 96 85 73 63 59 61 71 86103117127129123112 97 81 67 59 56 60 69 80 9110021 1 7Z11047129999999999999999999999 4 7 591752 5699999999999999",
    "103102 96 88 80 76 78 85 96110121128129122110 92 73 56 45 40 43 53 67 8321 1 8Z1 013103113513099999999999999 516 7619 6 4099999999999999",
    " 98108112110104 96 91 90 95104115125131131123108 87 64 44 29 23 26 39 5821 1 9Z1 2 9112123013299999999999999 640 9020 8 2399999999999999",
    " 80100115123123117109101 98101108118129135134125107 82 54 30 13  7 13 2921 110Z1 329124132613699999999999999 8 5 9821 1  799999999999999",
    " 54 81106125134133126115106101102110122133140139126104 75 44 17  0 -5  421 111Z1 426135142014199999999999999 9151012149 -599999999999999",
    " 26 55 87114134141139128115104 99102112126139145142126 99 66 33  6-10-1121 112Z1 51314215111469999999999999910 9 992234-1299999999999999",
    "  3 29 62 96123140145138125110 99 96102114130144149142122 92 57 23 -2-1421 113Z1 5541451557149999999999999991052 962316-1499999999999999",
    "-10  9 38 73106130143143133117102 92 92102117134147149138115 83 48 16 -521 114Z1 6301441641150999999999999991131 912354-1299999999999999",
    "-11 -2 21 52 86116135142137123106 92 86 90103120137146145130105 72 39 1321 115Z1 7 314217231479999999999999912 7 86999999999999999999999",
    " -2 -2 12 38 69100124136137127111 95 83 81 89104121135141136119 93 62 3421 116Z1 73313818 314199999999999999 030 -41242 8199999999999999",
    " 14  6 13 31 57 86112129135129116 99 84 77 78 88104119130133124106 81 5521 117Z1 8 1135184313399999999999999 1 2  61319 7699999999999999",
    " 34 21 20 31 52 77101120130130120105 89 77 72 77 87101114122121111 94 7321 118Z1 827131192412299999999999999 133 1914 1 7299999999999999",
    " 53 39 33 38 52 72 93112125128123111 96 81 72 69 74 84 96106110108 99 8621 119Z1 853128201211199999999999999 2 2 331449 6999999999999999",
    " 70 57 49 49 57 71 88105119125124116103 89 76 68 66 70 78 87 95 99 98 9221 120Z1 9211262116 9999999999999999 231 481549 6699999999999999",
    " 83 73 66 63 66 74 86100112121123119110 98 84 72 64 61 63 69 77 84 89 9121 121Z1 95312323 2 9199999999999999 3 2 6317 5 6199999999999999",
    " 90 86 82 78 78 81 87 97107115120120115106 94 80 67 58 53 53 58 66 76 8421 122Z11033120999999999999999999999 341 771825 5299999999999999",
    " 90 94 94 93 91 91 92 96102109115118118114104 91 76 61 49 42 42 48 58 7121 123Z1 147 94113011999999999999999 455 911933 4199999999999999",
    " 84 95102105105102100 98100103108114118119114104 88 70 52 37 30 30 39 5321 124Z1 322105123911999999999999999 7 2 982025 2999999999999999",
    " 71 89103113116114109104100 99102108115121122116103 83 61 39 23 17 20 3321 125Z1 4 5116134012299999999999999 838 9921 9 1799999999999999",
    " 54 77 98114123124119111102 97 97102110120127127118100 75 49 25  9  5 1421 126Z1 438125143112899999999999999 934 962149  599999999999999",
    " 33 59 86110125131128119107 97 92 94103115127134131117 94 65 35 10 -3 -221 127Z1 5 81311515134999999999999991013 922227 -499999999999999",
    " 13 38 69 98121134135127114100 90 88 94107122135140133114 85 52 21 -2-1121 128Z1 5381361557140999999999999991047 8723 4-1199999999999999",
    " -4 17 48 81111131139134122105 90 82 84 95112130142143132108 75 40 10 -921 129Z1 6 71391638144999999999999991120 822340-1399999999999999",
    "-12  2 28 62 96123137139129112 93 80 75 82 97117135145143127 99 64 30  321 130Z1 6371401720146999999999999991154 75999999999999999999999",
    " -9 -6 14 44 79110131140134119 99 81 70 70 81 99120137144138118 89 56 2521 131Z1 7 614018 314499999999999999 016-101229 6999999999999999",
    "  4 -1  9 32 63 95121136137126107 85 69 62 66 80100120134138129109 81 5121 2 1Z1 734138184913899999999999999 052 -213 7 6299999999999999",
    " 27 13 14 29 53 83110129136130114 93 73 59 56 63 77 96114126127118100 7621 2 2Z1 8 2136193912899999999999999 127 121350 5699999999999999",
    " 53 36 30 35 52 75100121132132121103 81 63 52 51 58 72 89104114115108 9421 2 3Z1 829134203911699999999999999 2 2 301439 5099999999999999",
    " 77 61 51 50 59 74 94113127131126112 93 73 57 47 46 52 64 78 9110110410121 2 4Z1 85713122 110499999999999999 237 501540 4699999999999999",
    " 93 83 75 70 72 80 93107120127127119105 87 69 53 44 40 44 52 64 77 88 9521 2 5Z1 928128999999999999999999999 314 701659 4099999999999999",
    " 98 98 94 91 89 91 96105114121125123115102 86 68 52 40 33 33 39 50 64 7921 2 6Z1 017 9810 912599999999999999 4 3 891831 3299999999999999",
    " 91101106107106104103105109114119122121115104 88 69 50 34 24 21 26 38 5521 2 7Z1 251108111812299999999999999 5521031953 2199999999999999",
    " 75 93108117120117113108106106110116121123119109 92 70 47 27 13  9 15 3021 2 8Z1 358120125512399999999999999 8171062056  999999999999999",
    " 52 77101118128128123114105100100105114123128126114 94 69 41 18  3  0  921 2 9Z1 436129141512899999999999999 930 992146 -199999999999999",
    " 29 56 85111128135131121107 96 91 93102115128135132118 94 64 33  9 -4 -421 210Z1 5 81351514135999999999999991013 912229 -699999999999999",
    " 10 35 67 98122135137128112 96 85 82 88103120134140135116 88 55 24  2 -721 211Z1 53713816 2140999999999999991048 8123 6 -799999999999999",
    " -1 19 49 82111131138133118 99 82 73 75 87106126140143133110 79 45 17 -121 212Z1 6 31381645143999999999999991119 722339 -499999999999999",
    " -3 10 35 67 99123136136123104 83 68 64 72 89111131142140125100 68 36 1321 213Z1 6271381724143999999999999991150 64999999999999999999999",
    "  3  9 27 56 87114132136128109 87 68 58 60 73 93115132139133114 87 57 3121 214Z1 65013618 113999999999999999 0 9  31221 5799999999999999",
    " 16 14 26 49 78105126134130115 94 72 56 52 59 76 97117130132121101 76 5021 215Z1 710135183813399999999999999 036 131252 5299999999999999",
    " 32 25 31 48 72 98119131131120101 78 60 49 50 61 79 99115124121109 89 6821 216Z1 730133191712499999999999999 1 2 251326 4899999999999999",
    " 49 39 40 51 70 93113127130123107 87 66 52 46 51 63 80 97110114109 97 8221 217Z1 749131195911499999999999999 126 3814 3 4699999999999999",
    " 66 55 52 58 72 89108121128124113 95 76 59 48 46 52 64 79 92101103 99 9021 218Z1 8 9128205010399999999999999 150 521446 4699999999999999",
    " 79 70 66 68 76 89103116123123116102 86 69 56 48 47 52 62 73 84 91 94 9221 219Z1 83012422 5 9499999999999999 212 661541 4699999999999999",
    " 88 83 80 80 83 91100110117119116107 95 81 67 56 48 46 49 56 65 75 83 8821 220Z1 854119999999999999999999999 232 791655 4699999999999999",
    " 91 92 92 92 93 96100106110113113109102 92 80 68 56 47 42 42 47 56 67 7821 221Z1 9261149999999999999999999991826 41999999999999999999999",
    " 87 95100102103103103103105107108108107102 94 83 68 54 41 33 32 37 47 6221 222Z110461099999999999999999999991945 32999999999999999999999",
    " 77 92104111113111108103100100101105108110107 99 85 67 48 32 22 20 27 4221 223Z1 4 2113125911099999999999999 8491002043 2099999999999999",
    " 62 83102115121120114106 98 93 93 97105113117115105 86 63 39 20  9  9 2121 224Z1 422121141411799999999999999 933 922128  899999999999999",
    " 42 68 93114126128122111 98 88 84 87 97110122127123108 84 56 28  7 -2  321 225Z1 44512915 81279999999999999910 4 8422 9 -299999999999999",
    " 21 49 79107126134130118101 85 76 75 84100118132137129109 79 46 16 -3 -721 226Z1 5101341554137999999999999991033 742246 -899999999999999",
    "  4 29 62 95121136137126107 86 70 63 68 84106127142144131105 71 36  8 -721 227Z1 53513816381459999999999999911 4 632322 -899999999999999",
    " -4 14 44 79111133140133115 91 68 54 53 64 86112135147145128 99 64 30  721 228Z1 6 01401723148999999999999991136 522358 -199999999999999",
    " -1  8 32 65 99126140139123 99 72 51 41 46 63 89116138147141121 91 58 3021 3 1Z1 62414118 8147999999999999991210 41999999999999999999999",
    " 13 13 28 55 87116136141130108 80 54 36 32 42 63 90117135141133113 85 5721 3 2Z1 649141185514199999999999999 032 111247 3299999999999999",
    " 36 28 34 53 80107129139135118 91 63 40 27 28 41 63 89112127130122104 8221 3 3Z1 712140194613199999999999999 1 4 281326 2699999999999999",
    " 62 50 49 59 78101122135136125103 77 51 32 24 28 42 62 84103115117111 9821 3 4Z1 735137204511799999999999999 135 481410 2499999999999999",
    " 84 72 67 71 82 99116129134128113 91 67 46 31 26 30 41 58 76 9110110510321 3 5Z1 75813422 810599999999999999 2 4 6715 4 2699999999999999",
    " 97 90 86 85 91100112122128127119104 84 65 47 35 30 31 39 50 64 78 88 9621 3 6Z1 822129999999999999999999999 232 851617 2999999999999999",
    "100101100100101104109115120122119111 99 85 69 53 41 33 30 33 41 53 66 8021 3 7Z1 055101 85312299999999999999 2551001759 3099999999999999",
    " 93103108111111110109109111112113112108101 91 77 61 46 34 27 26 32 44 6021 3 8Z1 32811110 311399999999999999 6181091938 2599999999999999",
    " 79 96110118120117111106101100102105109111108100 85 67 47 31 20 18 25 4021 3 9Z1 350120125711199999999999999 8551002046 1899999999999999",
    " 61 84105119126124116105 95 89 88 94103112118117108 91 68 44 25 13 13 2321 310Z1 414126142511999999999999999 934 882134 1199999999999999",
    " 43 69 95116128130121107 92 80 75 79 90105119127125113 91 64 38 18  9 1321 311Z1 43713015211289999999999999910 3 752212  899999999999999",
    " 29 54 83109127133127112 93 75 64 64 74 92112128135129112 86 57 30 13 1021 312Z1 5 013316 5135999999999999991031 632245  999999999999999",
    " 20 42 71100123134132119 97 75 58 52 58 75 98120135139128106 77 48 25 1421 313Z1 5211351644139999999999999991059 522315 1399999999999999",
    " 18 35 61 91117133135125104 78 56 44 45 58 81107128139137122 97 67 41 2421 314Z1 5411361721140999999999999991126 432342 2199999999999999",
    " 21 32 55 83110130137130111 85 59 41 35 43 63 89114132138131112 86 59 3921 315Z1 6 01371756138999999999999991154 35999999999999999999999",
    " 30 35 52 77104125136133117 93 66 43 31 32 47 70 97119132133121101 76 5521 316Z1 618136183213499999999999999 0 7 301223 3099999999999999",
    " 43 42 54 74 98120133134123101 75 49 32 27 35 53 78102120128124110 91 7121 317Z1 63613519 912899999999999999 032 411253 2799999999999999",
    " 57 52 58 74 94114129133126109 84 59 38 27 28 40 60 83104117120113100 8521 318Z1 654133194912099999999999999 055 521325 2699999999999999",
    " 71 64 66 76 92109123130127114 94 70 49 34 29 33 47 66 85101110110104 9421 319Z1 712130203511199999999999999 118 6414 1 2999999999999999",
    " 83 76 75 81 91105117124124116101 81 62 45 35 33 39 51 67 83 95101102 9821 320Z1 730126213810299999999999999 140 751444 3399999999999999",
    " 92 88 85 88 94102111118120115105 91 75 59 46 39 38 42 52 64 76 86 93 9721 321Z1 7491202346 9799999999999999 2 1 851543 3799999999999999",
    " 97 96 95 96 98102107111113112106 98 87 74 62 51 43 40 41 47 57 68 79 8921 322Z1 8 7113999999999999999999999 212 951712 4099999999999999",
    " 97101104105105105104105105105104101 96 89 79 68 55 44 37 35 39 48 61 7621 323Z1 8251059999999999999999999991851 35999999999999999999999",
    " 90102110114113109105100 97 96 97100102102 97 88 74 57 42 30 26 29 41 5821 324Z1 319114122610299999999999999 851 9620 4 2699999999999999",
    " 78 97112120122116107 97 89 85 87 93101109112108 96 78 56 35 21 16 22 3821 325Z1 33912214 011299999999999999 914 852056 1699999999999999",
    " 61 87109124129125113 98 83 74 72 79 92108120125119103 78 51 27 12 10 2121 326Z1 4 1129145912599999999999999 940 722140  999999999999999",
    " 43 72100123134133121102 81 64 57 61 76 97118133137128106 77 46 21  8 1121 327Z1 42513515491389999999999999910 9 572220  799999999999999",
    " 28 56 88117135140130109 83 60 44 42 54 76103128144146132106 73 42 19 1221 328Z1 4481401636147999999999999991039 412258 1299999999999999",
    " 20 43 75107132143138119 91 61 38 27 31 50 79110137150148131103 70 41 2521 329Z1 5121431723152999999999999991112 262333 2299999999999999",
    " 24 38 65 97125142144130103 70 39 19 14 26 50 83115140150145126 98 69 4721 330Z1 5361451810151999999999999991147 14999999999999999999999",
    " 37 43 62 89117138146138115 83 49 22  7  8 25 53 86116137144137119 95 7221 331Z1 6 014619 014499999999999999 0 8 371224  699999999999999",
    " 58 55 65 85110131144142126 99 66 34 12  3  9 29 56 86112129134127112 9421 4 1Z1 624145195313499999999999999 041 5413 4  399999999999999",
    " 79 72 75 87105124138142133112 84 53 27 11  7 15 34 58 8310411812111710721 4 2Z1 647142205612199999999999999 112 721348  799999999999999",
    " 96 89 87 93104118130136133120 99 74 49 29 17 15 23 38 58 77 9410511011021 4 3Z1 712137222511199999999999999 142 871440 1599999999999999",
    "106102 99100105113121127128122109 92 72 52 37 28 26 30 40 54 70 84 9610421 4 4Z1 737129999999999999999999999 214 991549 2599999999999999",
    "108109108107108110113116118116111102 90 76 62 49 39 34 34 39 49 63 77 9121 4 5Z1 058109 8 611899999999999999 3171071728 3399999999999999",
    "103111114114112109106104104105105104101 95 85 73 60 47 38 34 37 45 59 7621 4 6Z1 230115 95210599999999999999 74710419 9 3499999999999999",
    " 93107117120117111102 95 91 90 93 98103105103 96 83 67 51 38 32 34 44 6121 4 7Z1 3 112013 810599999999999999 842 902017 3299999999999999",
    " 81101116124123115103 90 79 75 77 85 96107114113104 89 69 50 36 30 34 4821 4 8Z1 326125142711599999999999999 911 7521 5 3099999999999999",
    " 69 92112125129122107 89 73 62 61 69 83101116123121109 89 67 46 33 31 4021 4 9Z1 349129151812499999999999999 939 602143 3099999999999999",
    " 58 82106124132128114 93 71 54 47 52 67 88109125131125109 86 62 43 33 3621 410Z1 41013316 11319999999999999910 6 472215 3399999999999999",
    " 51 74 99121134134122100 74 51 38 37 49 71 97120134136125105 80 57 42 3921 411Z1 4311351639136999999999999991033 362245 3899999999999999",
    " 48 68 92116133137128108 80 53 33 26 33 53 80107129139136121 98 73 54 4521 412Z1 45013817151399999999999999911 0 262312 4599999999999999",
    " 49 64 87111130139134116 89 60 34 20 21 36 61 91117135139131113 90 69 5621 413Z1 5 91391751140999999999999991127 192339 5399999999999999",
    " 54 64 83105126138137124 99 69 40 20 14 23 44 72101124136135124105 84 6821 414Z1 5281391826137999999999999991155 14999999999999999999999",
    " 62 66 81101121135138129108 80 51 27 14 15 30 54 82109126133128115 97 8121 415Z1 54713919 313399999999999999 0 5 621225 1299999999999999",
    " 72 72 81 97115130136132116 91 63 37 19 14 21 39 64 90112124126119107 9321 416Z1 6 7136194212799999999999999 031 701256 1499999999999999",
    " 82 79 83 94109123132131121101 76 51 31 19 19 30 49 72 9411011911811210221 417Z1 627133202811999999999999999 056 791330 1899999999999999",
    " 92 87 88 94105117125128122108 88 66 45 30 24 27 38 56 75 9310611211110721 418Z1 648128212711299999999999999 123 861411 2499999999999999",
    "101 96 94 97103110118121119111 97 79 61 46 35 31 34 44 58 74 8910010610821 419Z1 71012123 110899999999999999 154 9415 4 3199999999999999",
    "107104102101103106110113113110102 91 78 64 51 41 37 38 44 56 70 83 9510421 420Z1 736113999999999999999999999 2471011620 3699999999999999",
    "109111110108105104103103104104102 98 92 83 71 59 48 40 37 41 51 65 80 9521 421Z1 1 5111 83310499999999999999 6101031754 3799999999999999",
    "107115118116111104 98 93 92 93 96100101100 93 81 67 52 40 34 36 46 62 8221 422Z1 2 311812 410199999999999999 8 1 921914 3499999999999999",
    "100115124124118108 95 84 78 77 83 92103110112106 92 73 53 38 30 33 46 6621 423Z1 236125134411299999999999999 834 772015 3099999999999999",
    " 89111126132127114 97 79 65 59 63 76 93111123126118101 77 54 36 29 35 5121 424Z1 3 4132144712699999999999999 9 5 5921 4 2999999999999999",
    " 76102124136136124103 78 57 43 41 52 73 98121136139128107 80 54 37 33 4321 425Z1 330138154113999999999999999 938 402148 3399999999999999",
    " 64 91118137143135114 85 56 33 22 27 45 74105132147147134110 81 57 43 4321 426Z1 3561431632149999999999999991012 222229 4199999999999999",
    " 57 82110133146144127 98 63 32 11  6 18 43 77112139153151135110 83 63 5421 427Z1 4221471723154999999999999991048  623 8 5499999999999999",
    " 59 76102127145150139114 79 42 12 -4 -3 15 46 82116141152149132109 86 7121 428Z1 4491501814153999999999999991126 -62345 6899999999999999",
    " 68 77 96120140151147128 98 61 25  0-10 -3 18 50 86117139147142127108 9121 429Z1 51615119 61479999999999999912 6-10999999999999999999999",
    " 82 83 95113133147150139115 83 47 17 -3 -8  2 25 55 8711413213813412210721 430Z1 54415020 313899999999999999 021 811248 -899999999999999",
    " 96 92 97109124138146142127102 72 41 16  2  1 13 34 60 8710912312812511721 5 1Z1 61314621 712899999999999999 057 921334  099999999999999",
    "108102101106116127136138131115 92 67 42 23 14 14 24 41 63 8410211412011921 5 2Z1 645138222512099999999999999 1371011427 1399999999999999",
    "115110106106110116123127126119105 87 68 49 35 28 28 35 48 64 81 9710911521 5 3Z1 721127235611799999999999999 2311061531 2799999999999999",
    "117115112108106107109112114113108100 88 74 60 48 41 38 42 52 65 80 9510721 5 4Z1 815114999999999999999999999 4181061652 3899999999999999",
    "115119117112106101 97 96 98100102102100 93 83 71 60 50 46 47 54 67 82 9821 5 5Z1 1 8119103410399999999999999 649 961818 4699999999999999",
    "111119122118109 99 90 83 81 84 89 96102104101 93 81 68 56 50 50 58 71 8821 5 6Z1 151122125610499999999999999 755 811927 4999999999999999",
    "105118125124116102 87 74 67 67 73 84 96107112110101 87 72 59 53 54 63 7921 5 7Z1 223126141411299999999999999 834 662020 5299999999999999",
    " 98115127130124109 90 71 57 51 55 67 84102115121117106 90 73 60 55 59 7221 5 8Z1 25013015 812199999999999999 9 6 5121 3 5599999999999999",
    " 90110126134131118 97 73 52 40 39 49 68 90111125129122108 89 72 61 60 6821 5 9Z1 315134155212999999999999999 935 382139 5999999999999999",
    " 84104123135136126106 79 53 34 27 32 50 74100121133134124106 87 72 64 6721 510Z1 33813716321359999999999999910 4 272213 6499999999999999",
    " 80 98118134140134115 89 59 34 20 19 32 56 85112131139135122103 85 73 7021 511Z1 4 01401710139999999999999991033 182244 7099999999999999",
    " 78 94113131141139125100 69 40 19 11 18 38 66 96122137141133117 99 83 7621 512Z1 42214217461419999999999999911 2 112314 7699999999999999",
    " 79 90108126139142132111 82 51 24  9  9 23 48 78107129139138127111 95 8421 513Z1 4451421822140999999999999991132  72344 8199999999999999",
    " 81 89103120135142137121 95 64 35 15  7 13 32 60 89115132137132120105 9221 514Z1 5 814219 01379999999999999912 3  6999999999999999999999",
    " 86 89 99114128138138128107 79 50 26 11 10 21 43 71 9811913113212511310121 515Z1 533140193913399999999999999 013 861236  999999999999999",
    " 93 91 97108121132136131116 93 66 41 22 14 17 31 54 7910211912712611910921 516Z1 558136202412899999999999999 043 911313 1399999999999999",
    "100 95 97103114124130130121104 82 58 38 24 20 26 41 61 8410311712212111521 517Z1 627131211912399999999999999 118 951354 2099999999999999",
    "108102 99101107115121124121111 95 76 56 40 29 27 34 47 66 8510211412011921 518Z1 7 0124222612099999999999999 2 3 991445 2799999999999999",
    "115109104102102106110114115112104 91 76 60 46 37 35 40 51 68 8610211312021 519Z1 747115234012199999999999999 3161011549 3499999999999999",
    "120117111105100 98 98101104106106102 93 81 68 54 45 41 44 54 69 8610311621 520Z1 922107999999999999999999999 519 9817 5 4199999999999999",
    "123124119111101 93 87 85 88 93100104105101 92 79 64 52 46 47 56 71 9010821 521Z1 040124114410699999999999999 652 851822 4599999999999999",
    "122129128120107 92 78 70 68 73 84 96108114113105 91 74 59 51 51 60 77 9821 522Z1 124129132511599999999999999 745 681928 5099999999999999",
    "117130135130116 96 75 58 49 50 60 77 97115126127118102 82 66 56 57 68 8721 523Z1 159135143612899999999999999 826 482025 5599999999999999",
    "109128139140128107 80 54 36 28 33 50 75101124138139129110 90 72 64 67 8021 524Z1 232141153714099999999999999 9 6 282116 6399999999999999",
    "100122139146140121 93 61 32 14 10 21 44 75107133147148136116 95 79 73 7821 525Z1 3 3147163214999999999999999 946  922 2 7399999999999999",
    " 94115136149150137111 76 41 12 -3 -3 14 43 79113139152152139119100 86 8321 526Z1 3351511726154999999999999991028 -52246 8399999999999999",
    " 91108129146155149130 98 61 25 -1-13 -7 14 46 83117141153151138120103 9321 527Z1 4 81551819153999999999999991110-132329 9299999999999999",
    " 93103120139153155144120 85 48 15 -7-14 -4 19 52 8811914014914613411810521 528Z1 4431561913149999999999999991154-14999999999999999999999",
    " 98102113129144153151135109 75 40 12 -6 -8  4 28 59 9111813614213912811521 529Z1 51915420 614299999999999999 010 981239 -999999999999999",
    "105102107118132144148142125 99 68 38 15  3  4 17 39 67 9411713113513112221 530Z1 55814821 013599999999999999 0531021326  299999999999999",
    "112105104109118129137139131115 92 66 42 24 16 18 31 51 74 9711512612912521 531Z1 640139215512999999999999999 1411031415 1599999999999999",
    "117109103102106114122127127120106 88 68 49 36 30 34 45 61 8110011412312521 6 1Z1 730128224912599999999999999 24010215 8 3099999999999999",
    "121114106100 98100104110114115110101 88 73 59 49 45 47 57 71 8710311512321 6 2Z1 837115234112499999999999999 4 2 9816 6 4599999999999999",
    "124119111102 94 90 89 92 97102105104100 91 80 69 61 57 59 67 79 9310811921 6 3Z11021105999999999999999999999 538 891711 5799999999999999",
    "125124118108 96 85 78 76 79 85 93100103103 98 89 79 71 66 68 75 8610011321 6 4Z1 028125122310499999999999999 655 761818 6699999999999999",
    "123128125116102 86 73 64 62 67 76 88 99107109106 98 87 78 74 75 82 9310721 6 5Z1 1 9128135311099999999999999 748 621920 7399999999999999",
    "120129131125111 92 73 58 49 49 58 72 89105115118114105 93 84 79 80 8810121 6 6Z1 144131145611899999999999999 828 482015 7999999999999999",
    "116128134132121102 79 57 42 36 40 54 74 95113124126121109 97 87 83 86 9621 6 7Z1 216135154612799999999999999 9 4 3621 3 8399999999999999",
    "110124135137130113 89 63 40 27 26 36 56 81105124133133124111 98 89 87 9221 6 8Z1 246138162813499999999999999 937 252145 8699999999999999",
    "104119133140137124101 73 45 25 16 21 38 63 91116133139135124110 97 90 9121 6 9Z1 31514017 61399999999999999910 9 162223 8999999999999999",
    "100114129140142133114 86 56 30 13 11 22 44 73102126139142134121107 96 9221 610Z1 3441431743142999999999999991042 102257 9299999999999999",
    " 96108123137144140125101 70 41 18  7 10 28 54 85113133142140130116103 9521 611Z1 4131441819142999999999999991115  62330 9499999999999999",
    " 95103116131142144135115 87 56 28 10  6 15 37 66 96121136141136124110 9921 612Z1 4421441856141999999999999991149  6999999999999999999999",
    " 95 99109123136143140126102 73 44 21  8 10 24 48 7710512513713713011810521 613Z1 514143193413899999999999999 0 3 951225  799999999999999",
    " 98 97103115128137140133115 91 63 37 18 11 17 34 59 8711112813513312411221 614Z1 547140201513599999999999999 037 9613 3 1199999999999999",
    "102 97 98106117128135134124105 81 56 34 21 18 27 45 69 9411512913312912021 615Z1 624135205913399999999999999 117 971344 1799999999999999",
    "109100 97 99106116124129126115 98 76 55 37 27 27 37 56 7810111812913112621 616Z1 7 9129214513199999999999999 2 6 961429 2699999999999999",
    "116106 98 94 96102110117120118109 95 77 58 44 37 38 48 65 8610612112913021 617Z1 8 8121223313199999999999999 3 9 941521 3699999999999999",
    "124113102 93 88 88 93100107112112107 96 82 67 55 49 50 59 75 9311112413121 618Z1 933113232113199999999999999 430 881621 4899999999999999",
    "130122110 97 85 77 75 79 87 97105110110104 93 80 68 62 62 70 8410111712921 619Z11126111999999999999999999999 551 751728 6199999999999999",
    "134131120105 88 72 62 59 63 73 87101112117114106 94 82 74 73 80 9210812421 620Z1 0 7134131111799999999999999 656 591839 7399999999999999",
    "134137131117 97 75 56 43 40 46 61 80101117126127120107 94 85 83 8910111721 621Z1 051137143412899999999999999 751 401946 8399999999999999",
    "131141141132113 87 60 38 24 22 32 51 77103124137139131118104 94 92 9711021 622Z1 134142154113999999999999999 840 212049 9299999999999999",
    "125140147145130106 76 45 20  7  7 21 46 77107132145147139125110100 9810521 623Z1 217148164014899999999999999 928  52145 9899999999999999",
    "118134147153146127 98 64 31  6 -5 -2 17 46 8011313815115114212711210310221 624Z1 2591531733153999999999999991015 -6223510299999999999999",
    "110125141153156145122 90 54 21 -3-11 -4 18 50 8611814115215114012511110321 625Z1 34315618231539999999999999911 2-11232110399999999999999",
    "105115130146156156142116 82 46 15 -5-10  1 26 58 9312314315014713411910721 626Z1 42715719 8151999999999999991147-10999999999999999999999",
    "102106117133148155152135108 75 41 14 -2 -2 12 37 6910112614214613912611221 627Z1 511156195114699999999999999 0 41021232 -499999999999999",
    "102 99105118133146150144126100 69 39 18  8 11 27 52 8110912913913913111721 628Z1 557150203014199999999999999 046 991314  799999999999999",
    "104 96 96104116130140142134116 92 66 42 26 21 28 45 68 9311613013613312221 629Z1 64314221 613699999999999999 131 951354 2199999999999999",
    "109 97 91 93100111123130130122107 87 66 48 38 37 46 63 8310412113113212621 630Z1 733131214113399999999999999 221 911434 3699999999999999",
    "115102 92 87 88 94103113119119112100 85 69 57 52 54 64 79 9611312513012921 7 1Z1 831120221713199999999999999 319 861513 5299999999999999",
    "121109 97 86 81 81 86 94102108109106 98 87 77 69 67 70 79 9210611912713021 7 2Z1 949109225513099999999999999 430 801558 6799999999999999",
    "126117105 91 80 73 72 75 83 91 99103104100 94 87 82 80 83 9010111212212921 7 3Z11136104233913099999999999999 546 721654 8099999999999999",
    "129124114100 85 72 63 61 65 73 84 94103107107104 98 93 91 93 9810711712521 7 4Z11330108999999999999999999999 653 6118 6 9199999999999999",
    "130130123111 94 77 61 52 50 55 66 80 95107115116114108102 98 9810311112021 7 5Z1 027131145111699999999999999 747 491926 9899999999999999",
    "128132130121106 86 66 49 39 39 48 63 8210111512412612211410710210110611421 7 6Z1 115132154512699999999999999 832 38203510199999999999999",
    "123132135131118 99 75 53 36 28 31 44 65 8810912513313312611710810210210821 7 7Z1 159135162713499999999999999 912 28212810299999999999999",
    "118129136138130113 89 62 39 23 19 27 46 71 9712013414013612711510510110321 7 8Z1 23913817 414099999999999999 950 19221110199999999999999",
    "111123135141139127105 77 49 26 14 14 28 52 8010812914114213512311110210021 7 9Z1 3171421738143999999999999991026 122247 9999999999999999",
    "105116130141145138121 94 64 36 15  8 14 34 61 92119137145142131117105 9821 710Z1 35414518111459999999999999911 2  82320 9799999999999999",
    " 99108122137146146134112 83 51 25  9  7 19 43 74104128142145137124109 9821 711Z1 4301471844145999999999999991138  62354 9599999999999999",
    " 95100112128142148144128102 71 41 18  7 11 28 56 8711513514414213111610121 712Z1 5 81481917144999999999999991214  7999999999999999999999",
    " 93 93102116132143146138119 92 61 34 16 11 20 42 7010012413914313612310721 713Z1 547146194914399999999999999 029 921251 1199999999999999",
    " 94 89 92103118132141141130110 83 55 33 20 21 34 57 8511113114114012911421 714Z1 630142202214299999999999999 1 8 891328 1999999999999999",
    " 98 88 85 90101116128135133122102 78 55 38 31 35 50 73 9912113614013512221 715Z1 718136205514099999999999999 151 8514 7 3099999999999999",
    "105 91 81 80 85 97110121127125115 98 79 61 49 46 52 68 8911112813813812921 716Z1 816127213013999999999999999 243 791449 4599999999999999",
    "114 98 83 74 73 78 88100111118118111100 85 72 64 63 70 8410212013213813421 717Z1 93111922 613899999999999999 345 721536 6399999999999999",
    "124108 91 76 66 63 67 76 88100109114112106 96 87 81 81 87 9811212613513721 718Z11114114224913799999999999999 457 631634 8099999999999999",
    "132120103 85 68 56 51 53 61 75 90103113117116110103 98 9610010811912913621 719Z11314117234113899999999999999 613 501749 9699999999999999",
    "138132119100 79 59 44 36 37 47 63 8210111612612812411711110710811312213221 720Z11451128999999999999999999999 723 36191910799999999999999",
    "139140134120 99 74 50 32 22 23 34 54 7810212313513913512711811211111512421 721Z1 042140155813999999999999999 825 21204211099999999999999",
    "134143145138121 97 68 41 20  9 11 26 50 7910713014414714213111911110911521 722Z1 145145164914899999999999999 921  9214510999999999999999",
    "125138148150142122 94 62 32 10  0  5 23 51 8411513815015114212811510610621 723Z1 2441501732152999999999999991011  0223310599999999999999",
    "114127142153154143121 89 55 24  3 -3  5 28 59 93124144153149137120106 9921 724Z1 3371551811153999999999999991056 -32314 9999999999999999",
    "102113130147157156142116 83 48 19  2  0 13 39 72105132148151143127109 9621 725Z1 4261581845152999999999999991138 -12352 9299999999999999",
    " 92 99114132149157153136109 76 43 18  6 10 27 55 87117139148145132114 9721 726Z1 5121571915149999999999999991216  6999999999999999999999",
    " 87 87 97115133148153146127100 68 41 22 17 26 47 7510412814214513612010121 727Z1 556153194314599999999999999 029 861251 1799999999999999",
    " 86 80 84 97114132143145135116 90 64 43 32 33 46 68 9411813514213912610821 728Z1 64014620 814299999999999999 1 7 801323 3199999999999999",
    " 90 78 76 82 96112127135134124106 84 64 50 46 52 68 8911112913913913011521 729Z1 724136203214099999999999999 147 751352 4699999999999999",
    " 97 82 73 73 80 93107119125122113 98 82 69 62 63 72 8810612213413813312221 730Z1 813125205713899999999999999 232 721421 6199999999999999",
    "106 89 76 70 70 77 88100110114112106 96 86 78 76 80 9010311712813413412721 731Z1 914114212413599999999999999 325 691451 7699999999999999",
    "114 99 84 73 67 67 72 81 92100105107104 99 94 91 91 9510311312312913212921 8 1Z11046107215913299999999999999 430 661527 9199999999999999",
    "121109 95 81 70 63 61 65 73 83 9310110610810710510410410611111712312712921 8 2Z11314108224812999999999999999 546 61163110399999999999999",
    "126119107 93 78 65 56 53 56 65 76 8910111011611711611411211211311712212521 8 3Z115 3117999999999999999999999 659 53183911199999999999999",
    "127125119107 91 74 58 47 43 47 58 73 9010611812512712512011511211211512021 8 4Z1 0 3127155112799999999999999 8 0 43202911299999999999999",
    "126129128120106 87 67 49 37 33 40 54 74 9611512813513412812011310810911321 8 5Z1 118129162413599999999999999 850 33212710899999999999999",
    "121129134132122104 81 57 37 25 25 36 55 8010512513814113712711610710310621 8 6Z1 216134165314199999999999999 932 2422 410399999999999999",
    "114126136140136121 98 71 45 25 16 20 37 62 91117136145144134121107 99 9821 8 7Z1 3 31401721146999999999999991011 162236 9899999999999999",
    "105118133144146138118 90 60 32 14 10 21 43 73104129145148141127110 97 9121 8 8Z1 3451471748148999999999999991047 1023 7 9199999999999999",
    " 95107124141151150136111 80 48 22  9 11 28 55 88118140150147134116 98 8721 8 9Z1 4261521815150999999999999991123  82338 8599999999999999",
    " 85 94111131147154149131103 69 39 17 10 18 41 72104132148150141123102 8621 810Z1 5 61541842151999999999999991157 10999999999999999999999",
    " 78 81 95115135150154145123 93 61 34 19 18 33 59 91120142151146131109 8821 811Z1 54815419 915199999999999999 012 771231 1799999999999999",
    " 74 71 79 96117136149149137114 86 58 37 28 34 53 80109133148149137118 9521 812Z1 633150193515099999999999999 047 7113 5 2899999999999999",
    " 76 65 66 77 95116133143141128107 82 60 47 45 55 7510012414214814212610421 813Z1 72114320 114899999999999999 126 641339 4499999999999999",
    " 83 66 59 62 74 92111126133131120103 85 70 63 65 77 9611713514514413411521 814Z1 817134202714699999999999999 211 591414 6299999999999999",
    " 94 74 60 55 58 69 85102115122122115104 93 84 82 86 9811312813914313812521 815Z1 928123205614399999999999999 3 4 551451 8299999999999999",
    "107 87 69 56 51 53 62 75 9010311211611511010510110010411312313313913913321 816Z11118116213314099999999999999 412 51153710099999999999999",
    "120104 85 68 55 47 46 52 63 77 9110411411912011911611511612012613213513521 817Z11352120223013699999999999999 538 4617 411599999999999999",
    "130120106 88 69 53 42 37 40 50 65 8310111712713213112712312012012312713221 818Z11522132999999999999999999999 7 7 37193312099999999999999",
    "135133125111 92 70 50 35 27 28 39 58 8110412413714213913212311711411712321 819Z1 0 913516 714299999999999999 820 2621 111499999999999999",
    "131138139133118 95 70 45 26 17 20 34 57 8511213414614814112911610710511021 820Z1 142139164114899999999999999 917 17214910599999999999999",
    "121134144147140122 96 66 38 18 11 17 35 63 95123143151148136119104 95 9621 821Z1 25014717111529999999999999910 4 112226 9599999999999999",
    "106122139151154144122 92 59 31 13 10 21 45 76109135150152142124105 90 8421 822Z1 3431541739153999999999999991045  923 0 8499999999999999",
    " 90105126145157156143117 85 52 27 14 16 34 61 94124145152147131109 89 7721 823Z1 42915818 4153999999999999991120 132332 7599999999999999",
    " 76 88108131150159154136108 76 46 27 21 30 53 82113137150149136115 92 7421 824Z1 5111591827151999999999999991152 21999999999999999999999",
    " 67 73 89112135151155147126 98 68 45 33 35 50 75104129146150141122 98 7621 825Z1 551155184815099999999999999 0 3 671221 3299999999999999",
    " 63 62 73 92115136148148136114 89 65 49 45 54 73 98122141148144129106 8321 826Z1 63014919 814999999999999999 036 611247 4599999999999999",
    " 65 57 61 75 96117133141137124104 83 67 59 62 76 95117135145145134115 9221 827Z1 710141192714699999999999999 1 9 571312 5999999999999999",
    " 72 59 56 63 78 97115127131126113 98 83 74 74 81 9611313014114313612210221 828Z1 753131194614499999999999999 146 551335 7399999999999999",
    " 82 66 57 57 66 80 96110119121116107 97 89 86 90 9911112513513913612611121 829Z1 84512120 614099999999999999 228 561358 8699999999999999",
    " 93 76 64 58 59 67 79 92103110112111106102 9910010411212112913413312811721 830Z110 2112202813499999999999999 320 581420 9999999999999999",
    "104 89 76 66 60 60 65 74 84 9410210811011111111111211511912312712812612121 831Z12055128999999999999999999999 430 59999999999999999999999",
    "113102 90 78 67 60 57 60 66 76 88 9810811511912112112011911912012112212121 9 1Z1152912122 612299999999999999 6 1 57182311999999999999999",
    "119113105 93 80 66 56 50 51 58 70 8410011312312912912712211811511411511821 9 2Z11542130999999999999999999999 723 50205111499999999999999",
    "121122118110 96 79 62 48 41 41 51 67 8610612313313713412711811010610711221 9 3Z1 04612216 213799999999999999 823 40212410699999999999999",
    "119126129126115 96 74 53 37 30 34 48 69 94117134143142134121109100 9710221 9 4Z1 2 3129162414399999999999999 9 9 302151 9799999999999999",
    "112125135139133117 93 66 42 26 21 30 51 78107131145148141126109 95 88 9021 9 5Z1 255139164714999999999999999 949 212217 8799999999999999",
    "101117134146148138116 86 56 31 17 19 35 61 93122144152148134113 93 80 7721 9 6Z1 3391491710153999999999999991025 162245 7699999999999999",
    " 85103125145156154138111 78 46 24 16 24 46 78111138153154142120 96 75 6621 9 7Z1 42215717331569999999999999911 0 162315 6599999999999999",
    " 69 84108133153161155134104 70 41 24 23 38 65 98129150157149129102 76 5921 9 8Z1 5 41611757157999999999999991134 212348 5499999999999999",
    " 55 65 86113139157161151127 96 65 42 32 38 58 88119144157154138112 83 5921 9 9Z1 54716218211589999999999999912 7 32999999999999999999999",
    " 46 48 64 88117141155156143120 92 66 50 48 60 82110136153156145122 94 6621 910Z1 633158184415799999999999999 022 451239 4799999999999999",
    " 46 39 46 64 90116138148147134113 91 73 65 69 84105129147155150132107 7921 911Z1 72214919 715599999999999999 1 0 391311 6599999999999999",
    " 54 40 37 47 65 89112129137136125110 95 85 84 91105123140150150139119 9421 912Z1 819138193015199999999999999 141 371341 8399999999999999",
    " 70 50 40 39 48 65 8410311712512512011210410110311012113414314714212911021 913Z1 934126195514799999999999999 231 38141110199999999999999",
    " 89 68 53 44 43 49 61 76 9110411411811911811611511712212913513913913312221 914Z11149120202513999999999999999 337 42144611599999999999999",
    "107 90 74 59 50 45 47 54 66 80 9410711712412712712612512612712913013012721 915Z11440127212413099999999999999 512 45172412599999999999999",
    "121111 98 83 67 54 45 42 46 56 71 8810612113113613513112512011811812012421 916Z11518136999999999999999999999 658 42202311799999999999999",
    "126125120108 92 73 55 42 35 38 49 68 9011213014014213712711610810410611421 917Z1 018126154514399999999999999 813 3521 710499999999999999",
    "123131134130117 97 74 52 36 29 34 49 72 98123140147144132116102 92 91 9821 918Z1 158134161014799999999999999 9 7 292139 9099999999999999",
    "111127140144139122 98 71 47 31 27 36 56 84112135148149138120100 84 77 8121 919Z1 259144163315099999999999999 948 2622 9 7799999999999999",
    " 95115135149152143122 94 65 41 29 30 46 71101128147152145126103 81 67 6521 920Z1 3461521655153999999999999991023 282237 6599999999999999",
    " 76 97122143156155141116 86 58 39 33 42 63 91120143153150134109 83 63 5421 921Z1 4271571716154999999999999991054 3323 6 5499999999999999",
    " 60 78103130150158153134107 78 55 42 44 59 84112137152153140117 89 64 4921 922Z1 5 61581735154999999999999991122 412335 4699999999999999",
    " 48 60 84112137153156145124 98 73 56 52 61 81106131149154146125 98 70 4921 923Z1 5431561753154999999999999991148 52999999999999999999999",
    " 41 47 66 92119141151149135114 91 72 63 67 81102125144153149132108 79 5521 924Z1 620152181115399999999999999 0 4 411213 6399999999999999",
    " 41 40 52 73 99123140145139125106 88 76 75 84101121139149149137116 90 6521 925Z1 657145183015199999999999999 034 381237 7499999999999999",
    " 47 39 44 59 81104124135137129116101 90 86 90101117133144147140123101 7721 926Z1 738137184814799999999999999 1 7 3913 0 8699999999999999",
    " 57 45 43 51 66 86106120127127120111102 97 97104115127137142138127110 9021 927Z1 82512819 614299999999999999 142 421323 9699999999999999",
    " 71 56 48 49 57 71 8710211311911911511010710610911512313113513412811610121 928Z1 931119192313599999999999999 225 48134310699999999999999",
    " 85 70 60 54 55 61 72 84 9610611211511511511511511812112512712712411810921 929Z11935128999999999999999999999 323 54999999999999999999999",
    " 98 86 75 65 59 58 61 68 78 8910010911612012312312212112012011911811611321 930Z11451123999999999999999999999 453 58999999999999999999999",
    "108101 92 81 70 61 55 55 60 70 84 981111221291311291241191131101091111132110 1Z11459131999999999999999999999 633 55205210999999999999999",
    "115114110100 87 71 58 49 47 53 65 83102120132138136129119109101 981011072110 2Z1 021115151813899999999999999 745 4621 3 9899999999999999",
    "116123125120107 89 69 51 40 39 48 66 89113132143144136123107 93 86 87 952110 3Z1 150125153814599999999999999 836 382124 8599999999999999",
    "109124135137129112 87 62 42 32 35 50 74101127144151145129109 89 75 71 782110 4Z1 24513816 015199999999999999 918 322150 7199999999999999",
    " 95116136148148136112 83 56 36 30 38 59 88118142155153138114 88 67 56 592110 5Z1 332150162215699999999999999 956 292218 5599999999999999",
    " 74 99126148159156138110 78 51 35 35 49 76107136155159147124 93 65 46 412110 6Z1 4161601645159999999999999991032 332249 4099999999999999",
    " 51 75105135157166158136106 75 52 42 48 68 97128151162156135104 71 43 292110 7Z1 5 116617 81629999999999999911 7 422323 2799999999999999",
    " 31 49 78112142161166155132103 76 59 56 67 91119145160161146117 83 50 272110 8Z1 5461661732163999999999999991141 552358 1999999999999999",
    " 19 27 50 82116143159160148126101 81 71 75 90113137156162153131 99 65 362110 9Z1 6341621756162999999999999991214 71999999999999999999999",
    " 18 17 30 55 86116139151150139121103 90 87 95111131149159156141115 84 53211010Z1 726152182015999999999999999 037 151246 8799999999999999",
    " 30 19 21 36 59 86112130140139131119108102104113126141151154146128103 76211011Z1 827140184515499999999999999 119 18131810299999999999999",
    " 51 33 26 30 43 62 84104119127129126120115114117124133141146143134117 97211012Z1 949129191214699999999999999 2 9 26135111499999999999999",
    " 75 56 43 37 39 48 62 78 94108118124125125123123124127131134135131124112211013Z112 7125194213599999999999999 315 37145112399999999999999",
    " 98 82 67 56 48 46 50 59 71 86101114123129130129126123121120121121121118211014Z1135713021 912199999999999999 450 4619 212099999999999999",
    "113105 93 80 67 56 50 49 55 67 82100116128135135130123114108105106110115211015Z11433136999999999999999999999 636 49201610599999999999999",
    "119120115105 91 74 60 50 47 53 66 85105123136140136126112 99 91 89 93103211016Z1 04012015 014099999999999999 750 472048 8999999999999999",
    "115125129126114 97 77 59 48 46 55 72 94116134144142132114 96 80 73 75 86211017Z1 2 5129152314499999999999999 841 462117 7399999999999999",
    "103121134139134119 98 75 57 47 49 62 83108130145148139120 97 76 62 59 67211018Z1 3 0139154514899999999999999 921 472145 5899999999999999",
    " 86109130144147138119 95 71 55 50 58 75100125144151146129103 76 56 46 50211019Z1 34414716 615199999999999999 955 502213 4699999999999999",
    " 66 91118140152150137114 89 68 57 58 71 93118140152151137112 82 56 39 36211020Z1 4241531626154999999999999991025 562240 3599999999999999",
    " 48 72101129148155149131108 84 68 63 71 89112135151155144122 92 61 38 28211021Z1 5 11551645155999999999999991053 6323 8 2899999999999999",
    " 34 53 81112138153154143124101 82 72 74 87108130148155149130102 71 43 26211022Z1 53715517 5155999999999999991120 722337 2399999999999999",
    " 25 38 62 93122143152149135116 96 83 80 88104124142153152138113 83 53 31211023Z1 6131531724154999999999999991146 80999999999999999999999",
    " 22 28 47 74103128144148141126109 95 88 91103119136148151142122 95 66 42211024Z1 649148174415199999999999999 0 6 221212 8899999999999999",
    " 27 25 37 58 84110130140140131118106 97 96103115130142147143128106 80 56211025Z1 72914118 514799999999999999 037 251238 9699999999999999",
    " 38 30 33 47 68 92113127133131124114106103105113124134141140131114 93 71211026Z1 813133182514199999999999999 111 3013 410299999999999999",
    " 52 40 37 43 57 75 94111122126124119114110109113119127132134129119103 86211027Z1 912126184513499999999999999 150 37133510999999999999999",
    " 69 55 46 45 51 62 77 93106116120121119117115115117121124125124118109 98211028Z1104512119 312599999999999999 241 45142711599999999999999",
    " 85 72 61 54 52 55 63 75 89102112119123124122120118116115115114113111106211029Z11250124999999999999999999999 354 52999999999999999999999",
    " 99 90 80 69 60 55 55 61 71 85100113123129130127121114108104102103106108211030Z11345130234810999999999999999 530 5420 410299999999999999",
    "109107100 89 76 63 55 52 57 68 85103119131137135127116103 93 88 89 95104211031Z11415137999999999999999999999 652 522024 8899999999999999",
    "113119119111 98 80 64 52 48 55 69 90112130141143135120102 85 74 71 77 902111 1Z1 130120144114399999999999999 752 482050 7199999999999999",
    "107123132132123104 83 63 50 48 57 76101125142150145129106 82 62 52 55 692111 2Z1 23213415 615099999999999999 841 472119 5299999999999999",
    " 90115135146145131109 83 62 51 52 66 90116140154154140115 85 57 38 33 432111 3Z1 323147153115599999999999999 924 492151 3399999999999999",
    " 65 95125148158153136110 84 64 56 62 81107134153160151128 95 61 33 17 192111 4Z1 41215815561609999999999999910 4 562225 1699999999999999",
    " 37 66102134156164157137111 86 70 67 78100126149162160142111 74 38 13  32111 5Z1 5 01641623163999999999999991042 6723 2  399999999999999",
    " 12 36 71108140160165155135111 90 80 82 96119142160165154129 93 55 21  12111 6Z1 5491651650165999999999999991119 792341 -399999999999999",
    " -2 12 40 76112141157160149131111 96 91 98114134153163161143114 77 41 132111 7Z1 6401601718164999999999999991156 91999999999999999999999",
    " -1  1 18 47 80112137150151142127113104103112127144156160151130100 67 362111 8Z1 735152174816099999999999999 022 -2123210299999999999999",
    " 14  5 10 28 54 83110130140141135124115111113121133145152150139118 91 632111 9Z1 836142182115299999999999999 1 7  5131111099999999999999",
    " 39 23 17 23 38 60 83105121131133130123118116118124132138141137126109 88211110Z1 951133185714199999999999999 158 1714 111699999999999999",
    " 67 48 36 32 36 47 64 83100115124128128124120117117119123126127124116105211111Z11120129194712799999999999999 3 0 32153611799999999999999",
    " 91 75 61 51 46 47 54 67 82 98112122128129125120114110108108110113113111211112Z11238129215011399999999999999 418 46181610899999999999999",
    "106 98 86 74 64 57 55 59 69 83 99114125131131125115105 97 92 92 95101108211113Z11326132999999999999999999999 547 551934 9199999999999999",
    "112112107 97 85 73 64 60 64 73 88105121132135131121106 91 80 74 76 84 96211114Z1 032112135913599999999999999 7 3 602016 7499999999999999",
    "108117120117106 92 78 68 64 68 80 96115130139138128111 91 73 61 58 64 78211115Z1 159120142714099999999999999 759 642049 5899999999999999",
    " 96113126130124112 96 80 70 68 75 89108127140144137120 97 73 54 44 46 59211116Z1 256130145314499999999999999 844 682120 4399999999999999",
    " 79103123135137129114 96 81 73 74 84102122138147144130106 78 52 36 31 40211117Z1 342138151714799999999999999 922 722149 3199999999999999",
    " 60 87113133143142130113 95 81 77 82 97116135147149139117 87 57 34 22 25211118Z1 422144154015099999999999999 957 772218 2199999999999999",
    " 42 68 98125143149143128109 93 83 83 93110129145152146127 99 67 38 19 15211119Z1 45914916 3152999999999999991029 822247 1599999999999999",
    " 26 49 79110135148149140123105 92 87 92105123140151150136111 80 48 23 12211120Z1 5351501626152999999999999991059 872317 1199999999999999",
    " 15 33 60 92121141149146133117101 92 93102117134147151143122 94 62 34 15211121Z1 6111491650151999999999999991128 912348 1099999999999999",
    " 11 21 44 73103128143146139126111 99 95100112127141148145131107 77 48 25211122Z1 6471461714149999999999999991157 95999999999999999999999",
    " 14 16 31 56 85111131140140131118107100100108120133143144135117 92 64 40211123Z1 725141174014599999999999999 020 131227 9999999999999999",
    " 23 18 25 43 67 93116130135133124114106102106114125134139135123104 80 57211124Z1 8 713518 613999999999999999 055 1813 010299999999999999",
    " 37 26 26 36 54 76 98116127130127120112107106110117124130130124112 94 74211125Z1 856130183613199999999999999 133 25134110699999999999999",
    " 55 40 33 35 45 62 81100115124127124119113109108110114119121120114103 89211126Z1 957127191412199999999999999 218 33144710899999999999999",
    " 73 58 47 42 44 52 67 84101114123126125120114109106105106108110110107100211127Z111 8126202911199999999999999 315 42165210599999999999999",
    " 90 78 66 56 50 51 57 70 86102116125129127121113104 97 93 93 95 99103105211128Z1121112923 610599999999999999 427 501841 9399999999999999",
    "104 98 88 76 65 58 56 61 73 89106121130134130120107 94 82 76 76 81 91101211129Z11257134999999999999999999999 546 561932 7599999999999999",
    "109113110101 88 74 64 60 65 77 94113128138138130114 95 76 62 56 58 70 86211130Z1 1 4113133413999999999999999 657 602011 5599999999999999",
    "104118125124114 98 82 70 65 71 84103123138145141126103 77 54 38 35 43 612112 1Z1 21912614 714599999999999999 758 652048 3499999999999999",
    " 86110130139137125107 88 76 72 79 95116135148150139116 86 55 30 16 17 322112 2Z1 319139143915199999999999999 850 722127 1499999999999999",
    " 58 89119141150147132113 94 82 80 90108129147156152133103 67 33  8 -2  52112 3Z1 413150151215799999999999999 938 8022 7 -299999999999999",
    " 26 59 95127149157152136116 98 89 90102121142157160149124 88 49 15 -7-122112 4Z1 5 51571545161999999999999991023 882249-1399999999999999",
    "  0 26 62100132152159152136117102 95100114133151162160142112 74 35  4-142112 5Z1 55615916201639999999999999911 5 952332-1699999999999999",
    "-14  2 31 68105134151155147132116104101108123141156162154133101 63 27  02112 6Z1 6481551657162999999999999991146101999999999999999999999",
    "-12 -9 10 40 75108133147149140127113105105114128144155156145122 91 57 262112 7Z1 740149173715799999999999999 016-13122810499999999999999",
    "  4 -3  3 22 50 81109130140141133121111105107116128141147145133112 84 552112 8Z1 831142181914899999999999999 1 2 -3131410599999999999999",
    " 30 15 11 18 36 61 87110126134133126116108104106113123131136132121103 812112 9Z1 92413419 613699999999999999 150 1014 810499999999999999",
    " 58 40 29 27 35 51 71 92111124129128121112104100101106112118121119111 98211210Z1101612920 612199999999999999 239 27152210099999999999999",
    " 82 65 52 44 44 51 64 80 98113123127125118109100 94 92 94 98103107108104211211Z111 8127213910899999999999999 333 4317 2 9299999999999999",
    " 97 86 75 65 59 59 64 75 89103116124127124115104 93 84 79 79 83 89 96101211212Z11157127235410399999999999999 434 581832 7999999999999999",
    "103100 94 86 78 72 71 75 84 96109120127129123112 98 83 71 64 64 69 79 90211213Z11242129999999999999999999999 544 711933 6399999999999999",
    "100106107103 96 88 82 79 83 91102115126132130122106 87 69 55 49 50 60 74211214Z1 143107132113299999999999999 655 792017 4899999999999999",
    " 90105114117113105 95 88 85 88 97109122132135131117 97 74 53 39 35 41 56211215Z1 254117135713599999999999999 758 852054 3599999999999999",
    " 76 96114124126120110 99 91 89 93103117129138137127108 83 57 36 24 25 37211216Z1 344126143013999999999999999 851 892128 2399999999999999",
    " 58 83106124133133124112100 92 92 98110125137141136120 95 66 39 21 14 20211217Z1 42613415 114199999999999999 935 9122 0 1499999999999999",
    " 39 65 93118134140135124110 99 93 95105119133142142131109 80 49 24  9  8211218Z1 5 21401531144999999999999991014 932232  799999999999999",
    " 22 46 76105128141142134120106 96 94100112127140145139122 95 63 33 12  3211219Z1 53714316 1145999999999999991048 9423 5  399999999999999",
    "  9 29 57 89116135143140129114101 95 96105120135144144132110 79 48 21  5211220Z1 6111431630146999999999999991119 942338  299999999999999",
    "  3 15 40 70101125139141134121107 97 94100112127139144139122 96 65 35 13211221Z1 64414217 1144999999999999991150 94999999999999999999999",
    "  3  8 26 53 83110130138137127114101 95 96104117131140140130109 82 53 27211222Z1 718139173314199999999999999 011  31222 9499999999999999",
    " 11  7 17 38 66 94117132136131120107 97 94 98108120131136132119 97 71 45211223Z1 75413618 613699999999999999 045  71258 9499999999999999",
    " 24 14 16 29 51 78103122132132125113102 95 93 99108119127129122108 87 64211224Z1 832133184512999999999999999 121 131340 9399999999999999",
    " 42 27 21 27 42 64 88110125131128120109 98 92 92 97105113119119113 99 82211225Z1 912131193312099999999999999 2 0 211434 9199999999999999",
    " 62 45 35 33 40 55 75 97115126129125116105 95 88 87 90 96103108110105 95211226Z1 955129204211099999999999999 244 321548 8799999999999999",
    " 82 67 54 46 46 53 67 85104119127129123113100 89 81 77 78 83 91 98102102211227Z11041129223110399999999999999 335 451715 7799999999999999",
    " 97 89 78 67 60 60 66 78 93109122129129122110 94 80 68 62 62 68 77 88 98211228Z11129130999999999999999999999 438 591830 6199999999999999",
    "104105100 92 82 75 73 77 87101115127132131121105 86 67 51 43 43 51 65 82211229Z1 037105121713399999999999999 553 731930 4299999999999999",
    " 98110116114107 97 88 84 86 94107121132137133120 99 75 51 32 23 24 36 56211230Z1 21511613 513799999999999999 710 832022 2299999999999999",
    " 80103120129129121110100 94 95102115128138141134116 90 60 32 12  3  8 25211231Z1 329130134814199999999999999 822 9321 9  399999999999999",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseTideLines(lines);
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 潮位データ
// http://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php

// 油壺
// 20XX年

(function() {
  var lines = [
" 51 81109130140140131118105 99 99108121136145146135112 81 47 16 -4-11 -322 1 1Z1 427141143514799999999999999 924 982157-1199999999999999",
" 19 50 85116138148147136122109102104113128142151149133106 71 34  3-16-2022 1 2Z1 52114915201519999999999999910191022244-2199999999999999",
" -7 19 54 91122143151147135119106101105117133148155150131100 63 26 -4-2122 1 3Z1 6 815116 71559999999999999911 51012329-2399999999999999",
"-20 -4 26 62 98128145150143128112101 98105119136150155147125 93 56 20 -622 1 4Z1 6511501653155999999999999991147 98999999999999999999999",
"-18-13  7 37 73106131144144134118103 94 94104120136148150139116 85 50 1922 1 5Z1 730146173915199999999999999 013-181228 9399999999999999",
" -2 -8  1 23 53 86114133140136123107 94 88 91102117132142141128106 77 4722 1 6Z1 8 7140182614399999999999999 055 -81310 8799999999999999",
" 23  9  8 20 43 71 98120133135127112 97 86 82 87 98112124131128116 96 7222 1 7Z1 839135191413199999999999999 133  71356 8299999999999999",
" 48 31 24 28 42 63 87109125131128118103 89 79 77 81 91103113117114104 8822 1 8Z1 91013120 711799999999999999 2 9 241449 7799999999999999",
" 70 54 44 42 49 63 82101117127128122110 95 82 74 71 75 82 92100103102 9522 1 9Z1 940129211310499999999999999 242 421554 7199999999999999",
" 85 73 64 59 61 69 81 97111122127125117104 90 77 68 64 66 71 79 87 92 9422 110Z110131272257 9499999999999999 316 591712 6499999999999999",
" 92 87 81 77 75 78 84 95106116123125122113100 85 71 61 55 55 60 68 77 8622 111Z11052125999999999999999999999 355 751831 5499999999999999",
" 92 95 95 93 90 89 91 95102111118123124120111 97 80 64 51 44 43 49 59 7222 112Z1 128 95114312499999999999999 459 891935 4399999999999999",
" 85 96103105104101 99 98101105112119123124120109 93 73 54 39 32 32 41 5522 113Z1 312105124212599999999999999 644 982026 3199999999999999",
" 73 90104113116114109104101101106112120125126120106 86 64 42 27 20 24 3722 114Z1 4 2116133812799999999999999 82210121 8 2099999999999999",
" 56 79 99115123124119111104100100105114123129129119101 77 51 29 14 11 2022 115Z1 437124142713099999999999999 924 992146 1199999999999999",
" 38 63 88110125130127119109100 96 99107118129134130116 94 66 38 16  4  622 116Z1 5 813015 81349999999999999910 7 962222  399999999999999",
" 20 44 73100121132133126114102 94 93 99111124135138130110 83 52 24  5 -222 117Z1 5371341546138999999999999991040 932257 -299999999999999",
"  6 27 55 85112129135131120106 94 89 92102117131140139125101 70 38 12 -322 118Z1 6 51351623141999999999999991111 892330 -499999999999999",
" -3 12 38 69 99122134135126111 96 86 85 92107123137142136117 89 57 26  422 119Z1 6331361658142999999999999991140 84999999999999999999999",
" -4  3 24 53 84112130135130117100 87 80 83 95111128139140129106 76 45 1822 120Z1 7 0135173514199999999999999 0 2 -41212 8099999999999999",
"  2  1 15 39 70100122134133122106 89 78 76 83 97114129137134119 94 65 3722 121Z1 726135181313799999999999999 034  01245 7599999999999999",
" 16  7 13 31 58 87113129134127113 95 79 71 72 82 98114126131124108 84 5822 122Z1 753134185513199999999999999 1 7  71322 7199999999999999",
" 35 21 19 30 50 77102122132130119102 84 71 66 69 80 95110120122114 99 7822 123Z1 820133194312299999999999999 139 1814 5 6699999999999999",
" 57 41 33 36 50 70 93114128131124110 92 75 64 60 64 75 88101110111106 9422 124Z1 848131204411299999999999999 213 331456 6099999999999999",
" 78 64 53 50 56 70 88107121129127117101 83 67 57 53 56 65 77 89 9810210022 125Z1 918129221110299999999999999 250 5016 1 5399999999999999",
" 94 85 76 70 70 76 87101115124127123111 95 78 62 50 44 45 52 63 76 87 9522 126Z1 952127999999999999999999999 333 691721 4499999999999999",
"100100 97 92 89 88 92100109119125125120109 93 75 57 42 33 31 36 48 62 7822 127Z1 031100103812699999999999999 435 881846 3199999999999999",
" 93104110111108105102103106112119124125121110 94 73 52 33 20 16 20 33 5222 128Z1 245111114512599999999999999 62410220 0 1699999999999999",
" 74 95112122125122116110107107111118125128126115 97 72 46 23  6  0  6 2222 129Z1 35712513 712899999999999999 82210621 2  099999999999999",
" 46 74101121133135129120110104103109118128135133121 99 71 40 12 -6-12 -322 130Z1 443135142013599999999999999 9351032155-1299999999999999",
" 17 47 80110131141140130116104 97 98106120134142140125100 67 32  3-15-1822 131Z1 5221421520142999999999999991023 962241-1999999999999999",
" -5 21 55 90120138144138123106 93 87 92106123140148144126 97 61 25 -3-1822 2 1Z1 55714416121489999999999999911 2 872324-1999999999999999",
"-16  2 32 68102129142142130111 93 80 79 88106127143150143122 90 53 19 -522 2 2Z1 62814417 0150999999999999991138 78999999999999999999999",
"-13 -6 17 49 85115135141134117 96 78 69 73 87107129143147136113 81 46 1822 2 3Z1 656141174514799999999999999 0 2-131214 6999999999999999",
"  1 -1 13 39 71102126138136122101 80 65 61 69 86108127139138125101 71 4222 2 4Z1 722139182814099999999999999 036 -21250 6199999999999999",
" 21 13 18 37 63 92117132135126108 86 67 56 57 68 86106122129126111 89 6522 2 5Z1 744136191112999999999999999 1 6 131327 5599999999999999",
" 43 31 31 42 62 86110127134129114 94 73 58 51 55 67 84101113117112 99 8122 2 6Z1 8 5134195611799999999999999 133 2914 8 5199999999999999",
" 63 50 46 52 65 85105121130129119103 83 65 53 50 54 66 80 93102104 99 9022 2 7Z1 825131204810499999999999999 156 461454 5099999999999999",
" 78 68 62 64 72 86102116126128122110 93 75 61 51 49 53 62 73 84 91 93 9122 2 8Z1 84612822 3 9399999999999999 218 621551 4999999999999999",
" 87 81 77 77 81 89100111120124122114102 87 72 59 51 47 49 56 65 74 81 8722 2 9Z1 911124999999999999999999999 235 7717 6 4799999999999999",
" 89 90 90 90 91 95101107113117118115108 98 86 72 59 49 43 43 47 55 65 7622 210Z1 9431189999999999999999999991834 42999999999999999999999",
" 85 93 98101102103104105108110112113111107 98 87 72 57 44 36 34 38 48 6122 211Z110521139999999999999999999991950 34999999999999999999999",
" 76 90101108111111108106104103105108111112109101 88 71 52 36 26 24 30 4322 212Z1 420112125211299999999999999 8361032047 2499999999999999",
" 61 81 98111118119115108102 98 97101107113117114104 87 66 43 25 15 15 2522 213Z1 43611914 811799999999999999 934 972130 1499999999999999",
" 44 67 90109121125121112102 94 90 93100111120124119105 83 57 32 13  5 1022 214Z1 45712515 01249999999999999910 5 9022 8  599999999999999",
" 26 51 78103121129127117104 92 84 84 91104118129131122102 75 45 19  3  022 215Z1 5181291542131999999999999991032 832242 -199999999999999",
" 11 34 63 93116130131123108 92 79 75 80 93111127137135120 95 63 32  8 -322 216Z1 5401321621137999999999999991058 752314 -499999999999999",
"  1 20 48 80108128134129114 95 77 67 68 80 98119135141134114 84 51 21  222 217Z1 6 11341659141999999999999991126 662345 -299999999999999",
" -2 10 35 67 98123135134120100 79 63 58 65 82104126139141129105 73 41 1622 218Z1 6231361737142999999999999991155 58999999999999999999999",
"  4  8 27 55 88115133137127107 83 63 51 52 64 85109129139136120 94 64 3622 219Z1 645137181814099999999999999 015  31227 5099999999999999",
" 18 14 25 48 78107128137132115 91 66 49 42 48 65 88111128134128110 85 5922 220Z1 7 713719 013499999999999999 045 1413 1 4299999999999999",
" 38 28 32 48 72 99122135134122100 74 52 39 37 47 65 87108121125117101 8122 221Z1 729136194812599999999999999 115 281338 3799999999999999",
" 61 48 46 54 71 94115130134127109 85 61 43 34 35 46 63 83100111113108 9622 222Z1 751134204611499999999999999 144 451421 3399999999999999",
" 82 70 64 66 76 92110124131129116 97 75 54 39 32 34 43 58 74 89 9910310122 223Z1 814132221010399999999999999 213 641516 3299999999999999",
" 95 89 83 82 86 95107118126127121108 90 70 52 39 32 32 38 48 62 75 86 9422 224Z1 840128999999999999999999999 243 821632 3199999999999999",
" 99100100 99 99102107114119122121115104 89 73 56 42 32 27 29 36 48 62 7722 225Z1 1 5100 91512399999999999999 315 991814 2799999999999999",
" 91102109113113112111111112114116116113106 95 80 62 44 29 20 17 22 35 5322 226Z1 333113103511699999999999999 6291101949 1799999999999999",
" 74 94110120124122116110105104106110115117114105 89 67 44 24 10  5 11 2722 227Z1 4 412413 311799999999999999 8571042057  599999999999999",
" 51 77102121130131123112101 94 93 98107118125125115 96 70 42 17  1 -3  622 228Z1 432132142912699999999999999 942 922148 -399999999999999",
" 28 56 87113131136131117101 87 80 82 93109125135134122 98 68 36 10 -5 -522 3 1Z1 4581361529136999999999999991016 792230 -799999999999999",
" 10 37 69101125138136123104 84 70 66 74 92113132142140123 95 62 29  6 -422 3 2Z1 5241391618143999999999999991048 6623 7 -499999999999999",
"  2 23 54 87117135139130110 86 65 54 57 71 94119138146139119 88 54 25  722 3 3Z1 54714017 3146999999999999991120 542339  499999999999999",
"  5 18 43 75107130139134117 91 66 48 43 52 73 99124140144132109 79 48 2522 3 4Z1 6 91391744144999999999999991151 43999999999999999999999",
" 16 21 40 68 98123137137123 99 72 48 36 38 53 76103125137136122 98 70 4622 3 5Z1 629139182413899999999999999 0 8 151223 3599999999999999",
" 32 31 43 65 92117134138128107 81 54 36 30 38 57 81105123130125109 87 6522 3 6Z1 64713819 313099999999999999 034 291255 3099999999999999",
" 49 44 50 67 89112129136131115 91 64 42 30 30 42 62 84104117120112 98 8122 3 7Z1 7 5137194512099999999999999 057 441329 2999999999999999",
" 66 58 60 71 88108124133132120100 76 53 37 30 34 47 65 85100108108102 9122 3 8Z1 723134203110999999999999999 119 5814 6 3099999999999999",
" 80 72 71 77 89104118128129122107 87 66 48 37 34 39 51 66 81 93 98 99 9522 3 9Z1 7401302132 9999999999999999 138 711450 3499999999999999",
" 89 84 82 85 92102113121124120110 96 79 63 49 41 39 43 52 63 75 84 90 9322 310Z1 7581242344 9399999999999999 154 821549 3999999999999999",
" 93 92 92 94 97103109114116115110101 90 77 64 54 46 42 43 49 57 67 76 8522 311Z1 814116999999999999999999999 138 921715 4299999999999999",
" 92 97100102104105106108108108106103 98 90 81 70 58 48 41 39 42 49 60 7222 312Z1 8171089999999999999999999991857 39999999999999999999999",
" 85 96104109111109106103101100100101101100 96 87 75 60 46 35 31 33 42 5622 313Z1 35811112 010199999999999999 9271002011 3199999999999999",
" 73 90105114117115109101 95 91 91 95100106108104 93 77 57 39 26 21 26 3922 314Z1 4 4117135310899999999999999 930 9021 1 2199999999999999",
" 59 81101116122121113102 90 83 81 85 94106115117111 96 75 51 29 16 14 2422 315Z1 419123145011899999999999999 948 802140 1499999999999999",
" 43 68 94114126127119105 89 75 70 72 84100115126127116 95 68 41 19  9 1322 316Z1 4371281534128999999999999991010 692215  999999999999999",
" 29 55 84110127132126110 90 71 59 58 68 87108127136133117 90 60 32 13  822 317Z1 4561321615137999999999999991035 572248  899999999999999",
" 19 42 72102125136132117 94 70 52 45 51 69 93118137143134113 83 51 26 1322 318Z1 51513616561439999999999999911 2 452319 1299999999999999",
" 16 34 62 93120136138125102 74 49 35 34 48 72101127143144131106 76 47 2722 319Z1 5361391737146999999999999991132 332350 2199999999999999",
" 21 32 55 84113134141133111 82 52 31 22 29 49 78107131143141125 99 71 4722 320Z1 55714118201449999999999999912 3 22999999999999999999999",
" 35 37 53 78106129141138121 93 61 34 17 16 29 53 82110130138133116 93 7022 321Z1 61814219 513899999999999999 021 341237 1599999999999999",
" 55 50 58 77100123138140128105 74 45 22 11 15 31 56 84108124129123109 9122 322Z1 639141195512999999999999999 051 501314 1199999999999999",
" 75 67 69 80 98117133139133115 89 60 35 18 12 19 35 57 8110111411711310422 323Z1 7 1139205711799999999999999 120 671356 1299999999999999",
" 93 85 83 88 99113126134133122103 78 54 33 21 18 24 37 55 74 9010110710722 324Z1 724134223210799999999999999 148 831449 1799999999999999",
"104 99 97 98103111119126128123111 94 75 55 39 29 25 27 36 49 63 78 90 9922 325Z1 748128999999999999999999999 215 9716 5 2599999999999999",
"105108108108109111113117118118113105 93 79 64 50 38 30 28 31 40 53 68 8422 326Z1 8171199999999999999999999991754 28999999999999999999999",
" 98109115117116113110107106107107107105 99 89 76 61 45 32 25 25 32 46 6422 327Z1 3 3117102410799999999999999 8111061934 2499999999999999",
" 84103116123123117109100 94 92 94100106110110102 88 69 48 31 20 19 27 4522 328Z1 328124132211199999999999999 856 922040 1899999999999999",
" 68 92112126129123111 96 84 77 77 85 98111120121113 95 72 48 28 17 17 3022 329Z1 351129143912299999999999999 926 762127 1599999999999999",
" 52 79105124133130117 98 78 65 60 66 81101119130131119 98 71 44 25 17 2222 330Z1 414133153313299999999999999 956 6022 6 1699999999999999",
" 40 66 95120134135124103 79 58 46 47 61 83107128139136120 95 66 41 25 2322 331Z1 4361371619139999999999999991025 452240 2299999999999999",
" 34 57 86113132139131111 84 57 38 32 41 61 88116135142135116 89 61 40 3122 4 1Z1 45713917 0142999999999999991055 322310 3199999999999999",
" 36 53 79107129140137120 93 63 37 24 25 41 67 97123139141130108 82 59 4422 4 2Z1 5171411740142999999999999991124 222337 4199999999999999",
" 42 54 75101124139140127103 72 42 22 16 25 46 75105127138135121100 77 6022 4 3Z1 5361411818139999999999999991154 16999999999999999999999",
" 53 58 74 96119136141133112 83 53 27 14 15 30 55 84110127133127111 92 7522 4 4Z1 554141185713399999999999999 0 3 531225 1399999999999999",
" 65 65 76 94114131139135120 95 65 38 19 13 21 39 65 91112124125117103 8822 4 5Z1 613139193612699999999999999 027 641256 1399999999999999",
" 77 74 80 92109125134135124104 78 52 31 19 19 30 49 72 94109117116108 9722 4 6Z1 632136202111799999999999999 051 741330 1799999999999999",
" 88 83 85 93105118128131125110 90 67 46 30 24 27 39 56 75 9210410910710222 4 7Z1 651131211610999999999999999 115 8314 9 2499999999999999",
" 96 92 91 95103112120124122113 98 80 62 46 36 32 36 46 60 74 87 9710110222 4 8Z1 710124224910299999999999999 138 911459 3299999999999999",
"101 99 98 99103107112115115111102 90 77 63 51 43 40 41 48 58 70 81 91 9822 4 9Z1 727116999999999999999999999 2 0 981610 3999999999999999",
"102104105105105105106107107105101 96 89 79 69 59 50 44 42 46 54 65 77 8922 410Z1 7251079999999999999999999991748 42999999999999999999999",
" 99107111111109106102 98 97 96 96 97 96 93 87 77 65 53 44 39 41 49 61 7722 411Z1 2421111110 9799999999999999 859 961915 3999999999999999",
" 93106115118115109100 92 86 85 87 92 98103103 96 84 69 52 40 33 36 46 6322 412Z1 3 1118132910399999999999999 854 852014 3399999999999999",
" 83102116123122114101 87 77 72 73 82 94106114114105 89 69 49 34 29 34 5022 413Z1 321124143211599999999999999 913 712059 2999999999999999",
" 72 95115127129121105 86 69 58 57 66 82101117126125112 91 66 44 30 28 3922 414Z1 340130152112799999999999999 937 562139 2799999999999999",
" 60 86111129135129112 89 65 48 41 46 63 86111130138133115 90 63 41 31 3422 415Z1 4 113516 61389999999999999910 4 412215 3099999999999999",
" 51 76104127139137122 96 67 42 27 26 40 64 94122141146136115 87 61 43 3822 416Z1 4221401650146999999999999991033 252250 3899999999999999",
" 48 69 96122140143132107 75 44 20 11 17 38 69103131147148136112 86 63 5022 417Z1 44514417351509999999999999911 5 102324 4999999999999999",
" 51 66 90116137146141120 89 53 23  4  1 15 41 75109135148146131109 86 6822 418Z1 5 81471822149999999999999991140  02358 6299999999999999",
" 62 69 86110132145146131104 69 35  8 -5 -1 17 47 80111133143139125106 8822 419Z1 5321481912143999999999999991217 -5999999999999999999999",
" 78 78 88105125141146139118 88 54 23  2 -5  3 23 52 8210912713413011910522 420Z1 55714620 813499999999999999 031 761257 -599999999999999",
" 94 89 93104119133142141128105 76 46 20  5  2 11 30 55 8110211712312211522 421Z1 624143211712499999999999999 1 5 891344  299999999999999",
"107101100104114124133136130116 95 70 45 26 15 13 21 36 55 76 9410711511722 422Z1 653136225411799999999999999 1411001440 1399999999999999",
"114111108107110116122126125119107 90 71 53 37 27 24 28 39 53 70 8710011022 423Z1 726126999999999999999999999 2351071555 2499999999999999",
"115117115112110109110111113113109102 92 79 64 51 40 34 34 40 51 66 83 9922 424Z1 049117 82411399999999999999 5 01091732 3399999999999999",
"111118120118112105100 97 96 99102104104 99 90 77 63 49 40 36 40 50 66 8522 425Z1 152120112310499999999999999 732 9619 1 3699999999999999",
"103117124124117106 94 84 79 80 86 95104109109102 88 72 55 43 38 42 54 7222 426Z1 227125132711099999999999999 820 7920 5 3899999999999999",
" 93112125129124110 93 77 65 62 67 79 94109118119111 96 76 58 45 41 47 6322 427Z1 255129143712099999999999999 855 622053 4199999999999999",
" 84106124133131118 98 76 57 46 47 58 77 98117128128117 99 77 59 48 47 5722 428Z1 319134153012999999999999999 927 452132 4699999999999999",
" 76 99121134137127106 80 55 37 31 38 56 81106126135132118 98 76 60 53 5722 429Z1 342138161513699999999999999 958 3122 7 5399999999999999",
" 72 93116134141135117 89 60 35 21 21 36 60 89116134140133116 95 75 63 6122 430Z1 4 41411657140999999999999991028 192239 6099999999999999",
" 70 89111130142141126101 69 39 18 11 19 40 69100125139140130112 91 75 6822 5 1Z1 4261431736141999999999999991058 1123 9 6899999999999999",
" 72 86105126140144134112 82 50 23  8  8 23 49 81110131140137124106 89 7822 5 2Z1 4471441814140999999999999991128  62337 7699999999999999",
" 77 85101120136143139122 95 63 33 12  5 13 33 61 91117132137130117101 8822 5 3Z1 5 91431852137999999999999991159  5999999999999999999999",
" 82 86 98114130140140129107 78 48 23  9  9 22 45 72 99120130130122110 9722 5 4Z1 532141193113299999999999999 0 6 821232  799999999999999",
" 89 89 96108122134138132115 92 64 38 20 12 17 33 56 8110311912512311510522 5 5Z1 556138201412599999999999999 034 8813 6 1299999999999999",
" 97 93 96104115126132130120102 79 56 35 23 20 28 44 64 8610311511911611022 5 6Z1 62013221 511999999999999999 1 5 931345 2099999999999999",
"103 98 98101109117123125120108 91 72 53 38 29 29 37 51 69 8710111011411322 5 7Z1 646125221211499999999999999 139 971431 2899999999999999",
"109104102102104109114116115110 99 85 70 55 44 38 38 44 56 71 86 9910811222 5 8Z1 716117234011399999999999999 2311011530 3799999999999999",
"113111107104103102104106107106102 95 85 74 62 51 45 43 48 57 71 85 9810822 5 9Z1 8 5107999999999999999999999 4311021646 4399999999999999",
"114116114109104 98 95 94 95 97 98 99 97 91 81 70 59 50 46 49 58 71 8710222 510Z1 0531161042 9999999999999999 7 2 9418 6 4699999999999999",
"114120121116107 97 88 82 80 83 89 96102104100 91 78 64 53 47 49 59 75 9322 511Z1 136121125410499999999999999 752 801914 4799999999999999",
"110122127124114100 84 71 64 65 73 85 99110115112101 85 68 55 49 52 64 8322 512Z1 2 712714 811599999999999999 825 6420 9 4999999999999999",
"103121131132123106 85 65 51 46 52 66 86106122128124110 91 71 57 52 58 7422 513Z1 23413315 612899999999999999 857 462057 5299999999999999",
" 95117133139133116 91 64 42 29 29 42 64 91117134140133116 95 75 62 60 6922 514Z1 3 1139155714099999999999999 930 272140 5999999999999999",
" 88111131143142128103 71 41 19 10 16 37 66 99127144148139120 98 79 69 7022 515Z1 32714416471489999999999999910 5 102222 6899999999999999",
" 83104126143149140118 86 50 19  0 -3 10 36 71106134150152141121100 84 7822 516Z1 3551491737153999999999999991042 -423 2 7899999999999999",
" 84 99120139151150133105 68 32  3-11 -9  9 40 76111137150150139121103 9122 517Z1 4251521829152999999999999991122-132341 8899999999999999",
" 89 97113132148153145123 91 54 20 -5-14 -8 14 45 8011213514614513411910522 518Z1 45615319231479999999999999912 5-14999999999999999999999",
" 97 99109124140150150137112 80 45 15 -4-10  0 21 51 8311013013913812911722 519Z1 530151202214099999999999999 021 971251-1099999999999999",
"107103106116129140146142127103 73 43 18  3  1 11 30 56 8410712413113112422 520Z1 6 7146212513299999999999999 1 41031341  099999999999999",
"115108106109117127134137131117 96 71 47 27 16 14 23 39 61 8410411812512622 521Z1 650137223412699999999999999 1561061438 1499999999999999",
"121114108106107112118123125120110 94 75 55 40 30 29 35 48 66 8510311612322 522Z1 745125233912499999999999999 3101061543 2899999999999999",
"124120113106101 99101105110112111105 95 82 67 53 44 42 46 56 71 8810411722 523Z1 915112999999999999999999999 456 991656 4299999999999999",
"124124118109 99 91 86 86 90 96102106105100 91 78 66 57 52 55 64 78 9411022 524Z1 032125112810699999999999999 633 8618 9 5299999999999999",
"122127125116103 89 77 70 70 75 85 96105109108100 89 76 66 61 63 72 8610322 525Z1 114127131611099999999999999 734 691913 6199999999999999",
"118128131125111 93 74 60 53 55 64 79 95109116116109 97 83 73 68 71 81 9722 526Z1 148131143011799999999999999 819 5320 7 6899999999999999",
"113127135133121101 78 57 43 38 44 59 79 99116125124116102 88 78 75 80 9222 527Z1 218135152712699999999999999 857 382053 7599999999999999",
"108124136138131113 88 61 39 27 27 39 59 84108125132130119104 90 82 81 8922 528Z1 247139161413399999999999999 931 252135 8099999999999999",
"103119134141138124100 71 43 23 16 22 40 66 94118133138132120104 91 85 8822 529Z1 31414216561389999999999999910 4 162213 8599999999999999",
" 98114130141143134113 84 53 27 12 10 23 46 76105127139140131117102 92 8922 530Z1 3411441734141999999999999991036  92248 8999999999999999",
" 95108124138145140124 98 67 37 15  6 11 29 57 87115133141138127113100 9322 531Z1 4 914518121419999999999999911 9  62321 9299999999999999",
" 94103117132142144133112 83 52 25  9  6 17 40 69 98122136139133121108 9822 6 1Z1 4371441849140999999999999991142  52353 9499999999999999",
" 94 99111125137143138123 99 69 41 19  8 11 27 52 8010712613513512611410322 6 2Z1 5 61431926136999999999999991216  8999999999999999999999",
" 97 97105117129138139130111 86 58 33 17 12 20 39 64 9011212713212912010922 6 3Z1 53614020 513299999999999999 026 961252 1299999999999999",
"100 97100109120130135132119100 75 51 31 20 20 31 50 74 9711512512812311422 6 4Z1 6 8135204712899999999999999 1 0 971330 1999999999999999",
"105 99 98103111120127128122109 90 69 48 33 27 30 42 60 8210111612412411922 6 5Z1 643128213412599999999999999 142 981412 2699999999999999",
"111104 99 98102109115120119113101 85 67 51 39 35 39 51 69 8810511712312322 6 6Z1 727120222512499999999999999 236 9815 0 3599999999999999",
"118110102 97 96 98102107111111106 97 84 70 57 47 44 49 60 76 9310912012422 6 7Z1 832111231712599999999999999 356 961556 4499999999999999",
"123117108 99 92 88 88 92 97102105104 99 89 77 66 57 54 57 67 82 9911312322 6 8Z11018105999999999999999999999 530 8817 0 5499999999999999",
"127125116105 92 82 75 74 78 86 95103107105 99 88 76 67 62 65 75 8910512022 6 9Z1 0 4127121610799999999999999 641 7418 9 6299999999999999",
"129131125113 97 80 66 58 58 65 77 92106114116111100 87 76 71 73 83 9711422 610Z1 046131134611799999999999999 732 571915 7199999999999999",
"128135134124106 84 63 46 38 41 53 71 93112125129124112 98 85 79 81 9110722 611Z1 124136145512999999999999999 816 382015 7999999999999999",
"123136141136120 96 68 43 25 19 26 44 69 97120136141135121106 93 87 9010122 612Z1 2 0141155514199999999999999 859 192110 8799999999999999",
"117134145146135113 83 51 23  6  3 15 39 70102129145149142128111 99 94 9922 613Z1 237147165014999999999999999 942  222 1 9499999999999999",
"111128143152148132104 69 35  7 -8 -7  9 38 7310713515015314513011410310022 614Z1 3151521744154999999999999991027-10224810099999999999999",
"106120137151156148127 95 58 23 -4-15-11  9 41 7711113815215314412911410522 615Z1 3551561836154999999999999991113-16233410399999999999999",
"104112127143155156145120 87 49 16 -7-15 -7 15 47 8211413814914913912511222 616Z1 43715719271509999999999999912 0-15999999999999999999999",
"105106116131145154153139113 80 45 15 -4 -8  2 24 55 8811613614514213211922 617Z1 522155201614599999999999999 0191041249 -999999999999999",
"108103106116130143149145131106 76 46 20  6  4 16 37 65 9411813413913512522 618Z1 61114921 313999999999999999 1 61031337  399999999999999",
"112103 99103112125135140135122101 75 50 30 20 21 32 52 7710112013213412822 619Z1 7 4140214613499999999999999 158 991425 1999999999999999",
"118106 97 94 97105115124128124114 97 77 57 43 36 39 50 67 8810812313013022 620Z1 8 5128222813199999999999999 3 0 941514 3699999999999999",
"123111 99 90 86 88 94102111115115108 96 82 68 57 53 56 66 82 9911412513022 621Z1 92311623 813099999999999999 414 8616 4 5399999999999999",
"127119106 93 82 76 76 81 89 98105108106 99 89 79 72 69 72 81 9410812012822 622Z111 6108234913199999999999999 533 7517 0 6999999999999999",
"131126115101 85 72 64 63 68 77 88 98105108105 99 91 85 82 85 9210311512522 623Z11258108999999999999999999999 643 6318 3 8299999999999999",
"132132125111 94 75 60 51 50 56 68 83 97108114114109102 95 92 9410011012122 624Z1 031132142811599999999999999 740 501911 9299999999999999",
"130135132122106 85 64 47 38 39 48 64 84102115122123117109102 98 9910511522 625Z1 113135153112399999999999999 826 382017 9899999999999999",
"126134137132118 97 73 50 34 27 32 46 66 8911012513113012211310410010210922 626Z1 154137161813299999999999999 9 7 27211310099999999999999",
"120131138139130111 87 60 37 22 19 29 48 73 9812013313813412411310410110422 627Z1 233140165813899999999999999 944 1922 010199999999999999",
"113125136142138125102 74 46 25 14 16 31 54 8310912914014013312110910210122 628Z1 3101421734141999999999999991020 13223910099999999999999",
"107118131141144136117 91 61 34 15  9 17 37 65 94119136142139129116105 9922 629Z1 34614418 8142999999999999991055  92313 9999999999999999",
"101111124137145143130107 78 48 24 10 10 23 47 7710512714014113412210910022 630Z1 4211451840142999999999999991130  82345 9799999999999999",
" 98104115130141145139122 96 66 38 18 10 15 34 60 8911513314013712711410222 7 1Z1 45514519121409999999999999912 5  9999999999999999999999",
" 96 97107120134142142132111 84 55 31 16 14 25 46 7410112313513813111910622 7 2Z1 530143194413899999999999999 017 951239 1399999999999999",
" 96 93 98109123134140136122100 74 48 28 19 23 38 61 8711112913613412511122 7 3Z1 6 7140201613699999999999999 052 931314 1999999999999999",
" 99 92 92 99110122132134127112 91 67 45 31 27 35 52 7510012013213512911822 7 4Z1 647134204813599999999999999 131 911350 2799999999999999",
"105 94 88 90 97108119126126119104 85 64 48 38 39 49 67 8911012613413312422 7 5Z1 733127212213499999999999999 217 881428 3799999999999999",
"112 98 88 84 86 92102112118118112100 84 68 56 50 53 64 8110111813013413022 7 6Z1 833119215813499999999999999 313 841510 5099999999999999",
"119106 92 82 77 78 84 93102109112109100 89 77 68 65 68 78 9411012413213322 7 7Z1 956112223713499999999999999 420 7616 1 6599999999999999",
"127115100 85 73 66 66 71 81 93103109110107 99 90 83 80 82 9110411712913422 7 8Z11146111232113599999999999999 533 6517 4 8099999999999999",
"133125111 93 75 61 52 51 57 69 84 98110117117113105 98 93 9410111112313222 7 9Z11336118999999999999999999999 640 501820 9399999999999999",
"137134124107 86 64 46 36 34 41 57 77 9711412613012611911010410310811712822 710Z1 01013715 013099999999999999 741 33194110399999999999999",
"137141137124104 78 52 31 19 17 28 47 73 9912113614113812911811010811212122 711Z1 1 414116 514199999999999999 837 17205410899999999999999",
"132142146141125101 71 41 17  4  4 17 42 7210312914515014513412211210911322 712Z1 159146165915099999999999999 930  2215510999999999999999",
"124138149152145126 97 63 30  5 -7 -5 12 41 7510913615115414713412011010722 713Z1 2531521747155999999999999991020 -8224510799999999999999",
"114127142154157148125 93 57 23 -2-13 -7 14 46 8211614115415414412811310422 714Z1 34515818301559999999999999911 9-13233010399999999999999",
"104113129146158159147122 89 52 19 -4-11 -1 22 55 9112314415314913611910422 715Z1 4371601910153999999999999991155-11999999999999999999999",
" 97100112130147158157143117 84 48 19  1 -1 12 37 7010312914514914012510722 716Z1 527159194614999999999999999 012 971239 -299999999999999",
" 94 90 96110128144153150135110 79 48 24 13 15 31 56 8611413514414213011222 717Z1 617153201814599999999999999 054 901320 1299999999999999",
" 96 85 84 91106123137144140125103 76 52 35 29 36 53 7710212413814113411922 718Z1 7 8144204714199999999999999 139 831357 2999999999999999",
"101 86 78 78 86100115127132127115 97 76 59 50 49 59 75 9611613113813612522 719Z1 8 3132211413999999999999999 228 771431 4899999999999999",
"109 92 79 72 73 80 92105115119116107 94 81 71 67 70 80 9511112613513613022 720Z1 9 7119214213799999999999999 324 7115 4 6799999999999999",
"118102 86 73 67 67 73 83 94103108108104 97 90 85 84 88 9710912113013513322 721Z11033109221513599999999999999 431 661540 8499999999999999",
"125113 97 82 69 61 60 64 73 83 94101106106104101 99 9910210811712513113322 722Z11242107225813399999999999999 544 591630 9899999999999999",
"130122110 94 77 63 54 51 55 64 76 8910010911311411311010911011411912512922 723Z11446114235913199999999999999 656 5118 610999999999999999",
"131129121108 91 72 56 46 42 47 57 73 8910511612312412211711411211411812322 724Z11547124999999999999999999999 756 4220 111299999999999999",
"129132129121106 86 65 47 36 34 40 55 74 9511312613213212611911311011111622 725Z1 1 7132162513399999999999999 846 33211511099999999999999",
"124131134132121102 79 56 37 27 27 37 57 8010412313513913512611610910610922 726Z1 2 6134165613999999999999999 929 2522 010699999999999999",
"117127135139133119 96 70 45 26 19 23 39 63 9011513314214113312111010210222 727Z1 25513917241429999999999999910 8 19223410199999999999999",
"109120132141142133114 87 58 33 18 15 25 46 74103126140144138126112101 9622 728Z1 3371431752144999999999999991043 1423 3 9699999999999999",
"100111126139147144129105 76 46 24 12 16 32 58 88116135144142131116102 9322 729Z1 4151471817145999999999999991117 122332 9199999999999999",
" 92101116132145149141122 95 64 36 18 13 23 45 74103128142144136121105 9122 730Z1 4521491843145999999999999991149 13999999999999999999999",
" 86 91104121137148147135112 83 53 29 17 19 35 61 91118137145141127110 9322 731Z1 52814919 714599999999999999 0 2 861221 1699999999999999",
" 83 82 91107125140146141125101 72 46 28 23 32 53 80108131143144133116 9722 8 1Z1 6 6146193214599999999999999 033 811251 2399999999999999",
" 83 76 80 92109126138141133115 91 66 45 34 36 50 72 9912313914413812310422 8 2Z1 647141195614499999999999999 1 8 761322 3399999999999999",
" 86 74 71 78 92108124133133124107 86 65 51 47 53 70 9211513314314113011222 8 3Z1 732134202114399999999999999 146 711354 4799999999999999",
" 93 76 67 67 75 89104118125125116102 86 72 63 64 73 8910812713914213512122 8 4Z1 827126204814299999999999999 231 661427 6299999999999999",
"102 83 69 62 62 70 82 97109116117112103 92 84 80 83 9210512113314013812922 8 5Z1 940118211914099999999999999 325 6115 6 8099999999999999",
"113 95 77 63 56 55 61 72 86 98108113113109104 99 9710010711712713513813422 8 6Z11133113215713899999999999999 434 541558 9799999999999999",
"124109 91 73 58 49 45 49 59 73 8810111211812011811511311311612212913413622 8 7Z11357120225513699999999999999 556 45172911299999999999999",
"133124110 91 71 53 40 33 35 45 60 79 9911512713213212812311911912212713322 8 8Z11525133999999999999999999999 717 33193811999999999999999",
"137136129114 94 70 48 30 20 21 31 51 7510112213714414213512611911611812522 8 9Z1 021137161614499999999999999 827 1921 511699999999999999",
"134141143136120 97 68 41 19  8  9 22 46 7610713114715214613512211210911322 810Z1 146143165615299999999999999 925  6215810999999999999999",
"123136147151144126 98 65 34 10 -1  2 20 49 8311614115415414412811210110022 811Z1 2531511731155999999999999991016 -22239 9999999999999999",
"108123141155159150128 96 60 28  5 -4  4 27 60 96127148156150135115 98 8922 812Z1 35015918 31569999999999999911 1 -42317 8999999999999999",
" 92105125145160162151126 92 55 24  5  2 15 42 76111138153153141121 99 8322 813Z1 4421631832155999999999999991141  12354 7899999999999999",
" 78 86104126148161161146119 86 52 26 13 16 34 63 96126146152145127104 8322 814Z1 5301621858152999999999999991218 12999999999999999999999",
" 71 71 83103127146156153137110 80 52 33 28 37 59 87115138149147134112 8822 815Z1 616157192215099999999999999 030 691250 2899999999999999",
" 70 62 66 81102124141147141125102 77 56 46 49 62 84109131145148138120 9722 816Z1 7 2147194314899999999999999 1 8 621319 4699999999999999",
" 75 61 58 65 81100119132135128114 96 78 66 64 71 8710612614014614112710722 817Z1 75013520 214699999999999999 149 581344 6499999999999999",
" 86 68 58 57 65 79 96111120122117107 95 85 80 83 9310712213514214113211622 818Z1 844122202214399999999999999 234 5614 7 8099999999999999",
" 97 79 65 57 58 65 77 90102109112110105 99 95 9610110912013013713813412322 819Z1 959112204513999999999999999 327 561426 9599999999999999",
"109 92 77 65 58 58 63 72 82 9310110610810810810810911311912513013313212622 820Z11235108211313399999999999999 436 57143110899999999999999",
"117106 92 78 66 58 55 58 65 75 86 9610511211611811911912012112312512612622 821Z12210126999999999999999999999 6 2 55999999999999999999999",
"123116107 94 80 66 55 50 51 57 68 82 9711012012612812612312011811711912122 822Z11556128999999999999999999999 723 49203811799999999999999",
"123123119110 96 79 62 49 42 43 51 66 8410311913013413312712011411011011422 823Z1 030124161413599999999999999 825 41212711099999999999999",
"120126128125114 96 75 55 40 33 36 48 68 9111312913813913312311210510210622 824Z1 156129163614099999999999999 912 33215510299999999999999",
"114125133136130114 92 67 45 30 25 33 52 76103125139144139127113101 95 9622 825Z1 249136165714499999999999999 950 252220 9499999999999999",
"105118132142142131111 84 56 34 22 23 37 61 90117137146144133116100 89 8622 826Z1 3321431718146999999999999991024 202245 8699999999999999",
" 94108126142149145129103 73 45 25 19 27 48 77107132146148138121101 85 7822 827Z1 4101491739149999999999999991056 182311 7899999999999999",
" 81 95115135150153144122 93 62 36 22 23 38 65 96124144151144127105 85 7222 828Z1 44715318 0151999999999999991126 202339 6999999999999999",
" 70 80 99122142154152138112 82 53 32 26 35 57 86116139151149134112 88 6922 829Z1 5241551820152999999999999991155 26999999999999999999999",
" 61 66 82105128146153147129102 73 49 36 38 53 79108133149152141120 95 7222 830Z1 6 3153184115399999999999999 0 8 611224 3599999999999999",
" 57 55 65 85109131145148139119 94 70 53 48 56 76101126145152146128104 7822 831Z1 64414919 215299999999999999 040 541252 4899999999999999",
" 58 49 52 66 87110130140140129111 91 73 64 66 78 98120139150149136114 8922 9 1Z1 729142192415199999999999999 115 491321 6399999999999999",
" 66 50 46 52 67 87107123131130121108 93 83 80 86 9911613314514814012410122 9 2Z1 822132194614899999999999999 154 461350 8099999999999999",
" 78 59 47 45 52 66 83100113121121117109102 97 9810511612813914414213111422 9 3Z1 936122201114499999999999999 243 451419 9799999999999999",
" 94 74 58 48 45 50 60 74 8910211111611711611411311511912613313813913512522 9 4Z11156117204313999999999999999 350 45145411399999999999999",
"110 94 76 61 50 44 45 51 62 76 9010411512212612712612512612713013213213022 9 5Z11452127214513299999999999999 525 44172212599999999999999",
"124114100 83 66 51 41 36 39 49 64 8310211913113713813412812312112112412822 9 6Z11532138999999999999999999999 7 7 36202312199999999999999",
"130129123110 92 71 50 34 26 27 38 58 8210712814114614313412311310911111822 9 7Z1 01813116 214699999999999999 823 25211410999999999999999",
"127136139135121 99 72 46 26 17 19 34 59 88117139150150141125109 98 9510122 9 8Z1 159139163015299999999999999 918 162150 9599999999999999",
"115131145151145128101 70 41 20 12 18 39 68101130149155148131110 91 81 8322 9 9Z1 3 415116561559999999999999910 3 122223 8199999999999999",
" 95115137154160152130100 66 36 18 15 27 52 85118143155153138114 90 73 6722 910Z1 3561601720156999999999999991042 142256 6799999999999999",
" 74 94119144160163152127 94 61 35 23 26 44 73106135152156144122 94 70 5622 911Z1 4431641743156999999999999991117 222329 5599999999999999",
" 57 71 95124148162161146119 88 59 40 35 45 68 97126148156150130103 75 5422 912Z1 52716318 4156999999999999991148 35999999999999999999999",
" 46 53 72 99127148158153136110 83 61 50 54 69 93120142154153138113 84 5822 913Z1 610158182315599999999999999 0 2 461216 5099999999999999",
" 43 42 54 76103128145149142124102 81 68 66 75 94116137151153143122 95 6822 914Z1 652149184115499999999999999 035 401240 6599999999999999",
" 48 39 44 59 81105126137138129115 98 85 80 84 97114132146151145130107 8122 915Z1 735139185915199999999999999 110 3913 3 8099999999999999",
" 59 45 42 49 65 85105120127127119109 99 93 94102114128140146144134116 9522 916Z1 824128191614799999999999999 148 411322 9399999999999999",
" 74 57 48 48 55 69 8610111211711711410810510410811512513413914013412210622 917Z1 930118193314099999999999999 232 47133810499999999999999",
" 88 72 60 54 54 60 70 82 9410310911211311311311511812312813113212912311322 918Z11947132999999999999999999999 330 53999999999999999999999",
"101 89 76 66 60 58 60 67 76 87 9710611311712012212312312312412312212011622 919Z11913124999999999999999999999 456 58999999999999999999999",
"111103 94 83 72 63 57 56 61 70 81 9410711812512912812612111711511311411522 920Z11526129999999999999999999999 638 56211811399999999999999",
"116115110101 88 74 61 52 49 54 65 80 9711412713413513012211410710310410922 921Z1 0 5116153913599999999999999 753 49211710399999999999999",
"116121123118107 90 71 55 44 42 49 64 85106125136140136125113101 94 9310022 922Z1 147123155614099999999999999 843 422134 9399999999999999",
"110122131132125109 87 64 46 36 37 50 71 96120137144142130114 97 86 82 8722 923Z1 241133161314599999999999999 922 352155 8299999999999999",
"100117133142140128106 80 55 37 31 39 58 85112135147147137118 97 79 70 7322 924Z1 323142163214999999999999999 956 312218 7099999999999999",
" 86106127144151145126100 71 46 33 34 48 74103130148152144124100 77 61 5822 925Z1 4 21511650153999999999999991027 312244 5899999999999999",
" 68 89114138154156144121 91 63 42 35 44 65 94123146156151133106 78 57 4722 926Z1 4401571710156999999999999991057 352311 4699999999999999",
" 51 69 96124147159156140113 84 59 45 46 61 87116141156156141115 85 57 4022 927Z1 5191601730158999999999999991127 432341 3699999999999999",
" 37 49 73103132152159152132106 80 61 55 63 83109135153159149126 95 64 4022 928Z1 5591591751159999999999999991156 55999999999999999999999",
" 29 34 52 79109135151154144125101 81 70 71 84105129148158154136108 76 4822 929Z1 642155181215899999999999999 013 291225 6999999999999999",
" 30 26 36 57 84112134145145135118101 88 84 90105124142154155143120 92 6322 930Z1 730147183415699999999999999 047 261254 8499999999999999",
" 40 28 28 40 61 86109126135135127116105 99100108121136148152146130107 812210 1Z1 827136185615299999999999999 127 261322 9899999999999999",
" 57 40 32 34 45 62 821011151241261231181131121151221311401451441351201002210 2Z1 951126192114599999999999999 216 31135011299999999999999",
" 79 60 46 40 40 47 60 75 901041141201231241231231251281321351361331261152210 3Z11949136999999999999999999999 325 39999999999999999999999",
"101 85 69 57 48 44 46 53 65 80 951091211281321321301271251241241241241222210 4Z11430132999999999999999999999 5 9 44999999999999999999999",
"117108 96 82 67 53 44 41 45 56 73 921111261361391361291211131091101131192210 5Z11458139999999999999999999999 656 41202810999999999999999",
"124125121110 93 74 55 42 36 39 52 72 96119136144143134120106 96 92 961062210 6Z1 047125152314599999999999999 8 8 362059 9299999999999999",
"119131137134121101 77 54 38 32 39 56 80107131146149141124104 86 76 76 862210 7Z1 212137154614999999999999999 859 322130 7599999999999999",
"104124141148144128104 76 52 37 34 45 67 96123144153148131107 83 65 58 642210 8Z1 3 914816 915399999999999999 941 3322 1 5899999999999999",
" 82107132150157149129102 73 51 40 43 60 86115140154154140115 86 60 46 452210 9Z1 3581571630156999999999999991016 392232 4399999999999999",
" 59 84114140157160148126 97 71 53 49 59 80107134152158148125 94 64 41 32221010Z1 4411611651158999999999999991048 4923 3 3299999999999999",
" 39 61 90122147159158143119 93 71 61 64 79102128149158154135106 73 44 28221011Z1 5231601711159999999999999991117 602334 2599999999999999",
" 27 41 67 99128149157151134112 90 76 73 82100123144157156143117 86 54 32221012Z1 6 31571730158999999999999991144 72999999999999999999999",
" 23 29 48 77107132147150141125106 91 84 88100119138152156147127 99 68 42221013Z1 643150174915699999999999999 0 5 2212 9 8499999999999999",
" 27 25 37 59 86112132142141131117104 95 94102116132146152148134111 83 57221014Z1 72414218 915299999999999999 038 241233 9499999999999999",
" 38 29 33 47 69 92113128133131123113105102106115127138145145136119 97 74221015Z1 810133182814699999999999999 112 29125710299999999999999",
" 54 41 37 43 57 76 95111121125123118113109110115122131137139134123107 89221016Z1 9 8125184613999999999999999 151 37132110999999999999999",
" 71 56 48 47 52 64 78 93105114118119118116116117120124128130128122112100221017Z1104711919 013099999999999999 240 46134811699999999999999",
" 87 74 64 57 55 58 66 77 88100109115119121122121120120120120118116112107221018Z11347122999999999999999999999 352 55999999999999999999999",
"100 91 82 72 64 59 59 64 73 84 96108118124127127123119114110108107108109221019Z11419127232410999999999999999 532 59205310799999999999999",
"108106 99 90 78 67 59 56 60 69 82 98113125132133128120110102 96 95 98104221020Z11440133999999999999999999999 659 562044 9599999999999999",
"111115115109 97 81 66 56 52 56 69 86106123135139135124110 96 85 82 85 95221021Z1 126116145913999999999999999 757 5221 1 8299999999999999",
"107119127126116100 80 62 51 49 57 74 96118135144142130112 93 76 68 69 80221022Z1 225127151814499999999999999 841 482123 6799999999999999",
" 97116131139135121100 77 58 48 51 64 87112134147149138118 94 71 55 52 61221023Z1 310139153714999999999999999 919 482147 5199999999999999",
" 80104128144149141122 97 73 56 50 58 78104129148154147127 99 70 47 37 40221024Z1 352149155815499999999999999 953 502215 3699999999999999",
" 58 85115140155156143120 93 71 58 59 73 96123146158155137109 76 46 27 23221025Z1 4331571619158999999999999991027 562244 2399999999999999",
" 35 60 93125150161157141116 91 72 66 73 91116141157160148122 88 53 26 13221026Z1 51516116421619999999999999911 0 662317 1299999999999999",
" 17 36 67101133154161154136113 92 79 78 90111134154162156135103 67 34 13221027Z1 55916117 6162999999999999991132 772352  699999999999999",
"  6 17 41 74107136153156148131111 96 89 94108128147159160146119 86 51 24221028Z1 64615717311619999999999999912 5 89999999999999999999999",
"  8  8 23 48 79109133146148140126112103102109123139153158151133105 73 44221029Z1 739148175715899999999999999 030  6123710199999999999999",
" 22 12 16 31 54 81106126136138133124115111113121132143150150139120 95 68221030Z1 842138182615199999999999999 114 12131211199999999999999",
" 45 28 22 26 39 58 80100116126130129124120118120126132139141138128112 92221031Z11010130185914199999999999999 2 6 2214 011899999999999999",
" 71 53 40 34 36 45 59 76 931081201261291271251231221231251271281261191092211 1Z112 6129194712899999999999999 316 34155812299999999999999",
" 96 81 66 54 46 44 48 58 72 881041181271321311271211161121111121141161162211 2Z11321132222811699999999999999 450 44185911199999999999999",
"112105 93 80 66 55 49 50 57 71 88106122133136133124113102 95 92 951021112211 3Z114 0136999999999999999999999 625 491955 9299999999999999",
"118120116106 92 75 61 52 52 59 75 94114131140139130115 98 83 74 74 82 962211 4Z1 057120142814199999999999999 736 512032 7399999999999999",
"111124130128117100 81 64 55 56 66 84106127141145138122100 78 61 55 59 742211 5Z1 215131145414599999999999999 828 5421 5 5599999999999999",
" 95116133141137124104 83 67 60 63 77 98121140149147131107 80 56 41 39 512211 6Z1 311141151715099999999999999 910 592137 3899999999999999",
" 73100125142148142126104 84 70 67 75 92115136150153141118 88 58 35 25 312211 7Z1 358148154015399999999999999 947 6622 9 2599999999999999",
" 50 78108134150152142124102 84 75 77 89109131149156149130100 67 38 20 172211 8Z1 44215316 3156999999999999991020 742240 1699999999999999",
" 30 55 87118142153152139120100 86 82 89105126145156155140113 80 47 22 112211 9Z1 5221541625157999999999999991051 822311 1199999999999999",
" 16 36 65 98127146153147133115 99 90 92103120139152156147125 95 62 32 14221110Z1 6 11531648156999999999999991121 902343 1099999999999999",
" 11 23 47 78108133146148140125110 99 96102115132146153150134109 78 47 24221111Z1 6391491712154999999999999991149 96999999999999999999999",
" 13 17 34 59 89115134143141132119107101102111125138148149139119 93 65 40221112Z1 719143173614999999999999999 015 13121810199999999999999",
" 23 19 27 46 71 97118132136133124114107105109118130139143139126105 81 57221113Z1 8 113618 114399999999999999 050 19124910599999999999999",
" 38 28 29 39 58 80101118127129126119112108109114122129134134127113 95 75221114Z1 850130182713599999999999999 127 27132410899999999999999",
" 56 43 37 39 50 66 84102115122124122118113111112115120124125123115103 89221115Z1 954124185412599999999999999 211 37141711199999999999999",
" 74 60 50 46 49 58 71 86101112120122122119115113111111113114114112107 99221116Z11117123193111499999999999999 3 6 46162211199999999999999",
" 89 78 67 59 55 56 62 73 87100112120125125121116111106102101101103104103221117Z11231125221710499999999999999 419 5419 910199999999999999",
"100 94 86 76 67 60 59 64 74 88103116125129128122113103 94 88 87 89 95101221118Z11315130999999999999999999999 541 591949 8799999999999999",
"106107104 95 84 72 64 61 66 77 93109123133135129118103 88 76 71 72 80 92221119Z1 046108134713599999999999999 652 612017 7099999999999999",
"105115118115105 90 76 66 63 69 83101119134140138126107 86 68 56 53 60 76221120Z1 2 1118141314199999999999999 748 632045 5399999999999999",
" 95114127131126112 95 78 68 67 76 93113132144146136116 90 64 44 35 38 53221121Z1 256131143914699999999999999 836 662115 3599999999999999",
" 76102125140143134117 97 81 72 74 87106128145152146128100 69 40 22 18 28221122Z1 34414315 515299999999999999 919 712148 1799999999999999",
" 51 81112137151151139120 99 84 78 84100121142155155141115 81 46 18  4  6221123Z1 430152153215799999999999999 959 782223  399999999999999",
" 24 53 89122146157154140120101 89 87 97115136153160153131 99 61 26  2 -7221124Z1 51715816 1160999999999999991038 8623 0 -799999999999999",
"  1 25 59 96128150158153138119103 95 98110129147160160146119 83 45 13 -7221125Z1 6 51581633162999999999999991116 952341-1199999999999999",
"-10  4 30 65101130149154148134118106102108121138154161155136106 70 35  8221126Z1 65615417 6161999999999999991155102999999999999999999999",
" -7 -5 11 38 71103129144148142130117109108115128143153155146125 96 63 33221127Z1 751148174315699999999999999 025 -8123610799999999999999",
" 10  1  5 21 46 75103124137140135126116111112118129140147146135115 90 62221128Z1 850140182314799999999999999 112  0132311099999999999999",
" 37 20 13 18 32 54 79102120130133130123115111111116123131135133124108 88221129Z1 955133191413599999999999999 2 5 13142711199999999999999",
" 66 47 34 29 32 44 61 82101117127130127121114108106107112117120120115105221130Z111 0130202912199999999999999 3 5 2916 510699999999999999",
" 91 75 60 49 44 46 55 69 86103117126129126119109101 95 93 951001061091102212 1Z11158129223811099999999999999 414 441757 9399999999999999",
"106 98 86 74 64 58 58 64 76 92108121129131126115102 89 80 76 78 84 941032212 2Z11244131999999999999999999999 530 571910 7699999999999999",
"109111107 98 87 76 69 68 73 85100115128134133124108 90 73 61 57 61 72 872212 3Z1 047111132113599999999999999 642 6820 0 5799999999999999",
"102114119117109 97 86 78 76 82 94109124135139133118 97 74 55 43 41 49 662212 4Z1 214119135413999999999999999 743 762040 4099999999999999",
" 87107121128126117104 92 84 83 90103119134142141130109 82 56 36 27 29 442212 5Z1 316128142514399999999999999 835 832116 2699999999999999",
" 66 92115131137133121107 95 89 90 99114130142146140122 95 65 38 20 15 242212 6Z1 4 5137145514699999999999999 920 882150 1599999999999999",
" 45 73101125139142135122108 96 92 96108124139148147133109 78 47 22  9 102212 7Z1 44814215241499999999999999910 0 922223  899999999999999",
" 26 52 83112134145144134120106 97 96103117133146150142123 94 61 31 10  42212 8Z1 5261461553150999999999999991036 952256  499999999999999",
" 12 34 63 95122140146142130115103 97100111126140149147134109 78 46 19  52212 9Z1 6 314616231509999999999999911 9 972329  399999999999999",
"  5 19 45 76106130142144136123109100 98105118132144148141122 95 63 34 13221210Z1 6381441652148999999999999991141 98999999999999999999999",
"  5 12 31 58 88115133140138128115104 99101110123136144143130109 81 52 27221211Z1 713141172314599999999999999 0 3  51213 9899999999999999",
" 12 11 22 44 71 98120133136131120109101 99104114126136139133118 96 69 44221212Z1 749136175413999999999999999 037 101246 9999999999999999",
" 26 17 20 35 57 82106123131131124114104 99100106115125131131122106 85 62221213Z1 827132182713299999999999999 113 171325 9999999999999999",
" 42 29 25 32 48 69 91111123128126119110102 98100105113119123120111 96 78221214Z1 9 912819 612399999999999999 151 251414 9899999999999999",
" 60 45 36 36 44 60 79 98114124126123116107100 97 97100105110112110102 91221215Z1 954126195911299999999999999 232 351525 9699999999999999",
" 77 63 52 46 47 56 70 87104117124126121114105 97 91 89 91 94 99102102 98221216Z11042126213210299999999999999 320 4617 3 8999999999999999",
" 91 81 71 62 57 59 66 78 94109120126127121112100 89 81 77 77 81 88 94 99221217Z11131127234810099999999999999 419 571827 7699999999999999",
"100 97 90 82 73 68 68 75 86100114125130128120107 92 77 66 60 61 68 79 91221218Z11216130999999999999999999999 529 681921 6099999999999999",
"101107108103 94 85 78 77 82 93107121131134130117 99 79 60 46 41 45 57 74221219Z1 134108125713499999999999999 642 7720 4 4199999999999999",
" 93109119121116106 95 86 84 89100115128137138130112 87 62 39 25 22 31 49221220Z1 247121133613999999999999999 748 842045 2299999999999999",
" 73 98119131133127115102 93 90 96108124137144142127103 73 43 19  6  6 21221221Z1 345134141514599999999999999 847 902127  499999999999999",
" 46 76106129142143135121106 97 96103117133146151143123 92 57 24  0-10 -4221222Z1 436144145415199999999999999 940 9522 9-1099999999999999",
" 16 46 81114138149149138123108100100110125142153154142116 81 43 10-12-19221223Z1 5261501535155999999999999991027 992254-1999999999999999",
" -9 16 50 87120142152149137121107101104116133149158155138108 71 33  1-18221224Z1 61415216171589999999999999911111012339-2299999999999999",
"-21 -7 21 57 93124144150145132116105101106120137152158151131100 63 27 -2221225Z1 7 215017 2158999999999999991155101999999999999999999999",
"-16-15  2 31 65 99126142145138125110100 99107121137149153144123 93 58 26221226Z1 747146174815399999999999999 025-181239 9999999999999999",
"  3 -7 -3 16 43 75105127138139130116103 96 96104118132142143134114 87 57221227Z1 831140183814499999999999999 111 -71326 9599999999999999",
" 31 13  8 15 33 58 86110127134131121108 96 90 91 99110122130130122105 83221228Z1 912134193313199999999999999 156  81421 9099999999999999",
" 60 40 29 27 35 52 74 96115127130125114101 90 84 84 89 99108115116111 99221229Z1 951130204111799999999999999 240 261529 8399999999999999",
" 83 67 54 46 47 55 70 88106119127127120108 95 83 76 74 77 84 93100104103221230Z11030128221510499999999999999 325 461651 7399999999999999",
" 96 87 77 69 65 67 75 87101115124128125116103 88 74 64 60 62 68 78 88 95221231Z111 5128999999999999999999999 410 651812 6099999999999999",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseTideLines(lines);
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/

// 月齢(こよみ式)
// 2021年

(function() {
  var year = 2021;
  var lines = [
    '1/1,大潮',
    '1/2,中潮',
    '1/3,中潮',
    '1/4,中潮',
    '1/5,中潮',
    '1/6,小潮',
    '1/7,小潮',
    '1/8,小潮',
    '1/9,長潮',
    '1/10,若潮',
    '1/11,中潮',
    '1/12,中潮',
    '1/13,大潮',
    '1/14,大潮',
    '1/15,大潮',
    '1/16,大潮',
    '1/17,中潮',
    '1/18,中潮',
    '1/19,中潮',
    '1/20,中潮',
    '1/21,小潮',
    '1/22,小潮',
    '1/23,小潮',
    '1/24,長潮',
    '1/25,若潮',
    '1/26,中潮',
    '1/27,中潮',
    '1/28,大潮',
    '1/29,大潮',
    '1/30,大潮',
    '1/31,大潮',
    '2/1,中潮',
    '2/2,中潮',
    '2/3,中潮',
    '2/4,中潮',
    '2/5,小潮',
    '2/6,小潮',
    '2/7,小潮',
    '2/8,長潮',
    '2/9,若潮',
    '2/10,中潮',
    '2/11,中潮',
    '2/12,大潮',
    '2/13,大潮',
    '2/14,大潮',
    '2/15,中潮',
    '2/16,中潮',
    '2/17,中潮',
    '2/18,中潮',
    '2/19,小潮',
    '2/20,小潮',
    '2/21,小潮',
    '2/22,長潮',
    '2/23,若潮',
    '2/24,中潮',
    '2/25,中潮',
    '2/26,大潮',
    '2/27,大潮',
    '2/28,大潮',
    '3/1,大潮',
    '3/2,中潮',
    '3/3,中潮',
    '3/4,中潮',
    '3/5,中潮',
    '3/6,小潮',
    '3/7,小潮',
    '3/8,小潮',
    '3/9,長潮',
    '3/10,若潮',
    '3/11,中潮',
    '3/12,中潮',
    '3/13,大潮',
    '3/14,大潮',
    '3/15,大潮',
    '3/16,大潮',
    '3/17,中潮',
    '3/18,中潮',
    '3/19,中潮',
    '3/20,中潮',
    '3/21,小潮',
    '3/22,小潮',
    '3/23,小潮',
    '3/24,長潮',
    '3/25,若潮',
    '3/26,中潮',
    '3/27,中潮',
    '3/28,大潮',
    '3/29,大潮',
    '3/30,大潮',
    '3/31,大潮',
    '4/1,中潮',
    '4/2,中潮',
    '4/3,中潮',
    '4/4,中潮',
    '4/5,小潮',
    '4/6,小潮',
    '4/7,小潮',
    '4/8,長潮',
    '4/9,若潮',
    '4/10,中潮',
    '4/11,中潮',
    '4/12,大潮',
    '4/13,大潮',
    '4/14,大潮',
    '4/15,中潮',
    '4/16,中潮',
    '4/17,中潮',
    '4/18,中潮',
    '4/19,小潮',
    '4/20,小潮',
    '4/21,小潮',
    '4/22,長潮',
    '4/23,若潮',
    '4/24,中潮',
    '4/25,中潮',
    '4/26,大潮',
    '4/27,大潮',
    '4/28,大潮',
    '4/29,大潮',
    '4/30,中潮',
    '5/1,中潮',
    '5/2,中潮',
    '5/3,中潮',
    '5/4,小潮',
    '5/5,小潮',
    '5/6,小潮',
    '5/7,長潮',
    '5/8,若潮',
    '5/9,中潮',
    '5/10,中潮',
    '5/11,大潮',
    '5/12,大潮',
    '5/13,大潮',
    '5/14,大潮',
    '5/15,中潮',
    '5/16,中潮',
    '5/17,中潮',
    '5/18,中潮',
    '5/19,小潮',
    '5/20,小潮',
    '5/21,小潮',
    '5/22,長潮',
    '5/23,若潮',
    '5/24,中潮',
    '5/25,中潮',
    '5/26,大潮',
    '5/27,大潮',
    '5/28,大潮',
    '5/29,大潮',
    '5/30,中潮',
    '5/31,中潮',
    '6/1,中潮',
    '6/2,中潮',
    '6/3,小潮',
    '6/4,小潮',
    '6/5,小潮',
    '6/6,長潮',
    '6/7,若潮',
    '6/8,中潮',
    '6/9,中潮',
    '6/10,大潮',
    '6/11,大潮',
    '6/12,大潮',
    '6/13,大潮',
    '6/14,中潮',
    '6/15,中潮',
    '6/16,中潮',
    '6/17,中潮',
    '6/18,小潮',
    '6/19,小潮',
    '6/20,小潮',
    '6/21,長潮',
    '6/22,若潮',
    '6/23,中潮',
    '6/24,中潮',
    '6/25,大潮',
    '6/26,大潮',
    '6/27,大潮',
    '6/28,大潮',
    '6/29,中潮',
    '6/30,中潮',
    '7/1,中潮',
    '7/2,中潮',
    '7/3,小潮',
    '7/4,小潮',
    '7/5,小潮',
    '7/6,長潮',
    '7/7,若潮',
    '7/8,中潮',
    '7/9,中潮',
    '7/10,大潮',
    '7/11,大潮',
    '7/12,大潮',
    '7/13,中潮',
    '7/14,中潮',
    '7/15,中潮',
    '7/16,中潮',
    '7/17,小潮',
    '7/18,小潮',
    '7/19,小潮',
    '7/20,長潮',
    '7/21,若潮',
    '7/22,中潮',
    '7/23,中潮',
    '7/24,大潮',
    '7/25,大潮',
    '7/26,大潮',
    '7/27,大潮',
    '7/28,中潮',
    '7/29,中潮',
    '7/30,中潮',
    '7/31,中潮',
    '8/1,小潮',
    '8/2,小潮',
    '8/3,小潮',
    '8/4,長潮',
    '8/5,若潮',
    '8/6,中潮',
    '8/7,中潮',
    '8/8,大潮',
    '8/9,大潮',
    '8/10,大潮',
    '8/11,大潮',
    '8/12,中潮',
    '8/13,中潮',
    '8/14,中潮',
    '8/15,中潮',
    '8/16,小潮',
    '8/17,小潮',
    '8/18,小潮',
    '8/19,長潮',
    '8/20,若潮',
    '8/21,中潮',
    '8/22,中潮',
    '8/23,大潮',
    '8/24,大潮',
    '8/25,大潮',
    '8/26,大潮',
    '8/27,中潮',
    '8/28,中潮',
    '8/29,中潮',
    '8/30,中潮',
    '8/31,小潮',
    '9/1,小潮',
    '9/2,小潮',
    '9/3,長潮',
    '9/4,若潮',
    '9/5,中潮',
    '9/6,中潮',
    '9/7,大潮',
    '9/8,大潮',
    '9/9,大潮',
    '9/10,中潮',
    '9/11,中潮',
    '9/12,中潮',
    '9/13,中潮',
    '9/14,小潮',
    '9/15,小潮',
    '9/16,小潮',
    '9/17,長潮',
    '9/18,若潮',
    '9/19,中潮',
    '9/20,中潮',
    '9/21,大潮',
    '9/22,大潮',
    '9/23,大潮',
    '9/24,大潮',
    '9/25,中潮',
    '9/26,中潮',
    '9/27,中潮',
    '9/28,中潮',
    '9/29,小潮',
    '9/30,小潮',
    '10/1,小潮',
    '10/2,長潮',
    '10/3,若潮',
    '10/4,中潮',
    '10/5,中潮',
    '10/6,大潮',
    '10/7,大潮',
    '10/8,大潮',
    '10/9,大潮',
    '10/10,中潮',
    '10/11,中潮',
    '10/12,中潮',
    '10/13,中潮',
    '10/14,小潮',
    '10/15,小潮',
    '10/16,小潮',
    '10/17,長潮',
    '10/18,若潮',
    '10/19,中潮',
    '10/20,中潮',
    '10/21,大潮',
    '10/22,大潮',
    '10/23,大潮',
    '10/24,大潮',
    '10/25,中潮',
    '10/26,中潮',
    '10/27,中潮',
    '10/28,中潮',
    '10/29,小潮',
    '10/30,小潮',
    '10/31,小潮',
    '11/1,長潮',
    '11/2,若潮',
    '11/3,中潮',
    '11/4,中潮',
    '11/5,大潮',
    '11/6,大潮',
    '11/7,大潮',
    '11/8,中潮',
    '11/9,中潮',
    '11/10,中潮',
    '11/11,中潮',
    '11/12,小潮',
    '11/13,小潮',
    '11/14,小潮',
    '11/15,長潮',
    '11/16,若潮',
    '11/17,中潮',
    '11/18,中潮',
    '11/19,大潮',
    '11/20,大潮',
    '11/21,大潮',
    '11/22,大潮',
    '11/23,中潮',
    '11/24,中潮',
    '11/25,中潮',
    '11/26,中潮',
    '11/27,小潮',
    '11/28,小潮',
    '11/29,小潮',
    '11/30,長潮',
    '12/1,若潮',
    '12/2,中潮',
    '12/3,中潮',
    '12/4,大潮',
    '12/5,大潮',
    '12/6,大潮',
    '12/7,大潮',
    '12/8,中潮',
    '12/9,中潮',
    '12/10,中潮',
    '12/11,中潮',
    '12/12,小潮',
    '12/13,小潮',
    '12/14,小潮',
    '12/15,長潮',
    '12/16,若潮',
    '12/17,中潮',
    '12/18,中潮',
    '12/19,大潮',
    '12/20,大潮',
    '12/21,大潮',
    '12/22,大潮',
    '12/23,中潮',
    '12/24,中潮',
    '12/25,中潮',
    '12/26,中潮',
    '12/27,小潮',
    '12/28,小潮',
    '12/29,小潮',
    '12/30,長潮',
    '12/31,若潮'
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/

// 月齢(こよみ式)
// 2022年

(function () {
  var year = 2022;
  var lines = [
    "1/1,中潮",
    "1/2,中潮",
    "1/3,大潮",
    "1/4,大潮",
    "1/5,大潮",
    "1/6,中潮",
    "1/7,中潮",
    "1/8,中潮",
    "1/9,中潮",
    "1/10,小潮",
    "1/11,小潮",
    "1/12,小潮",
    "1/13,長潮",
    "1/14,若潮",
    "1/15,中潮",
    "1/16,中潮",
    "1/17,大潮",
    "1/18,大潮",
    "1/19,大潮",
    "1/20,大潮",
    "1/21,中潮",
    "1/22,中潮",
    "1/23,中潮",
    "1/24,中潮",
    "1/25,小潮",
    "1/26,小潮",
    "1/27,小潮",
    "1/28,長潮",
    "1/29,若潮",
    "1/30,中潮",
    "1/31,中潮",
    "2/1,大潮",
    "2/2,大潮",
    "2/3,大潮",
    "2/4,大潮",
    "2/5,中潮",
    "2/6,中潮",
    "2/7,中潮",
    "2/8,中潮",
    "2/9,小潮",
    "2/10,小潮",
    "2/11,小潮",
    "2/12,長潮",
    "2/13,若潮",
    "2/14,中潮",
    "2/15,中潮",
    "2/16,大潮",
    "2/17,大潮",
    "2/18,大潮",
    "2/19,大潮",
    "2/20,中潮",
    "2/21,中潮",
    "2/22,中潮",
    "2/23,中潮",
    "2/24,小潮",
    "2/25,小潮",
    "2/26,小潮",
    "2/27,長潮",
    "2/28,若潮",
    "3/1,中潮",
    "3/2,中潮",
    "3/3,大潮",
    "3/4,大潮",
    "3/5,大潮",
    "3/6,中潮",
    "3/7,中潮",
    "3/8,中潮",
    "3/9,中潮",
    "3/10,小潮",
    "3/11,小潮",
    "3/12,小潮",
    "3/13,長潮",
    "3/14,若潮",
    "3/15,中潮",
    "3/16,中潮",
    "3/17,大潮",
    "3/18,大潮",
    "3/19,大潮",
    "3/20,大潮",
    "3/21,中潮",
    "3/22,中潮",
    "3/23,中潮",
    "3/24,中潮",
    "3/25,小潮",
    "3/26,小潮",
    "3/27,小潮",
    "3/28,長潮",
    "3/29,若潮",
    "3/30,中潮",
    "3/31,中潮",
    "4/1,大潮",
    "4/2,大潮",
    "4/3,大潮",
    "4/4,大潮",
    "4/5,中潮",
    "4/6,中潮",
    "4/7,中潮",
    "4/8,中潮",
    "4/9,小潮",
    "4/10,小潮",
    "4/11,小潮",
    "4/12,長潮",
    "4/13,若潮",
    "4/14,中潮",
    "4/15,中潮",
    "4/16,大潮",
    "4/17,大潮",
    "4/18,大潮",
    "4/19,大潮",
    "4/20,中潮",
    "4/21,中潮",
    "4/22,中潮",
    "4/23,中潮",
    "4/24,小潮",
    "4/25,小潮",
    "4/26,小潮",
    "4/27,長潮",
    "4/28,若潮",
    "4/29,中潮",
    "4/30,中潮",
    "5/1,大潮",
    "5/2,大潮",
    "5/3,大潮",
    "5/4,中潮",
    "5/5,中潮",
    "5/6,中潮",
    "5/7,中潮",
    "5/8,小潮",
    "5/9,小潮",
    "5/10,小潮",
    "5/11,長潮",
    "5/12,若潮",
    "5/13,中潮",
    "5/14,中潮",
    "5/15,大潮",
    "5/16,大潮",
    "5/17,大潮",
    "5/18,大潮",
    "5/19,中潮",
    "5/20,中潮",
    "5/21,中潮",
    "5/22,中潮",
    "5/23,小潮",
    "5/24,小潮",
    "5/25,小潮",
    "5/26,長潮",
    "5/27,若潮",
    "5/28,中潮",
    "5/29,中潮",
    "5/30,大潮",
    "5/31,大潮",
    "6/1,大潮",
    "6/2,大潮",
    "6/3,中潮",
    "6/4,中潮",
    "6/5,中潮",
    "6/6,中潮",
    "6/7,小潮",
    "6/8,小潮",
    "6/9,小潮",
    "6/10,長潮",
    "6/11,若潮",
    "6/12,中潮",
    "6/13,中潮",
    "6/14,大潮",
    "6/15,大潮",
    "6/16,大潮",
    "6/17,大潮",
    "6/18,中潮",
    "6/19,中潮",
    "6/20,中潮",
    "6/21,中潮",
    "6/22,小潮",
    "6/23,小潮",
    "6/24,小潮",
    "6/25,長潮",
    "6/26,若潮",
    "6/27,中潮",
    "6/28,中潮",
    "6/29,大潮",
    "6/30,大潮",
    "7/1,大潮",
    "7/2,中潮",
    "7/3,中潮",
    "7/4,中潮",
    "7/5,中潮",
    "7/6,小潮",
    "7/7,小潮",
    "7/8,小潮",
    "7/9,長潮",
    "7/10,若潮",
    "7/11,中潮",
    "7/12,中潮",
    "7/13,大潮",
    "7/14,大潮",
    "7/15,大潮",
    "7/16,大潮",
    "7/17,中潮",
    "7/18,中潮",
    "7/19,中潮",
    "7/20,中潮",
    "7/21,小潮",
    "7/22,小潮",
    "7/23,小潮",
    "7/24,長潮",
    "7/25,若潮",
    "7/26,中潮",
    "7/27,中潮",
    "7/28,大潮",
    "7/29,大潮",
    "7/30,大潮",
    "7/31,大潮",
    "8/1,中潮",
    "8/2,中潮",
    "8/3,中潮",
    "8/4,中潮",
    "8/5,小潮",
    "8/6,小潮",
    "8/7,小潮",
    "8/8,長潮",
    "8/9,若潮",
    "8/10,中潮",
    "8/11,中潮",
    "8/12,大潮",
    "8/13,大潮",
    "8/14,大潮",
    "8/15,大潮",
    "8/16,中潮",
    "8/17,中潮",
    "8/18,中潮",
    "8/19,中潮",
    "8/20,小潮",
    "8/21,小潮",
    "8/22,小潮",
    "8/23,長潮",
    "8/24,若潮",
    "8/25,中潮",
    "8/26,中潮",
    "8/27,大潮",
    "8/28,大潮",
    "8/29,大潮",
    "8/30,大潮",
    "8/31,中潮",
    "9/1,中潮",
    "9/2,中潮",
    "9/3,中潮",
    "9/4,小潮",
    "9/5,小潮",
    "9/6,小潮",
    "9/7,長潮",
    "9/8,若潮",
    "9/9,中潮",
    "9/10,中潮",
    "9/11,大潮",
    "9/12,大潮",
    "9/13,大潮",
    "9/14,大潮",
    "9/15,中潮",
    "9/16,中潮",
    "9/17,中潮",
    "9/18,中潮",
    "9/19,小潮",
    "9/20,小潮",
    "9/21,小潮",
    "9/22,長潮",
    "9/23,若潮",
    "9/24,中潮",
    "9/25,中潮",
    "9/26,大潮",
    "9/27,大潮",
    "9/28,大潮",
    "9/29,中潮",
    "9/30,中潮",
    "10/1,中潮",
    "10/2,中潮",
    "10/3,小潮",
    "10/4,小潮",
    "10/5,小潮",
    "10/6,長潮",
    "10/7,若潮",
    "10/8,中潮",
    "10/9,中潮",
    "10/10,大潮",
    "10/11,大潮",
    "10/12,大潮",
    "10/13,大潮",
    "10/14,中潮",
    "10/15,中潮",
    "10/16,中潮",
    "10/17,中潮",
    "10/18,小潮",
    "10/19,小潮",
    "10/20,小潮",
    "10/21,長潮",
    "10/22,若潮",
    "10/23,中潮",
    "10/24,中潮",
    "10/25,大潮",
    "10/26,大潮",
    "10/27,大潮",
    "10/28,大潮",
    "10/29,中潮",
    "10/30,中潮",
    "10/31,中潮",
    "11/1,中潮",
    "11/2,小潮",
    "11/3,小潮",
    "11/4,小潮",
    "11/5,長潮",
    "11/6,若潮",
    "11/7,中潮",
    "11/8,中潮",
    "11/9,大潮",
    "11/10,大潮",
    "11/11,大潮",
    "11/12,大潮",
    "11/13,中潮",
    "11/14,中潮",
    "11/15,中潮",
    "11/16,中潮",
    "11/17,小潮",
    "11/18,小潮",
    "11/19,小潮",
    "11/20,長潮",
    "11/21,若潮",
    "11/22,中潮",
    "11/23,中潮",
    "11/24,大潮",
    "11/25,大潮",
    "11/26,大潮",
    "11/27,中潮",
    "11/28,中潮",
    "11/29,中潮",
    "11/30,中潮",
    "12/1,小潮",
    "12/2,小潮",
    "12/3,小潮",
    "12/4,長潮",
    "12/5,若潮",
    "12/6,中潮",
    "12/7,中潮",
    "12/8,大潮",
    "12/9,大潮",
    "12/10,大潮",
    "12/11,大潮",
    "12/12,中潮",
    "12/13,中潮",
    "12/14,中潮",
    "12/15,中潮",
    "12/16,小潮",
    "12/17,小潮",
    "12/18,小潮",
    "12/19,長潮",
    "12/20,若潮",
    "12/21,中潮",
    "12/22,中潮",
    "12/23,大潮",
    "12/24,大潮",
    "12/25,大潮",
    "12/26,大潮",
    "12/27,中潮",
    "12/28,中潮",
    "12/29,中潮",
    "12/30,中潮",
    "12/31,小潮",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 国立天文台 各地のこよみ
// 日の出・日の入
// http://eco.mtk.nao.ac.jp/koyomi/dni/
//
// このサイトでは月単位でしか表示されないので、画面をコピペして一年分にする。

// 1ヶ月ごとウェブ画面をコピペしてemacsで加工して作成
// emacsにコピペ
// meta-x replace-regexp
// ^
// 2020/01
// 日付の1〜9を01〜09に書き換える
// meta-x kill-rectangle
// meta-x replace-string でスペースを,に
// meta-x replace-regexp
// ^
// '
// meta-x replace-regexp
// $
// ',
// 最終行の,を削除

// 2021年

(function() {
  var lines = [
    '2021/01/01,6:50,16:39',
    '2021/01/02,6:51,16:40',
    '2021/01/03,6:51,16:41',
    '2021/01/04,6:51,16:42',
    '2021/01/05,6:51,16:43',
    '2021/01/06,6:51,16:44',
    '2021/01/07,6:51,16:44',
    '2021/01/08,6:51,16:45',
    '2021/01/09,6:51,16:46',
    '2021/01/10,6:51,16:47',
    '2021/01/11,6:51,16:48',
    '2021/01/12,6:51,16:49',
    '2021/01/13,6:50,16:50',
    '2021/01/14,6:50,16:51',
    '2021/01/15,6:50,16:52',
    '2021/01/16,6:50,16:53',
    '2021/01/17,6:49,16:54',
    '2021/01/18,6:49,16:55',
    '2021/01/19,6:49,16:56',
    '2021/01/20,6:48,16:57',
    '2021/01/21,6:48,16:58',
    '2021/01/22,6:47,16:59',
    '2021/01/23,6:47,17:00',
    '2021/01/24,6:46,17:01',
    '2021/01/25,6:46,17:02',
    '2021/01/26,6:45,17:03',
    '2021/01/27,6:45,17:04',
    '2021/01/28,6:44,17:05',
    '2021/01/29,6:43,17:06',
    '2021/01/30,6:43,17:07',
    '2021/01/31,6:42,17:08',
    '2021/02/01,6:41,17:09',
    '2021/02/02,6:40,17:10',
    '2021/02/03,6:40,17:11',
    '2021/02/04,6:39,17:12',
    '2021/02/05,6:38,17:13',
    '2021/02/06,6:37,17:14',
    '2021/02/07,6:36,17:15',
    '2021/02/08,6:35,17:16',
    '2021/02/09,6:34,17:17',
    '2021/02/10,6:33,17:18',
    '2021/02/11,6:32,17:19',
    '2021/02/12,6:31,17:20',
    '2021/02/13,6:30,17:21',
    '2021/02/14,6:29,17:22',
    '2021/02/15,6:28,17:23',
    '2021/02/16,6:27,17:24',
    '2021/02/17,6:26,17:25',
    '2021/02/18,6:25,17:26',
    '2021/02/19,6:24,17:27',
    '2021/02/20,6:23,17:28',
    '2021/02/21,6:21,17:29',
    '2021/02/22,6:20,17:30',
    '2021/02/23,6:19,17:31',
    '2021/02/24,6:18,17:32',
    '2021/02/25,6:17,17:33',
    '2021/02/26,6:15,17:34',
    '2021/02/27,6:14,17:35',
    '2021/02/28,6:13,17:36',
    '2021/03/01,6:11,17:37',
    '2021/03/02,6:10,17:37',
    '2021/03/03,6:09,17:38',
    '2021/03/04,6:08,17:39',
    '2021/03/05,6:06,17:40',
    '2021/03/06,6:05,17:41',
    '2021/03/07,6:04,17:42',
    '2021/03/08,6:02,17:43',
    '2021/03/09,6:01,17:44',
    '2021/03/10,5:59,17:45',
    '2021/03/11,5:58,17:45',
    '2021/03/12,5:57,17:46',
    '2021/03/13,5:55,17:47',
    '2021/03/14,5:54,17:48',
    '2021/03/15,5:52,17:49',
    '2021/03/16,5:51,17:50',
    '2021/03/17,5:50,17:50',
    '2021/03/18,5:48,17:51',
    '2021/03/19,5:47,17:52',
    '2021/03/20,5:45,17:53',
    '2021/03/21,5:44,17:54',
    '2021/03/22,5:43,17:55',
    '2021/03/23,5:41,17:55',
    '2021/03/24,5:40,17:56',
    '2021/03/25,5:38,17:57',
    '2021/03/26,5:37,17:58',
    '2021/03/27,5:35,17:59',
    '2021/03/28,5:34,18:00',
    '2021/03/29,5:33,18:00',
    '2021/03/30,5:31,18:01',
    '2021/03/31,5:30,18:02',
    '2021/04/01,5:28,18:03',
    '2021/04/02,5:27,18:04',
    '2021/04/03,5:26,18:04',
    '2021/04/04,5:24,18:05',
    '2021/04/05,5:23,18:06',
    '2021/04/06,5:21,18:07',
    '2021/04/07,5:20,18:08',
    '2021/04/08,5:19,18:09',
    '2021/04/09,5:17,18:09',
    '2021/04/10,5:16,18:10',
    '2021/04/11,5:15,18:11',
    '2021/04/12,5:13,18:12',
    '2021/04/13,5:12,18:13',
    '2021/04/14,5:11,18:13',
    '2021/04/15,5:09,18:14',
    '2021/04/16,5:08,18:15',
    '2021/04/17,5:07,18:16',
    '2021/04/18,5:05,18:17',
    '2021/04/19,5:04,18:18',
    '2021/04/20,5:03,18:18',
    '2021/04/21,5:02,18:19',
    '2021/04/22,5:00,18:20',
    '2021/04/23,4:59,18:21',
    '2021/04/24,4:58,18:22',
    '2021/04/25,4:57,18:23',
    '2021/04/26,4:56,18:23',
    '2021/04/27,4:55,18:24',
    '2021/04/28,4:53,18:25',
    '2021/04/29,4:52,18:26',
    '2021/04/30,4:51,18:27',
    '2021/05/01,4:50,18:27',
    '2021/05/02,4:49,18:28',
    '2021/05/03,4:48,18:29',
    '2021/05/04,4:47,18:30',
    '2021/05/05,4:46,18:31',
    '2021/05/06,4:45,18:32',
    '2021/05/07,4:44,18:32',
    '2021/05/08,4:43,18:33',
    '2021/05/09,4:42,18:34',
    '2021/05/10,4:41,18:35',
    '2021/05/11,4:40,18:36',
    '2021/05/12,4:39,18:37',
    '2021/05/13,4:39,18:37',
    '2021/05/14,4:38,18:38',
    '2021/05/15,4:37,18:39',
    '2021/05/16,4:36,18:40',
    '2021/05/17,4:36,18:41',
    '2021/05/18,4:35,18:41',
    '2021/05/19,4:34,18:42',
    '2021/05/20,4:33,18:43',
    '2021/05/21,4:33,18:44',
    '2021/05/22,4:32,18:44',
    '2021/05/23,4:32,18:45',
    '2021/05/24,4:31,18:46',
    '2021/05/25,4:30,18:47',
    '2021/05/26,4:30,18:47',
    '2021/05/27,4:30,18:48',
    '2021/05/28,4:29,18:49',
    '2021/05/29,4:29,18:49',
    '2021/05/30,4:28,18:50',
    '2021/05/31,4:28,18:51',
    '2021/06/01,4:28,18:51',
    '2021/06/02,4:27,18:52',
    '2021/06/03,4:27,18:52',
    '2021/06/04,4:27,18:53',
    '2021/06/05,4:26,18:54',
    '2021/06/06,4:26,18:54',
    '2021/06/07,4:26,18:55',
    '2021/06/08,4:26,18:55',
    '2021/06/09,4:26,18:56',
    '2021/06/10,4:26,18:56',
    '2021/06/11,4:26,18:57',
    '2021/06/12,4:26,18:57',
    '2021/06/13,4:26,18:57',
    '2021/06/14,4:26,18:58',
    '2021/06/15,4:26,18:58',
    '2021/06/16,4:26,18:59',
    '2021/06/17,4:26,18:59',
    '2021/06/18,4:26,18:59',
    '2021/06/19,4:26,18:59',
    '2021/06/20,4:26,19:00',
    '2021/06/21,4:26,19:00',
    '2021/06/22,4:27,19:00',
    '2021/06/23,4:27,19:00',
    '2021/06/24,4:27,19:00',
    '2021/06/25,4:27,19:01',
    '2021/06/26,4:28,19:01',
    '2021/06/27,4:28,19:01',
    '2021/06/28,4:28,19:01',
    '2021/06/29,4:29,19:01',
    '2021/06/30,4:29,19:01',
    '2021/07/01,4:30,19:01',
    '2021/07/02,4:30,19:01',
    '2021/07/03,4:31,19:01',
    '2021/07/04,4:31,19:00',
    '2021/07/05,4:32,19:00',
    '2021/07/06,4:32,19:00',
    '2021/07/07,4:33,19:00',
    '2021/07/08,4:33,19:00',
    '2021/07/09,4:34,18:59',
    '2021/07/10,4:34,18:59',
    '2021/07/11,4:35,18:59',
    '2021/07/12,4:35,18:58',
    '2021/07/13,4:36,18:58',
    '2021/07/14,4:37,18:58',
    '2021/07/15,4:37,18:57',
    '2021/07/16,4:38,18:57',
    '2021/07/17,4:39,18:56',
    '2021/07/18,4:39,18:56',
    '2021/07/19,4:40,18:55',
    '2021/07/20,4:41,18:54',
    '2021/07/21,4:41,18:54',
    '2021/07/22,4:42,18:53',
    '2021/07/23,4:43,18:53',
    '2021/07/24,4:44,18:52',
    '2021/07/25,4:44,18:51',
    '2021/07/26,4:45,18:50',
    '2021/07/27,4:46,18:50',
    '2021/07/28,4:47,18:49',
    '2021/07/29,4:47,18:48',
    '2021/07/30,4:48,18:47',
    '2021/07/31,4:49,18:46',
    '2021/08/01,4:50,18:45',
    '2021/08/02,4:50,18:45',
    '2021/08/03,4:51,18:44',
    '2021/08/04,4:52,18:43',
    '2021/08/05,4:53,18:42',
    '2021/08/06,4:53,18:41',
    '2021/08/07,4:54,18:40',
    '2021/08/08,4:55,18:39',
    '2021/08/09,4:56,18:38',
    '2021/08/10,4:57,18:37',
    '2021/08/11,4:57,18:35',
    '2021/08/12,4:58,18:34',
    '2021/08/13,4:59,18:33',
    '2021/08/14,5:00,18:32',
    '2021/08/15,5:00,18:31',
    '2021/08/16,5:01,18:30',
    '2021/08/17,5:02,18:29',
    '2021/08/18,5:03,18:27',
    '2021/08/19,5:04,18:26',
    '2021/08/20,5:04,18:25',
    '2021/08/21,5:05,18:24',
    '2021/08/22,5:06,18:22',
    '2021/08/23,5:07,18:21',
    '2021/08/24,5:07,18:20',
    '2021/08/25,5:08,18:18',
    '2021/08/26,5:09,18:17',
    '2021/08/27,5:10,18:16',
    '2021/08/28,5:10,18:14',
    '2021/08/29,5:11,18:13',
    '2021/08/30,5:12,18:12',
    '2021/08/31,5:13,18:10',
    '2021/09/01,5:13,18:09',
    '2021/09/02,5:14,18:08',
    '2021/09/03,5:15,18:06',
    '2021/09/04,5:16,18:05',
    '2021/09/05,5:16,18:03',
    '2021/09/06,5:17,18:02',
    '2021/09/07,5:18,18:01',
    '2021/09/08,5:19,17:59',
    '2021/09/09,5:19,17:58',
    '2021/09/10,5:20,17:56',
    '2021/09/11,5:21,17:55',
    '2021/09/12,5:22,17:53',
    '2021/09/13,5:22,17:52',
    '2021/09/14,5:23,17:50',
    '2021/09/15,5:24,17:49',
    '2021/09/16,5:25,17:48',
    '2021/09/17,5:25,17:46',
    '2021/09/18,5:26,17:45',
    '2021/09/19,5:27,17:43',
    '2021/09/20,5:28,17:42',
    '2021/09/21,5:28,17:40',
    '2021/09/22,5:29,17:39',
    '2021/09/23,5:30,17:37',
    '2021/09/24,5:31,17:36',
    '2021/09/25,5:31,17:34',
    '2021/09/26,5:32,17:33',
    '2021/09/27,5:33,17:31',
    '2021/09/28,5:34,17:30',
    '2021/09/29,5:34,17:29',
    '2021/09/30,5:35,17:27',
    '2021/10/01,5:36,17:26',
    '2021/10/02,5:37,17:24',
    '2021/10/03,5:38,17:23',
    '2021/10/04,5:38,17:21',
    '2021/10/05,5:39,17:20',
    '2021/10/06,5:40,17:19',
    '2021/10/07,5:41,17:17',
    '2021/10/08,5:42,17:16',
    '2021/10/09,5:42,17:15',
    '2021/10/10,5:43,17:13',
    '2021/10/11,5:44,17:12',
    '2021/10/12,5:45,17:11',
    '2021/10/13,5:46,17:09',
    '2021/10/14,5:47,17:08',
    '2021/10/15,5:47,17:07',
    '2021/10/16,5:48,17:05',
    '2021/10/17,5:49,17:04',
    '2021/10/18,5:50,17:03',
    '2021/10/19,5:51,17:01',
    '2021/10/20,5:52,17:00',
    '2021/10/21,5:53,16:59',
    '2021/10/22,5:53,16:58',
    '2021/10/23,5:54,16:57',
    '2021/10/24,5:55,16:55',
    '2021/10/25,5:56,16:54',
    '2021/10/26,5:57,16:53',
    '2021/10/27,5:58,16:52',
    '2021/10/28,5:59,16:51',
    '2021/10/29,6:00,16:50',
    '2021/10/30,6:01,16:49',
    '2021/10/31,6:02,16:48',
    '2021/11/01,6:03,16:47',
    '2021/11/02,6:04,16:46',
    '2021/11/03,6:05,16:45',
    '2021/11/04,6:06,16:44',
    '2021/11/05,6:07,16:43',
    '2021/11/06,6:07,16:42',
    '2021/11/07,6:08,16:41',
    '2021/11/08,6:09,16:40',
    '2021/11/09,6:10,16:40',
    '2021/11/10,6:11,16:39',
    '2021/11/11,6:12,16:38',
    '2021/11/12,6:13,16:37',
    '2021/11/13,6:14,16:37',
    '2021/11/14,6:15,16:36',
    '2021/11/15,6:16,16:35',
    '2021/11/16,6:17,16:35',
    '2021/11/17,6:18,16:34',
    '2021/11/18,6:19,16:33',
    '2021/11/19,6:20,16:33',
    '2021/11/20,6:21,16:32',
    '2021/11/21,6:22,16:32',
    '2021/11/22,6:23,16:31',
    '2021/11/23,6:24,16:31',
    '2021/11/24,6:25,16:31',
    '2021/11/25,6:26,16:30',
    '2021/11/26,6:27,16:30',
    '2021/11/27,6:28,16:30',
    '2021/11/28,6:29,16:29',
    '2021/11/29,6:30,16:29',
    '2021/11/30,6:31,16:29',
    '2021/12/01,6:32,16:29',
    '2021/12/02,6:33,16:29',
    '2021/12/03,6:33,16:29',
    '2021/12/04,6:34,16:28',
    '2021/12/05,6:35,16:28',
    '2021/12/06,6:36,16:28',
    '2021/12/07,6:37,16:28',
    '2021/12/08,6:38,16:29',
    '2021/12/09,6:38,16:29',
    '2021/12/10,6:39,16:29',
    '2021/12/11,6:40,16:29',
    '2021/12/12,6:41,16:29',
    '2021/12/13,6:41,16:29',
    '2021/12/14,6:42,16:30',
    '2021/12/15,6:43,16:30',
    '2021/12/16,6:43,16:30',
    '2021/12/17,6:44,16:31',
    '2021/12/18,6:45,16:31',
    '2021/12/19,6:45,16:31',
    '2021/12/20,6:46,16:32',
    '2021/12/21,6:46,16:32',
    '2021/12/22,6:47,16:33',
    '2021/12/23,6:47,16:33',
    '2021/12/24,6:48,16:34',
    '2021/12/25,6:48,16:35',
    '2021/12/26,6:49,16:35',
    '2021/12/27,6:49,16:36',
    '2021/12/28,6:49,16:36',
    '2021/12/29,6:50,16:37',
    '2021/12/30,6:50,16:38',
    '2021/12/31,6:50,16:39'
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();

/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 国立天文台 各地のこよみ
// 日の出・日の入
// http://eco.mtk.nao.ac.jp/koyomi/dni/
//
// このサイトでは月単位でしか表示されないので、画面をコピペして一年分にする。

// 1ヶ月ごとウェブ画面をコピペしてemacsで加工して作成
// emacsにコピペ
// meta-x replace-regexp
// ^
// 2020/01
// 日付の1〜9を01〜09に書き換える
// meta-x kill-rectangle
// meta-x replace-string でスペースを,に
// meta-x replace-regexp
// ^
// '
// meta-x replace-regexp
// $
// ',
// 最終行の,を削除

// 2022年

(function () {
  var lines = [
    "2022/01/01,6:50,16:39",
    "2022/01/02,6:51,16:40",
    "2022/01/03,6:51,16:41",
    "2022/01/04,6:51,16:42",
    "2022/01/05,6:51,16:42",
    "2022/01/06,6:51,16:43",
    "2022/01/07,6:51,16:44",
    "2022/01/08,6:51,16:45",
    "2022/01/09,6:51,16:46",
    "2022/01/10,6:51,16:47",
    "2022/01/11,6:51,16:48",
    "2022/01/12,6:51,16:49",
    "2022/01/13,6:50,16:50",
    "2022/01/14,6:50,16:51",
    "2022/01/15,6:50,16:52",
    "2022/01/16,6:50,16:53",
    "2022/01/17,6:49,16:54",
    "2022/01/18,6:49,16:55",
    "2022/01/19,6:49,16:56",
    "2022/01/20,6:48,16:57",
    "2022/01/21,6:48,16:58",
    "2022/01/22,6:47,16:59",
    "2022/01/23,6:47,17:00",
    "2022/01/24,6:46,17:01",
    "2022/01/25,6:46,17:02",
    "2022/01/26,6:45,17:03",
    "2022/01/27,6:45,17:04",
    "2022/01/28,6:44,17:05",
    "2022/01/29,6:43,17:06",
    "2022/01/30,6:43,17:07",
    "2022/01/31,6:42,17:08",
    "2022/02/01,6:41,17:09",
    "2022/02/02,6:41,17:10",
    "2022/02/03,6:40,17:11",
    "2022/02/04,6:39,17:12",
    "2022/02/05,6:38,17:13",
    "2022/02/06,6:37,17:14",
    "2022/02/07,6:36,17:15",
    "2022/02/08,6:35,17:16",
    "2022/02/09,6:34,17:17",
    "2022/02/10,6:34,17:18",
    "2022/02/11,6:33,17:19",
    "2022/02/12,6:32,17:20",
    "2022/02/13,6:30,17:21",
    "2022/02/14,6:29,17:22",
    "2022/02/15,6:28,17:23",
    "2022/02/16,6:27,17:24",
    "2022/02/17,6:26,17:25",
    "2022/02/18,6:25,17:26",
    "2022/02/19,6:24,17:27",
    "2022/02/20,6:23,17:28",
    "2022/02/21,6:22,17:29",
    "2022/02/22,6:20,17:30",
    "2022/02/23,6:19,17:31",
    "2022/02/24,6:18,17:32",
    "2022/02/25,6:17,17:33",
    "2022/02/26,6:16,17:34",
    "2022/02/27,6:14,17:35",
    "2022/02/28,6:13,17:35",
    "2022/03/01,6:12,17:36",
    "2022/03/02,6:10,17:37",
    "2022/03/03,6:09,17:38",
    "2022/03/04,6:08,17:39",
    "2022/03/05,6:07,17:40",
    "2022/03/06,6:05,17:41",
    "2022/03/07,6:04,17:42",
    "2022/03/08,6:02,17:43",
    "2022/03/09,6:01,17:43",
    "2022/03/10,6:00,17:44",
    "2022/03/11,5:58,17:45",
    "2022/03/12,5:57,17:46",
    "2022/03/13,5:56,17:47",
    "2022/03/14,5:54,17:48",
    "2022/03/15,5:53,17:49",
    "2022/03/16,5:51,17:49",
    "2022/03/17,5:50,17:50",
    "2022/03/18,5:49,17:51",
    "2022/03/19,5:47,17:52",
    "2022/03/20,5:46,17:53",
    "2022/03/21,5:44,17:54",
    "2022/03/22,5:43,17:54",
    "2022/03/23,5:41,17:55",
    "2022/03/24,5:40,17:56",
    "2022/03/25,5:39,17:57",
    "2022/03/26,5:37,17:58",
    "2022/03/27,5:36,17:59",
    "2022/03/28,5:34,17:59",
    "2022/03/29,5:33,18:00",
    "2022/03/30,5:32,18:01",
    "2022/03/31,5:30,18:02",
    "2022/04/01,5:29,18:03",
    "2022/04/02,5:27,18:03",
    "2022/04/03,5:26,18:04",
    "2022/04/04,5:25,18:05",
    "2022/04/05,5:23,18:06",
    "2022/04/06,5:22,18:07",
    "2022/04/07,5:20,18:08",
    "2022/04/08,5:19,18:08",
    "2022/04/09,5:18,18:09",
    "2022/04/10,5:16,18:10",
    "2022/04/11,5:15,18:11",
    "2022/04/12,5:14,18:12",
    "2022/04/13,5:12,18:12",
    "2022/04/14,5:11,18:13",
    "2022/04/15,5:10,18:14",
    "2022/04/16,5:08,18:15",
    "2022/04/17,5:07,18:16",
    "2022/04/18,5:06,18:17",
    "2022/04/19,5:04,18:17",
    "2022/04/20,5:03,18:18",
    "2022/04/21,5:02,18:19",
    "2022/04/22,5:01,18:20",
    "2022/04/23,5:00,18:21",
    "2022/04/24,4:58,18:21",
    "2022/04/25,4:57,18:22",
    "2022/04/26,4:56,18:23",
    "2022/04/27,4:55,18:24",
    "2022/04/28,4:54,18:25",
    "2022/04/29,4:53,18:26",
    "2022/04/30,4:51,18:26",
    "2022/05/01,4:50,18:27",
    "2022/05/02,4:49,18:28",
    "2022/05/03,4:48,18:29",
    "2022/05/04,4:47,18:30",
    "2022/05/05,4:46,18:31",
    "2022/05/06,4:45,18:31",
    "2022/05/07,4:44,18:32",
    "2022/05/08,4:43,18:33",
    "2022/05/09,4:42,18:34",
    "2022/05/10,4:41,18:35",
    "2022/05/11,4:41,18:36",
    "2022/05/12,4:40,18:36",
    "2022/05/13,4:39,18:37",
    "2022/05/14,4:38,18:38",
    "2022/05/15,4:37,18:39",
    "2022/05/16,4:36,18:40",
    "2022/05/17,4:36,18:40",
    "2022/05/18,4:35,18:41",
    "2022/05/19,4:34,18:42",
    "2022/05/20,4:34,18:43",
    "2022/05/21,4:33,18:43",
    "2022/05/22,4:32,18:44",
    "2022/05/23,4:32,18:45",
    "2022/05/24,4:31,18:46",
    "2022/05/25,4:31,18:46",
    "2022/05/26,4:30,18:47",
    "2022/05/27,4:30,18:48",
    "2022/05/28,4:29,18:48",
    "2022/05/29,4:29,18:49",
    "2022/05/30,4:28,18:50",
    "2022/05/31,4:28,18:50",
    "2022/06/01,4:28,18:51",
    "2022/06/02,4:27,18:52",
    "2022/06/03,4:27,18:52",
    "2022/06/04,4:27,18:53",
    "2022/06/05,4:26,18:53",
    "2022/06/06,4:26,18:54",
    "2022/06/07,4:26,18:55",
    "2022/06/08,4:26,18:55",
    "2022/06/09,4:26,18:56",
    "2022/06/10,4:26,18:56",
    "2022/06/11,4:26,18:57",
    "2022/06/12,4:26,18:57",
    "2022/06/13,4:26,18:57",
    "2022/06/14,4:26,18:58",
    "2022/06/15,4:26,18:58",
    "2022/06/16,4:26,18:58",
    "2022/06/17,4:26,18:59",
    "2022/06/18,4:26,18:59",
    "2022/06/19,4:26,18:59",
    "2022/06/20,4:26,19:00",
    "2022/06/21,4:26,19:00",
    "2022/06/22,4:27,19:00",
    "2022/06/23,4:27,19:00",
    "2022/06/24,4:27,19:00",
    "2022/06/25,4:27,19:01",
    "2022/06/26,4:28,19:01",
    "2022/06/27,4:28,19:01",
    "2022/06/28,4:28,19:01",
    "2022/06/29,4:29,19:01",
    "2022/06/30,4:29,19:01",
    "2022/07/01,4:30,19:01",
    "2022/07/02,4:30,19:01",
    "2022/07/03,4:30,19:01",
    "2022/07/04,4:31,19:00",
    "2022/07/05,4:31,19:00",
    "2022/07/06,4:32,19:00",
    "2022/07/07,4:32,19:00",
    "2022/07/08,4:33,19:00",
    "2022/07/09,4:34,18:59",
    "2022/07/10,4:34,18:59",
    "2022/07/11,4:35,18:59",
    "2022/07/12,4:35,18:58",
    "2022/07/13,4:36,18:58",
    "2022/07/14,4:37,18:58",
    "2022/07/15,4:37,18:57",
    "2022/07/16,4:38,18:57",
    "2022/07/17,4:39,18:56",
    "2022/07/18,4:39,18:56",
    "2022/07/19,4:40,18:55",
    "2022/07/20,4:41,18:55",
    "2022/07/21,4:41,18:54",
    "2022/07/22,4:42,18:53",
    "2022/07/23,4:43,18:53",
    "2022/07/24,4:43,18:52",
    "2022/07/25,4:44,18:51",
    "2022/07/26,4:45,18:51",
    "2022/07/27,4:46,18:50",
    "2022/07/28,4:46,18:49",
    "2022/07/29,4:47,18:48",
    "2022/07/30,4:48,18:47",
    "2022/07/31,4:49,18:47",
    "2022/08/01,4:49,18:46",
    "2022/08/02,4:50,18:45",
    "2022/08/03,4:51,18:44",
    "2022/08/04,4:52,18:43",
    "2022/08/05,4:53,18:42",
    "2022/08/06,4:53,18:41",
    "2022/08/07,4:54,18:40",
    "2022/08/08,4:55,18:39",
    "2022/08/09,4:56,18:38",
    "2022/08/10,4:56,18:37",
    "2022/08/11,4:57,18:36",
    "2022/08/12,4:58,18:35",
    "2022/08/13,4:59,18:33",
    "2022/08/14,4:59,18:32",
    "2022/08/15,5:00,18:31",
    "2022/08/16,5:01,18:30",
    "2022/08/17,5:02,18:29",
    "2022/08/18,5:03,18:28",
    "2022/08/19,5:03,18:26",
    "2022/08/20,5:04,18:25",
    "2022/08/21,5:05,18:24",
    "2022/08/22,5:06,18:23",
    "2022/08/23,5:06,18:21",
    "2022/08/24,5:07,18:20",
    "2022/08/25,5:08,18:19",
    "2022/08/26,5:09,18:17",
    "2022/08/27,5:09,18:16",
    "2022/08/28,5:10,18:15",
    "2022/08/29,5:11,18:13",
    "2022/08/30,5:12,18:12",
    "2022/08/31,5:12,18:11",
    "2022/09/01,5:13,18:09",
    "2022/09/02,5:14,18:08",
    "2022/09/03,5:15,18:07",
    "2022/09/04,5:15,18:05",
    "2022/09/05,5:16,18:04",
    "2022/09/06,5:17,18:02",
    "2022/09/07,5:18,18:01",
    "2022/09/08,5:18,17:59",
    "2022/09/09,5:19,17:58",
    "2022/09/10,5:20,17:57",
    "2022/09/11,5:21,17:55",
    "2022/09/12,5:21,17:54",
    "2022/09/13,5:22,17:52",
    "2022/09/14,5:23,17:51",
    "2022/09/15,5:24,17:49",
    "2022/09/16,5:24,17:48",
    "2022/09/17,5:25,17:46",
    "2022/09/18,5:26,17:45",
    "2022/09/19,5:27,17:43",
    "2022/09/20,5:27,17:42",
    "2022/09/21,5:28,17:41",
    "2022/09/22,5:29,17:39",
    "2022/09/23,5:30,17:38",
    "2022/09/24,5:30,17:36",
    "2022/09/25,5:31,17:35",
    "2022/09/26,5:32,17:33",
    "2022/09/27,5:33,17:32",
    "2022/09/28,5:33,17:30",
    "2022/09/29,5:34,17:29",
    "2022/09/30,5:35,17:28",
    "2022/10/01,5:36,17:26",
    "2022/10/02,5:37,17:25",
    "2022/10/03,5:37,17:23",
    "2022/10/04,5:38,17:22",
    "2022/10/05,5:39,17:20",
    "2022/10/06,5:40,17:19",
    "2022/10/07,5:41,17:18",
    "2022/10/08,5:41,17:16",
    "2022/10/09,5:42,17:15",
    "2022/10/10,5:43,17:14",
    "2022/10/11,5:44,17:12",
    "2022/10/12,5:45,17:11",
    "2022/10/13,5:45,17:09",
    "2022/10/14,5:46,17:08",
    "2022/10/15,5:47,17:07",
    "2022/10/16,5:48,17:06",
    "2022/10/17,5:49,17:04",
    "2022/10/18,5:50,17:03",
    "2022/10/19,5:51,17:02",
    "2022/10/20,5:51,17:01",
    "2022/10/21,5:52,16:59",
    "2022/10/22,5:53,16:58",
    "2022/10/23,5:54,16:57",
    "2022/10/24,5:55,16:56",
    "2022/10/25,5:56,16:55",
    "2022/10/26,5:57,16:53",
    "2022/10/27,5:58,16:52",
    "2022/10/28,5:59,16:51",
    "2022/10/29,6:00,16:50",
    "2022/10/30,6:01,16:49",
    "2022/10/31,6:02,16:48",
    "2022/11/01,6:02,16:47",
    "2022/11/02,6:03,16:46",
    "2022/11/03,6:04,16:45",
    "2022/11/04,6:05,16:44",
    "2022/11/05,6:06,16:43",
    "2022/11/06,6:07,16:42",
    "2022/11/07,6:08,16:41",
    "2022/11/08,6:09,16:41",
    "2022/11/09,6:10,16:40",
    "2022/11/10,6:11,16:39",
    "2022/11/11,6:12,16:38",
    "2022/11/12,6:13,16:37",
    "2022/11/13,6:14,16:37",
    "2022/11/14,6:15,16:36",
    "2022/11/15,6:16,16:35",
    "2022/11/16,6:17,16:35",
    "2022/11/17,6:18,16:34",
    "2022/11/18,6:19,16:34",
    "2022/11/19,6:20,16:33",
    "2022/11/20,6:21,16:32",
    "2022/11/21,6:22,16:32",
    "2022/11/22,6:23,16:32",
    "2022/11/23,6:24,16:31",
    "2022/11/24,6:25,16:31",
    "2022/11/25,6:26,16:30",
    "2022/11/26,6:27,16:30",
    "2022/11/27,6:28,16:30",
    "2022/11/28,6:29,16:29",
    "2022/11/29,6:30,16:29",
    "2022/11/30,6:31,16:29",
    "2022/12/01,6:31,16:29",
    "2022/12/02,6:32,16:29",
    "2022/12/03,6:33,16:29",
    "2022/12/04,6:34,16:29",
    "2022/12/05,6:35,16:28",
    "2022/12/06,6:36,16:28",
    "2022/12/07,6:37,16:28",
    "2022/12/08,6:37,16:29",
    "2022/12/09,6:38,16:29",
    "2022/12/10,6:39,16:29",
    "2022/12/11,6:40,16:29",
    "2022/12/12,6:41,16:29",
    "2022/12/13,6:41,16:29",
    "2022/12/14,6:42,16:30",
    "2022/12/15,6:43,16:30",
    "2022/12/16,6:43,16:30",
    "2022/12/17,6:44,16:31",
    "2022/12/18,6:45,16:31",
    "2022/12/19,6:45,16:31",
    "2022/12/20,6:46,16:32",
    "2022/12/21,6:46,16:32",
    "2022/12/22,6:47,16:33",
    "2022/12/23,6:47,16:33",
    "2022/12/24,6:48,16:34",
    "2022/12/25,6:48,16:34",
    "2022/12/26,6:49,16:35",
    "2022/12/27,6:49,16:36",
    "2022/12/28,6:49,16:36",
    "2022/12/29,6:50,16:37",
    "2022/12/30,6:50,16:38",
    "2022/12/31,6:50,16:38",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();

/* global d3, d3tide */

// 2016.11.29
// Takamitsu IIDA

// ミニ・ラインチャートモジュール
// svgは既に存在する前提
(function() {
  d3tide.miniChart = function module(_accessor) {
    //
    // クラス名定義
    //

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'mini-tidechart-layer';

    // チャートのラインとエリア
    var CLASS_CHART_LINE = 'mini-tidechart-line'; // CSSでスタイル指定
    var CLASS_CHART_AREA = 'mini-tidechart-area'; // CSSでスタイル指定

    // 外枠の大きさ(初期値)
    var width = 200;
    var height = 200;

    // 描画領域のマージン
    var margin = {
      top: 25, // 日付けがあるので上に隙間をあける
      right: 0,
      bottom: 0,
      left: 0
    };

    // 描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // ダミーデータ
    var dummy = [0];

    // このモジュールをcall()したコンテナへのセレクタ
    var container;

    // チャートを描画するレイヤへのセレクタ
    var layer;

    // call()時に渡されたデータ
    var tideDatas;

    // 入力ドメイン（決め打ち）
    var xdomain = [0, 24];
    var ydomain = [-20, 150];

    // スケール関数とレンジ指定
    var xScale = d3.scaleLinear().domain(xdomain).range([0, w]);
    var yScale = d3.scaleLinear().domain(ydomain).range([h, 0]);

    // ライン用のパスジェネレータ
    var line = d3.line().curve(d3.curveNatural);

    // 塗りつぶしを描画するか
    var draw_area = false;

    // 塗りつぶしエリアのパスジェネレータ
    var area = d3.area().curve(d3.curveNatural);

    // パスジェネレータにスケールを適用する関数
    // データは [[0, 107], [1, 102],
    // という構造を想定しているので、x軸はd[0]、y軸はd[1]になる
    // 実際にパスジェネレータにスケールを適用するのは
    // データ入手後に軸のドメインを決めて、スケールを作り直してから
    function setScale() {
      // ライン用パスジェネレータにスケールを適用する
      line
        .x(function(d) {
          return xScale(d[0]);
        })
        .y(function(d) {
          return yScale(d[1]);
        });

      // エリア用パスジェネレータにスケールを適用する
      area
        .x(function(d) {
          return xScale(d[0]);
        })
        .y0(h)
        .y1(function(d) {
          return yScale(d[1]);
        });
      //
    }

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        if (!_data) {
          // データにnullを指定してcall()した場合は、既存の描画領域を削除して終了
          container.select('.' + CLASS_CHART_LAYER).remove();
          return;
        }

        tideDatas = _data;

        // コンテナに直接描画するのは気がひけるので、レイヤを１枚追加する
        var layerAll = container.selectAll('.' + CLASS_CHART_LAYER).data(dummy);
        layer = layerAll
          .enter()
          .append('g')
          .classed(CLASS_CHART_LAYER, true)
          .merge(layerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // スケールをパスジェネレータに適用する
        setScale();

        // レイヤにチャートを配置する
        drawChart();
        //
      });
    }

    // レイヤにチャートを描画する
    function drawChart() {
      // X軸に並行のグリッド線を描画する
      var yGridAll = layer.selectAll('.mini-tidechart-y-grid').data(dummy);
      yGridAll
        .enter()
        .append('g')
        .classed('mini-tidechart-y-grid', true)
        .merge(yGridAll)
        .call(d3.axisLeft(yScale).ticks(3).tickSize(-w).tickFormat(''));

      // グラフを表示
      if (draw_area) {
        var areaAll = layer.selectAll('.' + CLASS_CHART_AREA).data(dummy);
        areaAll
          .enter()
          .append('path')
          .classed(CLASS_CHART_AREA, true)
          .merge(areaAll)
          .datum(tideDatas)
          .transition()
          .attr('d', area);
      }

      var lineAll = layer.selectAll('.' + CLASS_CHART_LINE).data(dummy);
      lineAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_LINE, true)
        .merge(lineAll)
        .datum(tideDatas)
        .transition()
        .attr('d', line);
      //
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      xScale.range([0, w]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    return exports;
  };

  //
})();

/* global d3, d3tide */

// 2016.11.28
// Takamitsu IIDA

//
// 依存
// dataManager.js
//

// 月を表示するモジュール
(function() {
  d3tide.monthCalendar = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    var needsvg = arguments.length ? _accessor : false;

    // コンテナの幅に自動調整するかどうか
    var adjustContainerWidth = false;

    //
    // データマネージャ
    //
    var dm = d3tide.dataManager();

    // ダミーデータ
    var dummy = [0];

    // カスタムイベント
    var dispatch = d3.dispatch('click', 'offsetChanged');

    // 枠の大きさ
    var width = 800;
    var height = 600;

    // 6行7列のグリッドの大きさを決めるマージン
    // マージンで作った余白部分には、年や月のラベル、曜日を表示する
    var margin = {
      top: 100, // 余白にラベルを表示するのでグリッドの位置を下げる(60+5 + 30+5)
      right: 50, // 余白にボタンを配置する
      bottom: 20,
      left: 50 // 余白にボタンを配置する
    };

    // グリッドを描画する領域
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // 6x7グリッドの各セルの幅と高さ
    var cellWidth = w / 7;
    var cellHeight = h / 6;

    // 左右にボタンを表示するかどうか
    var buttonEnabled = true;

    // ラベルの高さ
    var labelHeight = 60;

    // 曜日を表示する部分の高さ
    var dtwHeight = 30;

    // 描画するレイヤ'g'へのセレクタ
    var baseLayer;

    // いま時点の年・月・日
    var now = new Date();
    var ThisYear = now.getFullYear();
    var ThisMonth = now.getMonth();
    var ThisDay = now.getDate();

    // 今月から何ヶ月ズレた月を表示するか、のオフセット
    // -1で1ヶ月前、1で1ヶ月後になる
    // 依存関係があるので直接変更するのではなく、exports.offset(1)とする
    var offset = 0;

    // 表示対象の年と月(0-11)
    var targetYear = getTargetYear();
    var targetMonth = getTargetMonth();

    // 表示対象の前の月(0-11)とその年
    var prevMonth = getPrevMonth();
    var prevMonthYear = getPrevMonthYear();

    // 表示対象の次の月(0-11)とその年
    var nextMonth = getNextMonth();
    var nextMonthYear = getNextMonthYear();

    var weekNames = ['日', '月', '火', '水', '木', '金', '土'];
    var monthNames = d3.range(1, 13).map(function(d) {
      return d;
    });

    // 各セルの'g'へのセレクタ
    // セル位置の配列が紐付けられている
    var cell;

    // 6x7=42の長さを持つ配列
    // セルの位置情報 [ [x,y], [x,y],,,]
    var cellPositions = getCellPositions();

    // days配列に格納するオブジェクトのプロトタイプ
    var proto_day = {
      year: 1970,
      month: 0,
      day: 1,
      offset: 0, // ターゲット月は0、-1は前月、+1は翌月
      isToday: false
    };

    // proto_dayをインスタンス化する関数
    function makeDay() {
      var d = Object.create(proto_day);

      // 日付表示は 11/29 のように「月/日」を返すようにする
      d.showDate = function() {
        // return d.year + '/' + (d.month + 1) + '/' + d.day;
        return (d.month + 1) + '/' + d.day;
      };

      return d;
    }

    // 6x7=42の長さを持つコンテンツの配列
    var days = getDays();

    // 6x7=42のminiChart()インスタンスの配列
    var minicharts = d3.range(0, 42).map(function(d) {
      return d3tide.miniChart().width(cellWidth).height(cellHeight);
    });

    // call()したコンテナ
    var container;

    // call()時に実行される関数
    function exports(_selection) {
      if (adjustContainerWidth) {
        // コンテナの大きさを取り出してそれに合わせる
        var containerWidth = _selection.node().clientWidth;
        exports.width(containerWidth);
      }
      if (needsvg) {
        // svgの作成を必要とするなら、新たにsvgを作成して、それをコンテナにする
        var svgAll = _selection.selectAll('svg').data(dummy);
        container = svgAll.enter().append('svg').merge(svgAll).attr('width', width).attr('height', height);
      } else {
        container = _selection;
      }

      //
      _selection.each(function(_data) {
        // ベースとなるレイヤを作成し、この上にコンテンツを乗せていく
        var baseLayerAll = container.selectAll('.mc-base-layer').data(dummy);
        baseLayer = baseLayerAll
          .enter()
          .append('g')
          .classed('mc-base-layer', true)
          .merge(baseLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // 諸々を描画する
        draw();
        //
      });
    }

    // Prev Nextボタンを押したときもこれを実行する
    function draw() {
      // ベースレイヤの余白部分にボタンを乗せる
      if (buttonEnabled) {
        drawPrevNextButton();
      }

      // ベースレイヤの余白部分に曜日の表示を乗せる
      drawDayOfTheWeek();

      // ベースレイヤの余白部分にラベルを乗せる
      drawLabel();

      // ベースレイヤに6x7=42個のセルを乗せて、各セルに日付けや月齢を描画する
      drawGrid();

      // セルの中に潮汐グラフを描画する
      drawMiniChart();
    }

    // ラベルを表示する
    function drawLabel() {
      var labelAll = baseLayer.selectAll('.mc-label-g').data(dummy);
      var label = labelAll
        .enter()
        .append('g')
        .classed('mc-label-g', true)
        .merge(labelAll)
        .attr('width', w)
        .attr('height', labelHeight)
        .attr('transform', 'translate(0,' + (-margin.top) + ')');

      var labelMonthAll = label.selectAll('.mc-label-month').data(dummy);
      labelMonthAll
        .enter()
        .append('text')
        .classed('mc-label-month', true)
        .merge(labelMonthAll)
        .text(monthNames[targetMonth])
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth / 2)
        .attr('y', labelHeight);

      var labelYearAll = label.selectAll('.mc-label-year').data(dummy);
      labelYearAll
        .enter()
        .append('text')
        .classed('mc-label-year', true)
        .merge(labelYearAll)
        .text(targetYear)
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth * 1.5)
        .attr('y', labelHeight);
    }

    var buttonWidth = 40;

    // ボタンを表示する
    function drawPrevNextButton() {
      var prevButtonContainerAll = baseLayer.selectAll('.mc-prev-button-container').data(dummy);
      var prevButtonContainer = prevButtonContainerAll
        .enter()
        .append('g')
        .classed('mc-prev-button-container', true)
        .merge(prevButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (-1 * buttonWidth - 5) + ',0)');

      var prevButtonAll = prevButtonContainer.selectAll('.mc-prev-button').data(dummy);
      prevButtonAll
        .enter()
        .append('rect')
        .classed('mc-prev-button', true)
        .merge(prevButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onPrev(d3.select(this));
        });

      var nextButtonContainerAll = baseLayer.selectAll('.mc-next-button-container').data(dummy);
      var nextButtonContainer = nextButtonContainerAll
        .enter()
        .append('g')
        .classed('mc-next-button-container', true)
        .merge(nextButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (w + 5) + ',0)');

      var nextButtonAll = nextButtonContainer.selectAll('.mc-next-button').data(dummy);
      nextButtonAll
        .enter()
        .append('rect')
        .classed('mc-next-button', true)
        .merge(nextButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onNext(d3.select(this));
        });
      //
    }

    function onPrev(selector) {
      exports.prev();
    }

    function onNext(selector) {
      exports.next();
    }

    // 曜日(Day of The Week)を表示する
    function drawDayOfTheWeek() {
      var dtwAll = baseLayer.selectAll('.mc-dtw-g').data([0, 1, 2, 3, 4, 5, 6]);
      dtwAll
        .enter()
        .append('g')
        .classed('mc-dtw-g', true)
        .merge(dtwAll)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('transform', function(d, i) {
          return 'translate(' + cellPositions[i][0] + ',' + (-dtwHeight - 5) + ')';
        })
        .each(function(d, i) {
          var dtwRectAll = d3.select(this).selectAll('rect').data([i]);
          dtwRectAll
            .enter()
            .append('rect')
            .merge(dtwRectAll)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', cellWidth)
            .attr('height', dtwHeight)
            .attr('fill', '#E2E2E2')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', '2.0px');

          var dtwTextAll = d3.select(this).selectAll('text').data([i]);
          dtwTextAll
            .enter()
            .append('text')
            .merge(dtwTextAll)
            .attr('x', 0)
            .attr('y', 0)
            .attr('dx', '1em')
            .attr('dy', '1.5em')
            .text(function(d) {
              return weekNames[d];
            });
        });
    }

    function drawGrid() {
      // 座標の配列を紐付けて'g'を6x7=42個作成する
      var cellAll = baseLayer.selectAll('.mc-cell-g').data(cellPositions);
      cell = cellAll
        .enter()
        .append('g')
        .classed('mc-cell-g', true)
        .merge(cellAll)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('transform', function(d) {
          return 'translate(' + d[0] + ',' + d[1] + ')';
        });

      // 各セルの中に'rect'を一つ追加
      cell.each(function(d, i) {
        // 'rect'には座標配列の何番目か、という情報を紐付けておく
        var rectAll = d3.select(this).selectAll('.mc-cell-rect').data([i]);
        rectAll
          .enter()
          .append('rect')
          .classed('mc-cell-rect', true) // CSSでスタイルを指定
          .merge(rectAll)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', function(d) {
            return getFillColor(d);
          })
          .on('mouseover', function() {
            d3.select(this).style('opacity', '0.1');
          })
          .on('mouseout', function() {
            d3.select(this).style('opacity', '1.0');
          })
          // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する。クリックよりも前！
          .on('mousedown', function() {
            d3.event.preventDefault();
            d3.event.stopPropagation();
          })
          .on('click', function(d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            var date = new Date();
            date.setYear(targetYear);
            date.setMonth(targetMonth + days[d].offset); // offsetは前月だと-1、翌月だと+1
            date.setDate(days[d].day);
            // イベントを発行する
            dispatch.call('click', this, date);
          });
      });

      cell.each(function(d, i) {
        // セルの'g'の中に日付けを描画する'text'を追加する
        // 'text'にはセル位置配列の何番目か、という情報を紐付ける
        var dayTextAll = d3.select(this).selectAll('.mc-cell-day-text').data([i]);
        dayTextAll
          .enter()
          .append('text')
          .classed('mc-cell-day-text', true)
          .merge(dayTextAll)
          .attr('dx', '0.2em')
          .attr('dy', '1em')
          .text(function(d) {
            return days[d].showDate();
          });

        // 月齢を表示する
        var moon = dm.getMoonDataByDayObj(days[i]);
        var moonTextAll = d3.select(this).selectAll('.mc-cell-moon-text').data([i]);
        moonTextAll
          .enter()
          .append('text')
          .classed('mc-cell-moon-text', true)
          .merge(moonTextAll)
          .attr('x', cellWidth)
          .attr('dx', '-0.2em')
          .attr('dy', '1em')
          .attr('text-anchor', 'end')
          .text(moon);

        //
      });
      //
    }

    function drawMiniChart() {
      cell.each(function(d, i) {
        // データを取り出す
        var datas = dm.getTideDataByDayObj(days[i]);

        // チャートインスタンスを取り出す
        var chart = minicharts[i];

        // セルの中にチャート描画用のコンテナを一つだけ作り、データを紐付けてcall()する
        var chartContainerAll = d3.select(this).selectAll('.mc-cell-chart').data(dummy);
        chartContainerAll
          .enter()
          .append('g')
          .classed('mc-cell-chart', true)
          .merge(chartContainerAll)
          .datum(datas)
          .call(chart);
      });
    }

    // 表示対象の月を返却する(0-11)
    function getTargetMonth() {
      // 現時点のdate
      var date = new Date();
      // 1日を指定する(実行日が30日だったりすると、誤動作するため)
      date.setDate(1);
      // 今月を表す数字(0~11)
      var thisMonth = date.getMonth();
      // カウンター分だけdateをズラす
      date.setMonth(thisMonth + offset);
      return date.getMonth();
    }

    function getPrevMonth() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset - 1);
      return date.getMonth();
    }

    function getPrevMonthYear() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset - 1);
      return date.getFullYear();
    }

    function getNextMonth() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset + 1);
      return date.getMonth();
    }

    function getNextMonthYear() {
      var date = new Date();
      date.setDate(1);
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset + 1);
      return date.getFullYear();
    }

    // 表示対象の年を返却する
    function getTargetYear() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset);
      return date.getFullYear();
    }

    // 6行7列の各セルの位置の配列
    // [[x, y], [x, y],,,
    function getCellPositions() {
      var cellPositions = [];
      for (var y = 0; y < 6; y++) {
        for (var x = 0; x < 7; x++) {
          cellPositions.push([x * cellWidth, y * cellHeight]);
        }
      }
      return cellPositions;
    }

    // 6x7=42マスに日付けを入れるためのデータ配列
    // [{}, {}, ...
    function getDays() {
      // 6x7=42個分の日付けデータを格納する
      var results = [];

      // その月の1日の曜日を数字で表す(0が日曜、6が土曜)
      // つまりは、6x7グリッドのどの位置から始まるか、を表す
      var firstDayOfTheWeek = new Date(targetYear, targetMonth, 1).getDay();

      // 前の月の最後の日が31なのか、30なのか、28なのか、を取得する
      // 0日が前月の最後の日
      var lastDayOfPrevMonth = new Date(targetYear, targetMonth, 0).getDate();

      // 29, 30, 31のように、前月の最後の日付けで埋める
      var d;
      var i;
      for (i = 1; i <= firstDayOfTheWeek; i++) {
        d = makeDay();
        d.year = prevMonthYear;
        d.month = prevMonth; // 表示用に使うときには要注意
        d.day = lastDayOfPrevMonth - firstDayOfTheWeek + i;
        d.offset = -1; // 前月
        results.push(d);
      }

      // 今月の最後の日が31なのか、30なのか、を取得する
      // 翌月から1日戻った日を取得
      var lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      for (i = 1; i <= lastDay; i++) {
        d = makeDay();
        d.year = targetYear;
        d.month = targetMonth;
        d.day = i;
        d.offset = 0; // ターゲット月
        results.push(d);
      }

      // 6x7=42マスの最後の方は、翌月の先頭になる
      // あと何日足りないか
      var tail = 42 - results.length;
      for (i = 1; i <= tail; i++) {
        d = makeDay();
        d.year = nextMonthYear;
        d.month = nextMonth;
        d.day = i;
        d.offset = 1; // 翌月
        results.push(d);
      }

      // 各データが今日を表しているのか否か
      for (i = 0; i < results.length; i++) {
        d = results[i];
        if (d.year === ThisYear && d.month === ThisMonth && d.day === ThisDay) {
          d.isToday = true;
        } else {
          d.isToday = false;
        }
      }

      return results;
    }

    // 配列のi番目、の情報をもとにして、色を返す
    function getFillColor(i) {
      if (days[i].isToday) {
        return 'pink';
      }

      var column = i % 7;
      if (column === 0) { // 日曜日
        return '#ffddff';
      }
      if (column === 6) { // 土曜日
        return '#ddffff';
      }
      if (days[i].offset === 0) {
        // ターゲット月の平日
        return '#fffacd';
      }
      // それ以外
      return '#ffffee';
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      cellWidth = w / 7;
      cellPositions = getCellPositions();
      for (var i = 0; i < minicharts.length; i++) {
        minicharts[i].width(cellWidth);
      }
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      cellHeight = h / 6;
      cellPositions = getCellPositions();
      for (var i = 0; i < minicharts.length; i++) {
        minicharts[i].height(cellHeight);
      }
      return this;
    };

    exports.offset = function(_) {
      if (!arguments.length) {
        return offset;
      }
      offset = _;
      targetYear = getTargetYear();
      targetMonth = getTargetMonth();
      prevMonth = getPrevMonth();
      prevMonthYear = getPrevMonthYear();
      nextMonth = getNextMonth();
      nextMonthYear = getNextMonthYear();
      days = getDays();

      // イベントを発行する
      var date = new Date();
      date.setYear(targetYear);
      date.setMonth(targetMonth);
      date.setDate(1);
      dispatch.call('offsetChanged', this, date);

      return this;
    };

    exports.next = function(_) {
      exports.offset(offset + 1);
      draw();
      return this;
    };

    exports.prev = function(_) {
      exports.offset(offset - 1);
      draw();
      return this;
    };

    // カスタムイベントを'on'で発火できるようにリバインドする
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };
  //
})();

/* global d3, d3tide */

// 2016.11.30
// Takamitsu IIDA

// ラインチャートモジュール
// svgは既に存在する前提
(function() {
  d3tide.tideChart = function module(_accessor) {
    //
    // クラス名定義
    //

    // 外枠になる、最下層のレイヤ
    var CLASS_BASE_LAYER = 'tidechart-base-layer';

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'tidechart-layer';

    // チャートのラインとエリア
    var CLASS_CHART_LINE = 'tidechart-line'; // CSSでスタイル指定
    var CLASS_CHART_AREA = 'tidechart-area'; // CSSでスタイル指定

    // 日の出・日の入のタイムライン表示の縦線
    var CLASS_SUNRISE_LINE = 'tidechart-sunrise-line'; // CSSでスタイル指定
    var CLASS_SUNSET_LINE = 'tidechart-sunset-line'; // CSSでスタイル指定
    var CLASS_SUNRISE_LABEL = 'tidechart-sunrise-label'; // CSSでスタイル指定
    var CLASS_SUNSET_LABEL = 'tidechart-sunset-label'; // CSSでスタイル指定

    // 巨大テキスト'text'
    var CLASS_LABEL_LAYER = 'tidechart-label-layer';
    var CLASS_DATE_LABEL = 'tidechart-date-label'; // CSSでスタイル指定
    var CLASS_MOON_LABEL = 'tidechart-moon-label'; // CSSでスタイル指定

    // 左右の余白にボタンを配置するか
    var buttonEnabled = false;

    // カスタムイベント
    var dispatch = d3.dispatch('next', 'prev');

    // ダミーデータ
    var dummy = [0];

    // 外枠の大きさ(初期値)
    var width = 800;
    var height = 300;

    // 描画領域のマージン
    var margin = {
      top: 10,
      right: 50,
      bottom: 20,
      left: 90
    };

    // 描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // このモジュールをcall()したコンテナへのセレクタ
    var container;

    // レイヤへのセレクタ
    var baseLayer;
    var chartLayer;

    // call()時に渡されたデータ
    var tideDatas;

    // 入力ドメイン（決め打ち）
    var xdomain = [0, 24];
    var ydomain = [-20, 160];

    // 軸のテキスト
    var xAxisText = '時刻';
    var yAxisText = '潮位(cm)';

    // スケール関数とレンジ指定
    var xScale = d3.scaleLinear().domain(xdomain).range([0, w]);
    var yScale = d3.scaleLinear().domain(ydomain).range([h, 0]);

    // 軸に付与するticksパラメータ
    var xticks = 12;
    var yticks = 5;

    // X軸の値は0~24までの数字なので、これを時刻のように見せる
    function xtickFormat(d) {
      return d + ':00';
    }

    // X軸
    var xaxis = d3.axisBottom(xScale).ticks(xticks).tickFormat(xtickFormat);

    // Y軸
    var yaxis = d3.axisLeft(yScale).ticks(yticks);

    // X軸に付与するグリッドライン（Y軸と平行のグリッド線）
    var drawXGrid = false;
    function make_x_gridlines() {
      return d3.axisBottom(xScale);
    }

    // Y軸に付与するグリッドライン（X軸と平行のグリッド線）
    var drawYGrid = true;
    function make_y_gridlines() {
      return d3.axisLeft(yScale).ticks(yticks);
    }

    // ライン用のパスジェネレータ
    var line = d3.line().curve(d3.curveNatural);

    // 塗りつぶしエリアのパスジェネレータ
    var area = d3.area().curve(d3.curveNatural);

    // これらパスジェネレータにスケールを設定する
    // widthやheightが変わったらスケールが変わるので、その時は再適用する
    setScale();

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        // 渡されたデータがundefinedやnullであっても、軸は描画する
        tideDatas = _data;

        // 外枠になるレイヤを描画する
        // ボタンはこのレイヤに置く
        var baseLayerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
        baseLayer = baseLayerAll
          .enter()
          .append('g')
          .classed(CLASS_BASE_LAYER, true)
          .merge(baseLayerAll)
          .attr('width', width)
          .attr('height', height);

        // ベースレイヤの左右にボタンを表示
        if (buttonEnabled) {
          initButton();
        }

        // チャートを描画するレイヤを追加する
        var chartLayerAll = baseLayer.selectAll('.' + CLASS_CHART_LAYER).data(dummy);
        chartLayer = chartLayerAll
          .enter()
          .append('g')
          .classed(CLASS_CHART_LAYER, true)
          .merge(chartLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // レイヤに日の出・日の入を表示する
        drawSunrise();

        // レイヤにチャートを配置する
        drawChart();

        // レイヤに日付けを表示する
        drawDate();

        //
      });
    }

    // パスジェネレータにスケールを適用する関数
    // データは [[0, 107], [1, 102],
    // という構造を想定しているので、x軸はd[0]、y軸はd[1]になる
    // 実際にパスジェネレータにスケールを適用するのは
    // データ入手後に軸のドメインを決めて、スケールを作り直してから
    function setScale() {
      // ライン用パスジェネレータにスケールを適用する
      line
        .x(function(d) {
          return xScale(d[0]);
        })
        .y(function(d) {
          return yScale(d[1]);
        });

      // エリア用パスジェネレータにスケールを適用する
      area
        .x(function(d) {
          return xScale(d[0]);
        })
        .y0(h)
        .y1(function(d) {
          return yScale(d[1]);
        });
      //
    }

    // レイヤにチャートを描画する
    function drawChart() {
      // x軸を追加する
      var xAxisAll = chartLayer.selectAll('.tidechart-xaxis').data(dummy);
      xAxisAll
        .enter()
        .append('g')
        .classed('tidechart-xaxis', true)
        .merge(xAxisAll)
        .attr('transform', 'translate(0,' + h + ')')
        .call(xaxis);

      // X軸のラベルを追加
      var xAxisLabelAll = chartLayer.selectAll('.tidechart-xaxis-label').data(dummy);
      xAxisLabelAll
        .enter()
        .append('text')
        .classed('tidechart-xaxis-label', true) // CSSファイル参照
        .merge(xAxisLabelAll)
        .attr('x', w - 8)
        .attr('y', h - 8)
        .attr('text-anchor', 'end')
        .text(xAxisText);

      // y軸を追加する。クラス名はCSSと合わせる
      var yAxisAll = chartLayer.selectAll('.tidechart-yaxis').data(dummy);
      yAxisAll
        .enter()
        .append('g')
        .classed('tidechart-yaxis', true)
        .merge(yAxisAll)
        .call(yaxis);

      // Y軸のラベルを追加
      var yAxisLabelAll = chartLayer.selectAll('.tidechart-yaxis-label').data(dummy);
      yAxisLabelAll
        .enter()
        .append('text')
        .classed('tidechart-yaxis-label', true) // CSSファイル参照
        .merge(yAxisLabelAll)
        .attr('transform', 'rotate(-90)')
        .attr('x', -8)
        .attr('y', 8)
        .attr('dy', '.71em')
        .attr('text-anchor', 'end')
        .text(yAxisText);

      // X軸に対してグリッド線を引く(Y軸と平行の線)
      if (drawXGrid) {
        var xGridAll = chartLayer.selectAll('.tidechart-x-grid').data(dummy);
        xGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('tidechart-x-grid', true)
          .merge(xGridAll)
          .call(make_x_gridlines().tickSize(-h).tickFormat(''));
        //
      }

      // Y軸に対してグリッド線を引く(X軸と平行の線)
      if (drawYGrid) {
        var yGridAll = chartLayer.selectAll('.tidechart-y-grid').data(dummy);
        yGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('tidechart-y-grid', true)
          .merge(yGridAll)
          .call(make_y_gridlines().tickSize(-w).tickFormat(''));
      }

      // データがない場合は、過去に描画したパスを消して終わり
      if (!tideDatas) {
        chartLayer.selectAll('.' + CLASS_CHART_AREA).remove();
        chartLayer.selectAll('.' + CLASS_CHART_LINE).remove();
        return;
      }

      // グラフを表示
      var areaAll = chartLayer.selectAll('.' + CLASS_CHART_AREA).data(dummy);
      areaAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_AREA, true)
        .merge(areaAll)
        .datum(tideDatas)
        .transition()
        .attr('d', area);

      var lineAll = chartLayer.selectAll('.' + CLASS_CHART_LINE).data(dummy);
      lineAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_LINE, true)
        .merge(lineAll)
        .datum(tideDatas)
        .transition()
        .attr('d', line);
      //
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      xScale.range([0, w]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    //
    // 日付けと月齢の表示
    // 初期値は''なので、外からデータをセットしてからこのモジュールをcall()すること
    //

    // 表示する日付け
    var day = '';
    exports.day = function(_) {
      if (!arguments.length) {
        return day;
      }
      day = _;
      return this;
    };

    // 表示する月齢
    var moon = '';
    exports.moon = function(_) {
      if (!arguments.length) {
        return moon;
      }
      moon = _;
      return this;
    };

    // 日付け諸々を描画
    function drawDate() {
      // まとめて右寄せする
      var dateLayerAll = chartLayer.selectAll('.' + CLASS_LABEL_LAYER).data(dummy);
      var dateLayer = dateLayerAll
        .enter()
        .append('g')
        .classed(CLASS_LABEL_LAYER, true)
        .merge(dateLayerAll)
        .attr('transform', 'translate(' + (w - 10) + ',0)');

      var dateLabelAll = dateLayer.selectAll('.' + CLASS_DATE_LABEL).data([day]);
      var dateLabel = dateLabelAll
        .enter()
        .append('text')
        .classed(CLASS_DATE_LABEL, true)
        .merge(dateLabelAll)
        .text(function(d) {
          return d;
        })
        // 位置はdateLayerからの相対位置なので、右寄せ済み
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('dy', '1.0em');

      // この巨大テキストの境界ボックスを取り出す
      var bbox = dateLabel.node().getBBox();

      var moonLabelAll = dateLayer.selectAll('.' + CLASS_MOON_LABEL).data([moon]);
      moonLabelAll
        .enter()
        .append('text')
        .classed(CLASS_MOON_LABEL, true)
        .merge(moonLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', 0)
        .attr('y', bbox.height)
        .attr('text-anchor', 'end')
        .attr('dy', '1.0em');

      //
    }

    //
    // 日の出と日の入
    // 初期値は0なので、外からデータをセットしてからこのモジュールをcall()すること
    //

    // 日の出・日の入の時刻
    var sunrise = 0;
    exports.sunrise = function(_) {
      if (!arguments.length) {
        return sunrise;
      }
      sunrise = _;
      return this;
    };

    var sunset = 0;
    exports.sunset = function(_) {
      if (!arguments.length) {
        return sunset;
      }
      sunset = _;
      return this;
    };

    // 6:31のようになっている文字列を数字に変換する
    // 時刻は0~24で表現しているので、それに合わせる
    function sunriseScale(d) {
      if (!d) {
        return 0;
      }

      // 6:31 を時と分に分解
      d = String(d);
      var times = d.split(':');
      var hour = times[0];
      var minute = times[1];
      try {
        return parseInt(hour, 10) + parseInt(minute, 10) / 60;
      } catch (e) {
        return 0;
      }
    }

    // タイムライン用のパスジェネレータ
    var tline = d3.line()
      .x(function(d) {
        return d[0];
      })
      .y(function(d) {
        return d[1];
      });

    // 日の出・日の入の線を追加する
    function drawSunrise() {
      //
      var sunrisex = xScale(sunriseScale(sunrise)) || 0;
      var sunrisePosition = [[sunrisex, 0], [sunrisex, h]];

      var sunsetx = xScale(sunriseScale(sunset)) || 0;
      var sunsetPosition = [[sunsetx, h / 1.8], [sunsetx, h]];

      var sunriseLineAll = chartLayer.selectAll('.' + CLASS_SUNRISE_LINE).data(dummy);
      sunriseLineAll
        .enter()
        .append('path')
        .classed(CLASS_SUNRISE_LINE, true)
        .merge(sunriseLineAll)
        .attr('d', tline(sunrisePosition));

      var sunsetPathAll = chartLayer.selectAll('.' + CLASS_SUNSET_LINE).data(dummy);
      sunsetPathAll
        .enter()
        .append('path')
        .classed(CLASS_SUNSET_LINE, true)
        .merge(sunsetPathAll)
        .attr('d', tline(sunsetPosition));

      // 日の出時刻の表示
      var sunriseLabelAll = chartLayer.selectAll('.' + CLASS_SUNRISE_LABEL).data([sunrise]);
      sunriseLabelAll
        .enter()
        .append('text')
        .classed(CLASS_SUNRISE_LABEL, true)
        .merge(sunriseLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', sunrisex)
        .attr('y', h)
        .attr('text-anchor', 'start')
        .attr('dx', '0.1em')
        .attr('dy', '-0.4em');

      // 日の入時刻の表示
      var sunsetLabelAll = chartLayer.selectAll('.' + CLASS_SUNSET_LABEL).data([sunset]);
      sunsetLabelAll
        .enter()
        .append('text')
        .classed(CLASS_SUNSET_LABEL, true)
        .merge(sunsetLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', sunsetx)
        .attr('y', h)
        .attr('text-anchor', 'start')
        .attr('dx', '0.1em')
        .attr('dy', '-0.4em');
      //
    }

    //
    // 左右の余白部分にボタンを付ける
    //
    var buttonWidth = 40;

    // ベースレイヤの左右にボタンを表示する
    function initButton() {
      var prevButtonContainerAll = baseLayer.selectAll('.tidechart-prev-button-container').data(dummy);
      var prevButtonContainer = prevButtonContainerAll
        .enter()
        .append('g')
        .classed('tidechart-prev-button-container', true)
        .merge(prevButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(5,' + (margin.top) + ')');

      var prevButtonAll = prevButtonContainer.selectAll('.tidechart-prev-button').data(dummy);
      prevButtonAll
        .enter()
        .append('rect')
        .classed('tidechart-prev-button', true)
        .merge(prevButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onPrev(d3.select(this));
        });

      var nextButtonContainerAll = baseLayer.selectAll('.tidechart-next-button-container').data(dummy);
      var nextButtonContainer = nextButtonContainerAll
        .enter()
        .append('g')
        .classed('tidechart-next-button-container', true)
        .merge(nextButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (width - buttonWidth - 5) + ',' + (margin.top) + ')');

      var nextButtonAll = nextButtonContainer.selectAll('.tidechart-next-button').data(dummy);
      nextButtonAll
        .enter()
        .append('rect')
        .classed('tidechart-next-button', true)
        .merge(nextButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onNext(d3.select(this));
        });
      //
    }

    function onPrev(selector) {
      dispatch.call('prev', this, '');
    }

    function onNext(selector) {
      dispatch.call('next', this, '');
    }

    // カスタムイベントを'on'で発火できるようにリバインドする
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };

  //
})();
