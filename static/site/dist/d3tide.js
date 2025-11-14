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

        // 01/01
        var month_and_day = arr[0].split('/');
        var month = month_and_day[0].trim();
        var day = month_and_day[1].trim();

        if (month.startsWith('0')) {
          month = month.slice(1);
        }
        if (day.startsWith('0')) {
          day = day.slice(1);
        }

        var moon = arr[1].trim();

        // 2016/1/1
        var date = year + '/' + month + '/' + day;

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
// 2025年
// https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/2025/Z1.txt


(function() {
  var lines = [
" -7  9 36 69101125139141133119105 96 94102116132144147137115 84 50 18 -325 1 1Z1 6411421644147999999999999991138 942355-1199999999999999",
"-11 -3 18 48 81111131140137125110 96 89 92103119135145145131107 74 41 1325 1 2Z1 7141401727146999999999999991215 89999999999999999999999",
" -4 -6  6 31 62 94120135138131116100 88 84 90103119134142138123 97 66 3625 1 3Z1 747139181214299999999999999 038 -71255 8499999999999999",
" 13  2  6 22 48 78106126136134123107 91 80 79 86100116129134129113 89 6225 1 4Z1 82013719 113499999999999999 116  21340 7899999999999999",
" 38 21 16 23 41 67 93116131134128114 97 82 73 73 80 93108119123118105 8625 1 5Z1 851135195912399999999999999 154 161432 7299999999999999",
" 64 46 36 35 45 63 85107124132131121105 88 73 65 65 71 83 9610611110910025 1 6Z1 922133211111199999999999999 233 341534 6499999999999999",
" 87 72 61 55 57 67 83101117128132127114 98 80 66 57 54 59 69 82 9310010325 1 7Z1 954132225510399999999999999 313 551647 5499999999999999",
"100 93 85 78 76 79 87 99112123130130123110 93 74 58 46 42 45 54 67 81 9325 1 8Z11031131999999999999999999999 4 0 7618 5 4299999999999999",
"101104104100 97 95 96102110118126130129122108 89 69 50 35 29 30 39 54 7225 1 9Z1 119104111813199999999999999 5 6 951919 2899999999999999",
" 89103112116115112109108110114121127131130123108 87 64 41 24 15 16 27 4625 110Z1 318116122113199999999999999 6551082022 1499999999999999",
" 68 91110122128127122117112112115121128133133125109 85 58 32 12  3  5 1925 111Z1 421128133113499999999999999 8431112117  299999999999999",
" 42 70 96118132136133125117110109112120130137138128109 81 51 22  2 -6 -125 112Z1 5 3136143313999999999999999 95010822 5 -699999999999999",
" 18 45 76105127138140133122111104103110121134142141129106 75 42 13 -6-1025 113Z1 53914015271439999999999999910341032248-1199999999999999",
"  0 23 54 87115134141138127113101 96 99109124138146142127100 67 33  6 -925 114Z1 6101411614146999999999999991110 962327-1199999999999999",
" -8  7 35 68100124138139131116101 91 89 96110127141146139120 91 57 25  225 115Z1 6381401657146999999999999991142 88999999999999999999999",
" -6  1 22 52 84112131138133120103 89 82 84 96112129141142131109 79 47 2025 116Z1 7 4138173714399999999999999 0 2 -61214 8199999999999999",
"  4  3 16 41 71101123135134123107 90 78 75 82 96114129137134120 96 68 4025 117Z1 727136181613799999999999999 034  21247 7599999999999999",
" 20 12 18 37 63 91115130134127111 94 78 70 72 81 96112125129123107 85 6025 118Z1 748134185512999999999999999 1 4 121322 7099999999999999",
" 39 27 27 39 59 84108125133129117 99 82 70 66 70 80 95108117118110 96 7725 119Z1 8 9133193711999999999999999 131 2514 0 6699999999999999",
" 58 45 40 46 60 81102120130130121106 89 74 64 63 68 78 90101107107100 8825 120Z1 831131202610899999999999999 157 401445 6299999999999999",
" 74 62 56 57 66 80 98115126130125113 97 81 68 61 60 64 73 83 92 97 97 9325 121Z1 8541302134 9899999999999999 223 551540 5999999999999999",
" 86 78 73 71 75 84 97110121127126118105 90 76 65 57 56 59 66 74 82 88 9125 122Z1 9201272338 9299999999999999 249 711651 5699999999999999",
" 92 90 88 86 87 91 98107116122124121112100 87 73 61 53 49 50 56 64 74 8325 123Z1 952124999999999999999999999 316 861814 4999999999999999",
" 91 96 99100100100102106111116120121117110 99 85 70 56 45 39 39 45 56 6925 124Z110401219999999999999999999991929 39999999999999999999999",
" 83 95105110112111109107108111114118120118111 99 83 65 48 34 27 27 35 5025 125Z1 4 011212 112099999999999999 7 91072027 2699999999999999",
" 68 87104115121121117111107106108113118122122114100 80 58 37 21 13 16 2825 126Z1 428122132312399999999999999 8541062115 1399999999999999",
" 48 72 96115126129126117109102101105113123129128118100 75 47 23  6  1  825 127Z1 455129142612999999999999999 9441012157  199999999999999",
" 26 52 81107126135133125112101 95 96104117130137134121 97 66 35  9 -6 -825 128Z1 5221351517137999999999999991021 942236 -999999999999999",
"  5 30 61 93119135139132118102 90 86 92106123138144138120 91 56 23 -2-1425 129Z1 54913916 4144999999999999991054 862313-1499999999999999",
" -9 10 41 75107130141138125106 89 79 79 90109129144148139115 82 46 14 -725 130Z1 6171411649148999999999999991128 772350-1399999999999999",
"-13 -2 23 57 92121138141131113 91 74 68 73 89111133147148134108 74 39 1025 131Z1 64314217351499999999999999912 3 68999999999999999999999",
" -5 -3 14 43 77109132141137120 97 75 61 58 69 88112133144142126 99 67 3625 2 1Z1 7 9142182114599999999999999 025 -61240 5899999999999999",
" 15  8 16 37 67 98124138139127105 80 60 50 52 65 86110128136132116 91 6425 2 2Z1 733141191013799999999999999 058  81320 4999999999999999",
" 41 28 28 41 63 90116133139132114 90 66 49 42 47 62 82103118125120106 8725 2 3Z1 75613920 412599999999999999 130 2614 4 4299999999999999",
" 67 53 47 53 67 88110128137135122101 77 56 42 38 43 57 75 93105111108 9925 2 4Z1 818137211011199999999999999 2 0 471455 3899999999999999",
" 87 76 69 70 78 91108123133135127112 91 70 52 39 35 40 50 65 80 91 98 9925 2 5Z1 841135225010099999999999999 226 691559 3599999999999999",
" 97 93 89 88 91 99109120128132129120105 87 68 52 39 34 35 42 53 66 78 8825 2 6Z1 9 5132999999999999999999999 244 881721 3399999999999999",
" 96100102104105108112117122126126123116104 89 71 54 40 31 27 31 40 54 6925 2 7Z1 9391279999999999999999999991857 27999999999999999999999",
" 84 98108114117117117117117118120121120116108 94 76 57 39 25 19 20 30 4625 2 8Z1 453117111612199999999999999 7 31172018 1899999999999999",
" 66 87104117124125122117112110110113118121121115100 80 56 34 17  9 12 2425 2 9Z1 442126132912299999999999999 9261092116  999999999999999",
" 45 70 95115127131128119110102 99102109119127129121104 80 52 26  8  2  825 210Z1 5 013114441299999999999999910 3 9922 2  299999999999999",
" 26 52 80106125134132123109 97 89 89 96110124134135125104 75 44 18  1 -125 211Z1 5201341537136999999999999991032 882239 -299999999999999",
" 11 35 65 95119133135127112 95 82 77 82 96114131140138124 98 66 34 10 -125 212Z1 5411361621141999999999999991059 772312 -199999999999999",
"  4 22 51 83111130137131116 96 78 68 69 80 99120137143136116 87 54 25  725 213Z1 6 113717 0143999999999999991126 672342  399999999999999",
"  4 16 41 72102125136134120100 78 63 59 66 83105126139141129105 75 44 2125 214Z1 6191371737142999999999999991153 58999999999999999999999",
" 12 17 36 64 94119134136125105 82 62 52 54 67 87110128137134117 92 64 3925 215Z1 637137181313899999999999999 0 9 111221 5199999999999999",
" 24 23 36 59 88114132137129111 88 65 50 45 53 70 92113127131123105 81 5825 216Z1 654137184913199999999999999 034 221251 4599999999999999",
" 40 34 41 59 83108128136132117 95 71 52 42 44 55 74 95112122121111 94 7425 217Z1 712137192712399999999999999 058 341322 4299999999999999",
" 57 49 50 62 82104123134134123103 80 59 45 40 46 59 77 94107113110100 8625 218Z1 73013520 911399999999999999 121 481356 4099999999999999",
" 73 64 62 69 83100118129132125110 90 69 52 42 41 48 61 76 90100103100 9325 219Z1 74813321 210399999999999999 142 621436 4199999999999999",
" 85 78 75 78 87 99113124129126115 98 80 63 50 43 44 50 60 72 82 90 94 9425 220Z1 8 71292231 9499999999999999 2 1 751528 4399999999999999",
" 92 89 87 89 93101110118123123117106 91 76 62 51 45 44 47 55 64 73 81 8825 221Z1 828124999999999999999999999 2 8 871644 4499999999999999",
" 93 96 98 99102105109113117118116110101 90 77 64 53 45 40 40 45 53 64 7525 222Z1 8541189999999999999999999991828 40999999999999999999999",
" 87 97104109111111110110110111112111109103 94 82 67 53 40 31 29 33 43 5825 223Z1 430111101011299999999999999 6561101954 2999999999999999",
" 75 92106115119118114109105103104108111113110102 87 68 48 31 19 16 22 3625 224Z1 415120125711399999999999999 9 41032052 1699999999999999",
" 57 80102118126126120110100 94 94 99108117122120110 91 66 41 19  6  4 1525 225Z1 430127141812299999999999999 936 932137  499999999999999",
" 36 64 92115130133127114 99 87 81 85 96112126134131116 91 61 31  7 -4 -125 226Z1 45113315151349999999999999910 6 812217 -499999999999999",
" 17 45 77107128138134120101 82 70 69 79 98119136144138118 88 53 22  0 -625 227Z1 51313816 4144999999999999991036 682254 -699999999999999",
"  4 28 60 95123139140128106 81 62 53 58 76101126145150140116 82 47 17  125 228Z1 53514116521509999999999999911 8 532329 -199999999999999",
"  1 18 47 82114136143135114 86 60 42 39 51 75105132149151137111 77 44 2025 3 1Z1 5581431738152999999999999991142 38999999999999999999999",
" 11 18 40 71104130143141123 95 64 39 27 30 48 76107132146145130103 73 4625 3 2Z1 620144182614899999999999999 0 3 111218 2699999999999999",
" 31 30 43 67 97123141143131106 75 45 24 18 26 48 76106128138135119 97 7325 3 3Z1 641144191513999999999999999 034 281256 1899999999999999",
" 55 48 54 70 94118136143137117 89 58 32 17 15 27 49 75100118126122109 9325 3 4Z1 7 214320 812699999999999999 1 3 481337 1499999999999999",
" 78 69 69 79 95114131140139125103 76 49 28 17 18 30 49 71 9110511110910225 3 5Z1 721141211411199999999999999 128 681424 1699999999999999",
" 93 86 85 89100113126135136129114 92 69 47 31 23 24 33 48 64 80 91 9810025 3 6Z1 741137231110099999999999999 146 851523 2399999999999999",
"100 98 98100106113121128130127118105 88 70 53 39 31 30 34 43 55 68 80 8925 3 7Z1 759130999999999999999999999 139 981646 3099999999999999",
" 97102106109112115117120121120117111102 90 77 63 49 38 32 32 36 46 59 7325 3 8Z1 8 61219999999999999999999991837 31999999999999999999999",
" 87100109115117117115112110109109109108105 98 87 72 56 41 30 26 29 39 5525 3 9Z1 41911799999999999999999999920 5 26999999999999999999999",
" 74 92108118122120114107100 96 96100106112113108 96 78 58 39 25 20 25 3825 310Z1 410122134711399999999999999 930 9621 2 2099999999999999",
" 59 81102118125124117105 93 85 82 87 97109119123117101 79 54 32 19 16 2525 311Z1 422126145312399999999999999 949 822143 1699999999999999",
" 45 69 95115127129121106 89 76 69 72 83100117129130121100 74 47 26 15 1825 312Z1 4381291540131999999999999991012 692217 1599999999999999",
" 34 58 86111127132126110 89 71 59 58 67 86107126136134119 94 65 39 22 1825 313Z1 4551321620137999999999999991036 572246 1799999999999999",
" 28 49 77105126135131115 93 69 52 46 52 69 93117134140132113 85 56 34 2325 314Z1 51113516571409999999999999911 1 462314 2399999999999999",
" 27 44 70 99122135135121 98 72 50 37 38 52 75102125139139126103 75 50 3425 315Z1 5281371732141999999999999991126 362339 3199999999999999",
" 32 43 65 93118134138127106 78 52 34 28 37 57 84110130138133116 92 67 4825 316Z1 54413818 7138999999999999991152 28999999999999999999999",
" 41 46 64 88113132139132113 86 58 35 24 26 41 65 92116131133124106 84 6425 317Z1 6 1139184213499999999999999 0 4 411220 2399999999999999",
" 53 53 65 85108128138135120 95 67 42 25 21 30 49 74 98117126125113 96 7925 318Z1 619138191912799999999999999 028 511248 2199999999999999",
" 66 62 69 84104122134136125104 78 52 32 22 24 37 57 80101114119114104 9025 319Z1 637137195911999999999999999 051 621319 2299999999999999",
" 79 73 75 85101117129133127111 89 64 43 29 25 31 45 63 82 98107109105 9725 320Z1 656133204810999999999999999 113 731354 2599999999999999",
" 89 84 84 89 99112123128126115 98 77 57 41 32 31 37 49 64 79 91 98101 9925 321Z1 71512822 610199999999999999 133 831438 3099999999999999",
" 96 93 93 95101109116122122116105 89 72 57 44 37 36 40 49 60 72 82 90 9625 322Z1 734122999999999999999999999 146 931543 3699999999999999",
" 99101102103105108111114115113108 99 87 74 62 51 42 38 38 43 52 63 75 8625 323Z1 7551159999999999999999999991725 38999999999999999999999",
" 97104109111111109107106106106106104 99 92 82 70 56 44 35 31 34 42 55 7225 324Z1 31611199999999999999999999919 8 31999999999999999999999",
" 89103114119118113106100 96 95 97102106107103 93 78 60 42 29 22 24 35 5425 325Z1 321119124610799999999999999 842 952016 2299999999999999",
" 76 97114124126119108 95 85 80 83 91103114119116104 84 61 38 21 14 19 3525 326Z1 339126141111999999999999999 9 9 8021 5 1499999999999999",
" 59 86110127133127113 94 76 65 64 73 90109125133128112 88 59 33 16 12 2225 327Z1 359133151013399999999999999 938 632148 1299999999999999",
" 44 73102125137135120 97 73 53 45 50 67 92117137144137117 88 57 31 17 1825 328Z1 42113816 21449999999999999910 9 452226 1699999999999999",
" 34 61 92120138141129105 76 48 30 27 39 64 96126146151141118 87 57 34 2625 329Z1 4431421651151999999999999991042 2623 3 2699999999999999",
" 33 54 83113135145138117 85 51 24 11 14 34 66101131149152139115 86 59 4325 330Z1 5 61451740153999999999999991117 102337 4199999999999999",
" 42 54 78106131145145128 99 63 29  6 -1  9 34 69104132147147133110 85 6625 331Z1 5281471829149999999999999991154 -1999999999999999999999",
" 58 62 78101125143148138113 80 44 14 -4 -4 11 38 72104127138137124106 8825 4 1Z1 551148192013999999999999999 0 9 571233 -699999999999999",
" 76 75 83100120137146142125 98 64 32  8 -3  0 17 43 73 9911812612411510325 4 2Z1 613147201712799999999999999 039 741315 -499999999999999",
" 92 88 91101116131141142132112 85 56 30 12  5 10 26 48 71 9210711311310925 4 3Z1 636142212811499999999999999 1 5 8814 3  599999999999999",
"103 99 99104113123132135131119101 78 55 35 22 17 22 33 50 67 83 9510310625 4 4Z1 659135233610699999999999999 126 9815 1 1799999999999999",
"106105105107111117122125124119108 94 78 61 46 35 30 31 38 49 62 76 88 9725 4 5Z1 721125999999999999999999999 1321051620 3099999999999999",
"104108110111111111112112112111107102 94 84 72 59 47 40 37 39 47 58 72 8625 4 6Z1 71211299999999999999999999918 3 37999999999999999999999",
" 98108113115113109104100 98 97 99101102100 93 83 69 56 44 38 38 45 58 7425 4 7Z1 252115115410299999999999999 839 971929 3799999999999999",
" 90105115119116109100 91 84 82 85 92100107108103 92 76 59 44 37 38 47 6225 4 8Z1 3 6119134710899999999999999 855 822026 3699999999999999",
" 82100115122121113100 85 73 68 69 78 91105115118111 96 77 57 42 36 40 5325 4 9Z1 323123144811899999999999999 918 6721 7 3699999999999999",
" 73 95114125127119103 84 67 56 54 61 77 96114125125115 97 74 54 41 39 4825 410Z1 341127153312699999999999999 942 532142 3899999999999999",
" 66 88110126131125109 87 65 47 40 45 60 82106124133129115 93 70 51 42 4625 411Z1 35813116131339999999999999910 7 402213 4299999999999999",
" 60 82106125134131116 93 67 44 31 30 43 65 92117133137129111 87 65 51 4925 412Z1 4161351650138999999999999991032 292242 4899999999999999",
" 58 77101122135136124101 73 45 26 19 27 47 74103126138138125104 82 64 5625 413Z1 4341371726140999999999999991057 192310 5599999999999999",
" 60 74 96118134139131110 81 51 27 14 15 30 56 86113132139133118 97 78 6525 414Z1 45313918 2139999999999999991124 122337 6399999999999999",
" 64 74 92113131140136119 92 61 33 14  9 18 39 67 96120134135126109 91 7725 415Z1 5121401838136999999999999991152  9999999999999999999999",
" 71 75 89108126137138126103 73 44 21  9 11 26 50 78103122130128117102 8825 416Z1 533139191513199999999999999 0 4 711221  899999999999999",
" 79 79 88103120132137130112 86 57 32 15 11 18 36 60 85106119123119109 9725 417Z1 554137195612399999999999999 030 781253 1099999999999999",
" 88 85 89100113126133130118 97 72 47 27 17 17 27 45 67 8810411411611210425 418Z1 617133204811699999999999999 056 851329 1599999999999999",
" 97 92 93 99108119126127121106 86 64 43 29 22 25 35 51 69 86 9910711010825 419Z1 64112822 211099999999999999 124 921414 2299999999999999",
"104100 99100105112118121119111 97 80 62 46 35 29 31 39 52 67 81 9410310725 420Z1 7 9121235910999999999999999 2 2 991515 2999999999999999",
"109108106104104106108111112110103 93 81 67 53 42 36 35 39 49 62 77 9110325 421Z1 749112999999999999999999999 3331041641 3499999999999999",
"110114114110106102 99 99100102103101 97 88 76 63 50 40 35 37 46 59 76 9325 422Z1 124114 95910399999999999999 645 991814 3599999999999999",
"108117121118111101 92 86 84 87 93100105106100 88 73 56 43 35 35 44 60 8125 423Z1 2 3121123410699999999999999 750 841927 3499999999999999",
"101117126126118104 88 74 67 67 75 88103114119114101 82 61 45 35 37 48 6825 424Z1 23112714 011999999999999999 827 662024 3599999999999999",
" 91113128133127111 89 67 51 45 50 66 87109126132127111 89 66 48 39 43 5825 425Z1 25713315 313299999999999999 9 2 452112 3999999999999999",
" 81106127138136121 96 68 42 27 25 37 61 90118137144137118 94 70 53 48 5625 426Z1 322139155914499999999999999 938 242155 4899999999999999",
" 74 98122139143133109 77 44 18  5 10 29 60 95125145150142122 97 76 62 6125 427Z1 3471441651151999999999999991015  52235 6099999999999999",
" 72 93117137147143124 92 55 21 -2 -9  1 27 63 99130148151141122100 82 7325 428Z1 4131481743152999999999999991054 -92313 7399999999999999",
" 77 91111132147150137111 75 37  5-14-15  1 30 67103130145147136119101 8925 429Z1 4401501836148999999999999991134-172349 8599999999999999",
" 85 92107126143151146127 97 60 24 -3-16-12  7 37 7110312613813812911510325 430Z1 5 91511930140999999999999991217-16999999999999999999999",
" 95 96105120135146147137115 84 51 20 -1 -9 -3 17 44 7410112012912912211225 5 1Z1 539148202813099999999999999 023 9513 2 -999999999999999",
"104101105113125136142138125104 76 48 23  7  3 11 28 51 76 9711211912011625 5 2Z1 611142213512099999999999999 0581011351  399999999999999",
"110106105109116124130132127114 95 73 51 32 20 18 24 38 57 76 9310611311525 5 3Z1 646132225411599999999999999 1381051447 1899999999999999",
"113109106106108112116119119114105 91 75 58 44 35 32 36 47 61 77 9210311025 5 4Z1 729120999999999999999999999 2441061553 3299999999999999",
"113113109106103102102104105106105100 92 81 68 56 47 43 45 53 65 79 9310525 5 5Z1 014113 85610699999999999999 5171021710 4399999999999999",
"112115114109102 95 91 88 89 92 96 99100 97 89 78 66 56 51 51 58 70 84 9925 5 6Z1 1 7115114310099999999999999 716 881825 5099999999999999",
"110118119114105 94 83 76 73 75 82 91 99105104 98 87 74 62 56 56 64 77 9225 5 7Z1 142119132710599999999999999 8 3 731927 5599999999999999",
"107119123121111 97 81 67 59 59 65 77 92105113113106 93 78 66 60 62 71 8625 5 8Z1 2 9123143311499999999999999 836 582017 6099999999999999",
"103118127127119103 83 64 50 44 48 61 79 98114122121111 96 80 68 64 69 8125 5 9Z1 233128152312399999999999999 9 6 442059 6499999999999999",
" 98115128132126111 89 65 45 33 32 43 62 85108124130126114 97 81 71 70 7825 510Z1 25613216 613099999999999999 934 312137 6999999999999999",
" 93111126135133120 98 71 46 27 20 26 44 69 96119133136128113 95 81 74 7725 511Z1 31913616451369999999999999910 2 202212 7499999999999999",
" 89106123135138128108 80 51 27 14 14 27 50 79107128139137126110 93 82 7925 512Z1 3431381723139999999999999991030 122245 7999999999999999",
" 86101118133140135118 92 62 33 13  6 13 33 61 91117134140135121105 91 8425 513Z1 4 714018 01409999999999999911 0  62316 8499999999999999",
" 86 97113129139139128105 75 44 19  5  5 18 42 72101123136137129115100 9025 514Z1 4321411837138999999999999991131  32347 8899999999999999",
" 88 94107123135140134116 90 59 31 11  3  9 27 53 82107125133131122109 9725 515Z1 45814019161349999999999999912 4  3999999999999999999999",
" 91 93102115129137137125103 76 47 23  9  7 17 37 63 8911112412912511610525 516Z1 52613820 012999999999999999 018 911240  699999999999999",
" 97 94 99109121131135129114 91 65 40 21 12 14 26 46 70 9311112212412011225 517Z1 557135205012499999999999999 051 941319 1199999999999999",
"103 98 98103112122128128120104 83 59 38 24 18 22 35 54 75 9511011912111725 518Z1 631129214812199999999999999 132 9714 5 1899999999999999",
"111104100100104111117121120112 97 79 59 42 30 26 30 42 59 78 9611011812025 519Z1 716121225212099999999999999 230 9915 0 2699999999999999",
"117111104 99 98 99104109112112106 95 81 65 50 39 35 38 48 63 81 9811212025 520Z1 824112235012299999999999999 359 9816 6 3599999999999999",
"122119111102 94 89 89 92 97103106105 99 88 75 61 50 44 46 54 68 8610311725 521Z11018106999999999999999999999 541 881720 4499999999999999",
"124125119108 95 83 75 72 76 85 95104109108100 88 74 61 54 54 61 75 9311025 522Z1 037126121910999999999999999 652 721832 5399999999999999",
"124130128117101 82 65 55 53 60 73 90106117119114102 86 72 64 63 70 8510325 523Z1 115130135012099999999999999 743 521936 6299999999999999",
"120132135128111 88 63 43 32 33 45 65 89111126132127114 98 83 73 73 81 9725 524Z1 14913515 113299999999999999 827 312034 7299999999999999",
"115131140138125101 71 43 21 12 16 34 61 91118136142137124106 91 83 84 9325 525Z1 22114116 214299999999999999 910 112126 8299999999999999",
"109127141146138118 88 54 23  2 -4  5 29 61 95124143149143129112 98 91 9425 526Z1 255146165914999999999999999 953 -42213 9199999999999999",
"105122138149148135109 74 38  7-11-13  1 29 64 99128145150144130114102 9825 527Z1 3291501753150999999999999991037-152257 9899999999999999",
"103115132146153147129 99 62 26 -2-17-15  3 33 6910312914414714012711310425 528Z1 4 61531845147999999999999991122-18233910399999999999999",
"103110123138149152142121 89 53 20 -4-14 -9 11 41 7510512814014113412211125 529Z1 44415219361429999999999999912 8-15999999999999999999999",
"105106114127140148147135112 81 48 19  0 -6  2 23 51 8110712613413412611625 530Z1 525149202413599999999999999 0201041255 -699999999999999",
"107103106115126136142138125103 76 48 24 10  7 17 36 62 8710912312912611925 531Z1 6 8142211112999999999999999 1 31031341  799999999999999",
"110103101104112121129132127115 96 73 50 32 22 23 33 51 72 9411112112412125 6 1Z1 656132215612499999999999999 1531011428 2199999999999999",
"113105 99 97100105112118120116107 92 74 56 43 36 38 48 64 8310011412112225 6 2Z1 752120223912299999999999999 256 971516 3699999999999999",
"117109101 94 91 92 96101106109107101 91 78 65 55 50 53 62 76 9210611712225 6 3Z1 911109232012299999999999999 421 9116 8 5099999999999999",
"121115106 96 88 83 81 84 89 95100102100 94 85 75 67 63 66 74 8610011312125 6 4Z111 2102999999999999999999999 550 8117 6 6399999999999999",
"124121113102 89 78 71 68 71 78 87 96102104101 94 85 78 74 76 84 9510811825 6 5Z1 0 1124125210499999999999999 658 6818 9 7499999999999999",
"125126121110 95 79 66 57 55 60 70 84 97106111109103 94 87 83 84 9210211425 6 6Z1 040127141511199999999999999 746 551913 8399999999999999",
"124129128119104 85 66 51 43 44 53 68 85102115120119111101 93 89 91 9810925 6 7Z1 117130151512199999999999999 826 422012 8999999999999999",
"121130133127114 94 71 51 36 31 36 50 70 92111125129126117105 96 93 9610425 6 8Z1 15213316 312999999999999999 9 1 3121 4 9399999999999999",
"116128135134124105 81 56 35 23 22 32 52 76101122133136130118106 98 9610025 6 9Z1 225136164513699999999999999 935 212148 9599999999999999",
"111124134139133118 94 66 40 21 13 17 33 58 86111130139138129117105 98 9825 610Z1 25813917231409999999999999910 9 132227 9799999999999999",
"106118131140140129108 81 52 26 10  7 17 39 67 96120136141137126113102 9825 611Z1 33114118 1141999999999999991044  723 3 9899999999999999",
"101112125137143138122 97 67 38 15  4  7 22 47 77105127139140133120108 9925 612Z1 4 51431838141999999999999991119  42338 9899999999999999",
" 98105118131141143134113 85 55 27  9  3 11 30 57 8711313113913712711410325 613Z1 4401441915139999999999999991156  3999999999999999999999",
" 97100109122135142140126103 74 45 21  7  6 18 40 68 9611913313713212110825 614Z1 516143195413799999999999999 013 971234  599999999999999",
" 99 96101112125136140134118 93 65 39 19 10 13 28 52 7910412313313412711525 615Z1 556140203313599999999999999 052 961313  999999999999999",
"103 96 95101112124132134126109 86 61 38 22 17 24 41 64 8911112713313112225 616Z1 640134211313399999999999999 136 941355 1799999999999999",
"109 98 92 92 98108119126126118103 83 61 42 31 29 38 54 76 9911712913312825 617Z1 734127215213399999999999999 230 911440 2999999999999999",
"117104 93 86 85 91100110117118113101 84 67 52 44 44 53 69 8810812313113225 618Z1 844119223213399999999999999 335 851529 4399999999999999",
"124112 98 85 77 75 79 88 99108112111103 91 78 67 60 61 69 82 9911612813325 619Z11016112231213399999999999999 448 751626 6099999999999999",
"131121106 89 74 64 60 64 74 87100109112110103 93 83 77 77 83 9510912313225 620Z112 6113235413599999999999999 559 601731 7699999999999999",
"135130118100 79 61 48 43 47 59 76 94109118120116108 99 93 91 9610511712925 621Z11350120999999999999999999999 7 1 431845 9199999999999999",
"137138130115 93 68 46 31 26 31 47 68 9111212513112912211310510210511312425 622Z1 038138151313199999999999999 758 2620 110299999999999999",
"135142141131111 85 56 31 15 10 18 38 64 9211613314113913212111310911111825 623Z1 125142161914199999999999999 851 1021 910899999999999999",
"130140147144131107 77 45 18  2 -1 10 33 64 9512214014814513612411511111325 624Z1 214147171414899999999999999 942 -222 711199999999999999",
"122134146151146129103 69 36  8 -7 -7  8 34 6710112714415014613512211311025 625Z1 3 415118 1150999999999999991031 -9225511099999999999999",
"114125138150153146127 97 62 28  3-10 -6 12 41 7510713214614814112911610825 626Z1 3531541844149999999999999991118-10233710699999999999999",
"107114126141151153143122 91 56 24  2 -7  1 22 52 8511413514514313412010825 627Z1 44115419221459999999999999912 2 -7999999999999999999999",
"101103113127141150149137114 84 51 23  6  2 14 36 66 9612113714113612411025 628Z1 528151195514199999999999999 0171011243  299999999999999",
" 99 96100111125138145142128106 77 49 26 15 17 31 54 8210812713713612711325 629Z1 614145202513799999999999999 057 961322 1499999999999999",
"100 92 90 97108121132136132118 97 72 50 34 28 34 51 73 9811813113513011825 630Z1 7 1136205313599999999999999 139 901357 2899999999999999",
"104 92 86 86 92103115123126121108 91 71 55 45 45 54 71 9111112613313212325 7 1Z1 751126212013499999999999999 227 851432 4499999999999999",
"110 96 86 80 81 87 96106113115111102 88 75 64 59 63 73 8910612113113312825 7 2Z1 851115214813399999999999999 323 8015 6 5999999999999999",
"117104 90 80 75 75 79 88 96103107105100 91 83 77 75 80 8910311612713213125 7 3Z11013107222013399999999999999 429 741546 7599999999999999",
"124112 98 85 74 68 67 71 78 87 96102104103 99 94 90 90 9410211212212913225 7 4Z112 8104225813299999999999999 541 661637 8999999999999999",
"129121108 93 79 66 59 57 61 70 81 9210210811110910610310110410911712413025 7 5Z114 5111234713199999999999999 647 57175310199999999999999",
"131127118104 88 71 57 48 47 52 63 78 9310711612112011611110910911311912625 7 6Z11520121999999999999999999999 744 47192410899999999999999",
"131132127116100 80 61 46 37 37 45 60 79 9911512613012812311611111011412025 7 7Z1 04213216 913099999999999999 832 36204211099999999999999",
"128133134127114 94 71 50 34 26 29 41 61 8410712513513713312411611010911425 7 8Z1 137134164813799999999999999 915 26213710999999999999999",
"122131137137128110 86 60 37 22 17 24 41 66 9211613414214113312211210710825 7 9Z1 226138172214299999999999999 955 17221910699999999999999",
"115126137142139126104 76 48 25 12 11 23 46 7410312614114514012911610610325 710Z1 3111431755145999999999999991033 10225510399999999999999",
"107118132143147140122 96 65 36 14  5 10 27 54 85114135145145135121108 9925 711Z1 3531471827146999999999999991111  52329 9899999999999999",
"100108122138148149138116 86 54 26  8  3 14 36 66 98124141147141128112 9925 712Z1 4351501857147999999999999991147  3999999999999999999999",
" 93 97110126142150147132107 76 44 20  7  8 24 50 8111113414514513411810125 713Z1 517150192714699999999999999 0 4 931223  699999999999999",
" 90 88 96111128142148143125 98 68 39 20 13 20 39 67 9712314014614012510625 714Z1 6 2148195614699999999999999 042 881259 1399999999999999",
" 90 82 83 94110127139143135117 91 64 40 27 26 37 59 8611313314414313211425 715Z1 649143202414599999999999999 122 811335 2499999999999999",
" 95 81 75 78 90106122133135127110 88 65 48 41 44 58 8010412514014413712225 716Z1 743135205214499999999999999 2 8 741411 4199999999999999",
"103 85 72 67 71 83 98113124126120106 90 73 63 60 66 80 9911913414214113025 717Z1 846126212014399999999999999 3 0 671448 6099999999999999",
"113 94 76 64 59 63 74 88102113117115107 97 87 81 81 8810011512913914113625 718Z110 8117215114299999999999999 4 2 591529 8099999999999999",
"124106 87 69 56 50 53 62 76 9010311111411310810310010110611412513414014025 719Z112 7114223014099999999999999 512 50162110099999999999999",
"133120103 83 63 49 41 41 49 62 79 9510911712212111911611611812212913513925 720Z11427122232714099999999999999 628 40174811599999999999999",
"139133120102 81 59 41 30 28 36 51 70 9111012413213413212712412212412913425 721Z11552134999999999999999999999 741 28195612299999999999999",
"139140136123104 79 54 33 20 17 25 43 67 9211513214214313813112412012112625 722Z1 045141164114399999999999999 845 16212312099999999999999",
"134141145141127105 77 49 25 10  8 19 40 68 9812314114814713912811911411625 723Z1 2 1145171914999999999999999 940  7221511499999999999999",
"123135145150146130105 74 42 17  3  4 18 44 7610713214715114513211910910625 724Z1 3 41501751151999999999999991028  2225410699999999999999",
"111122137150155148130101 67 35 12  1  6 26 55 88118140150148137121106 9825 725Z1 3581551820150999999999999991110  12328 9799999999999999",
" 98108123141153156147125 94 60 30 10  6 16 40 71104130145149141125107 9325 726Z1 4461571846149999999999999991148  5999999999999999999999",
" 88 93107125143154154141117 85 53 28 15 17 33 60 91119139147143129111 9325 727Z1 53015519 914799999999999999 0 1 881222 1499999999999999",
" 82 81 91107126142150146131106 77 49 31 26 35 55 82110133145145134116 9625 728Z1 612150193014699999999999999 035 801252 2699999999999999",
" 81 74 78 90107125138142136119 96 71 51 41 43 56 7910412714114513812210225 729Z1 653142194914599999999999999 1 9 741320 4099999999999999",
" 84 72 70 76 90106121131132124108 89 70 58 55 63 7910012213814414112811025 730Z1 73613320 914599999999999999 147 691346 5599999999999999",
" 91 76 67 67 75 88103115122121114101 87 76 71 73 8410011813314214213311825 731Z1 826123203014399999999999999 228 661411 7099999999999999",
"100 83 70 65 66 74 85 97107113113108100 92 87 86 9110211512813814013612525 8 1Z1 930113205414099999999999999 318 641437 8699999999999999",
"110 93 79 68 63 64 70 79 90 9910510710710410110010110611512413213613612925 8 2Z11117107212113799999999999999 420 6315 310099999999999999",
"118105 90 77 66 60 60 64 72 82 9210010711111311311311411712112613113213125 8 3Z122 1132999999999999999999999 537 59999999999999999999999",
"125115103 89 75 63 55 53 56 63 74 8710011111912312412312112112212412712925 8 4Z11549124232012999999999999999 658 53184712199999999999999",
"129124116104 89 72 57 47 43 46 55 70 8810511912913313212812311911912112525 8 5Z11615133999999999999999999999 8 5 43204711899999999999999",
"129131128120105 86 66 48 36 32 37 51 70 9311413013914013512711911411311725 8 6Z1 1 0131164114099999999999999 857 32213611399999999999999",
"125132136134123105 81 57 36 24 22 31 50 7610212514014514213312011010610825 8 7Z1 21013717 614699999999999999 940 21221010699999999999999",
"117129140144140125101 73 45 24 13 16 31 56 86115137148148139124110100 9825 8 8Z1 3 31441731149999999999999991019 132241 9799999999999999",
"105119135148152143124 95 63 34 14  8 16 38 69101129147152146130111 96 8825 8 9Z1 3501521755152999999999999991055  82312 8899999999999999",
" 92105124143155156143119 86 53 25  9 10 25 52 86118142153151137116 96 8125 810Z1 4341571820154999999999999991130  72345 7899999999999999",
" 78 87106128148159156139111 77 45 22 13 20 42 72105134151154144124100 7925 811Z1 51915918441559999999999999912 3 13999999999999999999999",
" 69 71 85107131150157151132103 71 44 28 26 39 64 95124146155149132107 8325 812Z1 6 415819 715599999999999999 020 681236 2599999999999999",
" 65 59 66 83107130147152143123 97 70 50 41 46 63 89116140153152139117 9125 813Z1 651152192915499999999999999 058 5913 8 4199999999999999",
" 68 54 52 62 81105126139142133116 94 75 63 61 71 8911213414815314512710325 814Z1 743142195115399999999999999 139 511338 6199999999999999",
" 78 58 48 49 60 78 99117128130124111 97 86 81 84 9511212914415114813511625 815Z1 843131201315199999999999999 225 4714 6 8199999999999999",
" 92 70 54 45 47 56 72 9010511511911711110510010110611512713914614714012725 816Z110 7119203814799999999999999 322 45143010099999999999999",
"109 88 69 54 46 45 51 63 78 9210311111511611611611812212813414014214113425 817Z121 8143999999999999999999999 435 44999999999999999999999",
"123108 90 72 57 46 42 44 53 65 80 9510811812512812913013013113313513613525 818Z12216136999999999999999999999 6 8 42999999999999999999999",
"132124112 96 78 59 45 36 35 42 55 73 9311112513513813713412912612512713025 819Z11615138999999999999999999999 738 34205512599999999999999",
"134135131120103 82 59 40 28 26 33 50 72 9711913514314413813012111511511925 820Z1 047135163414599999999999999 845 25213911499999999999999",
"127136141139128108 83 56 34 21 19 30 52 7910712914414814313211810710210525 821Z1 217142165614899999999999999 936 18221010299999999999999",
"115129142150147133109 79 49 27 16 19 35 61 92120141150148136119103 92 9125 822Z1 3161501717150999999999999991017 152239 9099999999999999",
" 99115134149156150132104 71 42 22 16 26 48 78109135149151141122102 86 7925 823Z1 4 41561738152999999999999991053 1623 7 7999999999999999",
" 83 98119140155158148126 95 63 37 23 25 41 68 99127146152145128105 84 7125 824Z1 4461591757152999999999999991124 222336 6999999999999999",
" 70 81100124145157155141115 85 56 37 31 40 62 91120142152149133110 86 6825 825Z1 5251581815153999999999999991152 31999999999999999999999",
" 61 66 82105129147154148130104 77 54 43 46 62 87114138151152139118 92 7025 826Z1 6 3154183215399999999999999 0 5 611218 4399999999999999",
" 57 56 67 86110131145147137118 95 73 59 56 66 85110133148153144125101 7625 827Z1 641147184915399999999999999 035 551242 5699999999999999",
" 58 51 56 70 91113130138137126108 90 75 69 74 87107128144151147132110 8625 828Z1 72013919 715199999999999999 1 6 5113 5 6999999999999999",
" 65 53 51 59 75 94112125130126116103 90 83 84 92107124139148147136118 9625 829Z1 8 3130192514999999999999999 140 501327 8299999999999999",
" 76 60 53 54 64 78 94108117120117110102 97 95 9910912113414214413812510725 830Z1 857120194414499999999999999 219 521345 9599999999999999",
" 88 71 60 56 58 66 78 9010110811211211010710610811312112913613913612811525 831Z1102911220 313999999999999999 3 9 56135210699999999999999",
"100 85 72 63 59 60 65 73 83 9210010711111411611812012312613013213212812125 9 1Z12024132999999999999999999999 422 59999999999999999999999",
"112100 88 76 66 60 57 59 64 73 84 9610711612312612712712612512512512512325 9 2Z116 1127999999999999999999999 6 6 57999999999999999999999",
"120114105 93 79 66 56 49 49 54 66 81 9711312513313513212712211811711812125 9 3Z11555135999999999999999999999 735 48205911799999999999999",
"124125121112 97 80 62 47 38 38 46 62 8310512413714213913112111210710811425 9 4Z1 04212516 914299999999999999 833 37212410799999999999999",
"122130134131119 99 76 53 35 27 29 43 65 92117136147146137123108 98 9510125 9 5Z1 2 4134162814899999999999999 917 262149 9599999999999999",
"113128140145139123 98 69 43 25 19 27 48 76106132148152144127108 91 82 8525 9 6Z1 259145164815399999999999999 955 192217 8299999999999999",
" 97117137152155145123 93 61 34 19 19 34 61 93124147156151134111 87 71 6725 9 7Z1 34615517 9156999999999999991030 172247 6799999999999999",
" 77 97123146161161146120 86 54 30 21 28 50 81114141157157143118 89 66 5325 9 8Z1 43216317311599999999999999911 4 212319 5399999999999999",
" 56 73100129153165162143114 81 52 34 32 46 72104134155160151127 97 67 4625 9 9Z1 5171661752161999999999999991137 312354 4099999999999999",
" 40 50 72103133155164157136108 79 56 47 52 71 98127150161156138108 76 4825 910Z1 6 316418131619999999999999912 9 47999999999999999999999",
" 33 33 48 74105133151156148128104 81 67 66 76 97121144158159146121 90 6025 911Z1 651156183516199999999999999 030 311238 6599999999999999",
" 37 27 32 49 75103127142145137121103 89 83 88101119139154158151133106 7725 912Z1 744145185515999999999999999 110 2713 5 8399999999999999",
" 51 33 28 35 52 75 99118129131126117107101101108121135148154152140120 9625 913Z1 846132191615499999999999999 155 28132710099999999999999",
" 71 51 38 34 40 54 72 9010511512011911711411411712413314114714714213011325 914Z11026120193614899999999999999 251 34133511499999999999999",
" 93 74 58 46 42 44 53 65 79 9310411211812112312612813213513813813713212325 915Z11952138999999999999999999999 4 8 42999999999999999999999",
"112 98 83 68 56 48 45 49 57 69 83 9811112112913213313213012812712612612525 916Z11549133999999999999999999999 556 45999999999999999999999",
"123117108 94 78 63 50 43 43 50 63 80 9911612913713813412712011511211411925 917Z11541138999999999999999999999 732 4221 311299999999999999",
"125128127119104 85 64 48 38 37 46 63 85108126138142138127115104 98 9910625 918Z1 118129155514299999999999999 834 362125 9899999999999999",
"118130137137128109 85 61 43 33 36 49 71 97121138146142131114 98 86 83 9025 919Z1 230139161214699999999999999 918 332149 8399999999999999",
"104122138147145131109 81 56 38 33 41 60 86114136147147136117 95 78 70 7325 920Z1 321148162914999999999999999 954 332215 6999999999999999",
" 86107130147154148130103 74 50 38 39 53 78106131148151142122 98 75 60 5825 921Z1 4 31541646152999999999999991025 362241 5799999999999999",
" 68 89115138154156145123 95 67 49 43 52 72 99126146154148129103 76 56 4725 922Z1 44115717 3154999999999999991053 4323 7 4799999999999999",
" 52 70 96124146157154138114 86 64 53 55 70 94121143155152136111 82 57 4225 923Z1 5181571720155999999999999991120 522334 3999999999999999",
" 41 54 77105132149155147128104 81 66 62 72 92116139153155143119 90 62 4225 924Z1 5541551737156999999999999991145 62999999999999999999999",
" 35 41 60 86114136148148137118 97 80 73 77 91112134150155147128101 72 4825 925Z1 630150175515599999999999999 0 1 3412 9 7399999999999999",
" 35 35 47 69 95119136143139127110 94 85 84 93110129145153149134111 84 5825 926Z1 7 7143181315399999999999999 030 331233 8399999999999999",
" 41 35 40 56 78101120132134129118106 96 93 98109124138148148138119 96 7225 927Z1 748134183214999999999999999 1 1 351255 9399999999999999",
" 52 41 40 49 64 83102116124124120113106102104111121132141143138125106 8625 928Z1 838125185114499999999999999 136 39131410299999999999999",
" 67 53 46 48 56 69 84 98109115117115113111111114120127134137135127114 9825 929Z110 011719 813799999999999999 219 46132511199999999999999",
" 82 68 58 53 54 59 69 80 9110010811311611811912012212412712912812511810925 930Z11921129999999999999999999999 323 53999999999999999999999",
" 97 85 74 65 58 56 57 63 72 83 951061151221261271261241221201191181171152510 1Z11456127999999999999999999999 5 5 56999999999999999999999",
"110103 93 82 70 59 53 51 55 65 78 941101231311341321261181121081081111152510 2Z115 1134999999999999999999999 648 51203510899999999999999",
"118118113103 88 72 56 46 43 48 61 79100120134141139130118105 96 94 981072510 3Z1 032118151614199999999999999 754 432054 9499999999999999",
"118127130125112 92 70 51 38 36 45 63 88113133145146137120101 86 78 79 912510 4Z1 155130153514799999999999999 842 362119 7799999999999999",
"108126139143136118 93 67 45 34 36 50 74103129147153145126102 79 63 59 682510 5Z1 252143155515399999999999999 923 332148 5999999999999999",
" 88113137152155143121 92 63 43 36 43 63 92122145157153135108 78 53 41 442510 6Z1 34115516161579999999999999910 0 362219 4099999999999999",
" 61 90121147162162146120 90 63 47 45 59 83113140158160146119 85 52 30 232510 7Z1 4281641638161999999999999991036 442253 2399999999999999",
" 34 60 94128154166163145118 89 67 57 62 80107134155163155132 98 61 30 132510 8Z1 51616717 0163999999999999991110 572329 1199999999999999",
" 14 31 62 98132155164158139115 91 76 73 83103128150163161144114 78 42 162510 9Z1 6 41641724164999999999999991143 73999999999999999999999",
"  5 12 34 66101131150156149132113 96 88 92105124144159163153130 98 62 31251010Z1 654156174716399999999999999 0 7  51213 8899999999999999",
" 12  7 17 40 70100125140144138126113104102109122138152159155140116 85 55251011Z1 750144181115999999999999999 049  6124110299999999999999",
" 31 17 15 26 47 72 96116128131128122115112115122133143151151144128106 81251012Z1 859131183615299999999999999 136 1413 511299999999999999",
" 57 38 28 28 36 52 71 90105116121122121120120123128134139142139131118101251013Z1105112219 014299999999999999 232 27132312099999999999999",
" 83 65 51 42 40 44 54 68 83 97108116122124125125126126127128128125121114251014Z11915128999999999999999999999 349 40999999999999999999999",
"104 91 78 65 55 49 49 54 65 78 93106118125129128125121117113112113114116251015Z11423129231811699999999999999 531 48201111299999999999999",
"115111103 90 76 63 54 50 54 63 78 95111124132133128119109101 96 96101108251016Z11440133999999999999999999999 7 1 502031 9599999999999999",
"116121121113100 83 67 55 50 55 67 84104121133137133122107 92 82 79 83 94251017Z1 125122145713799999999999999 8 1 502056 7999999999999999",
"109122131131121105 85 66 54 52 59 75 96117134141139127109 89 73 64 65 76251018Z1 230132151614299999999999999 845 522122 6399999999999999",
" 94115131140138125105 83 65 55 57 69 89112132144145134114 90 68 53 50 58251019Z1 318140153414699999999999999 921 552148 4999999999999999",
" 77101124141147141124102 80 64 59 67 84107129145149141122 96 69 48 38 41251020Z1 359147155215099999999999999 953 592213 3799999999999999",
" 58 83111135149151140120 97 77 67 68 81102125143152148130104 74 47 31 29251021Z1 4371521611152999999999999991023 662240 2899999999999999",
" 41 64 94122144153150135114 92 77 73 81 98120140152152138114 83 53 30 21251022Z1 5131531630154999999999999991051 7323 6 2199999999999999",
" 27 46 75105132148152144127107 90 81 83 95115135150154145123 94 62 36 20251023Z1 5491531650154999999999999991119 802334 1899999999999999",
" 19 32 57 86115137148147136119102 90 88 95110129145153149132106 75 46 26251024Z1 6241491711153999999999999991145 87999999999999999999999",
" 18 24 42 68 97121138143139127112100 94 97107123138148149138116 89 60 37251025Z1 7 1143173315099999999999999 0 4 181211 9499999999999999",
" 23 22 33 53 78103122134135129119108101100106118131142146140124101 76 52251026Z1 742136175514699999999999999 035 21123710099999999999999",
" 34 27 31 44 63 85105119127127122115108106108115125134139138128111 90 68251027Z1 832128181814099999999999999 111 2713 410699999999999999",
" 50 38 34 40 52 69 87103114120121119115112111114119126131132127117102 84251028Z1 944121184313299999999999999 153 34134011199999999999999",
" 67 53 45 42 47 57 70 85 99109116120120119117116116118121122121117109 98251029Z11138120191312299999999999999 249 4215 911699999999999999",
" 85 72 60 52 49 51 57 68 82 95108117123125124120116113110110111111110107251030Z113 412521 611199999999999999 410 49185011099999999999999",
"101 92 81 69 59 53 51 56 66 80 96111123130131127119109101 96 95 98104109251031Z11341131999999999999999999999 544 511941 9599999999999999",
"112110104 92 78 64 54 50 54 66 83102120132138134124109 94 82 77 79 881012511 1Z1 01111214 813899999999999999 7 0 502012 7799999999999999",
"113122123117103 85 68 55 51 56 71 91113131142142132114 92 72 59 57 65 822511 2Z1 141124143214499999999999999 757 512044 5699999999999999",
"103122135138129112 91 71 58 55 63 81105127144149142123 96 68 46 35 38 552511 3Z1 244138145614999999999999999 845 542117 3599999999999999",
" 80109133148150139119 95 75 63 63 76 97121142154152135107 74 43 21 15 252511 4Z1 338151152115599999999999999 929 622153 1599999999999999",
" 50 82116143157157144122 99 80 72 77 92115138155159148123 88 50 19  1  12511 5Z1 42915915481599999999999999910 9 722230 -199999999999999",
" 19 50 87123149161159144123102 87 84 92110132152162158139107 68 30  2-102511 6Z1 5191621615163999999999999991047 842310-1099999999999999",
" -4 19 53 92126150159155141122105 95 97108126146160163152127 91 53 18 -52511 7Z1 6111591644163999999999999991123 952352-1299999999999999",
"-12 -1 24 59 95125145152147135120108104108121137153161158142114 79 44 142511 8Z1 7 41521715161999999999999991158104999999999999999999999",
" -3 -5  8 33 64 96121137142138129118111111117129142152155148130103 72 422511 9Z1 8 1142174815599999999999999 037 -6123411099999999999999",
" 19  7  8 20 43 69 95115128132130124117114115121130139145144135118 96 71251110Z1 9 5132182414599999999999999 126  5131411499999999999999",
" 47 30 21 23 34 51 73 93110120125124121117115116119124129132130123110 94251111Z1102112519 713299999999999999 221 20141311599999999999999",
" 75 57 44 37 37 45 59 76 93107117122123120117113111111113115117116113106251112Z11141123202311799999999999999 324 36163011199999999999999",
" 96 83 69 58 51 50 55 66 80 95108118123124120114108102 98 97 99102106108251113Z11238124231110899999999999999 440 501851 9799999999999999",
"107101 92 81 70 62 59 63 72 85100113123127126119109 98 88 82 80 84 92101251114Z11316127999999999999999999999 558 591944 8099999999999999",
"108112110102 91 79 70 66 69 79 92108121130131126114 99 83 70 64 65 74 87251115Z1 110112134513299999999999999 7 4 662020 6499999999999999",
"101113120119111 98 85 75 72 76 87102118130136133122104 83 65 52 49 55 69251116Z1 222120141113699999999999999 757 722051 4999999999999999",
" 88108122129127117102 88 79 77 84 97114129139140130112 89 64 46 36 38 51251117Z1 314129143514199999999999999 841 772120 3599999999999999",
" 72 96118133137132119103 89 82 83 93109126139144138122 97 70 45 28 24 33251118Z1 358137145914499999999999999 921 812149 2499999999999999",
" 53 79107129141143134119102 90 85 91104121136146145131108 79 50 27 16 19251119Z1 437144152414799999999999999 957 852217 1599999999999999",
" 35 61 91118138147144132115100 91 91100115132145148140119 91 60 32 14 10251120Z1 5131471549148999999999999991030 892247 1099999999999999",
" 20 43 72103128143147140126110 98 93 97110126141149145130104 73 42 19  8251121Z1 54914716151499999999999999911 2 932317  799999999999999",
" 11 27 53 84113134144143134119106 97 97105119134146148138117 88 57 30 12251122Z1 6251451641148999999999999991132 962350  799999999999999",
"  7 17 37 65 94119135141137126113102 98102113127139146142127103 73 45 23251123Z1 7 314117 91469999999999999912 2 98999999999999999999999",
" 11 12 26 49 76102122133135129119108101101107119131140141132114 89 62 38251124Z1 743136173814299999999999999 024 10123410099999999999999",
" 21 15 21 37 59 84106122130130123114106102104111121131135133121102 79 56251125Z1 828131181013599999999999999 1 0 15131110299999999999999",
" 36 24 22 31 47 68 89108121127126120113106104106112119125127123111 94 74251126Z1 920127184912799999999999999 141 2214 210499999999999999",
" 55 40 31 32 40 55 74 93110121125124119112106103104107112116117113104 91251127Z11018126194511799999999999999 228 30152310399999999999999",
" 75 60 47 41 41 49 62 79 97112122126125119111104 98 95 96100104107107102251128Z11115127212610899999999999999 326 401712 9599999999999999",
" 94 82 69 58 52 51 57 69 85101116126129127119107 96 86 80 80 85 92100105251129Z112 5129234210799999999999999 436 511832 8099999999999999",
"106102 94 82 71 63 61 65 76 91108122131133127115 98 81 68 61 61 69 83 97251130Z11245134999999999999999999999 552 611924 6099999999999999",
"109115115108 96 84 74 70 74 84100116130138136125107 84 62 45 38 42 56 762512 1Z1 126116132113899999999999999 7 2 7020 8 3899999999999999",
" 98116127129122109 95 84 79 83 94110127139144137120 94 65 39 22 17 26 472512 2Z1 241129135614499999999999999 8 5 792050 1799999999999999",
" 74102125139141134119104 92 88 92105121138148148135111 79 45 17  1  0 152512 3Z1 343142143015099999999999999 9 0 882133 -199999999999999",
" 42 75108133148149141126110 99 96102116133148155149131100 63 27  0-13-102512 4Z1 43915015 615599999999999999 949 962217-1499999999999999",
" 10 42 79113139152152143127112103102111125142155158147123 89 50 14-11-202512 5Z1 532154154415899999999999999103410123 2-2099999999999999",
"-12 12 46 83117141152150140125112105107118133149158157142115 79 40  7-142512 6Z1 62215216241599999999999999911171052347-2099999999999999",
"-19 -7 18 53 89119139147144133120110106110122137150156151134106 71 35  62512 7Z1 71214717 6157999999999999991158106999999999999999999999",
"-10-11  3 29 62 94120135140136126114106105111123136147150142124 97 65 352512 8Z1 759140174915099999999999999 033-12123910499999999999999",
" 12  1  3 18 43 72 99120131133128118108102103109119130138139131114 90 642512 9Z1 844134183613999999999999999 119  0132610299999999999999",
" 39 22 15 20 36 58 82104120127127120111103 98 98104112120126125118104 86251210Z1 926128192812699999999999999 2 4 151423 9899999999999999",
" 65 47 36 33 39 53 72 92110121125123115106 98 93 92 95101107111112108 98251211Z110 6125203711299999999999999 249 321541 9299999999999999",
" 85 71 58 51 50 57 69 85101115122124120112102 92 86 83 83 87 93 98101101251212Z11046124222410299999999999999 335 491718 8299999999999999",
" 97 89 79 71 66 66 72 83 96109119124124119109 97 85 76 70 70 73 80 88 95251213Z11127125999999999999999999999 429 651839 6999999999999999",
"100100 96 90 84 79 79 84 93104115123127125117105 90 75 63 56 56 61 71 84251214Z1 035100121012799999999999999 533 791935 5599999999999999",
" 95104108107101 95 90 89 92100110120127129125114 98 80 62 49 42 44 53 68251215Z1 214108125213099999999999999 646 882018 4299999999999999",
" 85101113118117111103 97 94 97105115125131131124109 89 67 47 34 30 35 50251216Z1 318118133213299999999999999 755 942054 3099999999999999",
" 70 92110123128125117107100 97101109120130135132120101 76 51 31 20 21 32251217Z1 4 5128141013599999999999999 854 972129 1999999999999999",
" 52 77102121133135129118107100 99104114126135138130113 89 61 35 17 10 16251218Z1 444135144613899999999999999 941 9822 3 1099999999999999",
" 33 59 87112131139137128116105 99100108120133140138126104 75 46 21  7  5251219Z1 5191391521141999999999999991020 982236  499999999999999",
" 17 40 69 98122137141136124111100 97102113127139143136118 91 61 31 10  0251220Z1 5541411555143999999999999991054 972310  099999999999999",
"  5 23 50 80108129139139130117104 97 97106119133142142130108 78 47 20  3251221Z1 6271411629144999999999999991126 962344 -199999999999999",
" -1 10 32 62 92117133139134123109 98 94 98110125137143138121 95 65 35 12251222Z1 7 013917 3143999999999999991159 94999999999999999999999",
"  1  4 19 45 74102124135136128115102 93 93100113128138139130110 83 54 27251223Z1 734137174014099999999999999 018  01234 9299999999999999",
" 10  5 13 32 59 87111128134131121107 96 90 92101114127134132120 99 73 47251224Z1 8 8135181913499999999999999 053  51313 9099999999999999",
" 25 13 14 26 47 73 98119131132126114100 90 87 90100112122126123110 91 67251225Z1 84213319 512699999999999999 129 121359 8799999999999999",
" 45 29 23 27 41 62 86108124131129120107 94 85 82 86 94104113117113103 86251226Z1 91713220 311799999999999999 2 7 231456 8299999999999999",
" 68 51 40 37 44 58 77 98116128131126115101 87 78 74 76 84 93102107106 99251227Z1 953131212210799999999999999 248 3716 6 7499999999999999",
" 88 74 63 55 55 61 74 91108122130130122110 94 79 68 62 63 69 80 90 99103251228Z11031131231410399999999999999 335 541722 6299999999999999",
"101 95 87 78 73 73 78 88102116126131129120105 87 69 54 46 46 53 65 80 93251229Z11113131999999999999999999999 435 721833 4599999999999999",
"103108107102 96 90 89 92 99110121130133129118101 79 57 39 29 28 36 52 72251230Z1 12010812 113399999999999999 553 891935 2799999999999999",
" 92108118121118113106102103108116125133135130117 95 69 43 22 11 10 22 42251231Z1 3 1121125213599999999999999 7251022031  999999999999999"
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
// 2026年
// https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/2026/Z1.txt

(function() {
  var lines = [
" 67 93114128133131124115109107111119129138140134117 91 61 31  7 -5 -4 1126 1 1Z1 4 8133134914099999999999999 8481072124 -699999999999999",
" 36 67 98122138143139129118110108112121133143145136116 87 52 20 -5-16-1226 1 2Z1 5 1143144514599999999999999 9541082214-1799999999999999",
"  7 37 71104130144147140128115106105111123137148149138115 82 45 11-13-2126 1 3Z1 545147153815099999999999999104110423 1-2199999999999999",
"-13 10 43 80112136147145135120107 99100110125141151151137110 75 37  5-1526 1 4Z1 6241471627152999999999999991122 982344-2099999999999999",
"-19 -7 20 55 91120139145139125109 96 91 96109126142151147131103 68 32  426 1 5Z1 65914517151519999999999999912 1 91999999999999999999999",
"-11 -9  8 36 71103127140140129113 97 86 85 93108125140145139121 93 60 3026 1 6Z1 73014118 114599999999999999 024-121239 8499999999999999",
"  8  0  8 28 57 88115132138132117100 85 78 80 90105121133136128109 84 5626 1 7Z1 757138184613699999999999999 1 1  01319 7799999999999999",
" 32 18 17 29 51 78105124134133122106 89 76 72 76 86100114122123114 98 7626 1 8Z1 822135193312499999999999999 134 1614 2 7299999999999999",
" 55 40 34 38 53 74 98118130133126112 95 80 70 67 72 81 93104110110102 8926 1 9Z1 845133202611199999999999999 2 4 341452 6799999999999999",
" 74 60 52 52 60 75 94112126132129119104 88 74 65 63 67 74 84 93 98 98 9426 110Z1 9101322136 9999999999999999 232 511552 6399999999999999",
" 87 78 71 68 71 80 93108121129129123112 97 82 70 61 58 60 66 74 82 88 9226 111Z1 9371302335 9299999999999999 3 0 6817 7 5899999999999999",
" 92 90 86 84 84 87 95105116124127126119107 93 79 66 56 51 51 56 64 74 8326 112Z11012128999999999999999999999 332 831827 5199999999999999",
" 91 96 98 98 97 97 99104111117123125123116105 91 75 60 49 42 41 47 57 6926 113Z1 229 9811 212599999999999999 433 971936 4199999999999999",
" 83 95104109110108106106107111116121123122116104 88 70 53 39 31 31 39 5226 114Z1 346110121312399999999999999 6481062030 3099999999999999",
" 70 88104115119119115110106106109114120124124117103 84 63 42 27 20 22 3426 115Z1 421120132512599999999999999 8361062114 2099999999999999",
" 53 75 97114124127123115108103102107115123129128118101 77 52 29 15 10 1726 116Z1 451127142212999999999999999 9341022153 1099999999999999",
" 34 58 84108124131130122111101 97 99107118129134131117 95 67 39 16  4  426 117Z1 51813215 8134999999999999991012 972229  299999999999999",
" 17 40 68 96119132134128116102 93 91 98110125136139132113 85 54 25  5 -326 118Z1 5451351550139999999999999991044 9123 3 -399999999999999",
"  3 23 51 82109128136133121106 92 85 88 99115131142141128104 73 40 13 -326 119Z1 6111361629143999999999999991115 852335 -599999999999999",
" -4 10 35 66 97122135136127110 93 81 79 86102121137144139121 93 60 29  626 120Z1 63613717 7144999999999999991146 78999999999999999999999",
" -3  3 23 52 84112131138132117 97 81 72 74 86105125139142133111 81 49 2226 121Z1 7 0138174714299999999999999 0 6 -31219 7199999999999999",
"  6  4 17 41 72102125137136123104 84 69 65 71 87107125136136123100 72 4426 122Z1 724138182913899999999999999 037  31255 6599999999999999",
" 23 14 19 37 63 92117133137129111 90 71 60 59 69 86105122130127113 91 6626 123Z1 748137191513099999999999999 1 8 141334 5899999999999999",
" 45 31 29 40 60 85109128136133119 99 77 60 52 54 65 82100114120116104 8626 124Z1 81213620 812099999999999999 138 291418 5299999999999999",
" 68 53 47 50 63 82103122133134125108 87 67 53 46 49 60 75 91103109107 9926 125Z1 836135211510999999999999999 2 9 471511 4699999999999999",
" 87 75 68 67 73 85101117128133129117 99 79 61 47 41 43 51 64 78 90 9810026 126Z1 9 2133225910099999999999999 240 661618 4199999999999999",
" 98 94 89 86 87 93102113123129130123111 95 76 58 44 35 34 40 50 64 78 9026 127Z1 933130999999999999999999999 312 861741 3499999999999999",
" 98103104104104105108113119124127126121110 95 77 58 40 28 23 26 35 50 6826 128Z1102112799999999999999999999919 9 23999999999999999999999",
" 86100111117119118116115115117120124125123115100 80 58 36 19 10 11 22 4026 129Z1 4 1119115712599999999999999 7191152024 1099999999999999",
" 63 87107122129130125119113110111116122128129122107 84 56 30  9 -2  0 1326 130Z1 435130133812999999999999999 9161102123 -399999999999999",
" 36 65 93117132137134125114105102104113124134137130112 84 52 22 -1-11 -726 131Z1 5 513714501379999999999999910 51022212-1199999999999999",
" 12 40 73104127139140131117102 93 91 99112129141144135113 81 46 14 -8-1426 2 1Z1 5331411547144999999999999991041 912255-1499999999999999",
" -5 19 52 87116135142136121103 87 80 83 95114133146147135109 74 38  8 -926 2 2Z1 5591421636148999999999999991114 802332-1199999999999999",
" -9  7 35 70103128140139126106 86 72 69 77 95117137148145129100 65 32  726 2 3Z1 6241411720148999999999999991146 69999999999999999999999",
" -2  4 26 57 91119136140130111 89 69 60 62 75 96119137144137118 89 57 2926 2 4Z1 64514018 214499999999999999 0 5 -21219 5999999999999999",
" 13 12 25 51 81111131140134117 94 72 56 52 59 76 98119132135125105 78 5226 2 5Z1 7 5140184313699999999999999 035 101252 5299999999999999",
" 33 25 32 50 77104126138137123102 78 59 48 49 59 77 98115124123112 93 7126 2 6Z1 724139192412599999999999999 1 1 251327 4799999999999999",
" 52 42 43 55 76100121135137128110 87 66 50 45 49 61 78 95108114110100 8526 2 7Z1 74213820 711499999999999999 125 4114 4 4599999999999999",
" 70 59 57 63 78 97116131136131117 97 76 58 47 45 50 62 76 90 99102 99 9226 2 8Z1 8 113621 110299999999999999 147 571447 4599999999999999",
" 83 75 71 74 83 97112125132131121106 87 70 56 48 47 51 60 71 82 89 93 9226 2 9Z1 8221322226 9399999999999999 2 5 711542 4699999999999999",
" 90 86 84 85 90 98109119125127122112 98 83 68 57 49 47 50 56 64 73 80 8626 210Z1 845127999999999999999999999 216 841658 4799999999999999",
" 91 93 95 96 99102107113118121120115106 95 83 70 58 50 44 44 48 55 64 7526 211Z1 9141219999999999999999999991838 44999999999999999999999",
" 85 94101106108108109110111113114114111106 97 86 72 58 46 38 35 38 46 5926 212Z1102011499999999999999999999920 0 35999999999999999999999",
" 74 90103111116115112109106105107109112113110102 89 72 54 38 27 24 29 4126 213Z1 425116124811399999999999999 8511052055 2499999999999999",
" 59 80 99113121122117110103 98 98102109116119117107 90 68 45 27 15 14 2426 214Z1 43812214 911999999999999999 933 972137 1399999999999999",
" 42 66 90111124128123113101 92 88 92101113123128123109 86 59 33 14  5  926 215Z1 45612815 21289999999999999910 2 882212  599999999999999",
" 25 50 78104123132129118103 88 80 80 89104121133136127107 79 48 21  4  026 216Z1 5161321546136999999999999991029 782244  099999999999999",
" 11 34 64 95119133134124107 87 73 68 74 90110129141140126100 68 36 12  026 217Z1 5361351627142999999999999991058 682315 -199999999999999",
"  4 22 51 83112132138131113 90 69 58 58 71 93117137146140121 91 58 28  826 218Z1 55613817 8146999999999999991127 562346  499999999999999",
"  4 16 40 72104128140136120 96 71 52 45 53 72 97123140145135112 82 50 2626 219Z1 6171401750145999999999999991159 45999999999999999999999",
" 14 18 36 64 95122138140128104 77 52 38 37 50 74101125139140127103 74 4826 220Z1 637141183314199999999999999 015 131232 3699999999999999",
" 31 28 38 60 88115135141134114 86 58 37 28 33 50 75102123133131117 95 7226 221Z1 658141191913499999999999999 044 2713 9 2899999999999999",
" 53 45 48 63 85110130140137122 98 70 45 28 24 33 51 75 98115122119107 9126 222Z1 718140201012299999999999999 112 441349 2499999999999999",
" 75 65 63 71 87106124136138128109 84 59 38 26 25 34 50 71 9010310910810126 223Z1 739138211611099999999999999 138 631437 2499999999999999",
" 91 83 80 84 93106120131135130118 99 76 55 38 28 27 34 46 62 78 90 9710026 224Z1 8 0135231410099999999999999 2 0 801539 2699999999999999",
" 99 97 96 97101109117125129128122110 94 76 58 43 33 28 31 39 51 64 77 8826 225Z1 823129999999999999999999999 2 5 9617 8 2899999999999999",
" 97103107109111113116119121121120115108 97 82 66 50 36 27 24 28 38 52 6926 226Z1 8511219999999999999999999991856 24999999999999999999999",
" 85100111117120119117114112111112113114112105 93 76 56 37 23 16 18 28 4626 227Z1 411120115111499999999999999 8551112019 1599999999999999",
" 67 89108121127125119111103 99 99104111118121116103 83 58 34 16  7 10 2426 228Z1 418127135612199999999999999 928 982116  799999999999999",
" 47 74 99119130131124111 98 88 84 89100114126131126110 85 55 28  9  2  926 3 1Z1 43613215 313199999999999999 957 8422 0  299999999999999",
" 29 57 87113130135129114 96 80 71 71 82100120135140132111 82 50 22  6  426 3 2Z1 4561351554140999999999999991025 702236  399999999999999",
" 17 43 74104127137134119 98 76 61 56 63 81105127142144131106 74 43 19  926 3 3Z1 5161381638144999999999999991054 5623 9  899999999999999",
" 14 34 63 95121137138126104 78 56 45 46 61 84111133144142125 97 66 38 2126 3 4Z1 5351391719145999999999999991123 442338 1899999999999999",
" 19 32 57 87115135141132111 84 58 39 34 43 63 90116135142134114 87 59 3826 3 5Z1 5531411758142999999999999991152 34999999999999999999999",
" 30 36 55 82110131141137119 92 64 41 29 31 45 69 96120134135124103 78 5626 3 6Z1 611141183613699999999999999 0 4 301221 2899999999999999",
" 44 44 57 79105127140139126102 73 47 30 25 33 52 76101119128125112 93 7326 3 7Z1 628141191412899999999999999 029 421252 2499999999999999",
" 59 55 62 79101122136140131111 84 58 37 26 27 39 59 81101115118113101 8626 3 8Z1 647140195411899999999999999 052 551324 2599999999999999",
" 74 67 70 81 98116131137132117 95 70 48 33 28 33 46 64 83 98107108103 9426 3 9Z1 7 5137204010899999999999999 113 6714 0 2899999999999999",
" 85 79 79 85 97111124131130121104 83 62 46 36 34 40 52 66 80 91 97 99 9626 310Z1 7251322149 9999999999999999 133 781443 3499999999999999",
" 92 89 88 91 98107117124125120109 94 77 61 49 42 40 45 53 63 73 82 89 9326 311Z1 745125999999999999999999999 144 881543 4099999999999999",
" 95 96 97 98101106111116118116110101 89 77 65 55 47 44 45 49 56 65 75 8426 312Z1 8 41189999999999999999999991720 44999999999999999999999",
" 92 99103106107107108108109109107104 99 91 82 71 60 50 43 39 41 48 58 7126 313Z1 81810999999999999999999999919 9 39999999999999999999999",
" 85 97107112113111107103100 99100102104103 99 90 77 62 47 36 31 32 41 5626 314Z1 346113121510499999999999999 853 992018 3099999999999999",
" 74 92107117120116108 99 92 88 90 95103110112108 97 80 60 41 27 22 26 4026 315Z1 355120135511299999999999999 913 8821 3 2299999999999999",
" 60 83104119125122112 98 85 77 76 83 95109120123117101 78 53 32 18 16 2626 316Z1 410125145212399999999999999 937 762141 1599999999999999",
" 46 72 98119130129118101 82 67 61 66 80100119131133122101 74 46 24 14 1726 317Z1 42713115391349999999999999910 3 612215 1399999999999999",
" 34 60 89115132135126106 82 61 48 47 60 82108130141140124 98 67 39 21 1726 318Z1 4461361623142999999999999991031 462248 1699999999999999",
" 27 50 80109131139133114 87 59 39 31 38 59 87116138148141121 93 62 38 2526 319Z1 5 614017 61489999999999999911 1 312320 2499999999999999",
" 28 45 71101127141140124 96 65 36 20 19 34 61 93123143148138116 87 60 4226 320Z1 5261431750148999999999999991134 172351 3799999999999999",
" 37 46 67 95121140144133108 76 43 18  7 13 34 65 98126142143131109 84 6326 321Z1 54714418361449999999999999912 8  7999999999999999999999",
" 52 54 68 91116136145139120 90 56 26  7  3 14 38 69 99123135134122103 8426 322Z1 6 9145192413699999999999999 021 521245  299999999999999",
" 71 68 75 91111130142142129105 74 43 18  4  5 19 42 70 9611512412211310026 323Z1 631143202012499999999999999 049 671327  399999999999999",
" 88 83 85 94109124136140133116 92 64 37 18  9 12 25 45 68 8810311111110726 324Z1 653140213311299999999999999 115 821416  999999999999999",
"100 96 95100108119128133132122105 84 61 41 26 19 21 30 45 62 78 9110010426 325Z1 716134999999999999999999999 137 951519 1999999999999999",
"105105105106110115120124124120112 99 84 67 51 38 29 27 31 41 54 68 82 9326 326Z1 7401249999999999999999999991650 27999999999999999999999",
"102108111113113112112112112112110106100 91 78 63 49 37 31 30 35 47 62 7826 327Z1 5331139999999999999999999991837 29999999999999999999999",
" 94107115118117112107101 98 98100103106106101 91 75 57 41 30 27 31 44 6226 328Z1 3 9118123010799999999999999 840 971957 2799999999999999",
" 82101115122122115104 93 85 81 84 92102112116113101 82 61 41 28 25 31 4826 329Z1 32612314 711699999999999999 9 5 812051 2499999999999999",
" 70 93113125127120106 90 75 66 66 74 89106120127122107 85 60 39 27 26 3826 330Z1 34412815 612799999999999999 932 652132 2599999999999999",
" 59 84108125132127112 91 70 55 49 55 71 92114130135127108 83 57 37 29 3426 331Z1 4 313215531359999999999999910 0 4922 7 2999999999999999",
" 51 76102124135133119 96 71 49 36 37 50 73100123137139127104 78 54 39 3726 4 1Z1 4221361636140999999999999991028 352238 3699999999999999",
" 48 70 96120136138127105 76 49 30 24 32 52 80109131141138122 98 72 53 4526 4 2Z1 4411391715142999999999999991055 2423 7 4599999999999999",
" 50 67 91116134141134114 85 55 30 17 18 34 60 90117135140132114 91 69 5626 4 3Z1 5 01411752140999999999999991123 152334 5499999999999999",
" 55 66 87110131141139123 96 65 36 16 11 20 42 70 99123135135124105 85 6926 4 4Z1 5191421829137999999999999991152 11999999999999999999999",
" 63 69 84105125139141129107 77 47 23 11 13 28 52 80106124131127114 97 8226 4 5Z1 53914219 613199999999999999 0 1 631221 1099999999999999",
" 73 73 84100119134140133115 89 60 34 17 12 20 38 62 88108121123117105 9226 4 6Z1 6 0140194612399999999999999 026 721253 1299999999999999",
" 83 80 85 97113127135133121100 74 49 29 19 19 30 48 70 9010611411410810026 4 7Z1 622136203111599999999999999 052 801327 1799999999999999",
" 91 87 88 96107119128130123108 87 65 45 31 25 28 39 55 73 8910010610610326 4 8Z1 644130213310799999999999999 117 8714 7 2599999999999999",
" 98 94 93 97103112119123120111 97 79 61 46 37 33 37 46 58 72 84 9410010226 4 9Z1 7 8123232710299999999999999 142 931459 3399999999999999",
"102101100100102106111114114110102 91 77 64 52 44 40 41 47 56 67 79 89 9726 410Z1 734114999999999999999999999 2191001617 4099999999999999",
"103106106105104103103104104104102 98 91 82 71 60 51 44 42 45 52 63 76 8926 411Z1 147106 82010499999999999999 5341031757 4299999999999999",
"101109112112108103 97 94 92 94 96 99 99 97 90 80 67 54 44 39 41 49 62 7926 412Z1 2221131146 9999999999999999 758 921917 3999999999999999",
" 95109117119114105 94 84 79 79 84 93101107107101 88 72 55 42 36 38 49 6726 413Z1 244119133310899999999999999 830 782013 3599999999999999",
" 87106120125122110 94 78 66 62 66 78 94109119120111 94 74 54 39 34 40 5626 414Z1 3 5125143712099999999999999 858 622058 3499999999999999",
" 77101120130130118 98 75 56 45 45 57 77100120131131119 98 74 53 39 38 4826 415Z1 326131152813399999999999999 928 442138 3799999999999999",
" 68 93117133137127106 79 52 32 25 33 53 80109132142139124100 74 54 44 4726 416Z1 348137161714399999999999999 959 252216 4499999999999999",
" 62 86111132141137118 88 56 27 11 10 25 53 86118140149143124100 76 59 5426 417Z1 41014217 4149999999999999991033  82252 5499999999999999",
" 62 81105128143144130102 67 33  6 -5  1 23 56 93124144150141122 99 79 6726 418Z1 43514517521509999999999999911 9 -52327 6699999999999999",
" 68 80100123141148140118 85 48 15 -7-12  0 26 61 97126142145136118 99 8426 419Z1 5 01481842146999999999999991148-13999999999999999999999",
" 78 83 98117135147146131104 69 33  4-11-11  4 32 65 9812213513712811410026 420Z1 527148193613799999999999999 0 1 781229-1399999999999999",
" 91 90 98112128141145138119 91 58 27  4 -7 -4 13 38 68 9511512512712011126 421Z1 555145203712799999999999999 035 891315 -899999999999999",
"102 98100108120132139138128108 82 54 29 11  4  8 22 43 68 9010611511811526 422Z1 626140215411899999999999999 1 9 9814 8  399999999999999",
"110105104107113121127130127117100 80 57 38 23 17 20 30 47 66 84 9910811326 423Z1 7 1130233511399999999999999 1511041512 1799999999999999",
"113111108107107110113117117115108 97 82 66 50 37 30 30 37 49 65 81 9510626 424Z1 750118999999999999999999999 3131071632 2999999999999999",
"113115113109105102100100102104105104 99 90 77 63 50 41 38 42 51 66 82 9726 425Z1 1 011510 210599999999999999 6251001759 3899999999999999",
"109116118114107 98 90 85 84 87 93 99104105100 89 75 60 49 44 46 55 70 8826 426Z1 145118123710599999999999999 745 841912 4499999999999999",
"104116122120111 99 85 73 67 68 75 86 99109113109 98 83 66 54 48 51 63 8026 427Z1 21412214 211399999999999999 826 6620 8 4899999999999999",
" 99115125126119104 85 67 54 50 55 68 86104117122118104 87 69 57 53 59 7426 428Z1 23912715 212299999999999999 859 502053 5399999999999999",
" 93112126132127112 90 67 48 37 37 48 67 91112126130123107 88 70 60 60 7026 429Z1 3 2132155013099999999999999 930 352131 5999999999999999",
" 87107125135134121 99 72 47 29 23 29 48 73100122134134124106 87 71 65 6926 430Z1 325136163213699999999999999 959 2322 6 6599999999999999",
" 83102122136139130110 82 53 28 15 15 29 53 83110130139135122103 85 73 7226 5 1Z1 3471391711139999999999999991028 132239 7199999999999999",
" 81 97117133141137120 94 63 34 14  7 15 35 64 94120136140132117 99 84 7726 5 2Z1 4111411749140999999999999991058  72310 7799999999999999",
" 80 93111128140141129106 76 45 19  6  6 21 45 75104126137136126110 94 8426 5 3Z1 4351421826138999999999999991128  42340 8299999999999999",
" 82 90105122136141135117 90 59 31 11  4 11 31 57 86111128134130118104 9226 5 4Z1 5 014119 3134999999999999991159  4999999999999999999999",
" 86 89 99114129138137125103 75 46 23  9  9 21 42 68 94114126128122111 9926 5 5Z1 526139194312899999999999999 010 861232  899999999999999",
" 91 90 96108121131135129113 89 63 38 21 13 17 32 53 76 9811312112111410526 5 6Z1 553135202712299999999999999 041 9013 8 1399999999999999",
" 97 93 95102112123129128118101 78 55 36 24 21 27 42 61 81 9911111611511026 5 7Z1 622129212111699999999999999 114 931348 2099999999999999",
"103 98 96 99105113120122118108 91 72 54 39 30 29 36 49 66 83 9810811311326 5 8Z1 655122222711399999999999999 155 961436 2999999999999999",
"109104100 98100104109113113109100 87 71 57 45 38 37 43 54 69 84 9810811326 5 9Z1 739114233911499999999999999 3 2 981535 3799999999999999",
"114111106101 97 96 97100103104103 97 88 76 64 53 46 44 48 58 71 8610011126 510Z1 9 0104999999999999999999999 457 961648 4499999999999999",
"117117113106 97 90 86 85 88 93 98101100 94 85 73 61 53 49 52 61 75 9110626 511Z1 036118111610199999999999999 638 8518 5 4999999999999999",
"117122121113101 87 76 70 70 75 85 96104108105 96 83 70 59 54 56 66 81 9926 512Z1 11612213 510899999999999999 732 691912 5499999999999999",
"115125128122108 90 71 57 50 53 64 81 98112120118108 93 77 65 59 62 74 9126 513Z1 148128141912099999999999999 813 5020 9 5999999999999999",
"110125133131118 97 72 50 34 30 38 56 80104123132130119102 84 71 66 71 8526 514Z1 218133151913399999999999999 850 302059 6699999999999999",
"104122136139130109 81 51 26 13 13 27 53 83112133143140126108 90 78 75 8226 515Z1 247139161414399999999999999 929 112146 7599999999999999",
" 98117135144141125 97 63 30  5 -5  1 22 53 88119141149144130111 95 85 8526 516Z1 31714417 71499999999999999910 9 -52229 8499999999999999",
" 95112130145149139116 83 45 12-10-16 -5 21 56 93124144150145130113 98 9226 517Z1 34914918 0150999999999999991051-162311 9299999999999999",
" 95107124140150149133106 70 32  1-17-19 -4 25 60 9612514214714112711210126 518Z1 4231511853147999999999999991135-202352 9899999999999999",
" 98104116132146151145126 96 60 25 -3-16-14  3 31 65 9812313714113412311126 519Z1 5 01511948141999999999999991222-18999999999999999999999",
"103103109122135145147137117 88 55 24  1 -9 -4 13 39 70 9811913113312711826 520Z1 540147204413399999999999999 0341021312 -999999999999999",
"108103104111122132139138128109 83 55 29 11  4 10 25 49 75 9811612512612126 521Z1 625140214112799999999999999 12110314 4  499999999999999",
"113106102103108116124128127118103 82 59 39 25 20 25 39 58 8010011412112226 522Z1 718129223612399999999999999 22010215 0 2099999999999999",
"117110103 98 97100105111116116110100 84 67 51 40 36 40 52 68 8610311512126 523Z1 831116232612199999999999999 343 971559 3699999999999999",
"120115107 98 91 88 88 92 97103106105100 90 77 64 54 51 54 64 78 9410811826 524Z11020106999999999999999999999 525 8717 3 5199999999999999",
"122120113102 91 81 74 73 77 84 93100104103 97 87 76 67 63 66 74 8810211526 525Z1 010123121910599999999999999 645 7318 7 6399999999999999",
"123125121110 95 80 67 59 58 64 74 88100108110106 97 86 77 73 76 84 9711126 526Z1 049126135011099999999999999 740 5819 9 7399999999999999",
"122129128119104 85 66 52 44 45 55 70 88104115119115105 94 84 81 84 9310626 527Z1 124129145611999999999999999 822 4420 4 8199999999999999",
"119130133128115 94 72 51 36 31 37 51 72 94112124127121110 98 89 86 9010126 528Z1 156133154812799999999999999 858 312054 8699999999999999",
"114127135135125106 81 56 35 23 22 33 53 78103122132133125112 99 91 90 9726 529Z1 228137163213499999999999999 932 212139 9099999999999999",
"109123134139134118 94 66 40 21 13 19 35 60 88113131138135125111 99 92 9426 530Z1 3 013917121389999999999999910 5 132219 9299999999999999",
"103116130140140129108 80 51 26 11  9 20 42 71 99123137140134121107 97 9326 531Z1 3311411749140999999999999991038  82255 9399999999999999",
" 98110124137142137120 95 65 37 15  6 10 27 52 82109129139138129115103 9526 6 1Z1 4 31421825139999999999999991112  62328 9499999999999999",
" 95103116131140141130110 82 52 26 10  6 16 36 64 92116132137133122109 9826 6 2Z1 43514219 1137999999999999991146  6999999999999999999999",
" 94 98109122135140136121 98 69 41 20  9 11 25 48 7510112113213312611510326 6 3Z1 5 7141193813399999999999999 0 1 941221  899999999999999",
" 95 95101113126135137129111 86 59 35 18 13 19 36 60 8510712313012812010826 6 4Z1 541138201513099999999999999 035 941257 1399999999999999",
" 99 94 96104115126132130119100 76 52 32 21 20 30 48 71 9411312412812311426 6 5Z1 618133205512899999999999999 113 941335 1999999999999999",
"104 96 93 96104114123126122110 92 70 50 35 27 30 41 59 8110111712512612026 6 6Z1 659126213612699999999999999 158 931415 2799999999999999",
"111101 93 91 94101109116118114103 87 69 53 41 37 41 53 71 9010712012612526 6 7Z1 752118221812699999999999999 257 9115 0 3799999999999999",
"118107 97 89 86 87 93101107110108100 88 74 61 52 49 54 65 81 9811312412726 6 8Z1 9 611023 112799999999999999 410 861552 4999999999999999",
"124115103 91 81 76 76 81 90 98105106103 94 83 72 65 62 66 76 9010611912726 6 9Z11049106234412999999999999999 527 751654 6299999999999999",
"129124112 97 81 68 61 61 67 79 91103109110105 96 86 78 75 77 86 9911312526 610Z11238110999999999999999999999 632 6018 5 7599999999999999",
"132131122107 87 67 51 43 43 53 69 87104116121118110100 91 86 88 9510712126 611Z1 02513214 912199999999999999 726 421916 8699999999999999",
"132137133120100 75 51 32 24 26 40 61 86108125133131123112101 96 9610411526 612Z1 1 7137152113399999999999999 816 232024 9599999999999999",
"128139141135117 91 62 34 14  6 12 30 57 8711413314314113212010910210311126 613Z1 150142162214399999999999999 9 5  6212410299999999999999",
"123136145146135113 82 48 18 -2 -8  2 24 56 9012014014914713712411210610726 614Z1 234147171815099999999999999 953 -8221810599999999999999",
"116130143151149134108 74 38  7-12-16 -3 24 58 9412414415214813712311110726 615Z1 31915218 9152999999999999991042-1623 610799999999999999",
"110120135148155150132103 67 30  0-16-16 -1 28 64 9912714515014413211810826 616Z1 4 61551857150999999999999991131-18235110599999999999999",
"105110123138150155147128 97 61 27  0-13-10  8 37 7210412914314513812511126 617Z1 4551551942146999999999999991219-14999999999999999999999",
"103102109122137148151142121 92 59 27  5 -4  2 22 50 8211013014013912911526 618Z1 545151202214199999999999999 03610113 5 -499999999999999",
"103 96 97106119132142143133114 88 58 32 16 11 20 39 66 9311713113613112026 619Z1 637143205813699999999999999 122 961350 1199999999999999",
"106 95 90 92100112124131132123107 85 61 41 30 30 40 59 8210512313213212426 620Z1 733133213113399999999999999 214 901432 2999999999999999",
"112 98 88 83 85 92102112119120114101 85 67 54 47 50 61 78 9811512713212826 621Z1 83812122 313299999999999999 315 831513 4799999999999999",
"118105 92 81 76 76 82 91100107110107 99 88 77 68 65 69 79 9411012313013126 622Z110 0110223613299999999999999 425 751556 6599999999999999",
"125114 99 85 74 67 67 71 79 89 98104105102 95 88 83 81 85 9410611812813226 623Z11147105231313299999999999999 539 661646 8199999999999999",
"130122110 94 79 66 58 56 60 69 81 93102108108105100 96 94 9710411412313026 624Z11339109235713399999999999999 647 561751 9499999999999999",
"133129120106 88 70 56 47 46 51 63 78 9310611511811511010510310411011812626 625Z115 1118999999999999999999999 742 4519 910399999999999999",
"132134129118101 81 61 45 36 37 45 60 79 9911412412712411711010710711212026 626Z1 047134155612799999999999999 829 35202510699999999999999",
"128134135128114 94 71 49 34 27 30 43 62 8510712413313412812011110610711326 627Z1 137135163713499999999999999 911 27212410699999999999999",
"122131137136127109 85 60 38 23 19 27 45 69 9411713313913712911810810410626 628Z1 224138171313999999999999999 950 19221010499999999999999",
"114125136140137123101 75 48 26 15 16 28 51 7810512613914213612411210410226 629Z1 3 71411747142999999999999991027 14224710199999999999999",
"107118131140143135117 92 63 36 17 10 16 34 60 89115133142140130117105 9926 630Z1 34614318181429999999999999911 2 102320 9899999999999999",
"100109123136144143131109 80 51 26 11 10 22 44 72101124138141135123108 9826 7 1Z1 4241451849142999999999999991137  92352 9599999999999999",
" 95100112127140145140124 98 69 40 19 10 15 32 57 8611313214013812811310026 7 2Z1 5 11451918141999999999999991210 10999999999999999999999",
" 92 92101116131141143134114 87 58 33 18 15 25 46 7310012313714013311910426 7 3Z1 539144194614099999999999999 026 911243 1499999999999999",
" 92 87 91103118132139137125103 77 51 31 22 25 39 62 8911413113913712611026 7 4Z1 619140201413999999999999999 1 2 871316 2199999999999999",
" 95 85 83 90102117129134129115 95 71 49 35 32 39 57 8010412413713913111726 7 5Z1 7 3134204313999999999999999 142 831349 3199999999999999",
"101 87 79 79 87 99113123126121108 90 70 54 45 46 57 75 9611713213813612526 7 6Z1 755126211113999999999999999 229 781424 4599999999999999",
"109 92 79 72 73 81 93105115119115105 90 76 65 61 64 75 9211012613613813126 7 7Z1 859119214213899999999999999 323 7215 3 6199999999999999",
"118101 84 71 64 64 71 83 96106112112106 97 87 80 78 83 9210612013213713626 7 8Z11026113221713899999999999999 427 631550 7899999999999999",
"127112 94 76 62 53 52 59 71 85 98108113112108102 97 96 9910611612713513826 7 9Z1122411323 113899999999999999 537 521653 9699999999999999",
"134124108 89 69 52 41 38 44 57 74 9210711812212211811311011111512213013626 710Z11422123235813999999999999999 647 38182411099999999999999",
"139135125107 85 61 41 27 23 29 45 66 8911012513313513112511911711912413126 711Z11543135999999999999999999999 753 2320 711799999999999999",
"139142139128108 82 54 30 13  9 16 35 60 8911413314314513913112211811812426 712Z1 1 6142163914599999999999999 853  9212511799999999999999",
"133142147145132109 79 47 19  2 -3  7 29 60 9212114115115014113011911311426 713Z1 213148172515199999999999999 948 -3222011399999999999999",
"122135147154150135109 75 40 11 -6 -9  4 31 65 9912814715414913712311110626 714Z1 31315418 4154999999999999991039-1023 410699999999999999",
"110121137151158154136107 71 35  6 -9 -8 10 39 7510913615015214312811110026 715Z1 4 91581839153999999999999991126-102344 9899999999999999",
" 98105120138154160153133103 66 32  7 -4  2 23 54 89120142150146133115 9826 716Z1 5 116019101509999999999999912 8 -4999999999999999999999",
" 89 91101119138152156148127 96 62 32 13  8 19 43 7410613114514713712010126 717Z1 551156193814899999999999999 024 891247  899999999999999",
" 86 80 85 98116134146148138117 89 60 37 25 27 42 66 9512113914614012610626 718Z1 64014920 214699999999999999 1 4 801322 2499999999999999",
" 88 76 73 80 94112128137137127108 85 63 47 43 50 67 9011413314314213111426 719Z1 730138202514499999999999999 146 731353 4399999999999999",
" 94 78 69 69 76 90105118125124116101 84 69 62 63 73 9011012814014313612226 720Z1 823126204714399999999999999 232 681422 6199999999999999",
"104 86 72 65 65 73 84 97108114114108 99 88 81 79 83 9410912413614213912926 721Z1 929114211114299999999999999 325 641449 7999999999999999",
"114 97 81 68 62 62 68 77 88 98104107106102 97 94 9510111012113113813913326 722Z111 7107214013999999999999999 429 611518 9499999999999999",
"123109 93 78 66 59 58 62 70 80 90 9910610910910910810911211812613213513426 723Z11346110222113599999999999999 544 5816 310899999999999999",
"129119106 91 76 63 54 52 54 62 74 87 9911011612012011811711812112512913126 724Z11530120232913299999999999999 7 0 52181011799999999999999",
"131127119106 90 73 58 48 44 47 56 71 8710411812612912812412011811812112626 725Z116 8129999999999999999999999 8 4 44202111799999999999999",
"130132129120106 87 67 50 38 35 40 53 72 9311212713513613112411711311311826 726Z1 057132163813699999999999999 855 35212611399999999999999",
"125132135132122104 82 59 40 28 27 36 54 7810212313614113812911911010710926 727Z1 2 513517 514199999999999999 938 2622 410799999999999999",
"117128137141136121 99 73 48 29 20 23 37 61 8811413314314313512211010210126 728Z1 2571411730144999999999999991015 19223610099999999999999",
"108120134144145136117 91 62 36 19 15 24 45 72101126142146140127112 99 9326 729Z1 3411461755146999999999999991049 1523 5 9399999999999999",
" 97109126141149147134110 80 50 26 14 16 32 58 88116137147145133115 99 8826 730Z1 4201501818148999999999999991121 132335 8699999999999999",
" 87 96113132147152145127 99 68 39 20 15 24 46 75106131146148139121101 8626 731Z1 4591521841149999999999999991152 15999999999999999999999",
" 79 83 98117137149151139117 88 58 34 22 24 40 66 96123142150144128107 8726 8 1Z1 53715219 315099999999999999 0 6 791221 2199999999999999",
" 74 73 82100121138148145131106 78 52 35 30 40 60 87115137149148135115 9226 8 2Z1 618148192515099999999999999 039 721250 3099999999999999",
" 74 66 68 81101121137143137121 98 74 54 44 46 60 8310813114614914112310026 8 3Z1 7 1143194715099999999999999 115 651319 4399999999999999",
" 79 64 59 65 80100118131135128113 94 75 63 60 67 8310412514114914513111026 8 4Z1 75013520 914999999999999999 155 591348 5999999999999999",
" 88 68 57 55 63 77 95112123125120109 95 84 78 79 8910412113614514613712126 8 5Z1 850126203314799999999999999 241 541417 7799999999999999",
"100 79 62 52 51 58 71 87102112117115110103 97 96 9910811913214114414113026 8 6Z1101411721 114499999999999999 339 501448 9599999999999999",
"114 94 75 59 49 46 51 61 75 9010211011511511411311311612112813514014113626 8 7Z11247115213914199999999999999 453 46152511399999999999999",
"127112 94 76 58 45 39 40 48 62 78 9410811912512812812712612713013313613726 8 8Z11529128225713799999999999999 621 39174812699999999999999",
"135128116 99 79 58 41 30 28 35 49 69 9011012613613913813312912512512813226 8 9Z116 8139999999999999999999999 744 27203912599999999999999",
"137139135124106 82 56 34 19 15 23 41 65 9211713614614714213212311711612126 810Z1 055139163914899999999999999 851 15213811699999999999999",
"130140146145133111 83 52 26 10  6 17 39 6910012714515214913812311110510726 811Z1 22014717 815299999999999999 945  6221710599999999999999",
"116131146155153139114 81 47 19  4  4 19 46 80113138152153143126109 96 9226 812Z1 3231561735154999999999999991031  22252 9299999999999999",
" 99114134152161158141112 76 42 16  5 10 31 62 97128148155148132110 91 8026 813Z1 41616218 0155999999999999991111  42326 7999999999999999",
" 81 94114137156163157137105 70 38 18 13 25 51 83116141154152138115 92 7526 814Z1 5 41641822155999999999999991146 13999999999999999999999",
" 68 75 92116139156160150128 97 65 40 27 30 48 76107134151154143122 97 7526 815Z1 549160184315499999999999999 0 0 681218 2799999999999999",
" 62 61 72 92116138151152139117 89 64 47 43 53 74101128147154148130106 8126 816Z1 63315319 215499999999999999 034 591246 4399999999999999",
" 62 54 58 72 93116134142140127107 85 68 60 64 78100123142152150137116 9126 817Z1 717143192015399999999999999 110 541311 6099999999999999",
" 69 55 52 59 75 94113126131127116101 86 77 77 8510112013814915114212410226 818Z1 8 3131193915199999999999999 147 521334 7699999999999999",
" 80 63 54 54 62 76 92107117120117109100 92 90 9410411813314414814313111326 819Z1 858120195914899999999999999 230 531353 9099999999999999",
" 93 75 62 56 57 64 76 88 9910711111010810410310410911812813714214113412126 820Z11024111202114299999999999999 321 5614 610399999999999999",
"106 90 76 65 59 59 64 72 81 91 9910610911211311411612012513013413513312626 821Z12048135999999999999999999999 433 59999999999999999999999",
"116104 91 79 68 61 58 59 65 74 84 9510511412012312412412412512612712812626 822Z12146128999999999999999999999 6 9 58999999999999999999999",
"123116107 95 82 69 59 52 52 57 67 81 9611012212913113012612211911912012326 823Z116 1131999999999999999999999 737 51204611999999999999999",
"125125121112 99 82 66 52 44 43 50 64 8210212013213713613012111411011111526 824Z1 033125161613899999999999999 836 42212311099999999999999",
"122129132128117100 79 58 42 34 36 47 67 9011313114114213512311110310110526 825Z1 158132163514299999999999999 919 33215010099999999999999",
"115127137140134118 96 70 47 31 26 33 52 77104127142146141127111 98 91 9326 826Z1 252140165414699999999999999 955 262215 9099999999999999",
"104120136146147136115 88 59 36 24 24 39 63 92120140150146133114 95 82 8026 827Z1 3351481714150999999999999991026 222242 8099999999999999",
" 89106127145154150134108 77 49 29 22 31 52 81112137151151139119 96 77 6926 828Z1 4141541733153999999999999991056 222310 6999999999999999",
" 73 89112135152158149128 98 67 42 28 29 45 71103131150155146126100 76 6126 829Z1 4531581752155999999999999991125 262340 5899999999999999",
" 59 70 92118142156157143119 89 60 41 35 44 66 95124146157152134108 80 5926 830Z1 5331581812157999999999999991153 35999999999999999999999",
" 49 53 71 96123145155152135110 82 60 48 50 65 90117141155156142118 89 6326 831Z1 614156183215799999999999999 011 481221 4799999999999999",
" 45 42 52 73100125143149143126103 81 66 62 71 89113136152157148128101 7226 9 1Z1 658149185215799999999999999 045 411248 6299999999999999",
" 50 38 40 53 75101123137140133118101 86 79 81 93111131147155151137114 8726 9 2Z1 747140191215599999999999999 123 371314 7999999999999999",
" 62 44 37 41 55 75 97115126129123114103 96 9510111312814115015114212510326 9 3Z1 847129193415199999999999999 2 7 371338 9599999999999999",
" 79 59 45 39 43 55 71 8910411411811811411111011211812713614414614313311726 9 4Z11022118195714699999999999999 3 4 39135311099999999999999",
" 99 79 62 49 43 44 51 63 77 9110311111712012212312612913313613813813512726 9 5Z12026139999999999999999999999 424 43999999999999999999999",
"116102 86 70 56 46 41 43 52 64 80 9611012112913313413213012912812913013026 9 6Z11545134224213099999999999999 610 4120 612899999999999999",
"128122112 97 79 60 45 35 34 41 55 74 9511513013914113713112311811611812326 9 7Z11549141999999999999999999999 741 33205911699999999999999",
"130134133124108 85 62 41 28 25 34 52 7710312514114714313312010910210210926 9 8Z1 12013416 814799999999999999 844 25213010199999999999999",
"121135144145135115 87 59 36 22 22 34 58 87116138149149138121103 90 85 9026 9 9Z1 235146162915199999999999999 932 2022 0 8599999999999999",
"104124142154154141116 85 55 31 21 26 44 73104131149153145126103 83 71 7126 910Z1 3301561649154999999999999991012 212230 6999999999999999",
" 83104129150161158141113 80 51 31 27 38 62 93124146156151133108 82 63 5626 911Z1 41816217 9156999999999999991046 2723 1 5699999999999999",
" 62 82108135155163156135106 75 50 38 41 59 86116142156155141116 87 62 4726 912Z1 5 11631728157999999999999991117 372331 4599999999999999",
" 47 60 85114140157160149126 98 71 54 50 61 83110137154158148125 96 67 4626 913Z1 5431601747158999999999999991145 50999999999999999999999",
" 38 45 64 91119141153152138116 92 73 64 68 84107131151158153134107 77 5226 914Z1 62315418 515899999999999999 0 2 381211 6499999999999999",
" 37 36 48 70 97122139146141126108 90 79 78 88106127146156155141118 90 6326 915Z1 7 3146182315799999999999999 034 351234 7799999999999999",
" 44 36 41 56 78101121133135129117103 92 89 93106123139151153144126102 7726 916Z1 745136184315499999999999999 1 7 361256 8999999999999999",
" 56 43 41 49 64 83102116124125120111103 99100108120133144148144132113 9126 917Z1 83512519 314899999999999999 143 411316 9999999999999999",
" 71 56 48 49 57 69 84 9810911511611411110810811211912813614014013212010426 918Z1 949116192214199999999999999 226 48132910899999999999999",
" 87 72 61 56 56 61 70 81 9210110711111411511611712012412813213212912211326 919Z11940132999999999999999999999 327 55999999999999999999999",
"101 89 78 68 62 60 61 67 75 84 9410411211812212412412312312312312212011726 920Z11535124999999999999999999999 5 5 60999999999999999999999",
"112104 95 85 74 65 59 57 60 68 79 9310611812613012912512011611311211311626 921Z11518130999999999999999999999 652 57204511299999999999999",
"118117112103 90 76 62 53 49 53 63 79 9711512813513513012011010310110311026 922Z1 016118153113699999999999999 8 0 4921 010199999999999999",
"118124126121109 92 73 56 45 42 49 65 86108127139141135123108 95 88 89 9826 923Z1 148126154714299999999999999 845 422122 8899999999999999",
"111125134136128111 89 66 48 38 40 53 74100123140147142128108 90 77 74 8226 924Z1 24113616 414799999999999999 921 372146 7499999999999999",
" 98118135146145132110 83 58 41 36 44 63 90117139150149135112 88 69 59 6326 925Z1 325147162115199999999999999 954 362213 5999999999999999",
" 79103127147155149131105 76 53 40 41 56 81110136152155143120 91 65 48 4526 926Z1 4 61551640155999999999999991025 392241 4599999999999999",
" 57 81110138156160150127 99 71 52 46 54 75103131151159151129 99 68 43 3226 927Z1 44716017 0159999999999999991055 462311 3299999999999999",
" 37 57 86119145160160145121 94 70 57 59 73 97124147160157140111 77 46 2626 928Z1 5291621720161999999999999991125 562344 2299999999999999",
" 22 35 60 93125148159155138115 91 75 69 77 95119142158160148124 91 57 3126 929Z1 6121591742161999999999999991155 69999999999999999999999",
" 17 20 38 66 98126146152146130110 93 84 85 97116136153160154135107 74 4426 930Z1 65915218 416099999999999999 020 161223 8399999999999999",
" 24 16 24 43 70 99123137141135123110100 97103115131146156155143121 94 652610 1Z1 751141182715799999999999999 059 161249 9799999999999999",
" 40 25 22 31 48 72 95114126129126119113109111117128139148150145131111 872610 2Z1 859129185115199999999999999 146 22131310999999999999999",
" 64 45 33 31 38 51 69 871031141201211201191191211261331381411401341221062610 3Z11059121191514299999999999999 245 31132811999999999999999",
" 89 71 55 45 40 42 51 63 78 931051151211251261271271271281291291281251182610 4Z11941129999999999999999999999 410 40999999999999999999999",
"109 97 83 68 55 47 44 47 57 70 871031161261321321291251201161141151181202610 5Z11440133234512199999999999999 557 44201011499999999999999",
"121118109 96 79 63 49 42 43 52 68 87107124134138134125114105 98 981021112610 6Z11457138999999999999999999999 723 422038 9799999999999999",
"121128129122107 87 66 49 41 42 54 73 96118134142140129114 97 84 79 83 942610 7Z1 138130151714399999999999999 822 4021 6 7999999999999999",
"111127139141132114 90 66 49 41 46 62 85111132145146136117 95 76 64 62 732610 8Z1 242141153614799999999999999 9 7 412136 6199999999999999",
" 92115136148149137115 89 65 49 46 56 77103128145151144125 99 73 54 46 522610 9Z1 332150155615199999999999999 944 4622 5 4699999999999999",
" 70 95123145156152137112 86 64 54 57 72 96123144154151134107 77 51 36 35261010Z1 4171561616155999999999999991017 532234 3399999999999999",
" 48 73103132151158151132107 83 67 63 72 92117140155156143118 87 56 33 25261011Z1 4581581635157999999999999991047 6323 4 2599999999999999",
" 31 52 81112139154156145125101 82 73 76 91112135152158150129 98 66 38 22261012Z1 5371571655158999999999999991115 732333 2099999999999999",
" 21 35 60 91121142152149136117 97 85 82 91108129148157154138111 79 49 28261013Z1 6161531716158999999999999991142 82999999999999999999999",
" 20 26 45 71100125141146140126110 96 90 94106124141153154143122 93 64 39261014Z1 654146173815599999999999999 0 4 1912 8 9099999999999999",
" 25 24 35 56 82107126136137130118106 99 98105118133146150145129106 79 55261015Z1 73513818 015099999999999999 036 231234 9799999999999999",
" 37 29 33 46 66 88108122129128122113106103106115126137143142133116 94 72261016Z1 821129182314499999999999999 110 2913 010399999999999999",
" 53 41 38 44 56 73 91106116121120117113110110114121128134136131120105 87261017Z1 925121184613699999999999999 150 38132810999999999999999",
" 70 57 49 47 52 62 75 89101110115117117116115115117121124126125120111 99261018Z1112111719 912699999999999999 242 47141411599999999999999",
" 87 74 64 57 55 57 64 74 85 96106114119121121119117116115115115114112107261019Z11325121999999999999999999999 358 55999999999999999999999",
"100 92 82 72 64 59 58 62 71 82 95108118124127125120113108104103104106109261020Z114 1127234110999999999999999 539 58195610399999999999999",
"109107100 90 78 67 59 56 60 69 83 99114126132131125114103 93 89 90 95104261021Z11423133999999999999999999999 659 562020 8899999999999999",
"112117117110 97 82 68 57 54 59 72 89109126136138131118101 85 75 73 79 92261022Z1 126118144313999999999999999 754 542045 7299999999999999",
"107121129128119102 83 66 55 54 63 80101123138144139124103 81 63 55 58 72261023Z1 22613015 314499999999999999 838 532112 5599999999999999",
" 93115133141138125104 82 65 56 59 72 94117138149147133109 81 56 40 37 49261024Z1 314142152415099999999999999 916 552141 3799999999999999",
" 71100126145152145127104 81 66 61 69 87111135151154143120 89 57 32 20 25261025Z1 359152154615599999999999999 952 612213 2099999999999999",
" 45 75108137154158147127103 82 70 71 84105129149158153133102 66 33 12  7261026Z1 44415816 9159999999999999991027 692247  799999999999999",
" 20 46 81116144159159146125102 86 79 85101123145159160146118 82 45 15  0261027Z1 52916016341619999999999999911 1 792323 -299999999999999",
"  2 20 51 88122146157154140121103 92 91101118138155162155134102 65 30  6261028Z1 61615817 1162999999999999991134 90999999999999999999999",
" -4  4 26 57 92122142150146134118106100103115131148158158145120 88 54 24261029Z1 7 8150172915999999999999999 0 3 -412 710099999999999999",
"  5  1 11 33 63 93118135140137128117110108114125138149154149133109 80 51261030Z1 8 514018 015499999999999999 048  1124110899999999999999",
" 27 13 11 21 41 66 91112125131129124118114115120129137144144137123102 78261031Z1 917131183514599999999999999 138 10132011499999999999999",
" 55 36 26 24 32 48 67 871051171241251231201181181201251291321311251151002611 1Z11050125191913299999999999999 238 24142811799999999999999",
" 83 65 50 40 37 41 52 68 851001131211251251221181151131131151161181161122611 2Z1122312521 511899999999999999 354 37173011399999999999999",
"104 92 78 64 53 48 49 56 69 85101115124128127121114106 99 96 971011071122611 3Z11315128999999999999999999999 522 471918 9699999999999999",
"114112104 91 77 64 56 55 61 73 90107121130132127117103 90 81 77 80 891012611 4Z1 0 1114134713299999999999999 641 5420 2 7799999999999999",
"113120121115102 86 72 62 60 67 81 99117131137135123106 87 71 61 59 67 832611 5Z1 139122141313799999999999999 742 602038 5999999999999999",
"101118129131124109 92 76 67 67 76 93112129140142132114 91 68 50 42 46 612611 6Z1 243132143814299999999999999 830 662110 4299999999999999",
" 83107127139139130113 94 79 72 76 88106126141147141124 99 71 47 32 29 402611 7Z1 33414015 114799999999999999 911 722141 2899999999999999",
" 61 89116136146144131113 94 82 79 86102121139150149135111 80 51 28 18 232611 8Z1 418147152515199999999999999 948 782211 1899999999999999",
" 41 68 99126144150144129110 94 85 87 98115134149153144123 93 61 33 15 122611 9Z1 4591501550153999999999999991022 842242 1299999999999999",
" 24 48 79110134148150140124106 94 90 96110128144153150134107 75 43 20  9261110Z1 5371511615153999999999999991054 892312  999999999999999",
" 13 31 59 91119140148145134118103 94 95105121138150152141120 90 58 30 13261111Z1 6141491641152999999999999991124 942344  999999999999999",
" 10 21 43 71101125140144138125111100 97102114130143150145129104 74 46 24261112Z1 65114417 8150999999999999991154 97999999999999999999999",
" 13 16 31 55 82108127137137129118107100101109121134144144135116 90 63 39261113Z1 730138173514599999999999999 017 13122510099999999999999",
" 24 19 26 43 66 90111125131129122113105102105114125134139135123103 79 56261114Z1 81313118 413999999999999999 052 19125810299999999999999",
" 38 28 28 38 54 75 95112122126123117110105105109116124130130124111 93 73261115Z1 9 3126183613199999999999999 130 27133910499999999999999",
" 55 42 36 38 48 63 81 97111119122120116110107106108113118121119113102 88261116Z110 4122191512199999999999999 214 36144310699999999999999",
" 73 59 49 45 48 56 69 84 99111119122121117111107104103105108110109106 99261117Z11112122202511099999999999999 3 7 45164010399999999999999",
" 89 77 66 58 54 56 62 74 87101113121125123118110102 96 92 92 95 99102103261118Z11210125224910399999999999999 415 541830 9299999999999999",
"101 95 86 76 67 62 62 67 78 92106119127129125116104 91 81 76 77 83 91100261119Z11252129999999999999999999999 533 611923 7699999999999999",
"107109105 97 86 76 68 67 72 83 98114126133133124109 91 74 62 58 62 73 88261120Z1 051109132513499999999999999 644 6720 1 5899999999999999",
"104115120118108 95 83 74 72 78 91107124136140134118 96 73 52 40 39 49 68261121Z1 2 8120135514099999999999999 744 722036 3899999999999999",
" 90112127133130118103 88 79 78 86101119135144143130107 78 50 29 19 23 41261122Z1 3 7133142414599999999999999 835 782112 1999999999999999",
" 67 96122139145139125108 93 85 86 97113132146151143122 92 58 27  7  2 13261123Z1 358145145415199999999999999 922 842150  299999999999999",
" 37 70103131148152144128111 97 91 95108126144154153139111 75 38  8 -9 -9261124Z1 44815215261569999999999999910 5 912230-1199999999999999",
"  8 38 74110137152154145128112100 98105120138153159152131 99 60 23 -4-17261125Z1 53715516 0159999999999999991046 972313-1799999999999999",
"-12  9 42 80114139152151141126112103104113129145157159147122 87 49 15 -9261126Z1 62815316371609999999999999911261022358-1799999999999999",
"-17 -8 15 48 84116137147145135122111106109119134148156154138112 79 43 13261127Z1 72014817171579999999999999912 7106999999999999999999999",
" -6-10  1 25 56 88115133140138129117109106111121134145150144129104 74 43261128Z1 81314018 015099999999999999 046-10125110699999999999999",
" 19  4  3 15 36 64 91114128133131123113107105110118128136138133119 98 73261129Z1 9 6134185013999999999999999 135  2134410599999999999999",
" 49 29 19 19 30 49 72 95114125128125118109103101104109117123125121111 96261130Z1 959128195412599999999999999 228 18145710199999999999999",
" 77 58 44 36 37 46 62 81100115124126122114105 98 94 93 961011071111111062612 1Z11050126213111199999999999999 324 351639 9399999999999999",
" 97 84 70 59 53 54 61 74 90106118125126121111100 90 82 79 80 85 921001052612 2Z11136126234310699999999999999 425 531814 7999999999999999",
"106102 94 84 74 69 68 74 86 99113123128127119107 92 78 67 62 63 70 81 932612 3Z11218129999999999999999999999 532 681919 6299999999999999",
"104110110105 96 87 81 80 85 95108120129132128117100 81 64 51 46 49 60 762612 4Z1 132111125713299999999999999 640 8020 6 4699999999999999",
" 93108117120115106 96 90 88 93103116127135135127111 90 67 47 35 32 40 562612 5Z1 248120133313699999999999999 743 882046 3299999999999999",
" 77 99116127129123113102 95 94 99110123134140136123102 76 51 31 21 23 362612 6Z1 34312914 914099999999999999 838 932121 2199999999999999",
" 58 83108126136135127115103 97 97105117130140142134116 90 61 35 18 12 202612 7Z1 427137144314399999999999999 926 962155 1299999999999999",
" 39 65 94119135141138127113102 97100110124137144142128105 75 45 21  8  82612 8Z1 5 514215171459999999999999910 7 972228  699999999999999",
" 22 46 76105128141143136123109 99 98104116131142146138119 91 60 31 11  32612 9Z1 5411441550146999999999999991044 9723 2  399999999999999",
" 10 29 57 88115134143140130116103 97 99108123137145144130107 77 46 20  6261210Z1 6151431623146999999999999991117 972335  399999999999999",
"  4 17 40 70 99123137140134122108 98 96101113128140144138120 94 63 35 14261211Z1 6491411655144999999999999991149 95999999999999999999999",
"  5 10 27 53 82108127136135126113101 95 96105118131140140129108 81 52 28261212Z1 723137172814199999999999999 0 8  51221 9499999999999999",
" 13 10 20 41 67 93115129133129118106 96 93 97107120131136131117 95 69 45261213Z1 75613318 313699999999999999 042 101257 9399999999999999",
" 26 17 20 33 55 79103120129130123111100 93 92 98108119126128121106 85 62261214Z1 831131184112899999999999999 116 171338 9299999999999999",
" 42 29 25 32 48 68 91110123129126117106 96 91 91 96104113118118110 96 79261215Z1 9 7129192611999999999999999 151 251429 9099999999999999",
" 60 45 37 37 46 62 81101116126127123113102 92 87 86 90 97104109108102 92261216Z1 945128202810999999999999999 228 361537 8699999999999999",
" 78 64 54 49 51 60 75 92108121127126120109 97 86 79 77 79 86 93 99101 99261217Z1102512822 310199999999999999 311 491657 7799999999999999",
" 93 84 74 66 63 65 74 86101115124128126118105 90 77 67 63 65 72 82 92 99261218Z111 7129999999999999999999999 4 6 631810 6399999999999999",
"102100 94 87 81 77 79 85 96108120128130126115 99 81 64 51 46 49 58 72 88261219Z1 0 8102115113099999999999999 516 7719 9 4699999999999999",
"101109111108102 95 90 89 94103115125132133126112 91 68 47 32 27 32 46 66261220Z1 155111123713499999999999999 637 8920 0 2799999999999999",
" 88106119124122115107100 98101109120131138137127107 81 53 28 13  9 17 37261221Z1 311124132413899999999999999 755 972048  899999999999999",
" 63 91114130136134125114106102106115127138144141126102 70 38 11 -5 -6  7261222Z1 410136141114499999999999999 9 11022136 -899999999999999",
" 32 63 96122139145141130117108105109119133145150144125 95 60 24 -4-18-16261223Z1 5 2145145915099999999999999 9561052224-1999999999999999",
"  1 31 67102129145149142129116106104111124139151154145122 89 50 14-13-25261224Z1 54914915471559999999999999910441042311-2599999999999999",
"-19  3 35 73108133147148139124110102103112127143154155143117 82 43  8-16261225Z1 63414916351579999999999999911281012357-2399999999999999",
"-23-14 10 45 81114136145142131116103 97100111128144153152137111 76 39  8261226Z1 7161451724154999999999999991210 97999999999999999999999",
"-11-14 -2 24 58 91119136141134121106 94 91 96109125139147144129103 71 39261227Z1 754141181414799999999999999 042-151254 9199999999999999",
" 13  0  2 17 43 73102124135135125110 95 86 84 91103118131136132118 95 69261228Z1 82813619 613699999999999999 124 -11341 8499999999999999",
" 43 25 17 23 39 63 89112127132128116100 87 79 78 84 95108118122119107 90261229Z1 85913220 512299999999999999 2 4 171436 7799999999999999",
" 70 52 40 38 46 62 83104120129129121107 92 80 72 71 75 84 95103108107100261230Z1 929130211810899999999999999 242 381542 7199999999999999",
" 88 75 64 59 61 70 84101117127131126116101 86 73 64 61 64 71 80 89 96 98261231Z1 95513123 5 9899999999999999 316 5917 0 6199999999999999"
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
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2025年

(function () {
  var year = 2025;
  var lines = [
    "01/01, 大潮",
    "01/02, 大潮",
    "01/03, 中潮",
    "01/04, 中潮",
    "01/05, 中潮",
    "01/06, 中潮",
    "01/07, 小潮",
    "01/08, 小潮",
    "01/09, 小潮",
    "01/10, 長潮",
    "01/11, 若潮",
    "01/12, 中潮",
    "01/13, 中潮",
    "01/14, 大潮",
    "01/15, 大潮",
    "01/16, 大潮",
    "01/17, 大潮",
    "01/18, 中潮",
    "01/19, 中潮",
    "01/20, 中潮",
    "01/21, 中潮",
    "01/22, 小潮",
    "01/23, 小潮",
    "01/24, 小潮",
    "01/25, 長潮",
    "01/26, 若潮",
    "01/27, 中潮",
    "01/28, 中潮",
    "01/29, 大潮",
    "01/30, 大潮",
    "01/31, 大潮",
    "02/01, 大潮",
    "02/02, 中潮",
    "02/03, 中潮",
    "02/04, 中潮",
    "02/05, 中潮",
    "02/06, 小潮",
    "02/07, 小潮",
    "02/08, 小潮",
    "02/09, 長潮",
    "02/10, 若潮",
    "02/11, 中潮",
    "02/12, 中潮",
    "02/13, 大潮",
    "02/14, 大潮",
    "02/15, 大潮",
    "02/16, 大潮",
    "02/17, 中潮",
    "02/18, 中潮",
    "02/19, 中潮",
    "02/20, 中潮",
    "02/21, 小潮",
    "02/22, 小潮",
    "02/23, 小潮",
    "02/24, 長潮",
    "02/25, 若潮",
    "02/26, 中潮",
    "02/27, 中潮",
    "02/28, 大潮",
    "03/01, 大潮",
    "03/02, 大潮",
    "03/03, 中潮",
    "03/04, 中潮",
    "03/05, 中潮",
    "03/06, 中潮",
    "03/07, 小潮",
    "03/08, 小潮",
    "03/09, 小潮",
    "03/10, 長潮",
    "03/11, 若潮",
    "03/12, 中潮",
    "03/13, 中潮",
    "03/14, 大潮",
    "03/15, 大潮",
    "03/16, 大潮",
    "03/17, 大潮",
    "03/18, 中潮",
    "03/19, 中潮",
    "03/20, 中潮",
    "03/21, 中潮",
    "03/22, 小潮",
    "03/23, 小潮",
    "03/24, 小潮",
    "03/25, 長潮",
    "03/26, 若潮",
    "03/27, 中潮",
    "03/28, 中潮",
    "03/29, 大潮",
    "03/30, 大潮",
    "03/31, 大潮",
    "04/01, 大潮",
    "04/02, 中潮",
    "04/03, 中潮",
    "04/04, 中潮",
    "04/05, 中潮",
    "04/06, 小潮",
    "04/07, 小潮",
    "04/08, 小潮",
    "04/09, 長潮",
    "04/10, 若潮",
    "04/11, 中潮",
    "04/12, 中潮",
    "04/13, 大潮",
    "04/14, 大潮",
    "04/15, 大潮",
    "04/16, 大潮",
    "04/17, 中潮",
    "04/18, 中潮",
    "04/19, 中潮",
    "04/20, 中潮",
    "04/21, 小潮",
    "04/22, 小潮",
    "04/23, 小潮",
    "04/24, 長潮",
    "04/25, 若潮",
    "04/26, 中潮",
    "04/27, 中潮",
    "04/28, 大潮",
    "04/29, 大潮",
    "04/30, 大潮",
    "05/01, 中潮",
    "05/02, 中潮",
    "05/03, 中潮",
    "05/04, 中潮",
    "05/05, 小潮",
    "05/06, 小潮",
    "05/07, 小潮",
    "05/08, 長潮",
    "05/09, 若潮",
    "05/10, 中潮",
    "05/11, 中潮",
    "05/12, 大潮",
    "05/13, 大潮",
    "05/14, 大潮",
    "05/15, 大潮",
    "05/16, 中潮",
    "05/17, 中潮",
    "05/18, 中潮",
    "05/19, 中潮",
    "05/20, 小潮",
    "05/21, 小潮",
    "05/22, 小潮",
    "05/23, 長潮",
    "05/24, 若潮",
    "05/25, 中潮",
    "05/26, 中潮",
    "05/27, 大潮",
    "05/28, 大潮",
    "05/29, 大潮",
    "05/30, 大潮",
    "05/31, 中潮",
    "06/01, 中潮",
    "06/02, 中潮",
    "06/03, 中潮",
    "06/04, 小潮",
    "06/05, 小潮",
    "06/06, 小潮",
    "06/07, 長潮",
    "06/08, 若潮",
    "06/09, 中潮",
    "06/10, 中潮",
    "06/11, 大潮",
    "06/12, 大潮",
    "06/13, 大潮",
    "06/14, 大潮",
    "06/15, 中潮",
    "06/16, 中潮",
    "06/17, 中潮",
    "06/18, 中潮",
    "06/19, 小潮",
    "06/20, 小潮",
    "06/21, 小潮",
    "06/22, 長潮",
    "06/23, 若潮",
    "06/24, 中潮",
    "06/25, 中潮",
    "06/26, 大潮",
    "06/27, 大潮",
    "06/28, 大潮",
    "06/29, 中潮",
    "06/30, 中潮",
    "07/01, 中潮",
    "07/02, 中潮",
    "07/03, 小潮",
    "07/04, 小潮",
    "07/05, 小潮",
    "07/06, 長潮",
    "07/07, 若潮",
    "07/08, 中潮",
    "07/09, 中潮",
    "07/10, 大潮",
    "07/11, 大潮",
    "07/12, 大潮",
    "07/13, 大潮",
    "07/14, 中潮",
    "07/15, 中潮",
    "07/16, 中潮",
    "07/17, 中潮",
    "07/18, 小潮",
    "07/19, 小潮",
    "07/20, 小潮",
    "07/21, 長潮",
    "07/22, 若潮",
    "07/23, 中潮",
    "07/24, 中潮",
    "07/25, 大潮",
    "07/26, 大潮",
    "07/27, 大潮",
    "07/28, 中潮",
    "07/29, 中潮",
    "07/30, 中潮",
    "07/31, 中潮",
    "08/01, 小潮",
    "08/02, 小潮",
    "08/03, 小潮",
    "08/04, 長潮",
    "08/05, 若潮",
    "08/06, 中潮",
    "08/07, 中潮",
    "08/08, 大潮",
    "08/09, 大潮",
    "08/10, 大潮",
    "08/11, 大潮",
    "08/12, 中潮",
    "08/13, 中潮",
    "08/14, 中潮",
    "08/15, 中潮",
    "08/16, 小潮",
    "08/17, 小潮",
    "08/18, 小潮",
    "08/19, 長潮",
    "08/20, 若潮",
    "08/21, 中潮",
    "08/22, 中潮",
    "08/23, 大潮",
    "08/24, 大潮",
    "08/25, 大潮",
    "08/26, 大潮",
    "08/27, 中潮",
    "08/28, 中潮",
    "08/29, 中潮",
    "08/30, 中潮",
    "08/31, 小潮",
    "09/01, 小潮",
    "09/02, 小潮",
    "09/03, 長潮",
    "09/04, 若潮",
    "09/05, 中潮",
    "09/06, 中潮",
    "09/07, 大潮",
    "09/08, 大潮",
    "09/09, 大潮",
    "09/10, 大潮",
    "09/11, 中潮",
    "09/12, 中潮",
    "09/13, 中潮",
    "09/14, 中潮",
    "09/15, 小潮",
    "09/16, 小潮",
    "09/17, 小潮",
    "09/18, 長潮",
    "09/19, 若潮",
    "09/20, 中潮",
    "09/21, 中潮",
    "09/22, 大潮",
    "09/23, 大潮",
    "09/24, 大潮",
    "09/25, 中潮",
    "09/26, 中潮",
    "09/27, 中潮",
    "09/28, 中潮",
    "09/29, 小潮",
    "09/30, 小潮",
    "10/01, 小潮",
    "10/02, 長潮",
    "10/03, 若潮",
    "10/04, 中潮",
    "10/05, 中潮",
    "10/06, 大潮",
    "10/07, 大潮",
    "10/08, 大潮",
    "10/09, 大潮",
    "10/10, 中潮",
    "10/11, 中潮",
    "10/12, 中潮",
    "10/13, 中潮",
    "10/14, 小潮",
    "10/15, 小潮",
    "10/16, 小潮",
    "10/17, 長潮",
    "10/18, 若潮",
    "10/19, 中潮",
    "10/20, 中潮",
    "10/21, 大潮",
    "10/22, 大潮",
    "10/23, 大潮",
    "10/24, 大潮",
    "10/25, 中潮",
    "10/26, 中潮",
    "10/27, 中潮",
    "10/28, 中潮",
    "10/29, 小潮",
    "10/30, 小潮",
    "10/31, 小潮",
    "11/01, 長潮",
    "11/02, 若潮",
    "11/03, 中潮",
    "11/04, 中潮",
    "11/05, 大潮",
    "11/06, 大潮",
    "11/07, 大潮",
    "11/08, 大潮",
    "11/09, 中潮",
    "11/10, 中潮",
    "11/11, 中潮",
    "11/12, 中潮",
    "11/13, 小潮",
    "11/14, 小潮",
    "11/15, 小潮",
    "11/16, 長潮",
    "11/17, 若潮",
    "11/18, 中潮",
    "11/19, 中潮",
    "11/20, 大潮",
    "11/21, 大潮",
    "11/22, 大潮",
    "11/23, 大潮",
    "11/24, 中潮",
    "11/25, 中潮",
    "11/26, 中潮",
    "11/27, 中潮",
    "11/28, 小潮",
    "11/29, 小潮",
    "11/30, 小潮",
    "12/01, 長潮",
    "12/02, 若潮",
    "12/03, 中潮",
    "12/04, 中潮",
    "12/05, 大潮",
    "12/06, 大潮",
    "12/07, 大潮",
    "12/08, 大潮",
    "12/09, 中潮",
    "12/10, 中潮",
    "12/11, 中潮",
    "12/12, 中潮",
    "12/13, 小潮",
    "12/14, 小潮",
    "12/15, 小潮",
    "12/16, 長潮",
    "12/17, 若潮",
    "12/18, 中潮",
    "12/19, 中潮",
    "12/20, 大潮",
    "12/21, 大潮",
    "12/22, 大潮",
    "12/23, 中潮",
    "12/24, 中潮",
    "12/25, 中潮",
    "12/26, 中潮",
    "12/27, 小潮",
    "12/28, 小潮",
    "12/29, 小潮",
    "12/30, 長潮",
    "12/31, 若潮",
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
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2026年

(function () {
  var year = 2026;
  var lines = [
    "01/01,中潮",
    "01/02,中潮",
    "01/03,大潮",
    "01/04,大潮",
    "01/05,大潮",
    "01/06,大潮",
    "01/07,中潮",
    "01/08,中潮",
    "01/09,中潮",
    "01/10,中潮",
    "01/11,小潮",
    "01/12,小潮",
    "01/13,小潮",
    "01/14,長潮",
    "01/15,若潮",
    "01/16,中潮",
    "01/17,中潮",
    "01/18,大潮",
    "01/19,大潮",
    "01/20,大潮",
    "01/21,大潮",
    "01/22,中潮",
    "01/23,中潮",
    "01/24,中潮",
    "01/25,中潮",
    "01/26,小潮",
    "01/27,小潮",
    "01/28,小潮",
    "01/29,長潮",
    "01/30,若潮",
    "01/31,中潮",
    "02/01,中潮",
    "02/02,大潮",
    "02/03,大潮",
    "02/04,大潮",
    "02/05,大潮",
    "02/06,中潮",
    "02/07,中潮",
    "02/08,中潮",
    "02/09,中潮",
    "02/10,小潮",
    "02/11,小潮",
    "02/12,小潮",
    "02/13,長潮",
    "02/14,若潮",
    "02/15,中潮",
    "02/16,中潮",
    "02/17,大潮",
    "02/18,大潮",
    "02/19,大潮",
    "02/20,大潮",
    "02/21,中潮",
    "02/22,中潮",
    "02/23,中潮",
    "02/24,中潮",
    "02/25,小潮",
    "02/26,小潮",
    "02/27,小潮",
    "02/28,長潮",
    "03/01,若潮",
    "03/02,中潮",
    "03/03,中潮",
    "03/04,大潮",
    "03/05,大潮",
    "03/06,大潮",
    "03/07,大潮",
    "03/08,中潮",
    "03/09,中潮",
    "03/10,中潮",
    "03/11,中潮",
    "03/12,小潮",
    "03/13,小潮",
    "03/14,小潮",
    "03/15,長潮",
    "03/16,若潮",
    "03/17,中潮",
    "03/18,中潮",
    "03/19,大潮",
    "03/20,大潮",
    "03/21,大潮",
    "03/22,中潮",
    "03/23,中潮",
    "03/24,中潮",
    "03/25,中潮",
    "03/26,小潮",
    "03/27,小潮",
    "03/28,小潮",
    "03/29,長潮",
    "03/30,若潮",
    "03/31,中潮",
    "04/01,中潮",
    "04/02,大潮",
    "04/03,大潮",
    "04/04,大潮",
    "04/05,大潮",
    "04/06,中潮",
    "04/07,中潮",
    "04/08,中潮",
    "04/09,中潮",
    "04/10,小潮",
    "04/11,小潮",
    "04/12,小潮",
    "04/13,長潮",
    "04/14,若潮",
    "04/15,中潮",
    "04/16,中潮",
    "04/17,大潮",
    "04/18,大潮",
    "04/19,大潮",
    "04/20,大潮",
    "04/21,中潮",
    "04/22,中潮",
    "04/23,中潮",
    "04/24,中潮",
    "04/25,小潮",
    "04/26,小潮",
    "04/27,小潮",
    "04/28,長潮",
    "04/29,若潮",
    "04/30,中潮",
    "05/01,中潮",
    "05/02,大潮",
    "05/03,大潮",
    "05/04,大潮",
    "05/05,大潮",
    "05/06,中潮",
    "05/07,中潮",
    "05/08,中潮",
    "05/09,中潮",
    "05/10,小潮",
    "05/11,小潮",
    "05/12,小潮",
    "05/13,長潮",
    "05/14,若潮",
    "05/15,中潮",
    "05/16,中潮",
    "05/17,大潮",
    "05/18,大潮",
    "05/19,大潮",
    "05/20,中潮",
    "05/21,中潮",
    "05/22,中潮",
    "05/23,中潮",
    "05/24,小潮",
    "05/25,小潮",
    "05/26,小潮",
    "05/27,長潮",
    "05/28,若潮",
    "05/29,中潮",
    "05/30,中潮",
    "05/31,大潮",
    "06/01,大潮",
    "06/02,大潮",
    "06/03,大潮",
    "06/04,中潮",
    "06/05,中潮",
    "06/06,中潮",
    "06/07,中潮",
    "06/08,小潮",
    "06/09,小潮",
    "06/10,小潮",
    "06/11,長潮",
    "06/12,若潮",
    "06/13,中潮",
    "06/14,中潮",
    "06/15,大潮",
    "06/16,大潮",
    "06/17,大潮",
    "06/18,中潮",
    "06/19,中潮",
    "06/20,中潮",
    "06/21,中潮",
    "06/22,小潮",
    "06/23,小潮",
    "06/24,小潮",
    "06/25,長潮",
    "06/26,若潮",
    "06/27,中潮",
    "06/28,中潮",
    "06/29,大潮",
    "06/30,大潮",
    "07/01,大潮",
    "07/02,大潮",
    "07/03,中潮",
    "07/04,中潮",
    "07/05,中潮",
    "07/06,中潮",
    "07/07,小潮",
    "07/08,小潮",
    "07/09,小潮",
    "07/10,長潮",
    "07/11,若潮",
    "07/12,中潮",
    "07/13,中潮",
    "07/14,大潮",
    "07/15,大潮",
    "07/16,大潮",
    "07/17,大潮",
    "07/18,中潮",
    "07/19,中潮",
    "07/20,中潮",
    "07/21,中潮",
    "07/22,小潮",
    "07/23,小潮",
    "07/24,小潮",
    "07/25,長潮",
    "07/26,若潮",
    "07/27,中潮",
    "07/28,中潮",
    "07/29,大潮",
    "07/30,大潮",
    "07/31,大潮",
    "08/01,大潮",
    "08/02,中潮",
    "08/03,中潮",
    "08/04,中潮",
    "08/05,中潮",
    "08/06,小潮",
    "08/07,小潮",
    "08/08,小潮",
    "08/09,長潮",
    "08/10,若潮",
    "08/11,中潮",
    "08/12,中潮",
    "08/13,大潮",
    "08/14,大潮",
    "08/15,大潮",
    "08/16,中潮",
    "08/17,中潮",
    "08/18,中潮",
    "08/19,中潮",
    "08/20,小潮",
    "08/21,小潮",
    "08/22,小潮",
    "08/23,長潮",
    "08/24,若潮",
    "08/25,中潮",
    "08/26,中潮",
    "08/27,大潮",
    "08/28,大潮",
    "08/29,大潮",
    "08/30,大潮",
    "08/31,中潮",
    "09/01,中潮",
    "09/02,中潮",
    "09/03,中潮",
    "09/04,小潮",
    "09/05,小潮",
    "09/06,小潮",
    "09/07,長潮",
    "09/08,若潮",
    "09/09,中潮",
    "09/10,中潮",
    "09/11,大潮",
    "09/12,大潮",
    "09/13,大潮",
    "09/14,大潮",
    "09/15,中潮",
    "09/16,中潮",
    "09/17,中潮",
    "09/18,中潮",
    "09/19,小潮",
    "09/20,小潮",
    "09/21,小潮",
    "09/22,長潮",
    "09/23,若潮",
    "09/24,中潮",
    "09/25,中潮",
    "09/26,大潮",
    "09/27,大潮",
    "09/28,大潮",
    "09/29,大潮",
    "09/30,中潮",
    "10/01,中潮",
    "10/02,中潮",
    "10/03,中潮",
    "10/04,小潮",
    "10/05,小潮",
    "10/06,小潮",
    "10/07,長潮",
    "10/08,若潮",
    "10/09,中潮",
    "10/10,中潮",
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
    "11/01,中潮",
    "11/02,小潮",
    "11/03,小潮",
    "11/04,小潮",
    "11/05,長潮",
    "11/06,若潮",
    "11/07,中潮",
    "11/08,中潮",
    "11/09,大潮",
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
    "11/27,大潮",
    "11/28,中潮",
    "11/29,中潮",
    "11/30,中潮",
    "12/01,中潮",
    "12/02,小潮",
    "12/03,小潮",
    "12/04,小潮",
    "12/05,長潮",
    "12/06,若潮",
    "12/07,中潮",
    "12/08,中潮",
    "12/09,大潮",
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
    "12/31,小潮"
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
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2027年

(function () {
  var year = 2027;
  var lines = [
    "01/01,小潮",
    "01/02,小潮",
    "01/03,長潮",
    "01/04,若潮",
    "01/05,中潮",
    "01/06,中潮",
    "01/07,大潮",
    "01/08,大潮",
    "01/09,大潮",
    "01/10,大潮",
    "01/11,中潮",
    "01/12,中潮",
    "01/13,中潮",
    "01/14,中潮",
    "01/15,小潮",
    "01/16,小潮",
    "01/17,小潮",
    "01/18,長潮",
    "01/19,若潮",
    "01/20,中潮",
    "01/21,中潮",
    "01/22,大潮",
    "01/23,大潮",
    "01/24,大潮",
    "01/25,大潮",
    "01/26,中潮",
    "01/27,中潮",
    "01/28,中潮",
    "01/29,中潮",
    "01/30,小潮",
    "01/31,小潮",
    "02/01,小潮",
    "02/02,長潮",
    "02/03,若潮",
    "02/04,中潮",
    "02/05,中潮",
    "02/06,大潮",
    "02/07,大潮",
    "02/08,大潮",
    "02/09,大潮",
    "02/10,中潮",
    "02/11,中潮",
    "02/12,中潮",
    "02/13,中潮",
    "02/14,小潮",
    "02/15,小潮",
    "02/16,小潮",
    "02/17,長潮",
    "02/18,若潮",
    "02/19,中潮",
    "02/20,中潮",
    "02/21,大潮",
    "02/22,大潮",
    "02/23,大潮",
    "02/24,大潮",
    "02/25,中潮",
    "02/26,中潮",
    "02/27,中潮",
    "02/28,中潮",
    "03/01,小潮",
    "03/02,小潮",
    "03/03,小潮",
    "03/04,長潮",
    "03/05,若潮",
    "03/06,中潮",
    "03/07,中潮",
    "03/08,大潮",
    "03/09,大潮",
    "03/10,大潮",
    "03/11,大潮",
    "03/12,中潮",
    "03/13,中潮",
    "03/14,中潮",
    "03/15,中潮",
    "03/16,小潮",
    "03/17,小潮",
    "03/18,小潮",
    "03/19,長潮",
    "03/20,若潮",
    "03/21,中潮",
    "03/22,中潮",
    "03/23,大潮",
    "03/24,大潮",
    "03/25,大潮",
    "03/26,大潮",
    "03/27,中潮",
    "03/28,中潮",
    "03/29,中潮",
    "03/30,中潮",
    "03/31,小潮",
    "04/01,小潮",
    "04/02,小潮",
    "04/03,長潮",
    "04/04,若潮",
    "04/05,中潮",
    "04/06,中潮",
    "04/07,大潮",
    "04/08,大潮",
    "04/09,大潮",
    "04/10,中潮",
    "04/11,中潮",
    "04/12,中潮",
    "04/13,中潮",
    "04/14,小潮",
    "04/15,小潮",
    "04/16,小潮",
    "04/17,長潮",
    "04/18,若潮",
    "04/19,中潮",
    "04/20,中潮",
    "04/21,大潮",
    "04/22,大潮",
    "04/23,大潮",
    "04/24,大潮",
    "04/25,中潮",
    "04/26,中潮",
    "04/27,中潮",
    "04/28,中潮",
    "04/29,小潮",
    "04/30,小潮",
    "05/01,小潮",
    "05/02,長潮",
    "05/03,若潮",
    "05/04,中潮",
    "05/05,中潮",
    "05/06,大潮",
    "05/07,大潮",
    "05/08,大潮",
    "05/09,大潮",
    "05/10,中潮",
    "05/11,中潮",
    "05/12,中潮",
    "05/13,中潮",
    "05/14,小潮",
    "05/15,小潮",
    "05/16,小潮",
    "05/17,長潮",
    "05/18,若潮",
    "05/19,中潮",
    "05/20,中潮",
    "05/21,大潮",
    "05/22,大潮",
    "05/23,大潮",
    "05/24,大潮",
    "05/25,中潮",
    "05/26,中潮",
    "05/27,中潮",
    "05/28,中潮",
    "05/29,小潮",
    "05/30,小潮",
    "05/31,小潮",
    "06/01,長潮",
    "06/02,若潮",
    "06/03,中潮",
    "06/04,中潮",
    "06/05,大潮",
    "06/06,大潮",
    "06/07,大潮",
    "06/08,中潮",
    "06/09,中潮",
    "06/10,中潮",
    "06/11,中潮",
    "06/12,小潮",
    "06/13,小潮",
    "06/14,小潮",
    "06/15,長潮",
    "06/16,若潮",
    "06/17,中潮",
    "06/18,中潮",
    "06/19,大潮",
    "06/20,大潮",
    "06/21,大潮",
    "06/22,大潮",
    "06/23,中潮",
    "06/24,中潮",
    "06/25,中潮",
    "06/26,中潮",
    "06/27,小潮",
    "06/28,小潮",
    "06/29,小潮",
    "06/30,長潮",
    "07/01,若潮",
    "07/02,中潮",
    "07/03,中潮",
    "07/04,大潮",
    "07/05,大潮",
    "07/06,大潮",
    "07/07,大潮",
    "07/08,中潮",
    "07/09,中潮",
    "07/10,中潮",
    "07/11,中潮",
    "07/12,小潮",
    "07/13,小潮",
    "07/14,小潮",
    "07/15,長潮",
    "07/16,若潮",
    "07/17,中潮",
    "07/18,中潮",
    "07/19,大潮",
    "07/20,大潮",
    "07/21,大潮",
    "07/22,大潮",
    "07/23,中潮",
    "07/24,中潮",
    "07/25,中潮",
    "07/26,中潮",
    "07/27,小潮",
    "07/28,小潮",
    "07/29,小潮",
    "07/30,長潮",
    "07/31,若潮",
    "08/01,中潮",
    "08/02,中潮",
    "08/03,大潮",
    "08/04,大潮",
    "08/05,大潮",
    "08/06,中潮",
    "08/07,中潮",
    "08/08,中潮",
    "08/09,中潮",
    "08/10,小潮",
    "08/11,小潮",
    "08/12,小潮",
    "08/13,長潮",
    "08/14,若潮",
    "08/15,中潮",
    "08/16,中潮",
    "08/17,大潮",
    "08/18,大潮",
    "08/19,大潮",
    "08/20,大潮",
    "08/21,中潮",
    "08/22,中潮",
    "08/23,中潮",
    "08/24,中潮",
    "08/25,小潮",
    "08/26,小潮",
    "08/27,小潮",
    "08/28,長潮",
    "08/29,若潮",
    "08/30,中潮",
    "08/31,中潮",
    "09/01,大潮",
    "09/02,大潮",
    "09/03,大潮",
    "09/04,中潮",
    "09/05,中潮",
    "09/06,中潮",
    "09/07,中潮",
    "09/08,小潮",
    "09/09,小潮",
    "09/10,小潮",
    "09/11,長潮",
    "09/12,若潮",
    "09/13,中潮",
    "09/14,中潮",
    "09/15,大潮",
    "09/16,大潮",
    "09/17,大潮",
    "09/18,大潮",
    "09/19,中潮",
    "09/20,中潮",
    "09/21,中潮",
    "09/22,中潮",
    "09/23,小潮",
    "09/24,小潮",
    "09/25,小潮",
    "09/26,長潮",
    "09/27,若潮",
    "09/28,中潮",
    "09/29,中潮",
    "09/30,大潮",
    "10/01,大潮",
    "10/02,大潮",
    "10/03,中潮",
    "10/04,中潮",
    "10/05,中潮",
    "10/06,中潮",
    "10/07,小潮",
    "10/08,小潮",
    "10/09,小潮",
    "10/10,長潮",
    "10/11,若潮",
    "10/12,中潮",
    "10/13,中潮",
    "10/14,大潮",
    "10/15,大潮",
    "10/16,大潮",
    "10/17,大潮",
    "10/18,中潮",
    "10/19,中潮",
    "10/20,中潮",
    "10/21,中潮",
    "10/22,小潮",
    "10/23,小潮",
    "10/24,小潮",
    "10/25,長潮",
    "10/26,若潮",
    "10/27,中潮",
    "10/28,中潮",
    "10/29,大潮",
    "10/30,大潮",
    "10/31,大潮",
    "11/01,大潮",
    "11/02,中潮",
    "11/03,中潮",
    "11/04,中潮",
    "11/05,中潮",
    "11/06,小潮",
    "11/07,小潮",
    "11/08,小潮",
    "11/09,長潮",
    "11/10,若潮",
    "11/11,中潮",
    "11/12,中潮",
    "11/13,大潮",
    "11/14,大潮",
    "11/15,大潮",
    "11/16,大潮",
    "11/17,中潮",
    "11/18,中潮",
    "11/19,中潮",
    "11/20,中潮",
    "11/21,小潮",
    "11/22,小潮",
    "11/23,小潮",
    "11/24,長潮",
    "11/25,若潮",
    "11/26,中潮",
    "11/27,中潮",
    "11/28,大潮",
    "11/29,大潮",
    "11/30,大潮",
    "12/01,大潮",
    "12/02,中潮",
    "12/03,中潮",
    "12/04,中潮",
    "12/05,中潮",
    "12/06,小潮",
    "12/07,小潮",
    "12/08,小潮",
    "12/09,長潮",
    "12/10,若潮",
    "12/11,中潮",
    "12/12,中潮",
    "12/13,大潮",
    "12/14,大潮",
    "12/15,大潮",
    "12/16,大潮",
    "12/17,中潮",
    "12/18,中潮",
    "12/19,中潮",
    "12/20,中潮",
    "12/21,小潮",
    "12/22,小潮",
    "12/23,小潮",
    "12/24,長潮",
    "12/25,若潮",
    "12/26,中潮",
    "12/27,中潮",
    "12/28,大潮",
    "12/29,大潮",
    "12/30,大潮",
    "12/31,中潮"
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
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2028年

(function () {
  var year = 2028;
  var lines = [
    "01/01,中潮",
    "01/02,中潮",
    "01/03,中潮",
    "01/04,小潮",
    "01/05,小潮",
    "01/06,小潮",
    "01/07,長潮",
    "01/08,若潮",
    "01/09,中潮",
    "01/10,中潮",
    "01/11,大潮",
    "01/12,大潮",
    "01/13,大潮",
    "01/14,大潮",
    "01/15,中潮",
    "01/16,中潮",
    "01/17,中潮",
    "01/18,中潮",
    "01/19,小潮",
    "01/20,小潮",
    "01/21,小潮",
    "01/22,長潮",
    "01/23,若潮",
    "01/24,中潮",
    "01/25,中潮",
    "01/26,大潮",
    "01/27,大潮",
    "01/28,大潮",
    "01/29,大潮",
    "01/30,中潮",
    "01/31,中潮",
    "02/01,中潮",
    "02/02,中潮",
    "02/03,小潮",
    "02/04,小潮",
    "02/05,小潮",
    "02/06,長潮",
    "02/07,若潮",
    "02/08,中潮",
    "02/09,中潮",
    "02/10,大潮",
    "02/11,大潮",
    "02/12,大潮",
    "02/13,大潮",
    "02/14,中潮",
    "02/15,中潮",
    "02/16,中潮",
    "02/17,中潮",
    "02/18,小潮",
    "02/19,小潮",
    "02/20,小潮",
    "02/21,長潮",
    "02/22,若潮",
    "02/23,中潮",
    "02/24,中潮",
    "02/25,大潮",
    "02/26,大潮",
    "02/27,大潮",
    "02/28,大潮",
    "02/29,中潮",
    "03/01,中潮",
    "03/02,中潮",
    "03/03,中潮",
    "03/04,小潮",
    "03/05,小潮",
    "03/06,小潮",
    "03/07,長潮",
    "03/08,若潮",
    "03/09,中潮",
    "03/10,中潮",
    "03/11,大潮",
    "03/12,大潮",
    "03/13,大潮",
    "03/14,大潮",
    "03/15,中潮",
    "03/16,中潮",
    "03/17,中潮",
    "03/18,中潮",
    "03/19,小潮",
    "03/20,小潮",
    "03/21,小潮",
    "03/22,長潮",
    "03/23,若潮",
    "03/24,中潮",
    "03/25,中潮",
    "03/26,大潮",
    "03/27,大潮",
    "03/28,大潮",
    "03/29,大潮",
    "03/30,中潮",
    "03/31,中潮",
    "04/01,中潮",
    "04/02,中潮",
    "04/03,小潮",
    "04/04,小潮",
    "04/05,小潮",
    "04/06,長潮",
    "04/07,若潮",
    "04/08,中潮",
    "04/09,中潮",
    "04/10,大潮",
    "04/11,大潮",
    "04/12,大潮",
    "04/13,大潮",
    "04/14,中潮",
    "04/15,中潮",
    "04/16,中潮",
    "04/17,中潮",
    "04/18,小潮",
    "04/19,小潮",
    "04/20,小潮",
    "04/21,長潮",
    "04/22,若潮",
    "04/23,中潮",
    "04/24,中潮",
    "04/25,大潮",
    "04/26,大潮",
    "04/27,大潮",
    "04/28,中潮",
    "04/29,中潮",
    "04/30,中潮",
    "05/01,中潮",
    "05/02,小潮",
    "05/03,小潮",
    "05/04,小潮",
    "05/05,長潮",
    "05/06,若潮",
    "05/07,中潮",
    "05/08,中潮",
    "05/09,大潮",
    "05/10,大潮",
    "05/11,大潮",
    "05/12,大潮",
    "05/13,中潮",
    "05/14,中潮",
    "05/15,中潮",
    "05/16,中潮",
    "05/17,小潮",
    "05/18,小潮",
    "05/19,小潮",
    "05/20,長潮",
    "05/21,若潮",
    "05/22,中潮",
    "05/23,中潮",
    "05/24,大潮",
    "05/25,大潮",
    "05/26,大潮",
    "05/27,大潮",
    "05/28,中潮",
    "05/29,中潮",
    "05/30,中潮",
    "05/31,中潮",
    "06/01,小潮",
    "06/02,小潮",
    "06/03,小潮",
    "06/04,長潮",
    "06/05,若潮",
    "06/06,中潮",
    "06/07,中潮",
    "06/08,大潮",
    "06/09,大潮",
    "06/10,大潮",
    "06/11,大潮",
    "06/12,中潮",
    "06/13,中潮",
    "06/14,中潮",
    "06/15,中潮",
    "06/16,小潮",
    "06/17,小潮",
    "06/18,小潮",
    "06/19,長潮",
    "06/20,若潮",
    "06/21,中潮",
    "06/22,中潮",
    "06/23,大潮",
    "06/24,大潮",
    "06/25,大潮",
    "06/26,中潮",
    "06/27,中潮",
    "06/28,中潮",
    "06/29,中潮",
    "06/30,小潮",
    "07/01,小潮",
    "07/02,小潮",
    "07/03,長潮",
    "07/04,若潮",
    "07/05,中潮",
    "07/06,中潮",
    "07/07,大潮",
    "07/08,大潮",
    "07/09,大潮",
    "07/10,大潮",
    "07/11,中潮",
    "07/12,中潮",
    "07/13,中潮",
    "07/14,中潮",
    "07/15,小潮",
    "07/16,小潮",
    "07/17,小潮",
    "07/18,長潮",
    "07/19,若潮",
    "07/20,中潮",
    "07/21,中潮",
    "07/22,大潮",
    "07/23,大潮",
    "07/24,大潮",
    "07/25,大潮",
    "07/26,中潮",
    "07/27,中潮",
    "07/28,中潮",
    "07/29,中潮",
    "07/30,小潮",
    "07/31,小潮",
    "08/01,小潮",
    "08/02,長潮",
    "08/03,若潮",
    "08/04,中潮",
    "08/05,中潮",
    "08/06,大潮",
    "08/07,大潮",
    "08/08,大潮",
    "08/09,大潮",
    "08/10,中潮",
    "08/11,中潮",
    "08/12,中潮",
    "08/13,中潮",
    "08/14,小潮",
    "08/15,小潮",
    "08/16,小潮",
    "08/17,長潮",
    "08/18,若潮",
    "08/19,中潮",
    "08/20,中潮",
    "08/21,大潮",
    "08/22,大潮",
    "08/23,大潮",
    "08/24,中潮",
    "08/25,中潮",
    "08/26,中潮",
    "08/27,中潮",
    "08/28,小潮",
    "08/29,小潮",
    "08/30,小潮",
    "08/31,長潮",
    "09/01,若潮",
    "09/02,中潮",
    "09/03,中潮",
    "09/04,大潮",
    "09/05,大潮",
    "09/06,大潮",
    "09/07,大潮",
    "09/08,中潮",
    "09/09,中潮",
    "09/10,中潮",
    "09/11,中潮",
    "09/12,小潮",
    "09/13,小潮",
    "09/14,小潮",
    "09/15,長潮",
    "09/16,若潮",
    "09/17,中潮",
    "09/18,中潮",
    "09/19,大潮",
    "09/20,大潮",
    "09/21,大潮",
    "09/22,中潮",
    "09/23,中潮",
    "09/24,中潮",
    "09/25,中潮",
    "09/26,小潮",
    "09/27,小潮",
    "09/28,小潮",
    "09/29,長潮",
    "09/30,若潮",
    "10/01,中潮",
    "10/02,中潮",
    "10/03,大潮",
    "10/04,大潮",
    "10/05,大潮",
    "10/06,大潮",
    "10/07,中潮",
    "10/08,中潮",
    "10/09,中潮",
    "10/10,中潮",
    "10/11,小潮",
    "10/12,小潮",
    "10/13,小潮",
    "10/14,長潮",
    "10/15,若潮",
    "10/16,中潮",
    "10/17,中潮",
    "10/18,大潮",
    "10/19,大潮",
    "10/20,大潮",
    "10/21,中潮",
    "10/22,中潮",
    "10/23,中潮",
    "10/24,中潮",
    "10/25,小潮",
    "10/26,小潮",
    "10/27,小潮",
    "10/28,長潮",
    "10/29,若潮",
    "10/30,中潮",
    "10/31,中潮",
    "11/01,大潮",
    "11/02,大潮",
    "11/03,大潮",
    "11/04,大潮",
    "11/05,中潮",
    "11/06,中潮",
    "11/07,中潮",
    "11/08,中潮",
    "11/09,小潮",
    "11/10,小潮",
    "11/11,小潮",
    "11/12,長潮",
    "11/13,若潮",
    "11/14,中潮",
    "11/15,中潮",
    "11/16,大潮",
    "11/17,大潮",
    "11/18,大潮",
    "11/19,大潮",
    "11/20,中潮",
    "11/21,中潮",
    "11/22,中潮",
    "11/23,中潮",
    "11/24,小潮",
    "11/25,小潮",
    "11/26,小潮",
    "11/27,長潮",
    "11/28,若潮",
    "11/29,中潮",
    "11/30,中潮",
    "12/01,大潮",
    "12/02,大潮",
    "12/03,大潮",
    "12/04,大潮",
    "12/05,中潮",
    "12/06,中潮",
    "12/07,中潮",
    "12/08,中潮",
    "12/09,小潮",
    "12/10,小潮",
    "12/11,小潮",
    "12/12,長潮",
    "12/13,若潮",
    "12/14,中潮",
    "12/15,中潮",
    "12/16,大潮",
    "12/17,大潮",
    "12/18,大潮",
    "12/19,中潮",
    "12/20,中潮",
    "12/21,中潮",
    "12/22,中潮",
    "12/23,小潮",
    "12/24,小潮",
    "12/25,小潮",
    "12/26,長潮",
    "12/27,若潮",
    "12/28,中潮",
    "12/29,中潮",
    "12/30,大潮",
    "12/31,大潮"
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
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2029年

(function () {
  var year = 2029;
  var lines = [
    "01/01,大潮",
    "01/02,大潮",
    "01/03,中潮",
    "01/04,中潮",
    "01/05,中潮",
    "01/06,中潮",
    "01/07,小潮",
    "01/08,小潮",
    "01/09,小潮",
    "01/10,長潮",
    "01/11,若潮",
    "01/12,中潮",
    "01/13,中潮",
    "01/14,大潮",
    "01/15,大潮",
    "01/16,大潮",
    "01/17,大潮",
    "01/18,中潮",
    "01/19,中潮",
    "01/20,中潮",
    "01/21,中潮",
    "01/22,小潮",
    "01/23,小潮",
    "01/24,小潮",
    "01/25,長潮",
    "01/26,若潮",
    "01/27,中潮",
    "01/28,中潮",
    "01/29,大潮",
    "01/30,大潮",
    "01/31,大潮",
    "02/01,大潮",
    "02/02,中潮",
    "02/03,中潮",
    "02/04,中潮",
    "02/05,中潮",
    "02/06,小潮",
    "02/07,小潮",
    "02/08,小潮",
    "02/09,長潮",
    "02/10,若潮",
    "02/11,中潮",
    "02/12,中潮",
    "02/13,大潮",
    "02/14,大潮",
    "02/15,大潮",
    "02/16,大潮",
    "02/17,中潮",
    "02/18,中潮",
    "02/19,中潮",
    "02/20,中潮",
    "02/21,小潮",
    "02/22,小潮",
    "02/23,小潮",
    "02/24,長潮",
    "02/25,若潮",
    "02/26,中潮",
    "02/27,中潮",
    "02/28,大潮",
    "03/01,大潮",
    "03/02,大潮",
    "03/03,大潮",
    "03/04,中潮",
    "03/05,中潮",
    "03/06,中潮",
    "03/07,中潮",
    "03/08,小潮",
    "03/09,小潮",
    "03/10,小潮",
    "03/11,長潮",
    "03/12,若潮",
    "03/13,中潮",
    "03/14,中潮",
    "03/15,大潮",
    "03/16,大潮",
    "03/17,大潮",
    "03/18,大潮",
    "03/19,中潮",
    "03/20,中潮",
    "03/21,中潮",
    "03/22,中潮",
    "03/23,小潮",
    "03/24,小潮",
    "03/25,小潮",
    "03/26,長潮",
    "03/27,若潮",
    "03/28,中潮",
    "03/29,中潮",
    "03/30,大潮",
    "03/31,大潮",
    "04/01,大潮",
    "04/02,大潮",
    "04/03,中潮",
    "04/04,中潮",
    "04/05,中潮",
    "04/06,中潮",
    "04/07,小潮",
    "04/08,小潮",
    "04/09,小潮",
    "04/10,長潮",
    "04/11,若潮",
    "04/12,中潮",
    "04/13,中潮",
    "04/14,大潮",
    "04/15,大潮",
    "04/16,大潮",
    "04/17,中潮",
    "04/18,中潮",
    "04/19,中潮",
    "04/20,中潮",
    "04/21,小潮",
    "04/22,小潮",
    "04/23,小潮",
    "04/24,長潮",
    "04/25,若潮",
    "04/26,中潮",
    "04/27,中潮",
    "04/28,大潮",
    "04/29,大潮",
    "04/30,大潮",
    "05/01,大潮",
    "05/02,中潮",
    "05/03,中潮",
    "05/04,中潮",
    "05/05,中潮",
    "05/06,小潮",
    "05/07,小潮",
    "05/08,小潮",
    "05/09,長潮",
    "05/10,若潮",
    "05/11,中潮",
    "05/12,中潮",
    "05/13,大潮",
    "05/14,大潮",
    "05/15,大潮",
    "05/16,大潮",
    "05/17,中潮",
    "05/18,中潮",
    "05/19,中潮",
    "05/20,中潮",
    "05/21,小潮",
    "05/22,小潮",
    "05/23,小潮",
    "05/24,長潮",
    "05/25,若潮",
    "05/26,中潮",
    "05/27,中潮",
    "05/28,大潮",
    "05/29,大潮",
    "05/30,大潮",
    "05/31,大潮",
    "06/01,中潮",
    "06/02,中潮",
    "06/03,中潮",
    "06/04,中潮",
    "06/05,小潮",
    "06/06,小潮",
    "06/07,小潮",
    "06/08,長潮",
    "06/09,若潮",
    "06/10,中潮",
    "06/11,中潮",
    "06/12,大潮",
    "06/13,大潮",
    "06/14,大潮",
    "06/15,大潮",
    "06/16,中潮",
    "06/17,中潮",
    "06/18,中潮",
    "06/19,中潮",
    "06/20,小潮",
    "06/21,小潮",
    "06/22,小潮",
    "06/23,長潮",
    "06/24,若潮",
    "06/25,中潮",
    "06/26,中潮",
    "06/27,大潮",
    "06/28,大潮",
    "06/29,大潮",
    "06/30,大潮",
    "07/01,中潮",
    "07/02,中潮",
    "07/03,中潮",
    "07/04,中潮",
    "07/05,小潮",
    "07/06,小潮",
    "07/07,小潮",
    "07/08,長潮",
    "07/09,若潮",
    "07/10,中潮",
    "07/11,中潮",
    "07/12,大潮",
    "07/13,大潮",
    "07/14,大潮",
    "07/15,中潮",
    "07/16,中潮",
    "07/17,中潮",
    "07/18,中潮",
    "07/19,小潮",
    "07/20,小潮",
    "07/21,小潮",
    "07/22,長潮",
    "07/23,若潮",
    "07/24,中潮",
    "07/25,中潮",
    "07/26,大潮",
    "07/27,大潮",
    "07/28,大潮",
    "07/29,大潮",
    "07/30,中潮",
    "07/31,中潮",
    "08/01,中潮",
    "08/02,中潮",
    "08/03,小潮",
    "08/04,小潮",
    "08/05,小潮",
    "08/06,長潮",
    "08/07,若潮",
    "08/08,中潮",
    "08/09,中潮",
    "08/10,大潮",
    "08/11,大潮",
    "08/12,大潮",
    "08/13,中潮",
    "08/14,中潮",
    "08/15,中潮",
    "08/16,中潮",
    "08/17,小潮",
    "08/18,小潮",
    "08/19,小潮",
    "08/20,長潮",
    "08/21,若潮",
    "08/22,中潮",
    "08/23,中潮",
    "08/24,大潮",
    "08/25,大潮",
    "08/26,大潮",
    "08/27,大潮",
    "08/28,中潮",
    "08/29,中潮",
    "08/30,中潮",
    "08/31,中潮",
    "09/01,小潮",
    "09/02,小潮",
    "09/03,小潮",
    "09/04,長潮",
    "09/05,若潮",
    "09/06,中潮",
    "09/07,中潮",
    "09/08,大潮",
    "09/09,大潮",
    "09/10,大潮",
    "09/11,大潮",
    "09/12,中潮",
    "09/13,中潮",
    "09/14,中潮",
    "09/15,中潮",
    "09/16,小潮",
    "09/17,小潮",
    "09/18,小潮",
    "09/19,長潮",
    "09/20,若潮",
    "09/21,中潮",
    "09/22,中潮",
    "09/23,大潮",
    "09/24,大潮",
    "09/25,大潮",
    "09/26,大潮",
    "09/27,中潮",
    "09/28,中潮",
    "09/29,中潮",
    "09/30,中潮",
    "10/01,小潮",
    "10/02,小潮",
    "10/03,小潮",
    "10/04,長潮",
    "10/05,若潮",
    "10/06,中潮",
    "10/07,中潮",
    "10/08,大潮",
    "10/09,大潮",
    "10/10,大潮",
    "10/11,中潮",
    "10/12,中潮",
    "10/13,中潮",
    "10/14,中潮",
    "10/15,小潮",
    "10/16,小潮",
    "10/17,小潮",
    "10/18,長潮",
    "10/19,若潮",
    "10/20,中潮",
    "10/21,中潮",
    "10/22,大潮",
    "10/23,大潮",
    "10/24,大潮",
    "10/25,大潮",
    "10/26,中潮",
    "10/27,中潮",
    "10/28,中潮",
    "10/29,中潮",
    "10/30,小潮",
    "10/31,小潮",
    "11/01,小潮",
    "11/02,長潮",
    "11/03,若潮",
    "11/04,中潮",
    "11/05,中潮",
    "11/06,大潮",
    "11/07,大潮",
    "11/08,大潮",
    "11/09,大潮",
    "11/10,中潮",
    "11/11,中潮",
    "11/12,中潮",
    "11/13,中潮",
    "11/14,小潮",
    "11/15,小潮",
    "11/16,小潮",
    "11/17,長潮",
    "11/18,若潮",
    "11/19,中潮",
    "11/20,中潮",
    "11/21,大潮",
    "11/22,大潮",
    "11/23,大潮",
    "11/24,大潮",
    "11/25,中潮",
    "11/26,中潮",
    "11/27,中潮",
    "11/28,中潮",
    "11/29,小潮",
    "11/30,小潮",
    "12/01,小潮",
    "12/02,長潮",
    "12/03,若潮",
    "12/04,中潮",
    "12/05,中潮",
    "12/06,大潮",
    "12/07,大潮",
    "12/08,大潮",
    "12/09,中潮",
    "12/10,中潮",
    "12/11,中潮",
    "12/12,中潮",
    "12/13,小潮",
    "12/14,小潮",
    "12/15,小潮",
    "12/16,長潮",
    "12/17,若潮",
    "12/18,中潮",
    "12/19,中潮",
    "12/20,大潮",
    "12/21,大潮",
    "12/22,大潮",
    "12/23,大潮",
    "12/24,中潮",
    "12/25,中潮",
    "12/26,中潮",
    "12/27,中潮",
    "12/28,小潮",
    "12/29,小潮",
    "12/30,小潮",
    "12/31,長潮"
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

// 2025年

(function () {
  var lines = [
    "2025/01/01,6:50,16:39",
    "2025/01/02,6:51,16:40",
    "2025/01/03,6:51,16:41",
    "2025/01/04,6:51,16:42",
    "2025/01/05,6:51,16:43",
    "2025/01/06,6:51,16:44",
    "2025/01/07,6:51,16:44",
    "2025/01/08,6:51,16:45",
    "2025/01/09,6:51,16:46",
    "2025/01/10,6:51,16:47",
    "2025/01/11,6:51,16:48",
    "2025/01/12,6:51,16:49",
    "2025/01/13,6:50,16:50",
    "2025/01/14,6:50,16:51",
    "2025/01/15,6:50,16:52",
    "2025/01/16,6:50,16:53",
    "2025/01/17,6:49,16:54",
    "2025/01/18,6:49,16:55",
    "2025/01/19,6:49,16:56",
    "2025/01/20,6:48,16:57",
    "2025/01/21,6:48,16:58",
    "2025/01/22,6:47,16:59",
    "2025/01/23,6:47,17:00",
    "2025/01/24,6:46,17:01",
    "2025/01/25,6:46,17:02",
    "2025/01/26,6:45,17:03",
    "2025/01/27,6:45,17:04",
    "2025/01/28,6:44,17:05",
    "2025/01/29,6:43,17:06",
    "2025/01/30,6:43,17:07",
    "2025/01/31,6:42,17:08",
    "2025/02/01,6:41,17:09",
    "2025/02/02,6:40,17:10",
    "2025/02/03,6:40,17:11",
    "2025/02/04,6:39,17:12",
    "2025/02/05,6:38,17:13",
    "2025/02/06,6:37,17:14",
    "2025/02/07,6:36,17:15",
    "2025/02/08,6:35,17:16",
    "2025/02/09,6:34,17:17",
    "2025/02/10,6:33,17:18",
    "2025/02/11,6:32,17:19",
    "2025/02/12,6:31,17:20",
    "2025/02/13,6:30,17:21",
    "2025/02/14,6:29,17:22",
    "2025/02/15,6:28,17:23",
    "2025/02/16,6:27,17:24",
    "2025/02/17,6:26,17:25",
    "2025/02/18,6:25,17:26",
    "2025/02/19,6:24,17:27",
    "2025/02/20,6:22,17:28",
    "2025/02/21,6:21,17:29",
    "2025/02/22,6:20,17:30",
    "2025/02/23,6:19,17:31",
    "2025/02/24,6:18,17:32",
    "2025/02/25,6:16,17:33",
    "2025/02/26,6:15,17:34",
    "2025/02/27,6:14,17:35",
    "2025/02/28,6:13,17:36",
    "2025/03/01,6:11,17:37",
    "2025/03/02,6:10,17:37",
    "2025/03/03,6:09,17:38",
    "2025/03/04,6:07,17:39",
    "2025/03/05,6:06,17:40",
    "2025/03/06,6:05,17:41",
    "2025/03/07,6:03,17:42",
    "2025/03/08,6:02,17:43",
    "2025/03/09,6:01,17:44",
    "2025/03/10,5:59,17:45",
    "2025/03/11,5:58,17:45",
    "2025/03/12,5:57,17:46",
    "2025/03/13,5:55,17:47",
    "2025/03/14,5:54,17:48",
    "2025/03/15,5:52,17:49",
    "2025/03/16,5:51,17:50",
    "2025/03/17,5:50,17:50",
    "2025/03/18,5:48,17:51",
    "2025/03/19,5:47,17:52",
    "2025/03/20,5:45,17:53",
    "2025/03/21,5:44,17:54",
    "2025/03/22,5:43,17:55",
    "2025/03/23,5:41,17:55",
    "2025/03/24,5:40,17:56",
    "2025/03/25,5:38,17:57",
    "2025/03/26,5:37,17:58",
    "2025/03/27,5:35,17:59",
    "2025/03/28,5:34,18:00",
    "2025/03/29,5:33,18:00",
    "2025/03/30,5:31,18:01",
    "2025/03/31,5:30,18:02",
    "2025/04/01,5:28,18:03",
    "2025/04/02,5:27,18:04",
    "2025/04/03,5:26,18:04",
    "2025/04/04,5:24,18:05",
    "2025/04/05,5:23,18:06",
    "2025/04/06,5:21,18:07",
    "2025/04/07,5:20,18:08",
    "2025/04/08,5:19,18:09",
    "2025/04/09,5:17,18:09",
    "2025/04/10,5:16,18:10",
    "2025/04/11,5:15,18:11",
    "2025/04/12,5:13,18:12",
    "2025/04/13,5:12,18:13",
    "2025/04/14,5:11,18:13",
    "2025/04/15,5:09,18:14",
    "2025/04/16,5:08,18:15",
    "2025/04/17,5:07,18:16",
    "2025/04/18,5:05,18:17",
    "2025/04/19,5:04,18:18",
    "2025/04/20,5:03,18:18",
    "2025/04/21,5:02,18:19",
    "2025/04/22,5:00,18:20",
    "2025/04/23,4:59,18:21",
    "2025/04/24,4:58,18:22",
    "2025/04/25,4:57,18:23",
    "2025/04/26,4:56,18:23",
    "2025/04/27,4:54,18:24",
    "2025/04/28,4:53,18:25",
    "2025/04/29,4:52,18:26",
    "2025/04/30,4:51,18:27",
    "2025/05/01,4:50,18:28",
    "2025/05/02,4:49,18:28",
    "2025/05/03,4:48,18:29",
    "2025/05/04,4:47,18:30",
    "2025/05/05,4:46,18:31",
    "2025/05/06,4:45,18:32",
    "2025/05/07,4:44,18:32",
    "2025/05/08,4:43,18:33",
    "2025/05/09,4:42,18:34",
    "2025/05/10,4:41,18:35",
    "2025/05/11,4:40,18:36",
    "2025/05/12,4:39,18:37",
    "2025/05/13,4:39,18:37",
    "2025/05/14,4:38,18:38",
    "2025/05/15,4:37,18:39",
    "2025/05/16,4:36,18:40",
    "2025/05/17,4:35,18:41",
    "2025/05/18,4:35,18:41",
    "2025/05/19,4:34,18:42",
    "2025/05/20,4:33,18:43",
    "2025/05/21,4:33,18:44",
    "2025/05/22,4:32,18:44",
    "2025/05/23,4:32,18:45",
    "2025/05/24,4:31,18:46",
    "2025/05/25,4:30,18:47",
    "2025/05/26,4:30,18:47",
    "2025/05/27,4:29,18:48",
    "2025/05/28,4:29,18:49",
    "2025/05/29,4:29,18:49",
    "2025/05/30,4:28,18:50",
    "2025/05/31,4:28,18:51",
    "2025/06/01,4:27,18:51",
    "2025/06/02,4:27,18:52",
    "2025/06/03,4:27,18:52",
    "2025/06/04,4:27,18:53",
    "2025/06/05,4:26,18:54",
    "2025/06/06,4:26,18:54",
    "2025/06/07,4:26,18:55",
    "2025/06/08,4:26,18:55",
    "2025/06/09,4:26,18:56",
    "2025/06/10,4:26,18:56",
    "2025/06/11,4:26,18:57",
    "2025/06/12,4:26,18:57",
    "2025/06/13,4:26,18:57",
    "2025/06/14,4:26,18:58",
    "2025/06/15,4:26,18:58",
    "2025/06/16,4:26,18:59",
    "2025/06/17,4:26,18:59",
    "2025/06/18,4:26,18:59",
    "2025/06/19,4:26,18:59",
    "2025/06/20,4:26,19:00",
    "2025/06/21,4:26,19:00",
    "2025/06/22,4:27,19:00",
    "2025/06/23,4:27,19:00",
    "2025/06/24,4:27,19:00",
    "2025/06/25,4:27,19:01",
    "2025/06/26,4:28,19:01",
    "2025/06/27,4:28,19:01",
    "2025/06/28,4:28,19:01",
    "2025/06/29,4:29,19:01",
    "2025/06/30,4:29,19:01",
    "2025/07/01,4:30,19:01",
    "2025/07/02,4:30,19:01",
    "2025/07/03,4:31,19:01",
    "2025/07/04,4:31,19:00",
    "2025/07/05,4:32,19:00",
    "2025/07/06,4:32,19:00",
    "2025/07/07,4:33,19:00",
    "2025/07/08,4:33,19:00",
    "2025/07/09,4:34,18:59",
    "2025/07/10,4:34,18:59",
    "2025/07/11,4:35,18:59",
    "2025/07/12,4:36,18:58",
    "2025/07/13,4:36,18:58",
    "2025/07/14,4:37,18:58",
    "2025/07/15,4:37,18:57",
    "2025/07/16,4:38,18:57",
    "2025/07/17,4:39,18:56",
    "2025/07/18,4:39,18:56",
    "2025/07/19,4:40,18:55",
    "2025/07/20,4:41,18:54",
    "2025/07/21,4:41,18:54",
    "2025/07/22,4:42,18:53",
    "2025/07/23,4:43,18:53",
    "2025/07/24,4:44,18:52",
    "2025/07/25,4:44,18:51",
    "2025/07/26,4:45,18:50",
    "2025/07/27,4:46,18:50",
    "2025/07/28,4:47,18:49",
    "2025/07/29,4:47,18:48",
    "2025/07/30,4:48,18:47",
    "2025/07/31,4:49,18:46",
    "2025/08/01,4:50,18:45",
    "2025/08/02,4:50,18:45",
    "2025/08/03,4:51,18:44",
    "2025/08/04,4:52,18:43",
    "2025/08/05,4:53,18:42",
    "2025/08/06,4:53,18:41",
    "2025/08/07,4:54,18:40",
    "2025/08/08,4:55,18:39",
    "2025/08/09,4:56,18:38",
    "2025/08/10,4:57,18:36",
    "2025/08/11,4:57,18:35",
    "2025/08/12,4:58,18:34",
    "2025/08/13,4:59,18:33",
    "2025/08/14,5:00,18:32",
    "2025/08/15,5:00,18:31",
    "2025/08/16,5:01,18:30",
    "2025/08/17,5:02,18:28",
    "2025/08/18,5:03,18:27",
    "2025/08/19,5:04,18:26",
    "2025/08/20,5:04,18:25",
    "2025/08/21,5:05,18:24",
    "2025/08/22,5:06,18:22",
    "2025/08/23,5:07,18:21",
    "2025/08/24,5:07,18:20",
    "2025/08/25,5:08,18:18",
    "2025/08/26,5:09,18:17",
    "2025/08/27,5:10,18:16",
    "2025/08/28,5:10,18:14",
    "2025/08/29,5:11,18:13",
    "2025/08/30,5:12,18:12",
    "2025/08/31,5:13,18:10",
    "2025/09/01,5:13,18:09",
    "2025/09/02,5:14,18:08",
    "2025/09/03,5:15,18:06",
    "2025/09/04,5:16,18:05",
    "2025/09/05,5:16,18:03",
    "2025/09/06,5:17,18:02",
    "2025/09/07,5:18,18:00",
    "2025/09/08,5:19,17:59",
    "2025/09/09,5:19,17:58",
    "2025/09/10,5:20,17:56",
    "2025/09/11,5:21,17:55",
    "2025/09/12,5:22,17:53",
    "2025/09/13,5:22,17:52",
    "2025/09/14,5:23,17:50",
    "2025/09/15,5:24,17:49",
    "2025/09/16,5:25,17:47",
    "2025/09/17,5:25,17:46",
    "2025/09/18,5:26,17:45",
    "2025/09/19,5:27,17:43",
    "2025/09/20,5:28,17:42",
    "2025/09/21,5:28,17:40",
    "2025/09/22,5:29,17:39",
    "2025/09/23,5:30,17:37",
    "2025/09/24,5:31,17:36",
    "2025/09/25,5:31,17:34",
    "2025/09/26,5:32,17:33",
    "2025/09/27,5:33,17:31",
    "2025/09/28,5:34,17:30",
    "2025/09/29,5:34,17:29",
    "2025/09/30,5:35,17:27",
    "2025/10/01,5:36,17:26",
    "2025/10/02,5:37,17:24",
    "2025/10/03,5:38,17:23",
    "2025/10/04,5:38,17:21",
    "2025/10/05,5:39,17:20",
    "2025/10/06,5:40,17:19",
    "2025/10/07,5:41,17:17",
    "2025/10/08,5:42,17:16",
    "2025/10/09,5:42,17:15",
    "2025/10/10,5:43,17:13",
    "2025/10/11,5:44,17:12",
    "2025/10/12,5:45,17:10",
    "2025/10/13,5:46,17:09",
    "2025/10/14,5:47,17:08",
    "2025/10/15,5:47,17:07",
    "2025/10/16,5:48,17:05",
    "2025/10/17,5:49,17:04",
    "2025/10/18,5:50,17:03",
    "2025/10/19,5:51,17:01",
    "2025/10/20,5:52,17:00",
    "2025/10/21,5:53,16:59",
    "2025/10/22,5:54,16:58",
    "2025/10/23,5:54,16:57",
    "2025/10/24,5:55,16:55",
    "2025/10/25,5:56,16:54",
    "2025/10/26,5:57,16:53",
    "2025/10/27,5:58,16:52",
    "2025/10/28,5:59,16:51",
    "2025/10/29,6:00,16:50",
    "2025/10/30,6:01,16:49",
    "2025/10/31,6:02,16:48",
    "2025/11/01,6:03,16:47",
    "2025/11/02,6:04,16:46",
    "2025/11/03,6:05,16:45",
    "2025/11/04,6:06,16:44",
    "2025/11/05,6:07,16:43",
    "2025/11/06,6:08,16:42",
    "2025/11/07,6:09,16:41",
    "2025/11/08,6:09,16:40",
    "2025/11/09,6:10,16:40",
    "2025/11/10,6:11,16:39",
    "2025/11/11,6:12,16:38",
    "2025/11/12,6:13,16:37",
    "2025/11/13,6:14,16:37",
    "2025/11/14,6:15,16:36",
    "2025/11/15,6:16,16:35",
    "2025/11/16,6:17,16:35",
    "2025/11/17,6:18,16:34",
    "2025/11/18,6:19,16:33",
    "2025/11/19,6:20,16:33",
    "2025/11/20,6:21,16:32",
    "2025/11/21,6:22,16:32",
    "2025/11/22,6:23,16:31",
    "2025/11/23,6:24,16:31",
    "2025/11/24,6:25,16:31",
    "2025/11/25,6:26,16:30",
    "2025/11/26,6:27,16:30",
    "2025/11/27,6:28,16:30",
    "2025/11/28,6:29,16:29",
    "2025/11/29,6:30,16:29",
    "2025/11/30,6:31,16:29",
    "2025/12/01,6:32,16:29",
    "2025/12/02,6:33,16:29",
    "2025/12/03,6:34,16:29",
    "2025/12/04,6:34,16:28",
    "2025/12/05,6:35,16:28",
    "2025/12/06,6:36,16:28",
    "2025/12/07,6:37,16:28",
    "2025/12/08,6:38,16:29",
    "2025/12/09,6:38,16:29",
    "2025/12/10,6:39,16:29",
    "2025/12/11,6:40,16:29",
    "2025/12/12,6:41,16:29",
    "2025/12/13,6:41,16:29",
    "2025/12/14,6:42,16:30",
    "2025/12/15,6:43,16:30",
    "2025/12/16,6:43,16:30",
    "2025/12/17,6:44,16:31",
    "2025/12/18,6:45,16:31",
    "2025/12/19,6:45,16:31",
    "2025/12/20,6:46,16:32",
    "2025/12/21,6:46,16:32",
    "2025/12/22,6:47,16:33",
    "2025/12/23,6:47,16:33",
    "2025/12/24,6:48,16:34",
    "2025/12/25,6:48,16:35",
    "2025/12/26,6:49,16:35",
    "2025/12/27,6:49,16:36",
    "2025/12/28,6:49,16:36",
    "2025/12/29,6:50,16:37",
    "2025/12/30,6:50,16:38",
    "2025/12/31,6:50,16:39"
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

// 2026年

(function() {
  var lines = [
"2026/01/01,6:50,16:39",
"2026/01/02,6:51,16:40",
"2026/01/03,6:51,16:41",
"2026/01/04,6:51,16:42",
"2026/01/05,6:51,16:43",
"2026/01/06,6:51,16:43",
"2026/01/07,6:51,16:44",
"2026/01/08,6:51,16:45",
"2026/01/09,6:51,16:46",
"2026/01/10,6:51,16:47",
"2026/01/11,6:51,16:48",
"2026/01/12,6:51,16:49",
"2026/01/13,6:50,16:50",
"2026/01/14,6:50,16:51",
"2026/01/15,6:50,16:52",
"2026/01/16,6:50,16:53",
"2026/01/17,6:49,16:54",
"2026/01/18,6:49,16:55",
"2026/01/19,6:49,16:56",
"2026/01/20,6:48,16:57",
"2026/01/21,6:48,16:58",
"2026/01/22,6:47,16:59",
"2026/01/23,6:47,17:00",
"2026/01/24,6:46,17:01",
"2026/01/25,6:46,17:02",
"2026/01/26,6:45,17:03",
"2026/01/27,6:45,17:04",
"2026/01/28,6:44,17:05",
"2026/01/29,6:43,17:06",
"2026/01/30,6:43,17:07",
"2026/01/31,6:42,17:08",
"2026/02/01,6:41,17:09",
"2026/02/02,6:40,17:10",
"2026/02/03,6:40,17:11",
"2026/02/04,6:39,17:12",
"2026/02/05,6:38,17:13",
"2026/02/06,6:37,17:14",
"2026/02/07,6:36,17:15",
"2026/02/08,6:35,17:16",
"2026/02/09,6:34,17:17",
"2026/02/10,6:33,17:18",
"2026/02/11,6:32,17:19",
"2026/02/12,6:31,17:20",
"2026/02/13,6:30,17:21",
"2026/02/14,6:29,17:22",
"2026/02/15,6:28,17:23",
"2026/02/16,6:27,17:24",
"2026/02/17,6:26,17:25",
"2026/02/18,6:25,17:26",
"2026/02/19,6:24,17:27",
"2026/02/20,6:23,17:28",
"2026/02/21,6:22,17:29",
"2026/02/22,6:20,17:30",
"2026/02/23,6:19,17:31",
"2026/02/24,6:18,17:32",
"2026/02/25,6:17,17:33",
"2026/02/26,6:16,17:34",
"2026/02/27,6:14,17:35",
"2026/02/28,6:13,17:35",
"2026/03/01,6:12,17:36",
"2026/03/02,6:10,17:37",
"2026/03/03,6:09,17:38",
"2026/03/04,6:08,17:39",
"2026/03/05,6:06,17:40",
"2026/03/06,6:05,17:41",
"2026/03/07,6:04,17:42",
"2026/03/08,6:02,17:43",
"2026/03/09,6:01,17:43",
"2026/03/10,6:00,17:44",
"2026/03/11,5:58,17:45",
"2026/03/12,5:57,17:46",
"2026/03/13,5:56,17:47",
"2026/03/14,5:54,17:48",
"2026/03/15,5:53,17:49",
"2026/03/16,5:51,17:49",
"2026/03/17,5:50,17:50",
"2026/03/18,5:49,17:51",
"2026/03/19,5:47,17:52",
"2026/03/20,5:46,17:53",
"2026/03/21,5:44,17:54",
"2026/03/22,5:43,17:54",
"2026/03/23,5:41,17:55",
"2026/03/24,5:40,17:56",
"2026/03/25,5:39,17:57",
"2026/03/26,5:37,17:58",
"2026/03/27,5:36,17:59",
"2026/03/28,5:34,17:59",
"2026/03/29,5:33,18:00",
"2026/03/30,5:31,18:01",
"2026/03/31,5:30,18:02",
"2026/04/01,5:29,18:03",
"2026/04/02,5:27,18:03",
"2026/04/03,5:26,18:04",
"2026/04/04,5:24,18:05",
"2026/04/05,5:23,18:06",
"2026/04/06,5:22,18:07",
"2026/04/07,5:20,18:08",
"2026/04/08,5:19,18:08",
"2026/04/09,5:18,18:09",
"2026/04/10,5:16,18:10",
"2026/04/11,5:15,18:11",
"2026/04/12,5:13,18:12",
"2026/04/13,5:12,18:12",
"2026/04/14,5:11,18:13",
"2026/04/15,5:10,18:14",
"2026/04/16,5:08,18:15",
"2026/04/17,5:07,18:16",
"2026/04/18,5:06,18:17",
"2026/04/19,5:04,18:17",
"2026/04/20,5:03,18:18",
"2026/04/21,5:02,18:19",
"2026/04/22,5:01,18:20",
"2026/04/23,4:59,18:21",
"2026/04/24,4:58,18:21",
"2026/04/25,4:57,18:22",
"2026/04/26,4:56,18:23",
"2026/04/27,4:55,18:24",
"2026/04/28,4:54,18:25",
"2026/04/29,4:52,18:26",
"2026/04/30,4:51,18:26",
"2026/05/01,4:50,18:27",
"2026/05/02,4:49,18:28",
"2026/05/03,4:48,18:29",
"2026/05/04,4:47,18:30",
"2026/05/05,4:46,18:31",
"2026/05/06,4:45,18:31",
"2026/05/07,4:44,18:32",
"2026/05/08,4:43,18:33",
"2026/05/09,4:42,18:34",
"2026/05/10,4:41,18:35",
"2026/05/11,4:40,18:36",
"2026/05/12,4:40,18:36",
"2026/05/13,4:39,18:37",
"2026/05/14,4:38,18:38",
"2026/05/15,4:37,18:39",
"2026/05/16,4:36,18:40",
"2026/05/17,4:36,18:40",
"2026/05/18,4:35,18:41",
"2026/05/19,4:34,18:42",
"2026/05/20,4:34,18:43",
"2026/05/21,4:33,18:43",
"2026/05/22,4:32,18:44",
"2026/05/23,4:32,18:45",
"2026/05/24,4:31,18:46",
"2026/05/25,4:31,18:46",
"2026/05/26,4:30,18:47",
"2026/05/27,4:30,18:48",
"2026/05/28,4:29,18:48",
"2026/05/29,4:29,18:49",
"2026/05/30,4:28,18:50",
"2026/05/31,4:28,18:50",
"2026/06/01,4:28,18:51",
"2026/06/02,4:27,18:52",
"2026/06/03,4:27,18:52",
"2026/06/04,4:27,18:53",
"2026/06/05,4:26,18:53",
"2026/06/06,4:26,18:54",
"2026/06/07,4:26,18:55",
"2026/06/08,4:26,18:55",
"2026/06/09,4:26,18:56",
"2026/06/10,4:26,18:56",
"2026/06/11,4:26,18:57",
"2026/06/12,4:26,18:57",
"2026/06/13,4:26,18:57",
"2026/06/14,4:26,18:58",
"2026/06/15,4:26,18:58",
"2026/06/16,4:26,18:58",
"2026/06/17,4:26,18:59",
"2026/06/18,4:26,18:59",
"2026/06/19,4:26,18:59",
"2026/06/20,4:26,19:00",
"2026/06/21,4:26,19:00",
"2026/06/22,4:27,19:00",
"2026/06/23,4:27,19:00",
"2026/06/24,4:27,19:00",
"2026/06/25,4:27,19:01",
"2026/06/26,4:28,19:01",
"2026/06/27,4:28,19:01",
"2026/06/28,4:28,19:01",
"2026/06/29,4:29,19:01",
"2026/06/30,4:29,19:01",
"2026/07/01,4:30,19:01",
"2026/07/02,4:30,19:01",
"2026/07/03,4:30,19:01",
"2026/07/04,4:31,19:00",
"2026/07/05,4:31,19:00",
"2026/07/06,4:32,19:00",
"2026/07/07,4:32,19:00",
"2026/07/08,4:33,19:00",
"2026/07/09,4:34,18:59",
"2026/07/10,4:34,18:59",
"2026/07/11,4:35,18:59",
"2026/07/12,4:35,18:58",
"2026/07/13,4:36,18:58",
"2026/07/14,4:37,18:58",
"2026/07/15,4:37,18:57",
"2026/07/16,4:38,18:57",
"2026/07/17,4:39,18:56",
"2026/07/18,4:39,18:56",
"2026/07/19,4:40,18:55",
"2026/07/20,4:41,18:55",
"2026/07/21,4:41,18:54",
"2026/07/22,4:42,18:53",
"2026/07/23,4:43,18:53",
"2026/07/24,4:43,18:52",
"2026/07/25,4:44,18:51",
"2026/07/26,4:45,18:51",
"2026/07/27,4:46,18:50",
"2026/07/28,4:46,18:49",
"2026/07/29,4:47,18:48",
"2026/07/30,4:48,18:47",
"2026/07/31,4:49,18:47",
"2026/08/01,4:49,18:46",
"2026/08/02,4:50,18:45",
"2026/08/03,4:51,18:44",
"2026/08/04,4:52,18:43",
"2026/08/05,4:53,18:42",
"2026/08/06,4:53,18:41",
"2026/08/07,4:54,18:40",
"2026/08/08,4:55,18:39",
"2026/08/09,4:56,18:38",
"2026/08/10,4:56,18:37",
"2026/08/11,4:57,18:36",
"2026/08/12,4:58,18:35",
"2026/08/13,4:59,18:33",
"2026/08/14,5:00,18:32",
"2026/08/15,5:00,18:31",
"2026/08/16,5:01,18:30",
"2026/08/17,5:02,18:29",
"2026/08/18,5:03,18:28",
"2026/08/19,5:03,18:26",
"2026/08/20,5:04,18:25",
"2026/08/21,5:05,18:24",
"2026/08/22,5:06,18:23",
"2026/08/23,5:06,18:21",
"2026/08/24,5:07,18:20",
"2026/08/25,5:08,18:19",
"2026/08/26,5:09,18:17",
"2026/08/27,5:09,18:16",
"2026/08/28,5:10,18:15",
"2026/08/29,5:11,18:13",
"2026/08/30,5:12,18:12",
"2026/08/31,5:12,18:11",
"2026/09/01,5:13,18:09",
"2026/09/02,5:14,18:08",
"2026/09/03,5:15,18:06",
"2026/09/04,5:15,18:05",
"2026/09/05,5:16,18:04",
"2026/09/06,5:17,18:02",
"2026/09/07,5:18,18:01",
"2026/09/08,5:18,17:59",
"2026/09/09,5:19,17:58",
"2026/09/10,5:20,17:57",
"2026/09/11,5:21,17:55",
"2026/09/12,5:21,17:54",
"2026/09/13,5:22,17:52",
"2026/09/14,5:23,17:51",
"2026/09/15,5:24,17:49",
"2026/09/16,5:24,17:48",
"2026/09/17,5:25,17:46",
"2026/09/18,5:26,17:45",
"2026/09/19,5:27,17:43",
"2026/09/20,5:27,17:42",
"2026/09/21,5:28,17:41",
"2026/09/22,5:29,17:39",
"2026/09/23,5:30,17:38",
"2026/09/24,5:30,17:36",
"2026/09/25,5:31,17:35",
"2026/09/26,5:32,17:33",
"2026/09/27,5:33,17:32",
"2026/09/28,5:33,17:30",
"2026/09/29,5:34,17:29",
"2026/09/30,5:35,17:27",
"2026/10/01,5:36,17:26",
"2026/10/02,5:37,17:25",
"2026/10/03,5:37,17:23",
"2026/10/04,5:38,17:22",
"2026/10/05,5:39,17:20",
"2026/10/06,5:40,17:19",
"2026/10/07,5:41,17:18",
"2026/10/08,5:41,17:16",
"2026/10/09,5:42,17:15",
"2026/10/10,5:43,17:13",
"2026/10/11,5:44,17:12",
"2026/10/12,5:45,17:11",
"2026/10/13,5:46,17:09",
"2026/10/14,5:46,17:08",
"2026/10/15,5:47,17:07",
"2026/10/16,5:48,17:06",
"2026/10/17,5:49,17:04",
"2026/10/18,5:50,17:03",
"2026/10/19,5:51,17:02",
"2026/10/20,5:52,17:01",
"2026/10/21,5:52,16:59",
"2026/10/22,5:53,16:58",
"2026/10/23,5:54,16:57",
"2026/10/24,5:55,16:56",
"2026/10/25,5:56,16:55",
"2026/10/26,5:57,16:53",
"2026/10/27,5:58,16:52",
"2026/10/28,5:59,16:51",
"2026/10/29,6:00,16:50",
"2026/10/30,6:01,16:49",
"2026/10/31,6:02,16:48",
"2026/11/01,6:03,16:47",
"2026/11/02,6:03,16:46",
"2026/11/03,6:04,16:45",
"2026/11/04,6:05,16:44",
"2026/11/05,6:06,16:43",
"2026/11/06,6:07,16:42",
"2026/11/07,6:08,16:41",
"2026/11/08,6:09,16:41",
"2026/11/09,6:10,16:40",
"2026/11/10,6:11,16:39",
"2026/11/11,6:12,16:38",
"2026/11/12,6:13,16:37",
"2026/11/13,6:14,16:37",
"2026/11/14,6:15,16:36",
"2026/11/15,6:16,16:35",
"2026/11/16,6:17,16:35",
"2026/11/17,6:18,16:34",
"2026/11/18,6:19,16:34",
"2026/11/19,6:20,16:33",
"2026/11/20,6:21,16:32",
"2026/11/21,6:22,16:32",
"2026/11/22,6:23,16:32",
"2026/11/23,6:24,16:31",
"2026/11/24,6:25,16:31",
"2026/11/25,6:26,16:30",
"2026/11/26,6:27,16:30",
"2026/11/27,6:28,16:30",
"2026/11/28,6:29,16:29",
"2026/11/29,6:30,16:29",
"2026/11/30,6:31,16:29",
"2026/12/01,6:31,16:29",
"2026/12/02,6:32,16:29",
"2026/12/03,6:33,16:29",
"2026/12/04,6:34,16:28",
"2026/12/05,6:35,16:28",
"2026/12/06,6:36,16:28",
"2026/12/07,6:37,16:28",
"2026/12/08,6:38,16:29",
"2026/12/09,6:38,16:29",
"2026/12/10,6:39,16:29",
"2026/12/11,6:40,16:29",
"2026/12/12,6:41,16:29",
"2026/12/13,6:41,16:29",
"2026/12/14,6:42,16:30",
"2026/12/15,6:43,16:30",
"2026/12/16,6:43,16:30",
"2026/12/17,6:44,16:31",
"2026/12/18,6:45,16:31",
"2026/12/19,6:45,16:31",
"2026/12/20,6:46,16:32",
"2026/12/21,6:46,16:32",
"2026/12/22,6:47,16:33",
"2026/12/23,6:47,16:33",
"2026/12/24,6:48,16:34",
"2026/12/25,6:48,16:34",
"2026/12/26,6:49,16:35",
"2026/12/27,6:49,16:36",
"2026/12/28,6:49,16:36",
"2026/12/29,6:50,16:37",
"2026/12/30,6:50,16:38",
"2026/12/31,6:50,16:38"
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
