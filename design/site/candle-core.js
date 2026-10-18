(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RidgeCandles = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  };

  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
    return result >>> 0;
  }

  function randomSequence(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function contour(points, closed = false) {
    if (!Array.isArray(points)) throw new TypeError('Contour points must be an array');
    const clean = points.map((point) => {
      if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) throw new TypeError('Each point needs finite x and y coordinates');
      return [point[0], point[1]];
    });
    if (closed && clean.length > 1 && (clean[0][0] !== clean.at(-1)[0] || clean[0][1] !== clean.at(-1)[1])) clean.push([...clean[0]]);
    const segments = [];
    let length = 0;
    for (let index = 1; index < clean.length; index++) {
      const [x0, y0] = clean[index - 1];
      const [x1, y1] = clean[index];
      const size = Math.hypot(x1 - x0, y1 - y0);
      if (size) segments.push({ x0, y0, x1, y1, length: size, s: length });
      length += size;
    }
    const xs = clean.map(([x]) => x);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 0;
    const at = (x) => {
      let found = null;
      for (const segment of segments) {
        if (x < Math.min(segment.x0, segment.x1) - 1e-8 || x > Math.max(segment.x0, segment.x1) + 1e-8) continue;
        const vertical = segment.x0 === segment.x1;
        const t = vertical ? (segment.y0 <= segment.y1 ? 0 : 1) : clamp((x - segment.x0) / (segment.x1 - segment.x0), 0, 1);
        const candidate = { x, y: segment.y0 + (segment.y1 - segment.y0) * t, s: segment.s + segment.length * t };
        if (!found || candidate.y < found.y || (candidate.y === found.y && candidate.s < found.s)) found = candidate;
      }
      return found;
    };
    return { points: clean, segments, minX, maxX, length, at };
  }

  // Sorting vertices alone would retain the underside of a closed cairn.
  // Intersections also capture changes of the uppermost segment between vertices.
  function upperEnvelope(points, { closed = false } = {}) {
    const profile = contour(points, closed);
    if (!profile.segments.length) return [];
    const xs = new Set(profile.points.map(([x]) => x));
    const segments = profile.segments.filter((segment) => segment.x0 !== segment.x1);
    for (let a = 0; a < segments.length; a++) for (let b = a + 1; b < segments.length; b++) {
      const first = segments[a];
      const second = segments[b];
      const low = Math.max(Math.min(first.x0, first.x1), Math.min(second.x0, second.x1));
      const high = Math.min(Math.max(first.x0, first.x1), Math.max(second.x0, second.x1));
      if (low >= high) continue;
      const m0 = (first.y1 - first.y0) / (first.x1 - first.x0);
      const m1 = (second.y1 - second.y0) / (second.x1 - second.x0);
      if (Math.abs(m0 - m1) < 1e-12) continue;
      const x = (second.y0 - m1 * second.x0 - first.y0 + m0 * first.x0) / (m0 - m1);
      if (x > low && x < high) xs.add(x);
    }
    return [...xs].sort((a, b) => a - b).map((x) => profile.at(x)).filter(Boolean).map(({ x, y }) => [x, y]);
  }

  // Source cairn paths describe entire objects, including their vertical base
  // walls. Financial candles belong to their readable upper crown. Crop the
  // source geometry before sampling so O/C continuity stays intact.
  function cropCrown(points, options = {}) {
    const { depth = 'near', heightFraction = .24, maxHeight = 85, maxEndSlope = 1.20 } = options;
    const source = contour(points).points;
    if (depth === 'far' || source.length < 2) return source;
    if (!(heightFraction > 0 && heightFraction < 1) || !(maxHeight > 0) || !(maxEndSlope > 0)) throw new RangeError('Crown parameters must describe a positive height and slope');
    const envelope = upperEnvelope(source);
    const ordered = [];
    for (const point of envelope) {
      const previous = ordered.at(-1);
      if (previous && Math.abs(point[0] - previous[0]) < 1e-6) previous[1] = Math.min(previous[1], point[1]);
      else ordered.push([...point]);
    }
    if (ordered.length < 2) return ordered;
    if (depth !== 'near') {
      // Trim only an uninterrupted terminal wall. Interior steep mountain
      // sections are retained and are handled by the macro price trajectory.
      const slope = (a, b) => Math.abs((b[1] - a[1]) / (b[0] - a[0]));
      let start = 0, end = ordered.length - 1;
      while (start + 1 < end && slope(ordered[start], ordered[start + 1]) > maxEndSlope) start++;
      while (end - 1 > start && slope(ordered[end - 1], ordered[end]) > maxEndSlope) end--;
      return ordered.slice(start, end + 1);
    }
    const ys = ordered.map((point) => point[1]);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    if (bottom - top < 1e-8) return ordered;
    const threshold = top + Math.min((bottom - top) * heightFraction, maxHeight);
    const summit = ys.indexOf(top);
    let start = summit, end = summit;
    while (start > 0 && ordered[start - 1][1] <= threshold) start--;
    while (end + 1 < ordered.length && ordered[end + 1][1] <= threshold) end++;
    const crossing = (a, b) => {
      const t = (threshold - a[1]) / (b[1] - a[1]);
      return [a[0] + (b[0] - a[0]) * t, threshold];
    };
    const crown = ordered.slice(start, end + 1);
    if (start > 0) crown.unshift(crossing(ordered[start - 1], ordered[start]));
    if (end + 1 < ordered.length) crown.push(crossing(ordered[end], ordered[end + 1]));
    return crown;
  }

  const profiles = Object.freeze({
    bold: Object.freeze({ label: 'Bold', farCount: 50, bodyRatio: .70, middleSpacing: 92, nearSpacing: 75, middleMax: 11, nearMin: 5, nearMax: 8, volatility: .90 }),
    balanced: Object.freeze({ label: 'Balanced', farCount: 70, bodyRatio: .68, middleSpacing: 74, nearSpacing: 63, middleMax: 14, nearMin: 6, nearMax: 9, volatility: 1.00 }),
    active: Object.freeze({ label: 'Active', farCount: 90, bodyRatio: .66, middleSpacing: 60, nearSpacing: 53, middleMax: 17, nearMin: 7, nearMax: 10, volatility: 1.08 }),
    detailed: Object.freeze({ label: 'Detailed', farCount: 110, bodyRatio: .64, middleSpacing: 49, nearSpacing: 45, middleMax: 20, nearMin: 8, nearMax: 12, volatility: 1.12 })
  });

  function resolveProfile(value = 'balanced') {
    if (typeof value === 'string') {
      if (!profiles[value]) throw new RangeError(`Unknown candle profile: ${value}`);
      return profiles[value];
    }
    if (value && typeof value === 'object' && Number.isFinite(value.farCount) && Number.isFinite(value.bodyRatio)) return value;
    throw new TypeError('Candle profile must name an existing profile or provide its configuration');
  }

  function defaultCount(depth, span, selected = 'balanced') {
    const config = resolveProfile(selected);
    if (depth === 'far') return clamp(Math.round(span / 4032 * config.farCount), 12, 180);
    if (depth === 'near') return clamp(Math.round(span / config.nearSpacing), config.nearMin, config.nearMax);
    return clamp(Math.round(span / config.middleSpacing), 4, config.middleMax);
  }

  function signsOf(levels) {
    return levels.slice(1).map((value, index) => Math.sign(value - levels[index]));
  }

  // A short-term reversal is a change in shared closing prices, not a repaint
  // of an otherwise monotone body. Adjusting a pair around its midpoint also
  // keeps the excursion on both sides of the large-scale mountain trend.
  function introduceReversal(levels, candleIndex, direction, size) {
    const center = (levels[candleIndex] + levels[candleIndex + 1]) / 2;
    levels[candleIndex] = center + direction * size / 2;
    levels[candleIndex + 1] = center - direction * size / 2;
  }

  function breakDirectionalRuns(levels, scale, rng) {
    const count = levels.length - 1;
    const maxRun = 4;
    for (let pass = 0; pass < 3; pass++) {
      const signs = signsOf(levels);
      let changed = false;
      for (let start = 0; start < count;) {
        let end = start + 1;
        while (end < count && signs[end] === signs[start]) end++;
        if (signs[start] && end - start > maxRun) {
          for (let block = start; block + maxRun < end; block += maxRun + 1) {
            const target = clamp(block + 1 + Math.floor(rng() * Math.max(1, maxRun - 1)), 1, count - 2);
            introduceReversal(levels, target, signs[start], scale * (.55 + rng() * .65));
            changed = true;
          }
        }
        start = end;
      }
      if (!changed) break;
    }
    const signs = signsOf(levels);
    if (signs.some((sign) => sign < 0) && signs.some((sign) => sign > 0)) return;
    const direction = Math.sign(levels[count] - levels[0]) || 1;
    if (count === 2) {
      levels[1] = direction > 0 ? Math.min(levels[0], levels[2]) - scale : Math.max(levels[0], levels[2]) + scale;
    } else {
      introduceReversal(levels, clamp(Math.floor(count / 2), 1, count - 2), direction, scale);
    }
  }

  function createCandles(points, options = {}) {
    const { depth = 'middle', id = '', closed = false } = options;
    const config = resolveProfile(options.profile);
    const shape = contour(points, closed);
    const span = shape.maxX - shape.minX;
    if (!shape.segments.length || span <= 1e-8) return [];
    const count = options.count ?? defaultCount(depth, span, config);
    if (!Number.isSafeInteger(count) || count < 2 || count > 256) throw new RangeError('Candle count must be an integer between 2 and 256');
    const rng = randomSequence(hash(options.seed ?? `${id}|${depth}|${config.label}|${JSON.stringify(shape.points)}`));
    const step = span / count;
    const anchors = Array.from({ length: count }, (_, index) => shape.at(shape.minX + (index + .5) * step));
    // The contour is a macro trend. A symmetric low-pass sample avoids treating
    // every rock edge as a price move while retaining the major mountain peaks.
    const macroAt = (x) => {
      const weights = [1, 3, 5, 3, 1];
      return weights.reduce((total, weight, index) => total + weight * shape.at(clamp(x + (index - 2) * step * .23, shape.minX, shape.maxX)).y, 0) / 13;
    };
    const edgeY = Array.from({ length: count + 1 }, (_, index) => macroAt(shape.minX + index * step));
    edgeY[0] = shape.at(shape.minX).y;
    edgeY[count] = shape.at(shape.maxX).y;
    const range = Math.max(...edgeY) - Math.min(...edgeY);
    const typical = Math.max(2, median(edgeY.slice(1).map((y, index) => Math.abs(y - edgeY[index]))), range / count * .45);
    const amplitude = Math.max(3, step * .14, typical * .55, range * .012) * config.volatility * (depth === 'near' ? .72 : 1);
    let displacement = 0;
    const levels = edgeY.map((y, index) => {
      if (index === 0 || index === count) return y;
      displacement = displacement * .22 + (rng() * 2 - 1) * amplitude;
      return y + displacement;
    });
    breakDirectionalRuns(levels, Math.max(3, typical * .7, amplitude * .75), rng);

    return anchors.map((anchor, index) => {
      const openY = levels[index];
      const closeY = levels[index + 1];
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const wickScale = Math.max(2.2, Math.min(step * .42, typical * .60 + amplitude * .35));
      const pattern = rng();
      let upperRatio = .18 + rng() * .58;
      let lowerRatio = .18 + rng() * .58;
      if (pattern < .20) upperRatio += .75 + rng() * .65;
      else if (pattern < .40) lowerRatio += .75 + rng() * .65;
      const highY = bodyTop - wickScale * upperRatio;
      const lowY = bodyBottom + wickScale * lowerRatio;
      return {
        x: anchor.x, openY, closeY, highY, lowY,
        rising: closeY < openY,
        anchorY: anchor.y, s: anchor.s,
        bodyWidth: step * config.bodyRatio,
        synthetic: true
      };
    });
  }

  return Object.freeze({ contour, createCandles, upperEnvelope, cropCrown, defaultCount, profiles });
});
