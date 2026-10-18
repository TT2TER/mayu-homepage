/* Original photograph coordinates: 4032 x 3024 pixels.
 * Name materials and projected letter silhouettes use Canvas geometry.
 * Restore the photograph through the foreground cairn after name and shadow. */
(function (global) {
  'use strict';
  const FONT = '500 740px Impact, "Arial Narrow", sans-serif';
  const FRAME = Object.freeze({ x: 60, y: 810, width: 1500, height: 760 });
  const INK = Object.freeze({ left: 118, right: 1318, baseline: 1350, height: 480 });
  const SCALE = 1;
  const LIGHT = Object.freeze({
    imageLightFrom: { x: -0.82, y: -0.57 },
    groundShadowTipOffset: { x: 260, y: 132 },
    inference: 'Upper-left illumination and lower-right cast shadows, inferred from visible rock and shoe shadows; an image-plane design approximation.'
  });
  const SHADOW = Object.freeze({ color: '#020507', opacity: .86, contactOpacity: .24, softness: 3.5 });
  const SHADOW_FRAME = Object.freeze({ x: 85, y: 1320, width: 1540, height: 215 });
  const cache = new Map();
  const geometry = Object.create(null);
  const variants = [
    { id: 'solid-flat', label: 'Pure white', description: 'A pure-white flat name with a dark letter-shaped shadow on the rocky ground.' }
  ];
  const bounds = Object.freeze({ x: 118, y: 870, width: 1218, height: 510 });
  variants.forEach(v => { v.bounds = bounds; });
  const canvas = (w, h) => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  };
  function alphaBounds(data, width, height) {
    let x0 = width, y0 = height, x1 = -1, y1 = -1, count = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 5) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); count++;
    }
    return x1 < x0 ? null : { x: FRAME.x + x0 / SCALE, y: FRAME.y + y0 / SCALE,
      width: (x1 - x0 + 1) / SCALE, height: (y1 - y0 + 1) / SCALE, alphaPixelCount: count };
  }
  function components(pixels, width, height) {
    const result = []; let current = null;
    for (let x = 0; x < width; x++) {
      let top = height, bottom = -1;
      for (let y = 0; y < height; y++) if (pixels[(y * width + x) * 4 + 3] >= 40) { top = Math.min(top, y); bottom = y; }
      if (bottom >= 0) {
        if (!current) current = { x0: x, x1: x, y0: top, y1: bottom };
        else { current.x1 = x; current.y0 = Math.min(current.y0, top); current.y1 = Math.max(current.y1, bottom); }
      } else if (current) { result.push(current); current = null; }
    }
    if (current) result.push(current);
    return result;
  }
  function makeMask() {
    const width = FRAME.width * SCALE, height = FRAME.height * SCALE;
    const mask = canvas(width, height), c = mask.getContext('2d', { willReadFrequently: true });
    c.font = FONT; c.textBaseline = 'alphabetic';
    const metrics = c.measureText('Yu Ma');
    const xScale = (INK.right - INK.left) / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);
    const yScale = INK.height / (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
    const tx = INK.left - FRAME.x + metrics.actualBoundingBoxLeft * xScale;
    const baseline = INK.baseline - FRAME.y;
    c.save(); c.scale(SCALE, SCALE); c.translate(tx, baseline); c.scale(xScale, yScale);
    c.fillStyle = '#fff'; c.fillText('Yu Ma', 0, 0); c.restore();
    const last = canvas(width, height), lc = last.getContext('2d', { willReadFrequently: true });
    lc.font = FONT; lc.textBaseline = 'alphabetic';
    const prefix = metrics.width - lc.measureText('a').width;
    lc.scale(SCALE, SCALE); lc.translate(tx, baseline); lc.scale(xScale, yScale);
    lc.fillStyle = '#fff'; lc.fillText('a', prefix, 0);
    const pixels = c.getImageData(0, 0, width, height).data;
    const lastPixels = lc.getImageData(0, 0, width, height).data;
    return { mask, width, height, pixels, lastPixels, glyphs: components(pixels, width, height),
      inkBounds: alphaBounds(pixels, width, height), lastGlyphBounds: alphaBounds(lastPixels, width, height),
      xScale, yScale };
  }
  function tint(mask, color) {
    const out = canvas(mask.width, mask.height), c = out.getContext('2d');
    c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-in';
    c.fillStyle = color; c.fillRect(0, 0, out.width, out.height); return out;
  }
  function projectedShadow(maskData, dx, dy, softness) {
    const out = canvas(SHADOW_FRAME.width, SHADOW_FRAME.height), c = out.getContext('2d');
    const source = tint(maskData.mask, SHADOW.color);
    // Each disconnected letter meets its own lowest ink row. Project its height
    // onto the image's rocky ground, preserving counters and spaces between letters.
    for (const g of maskData.glyphs) {
      const footY = FRAME.y + (g.y1 + 1) / SCALE;
      c.save(); c.translate(FRAME.x + g.x0 / SCALE - SHADOW_FRAME.x, footY - SHADOW_FRAME.y);
      c.transform(1, 0, -dx / INK.height, -dy / INK.height, 0, 0);
      c.drawImage(source, g.x0, 0, g.x1 - g.x0 + 1, source.height,
        0, FRAME.y - footY, (g.x1 - g.x0 + 1) / SCALE, FRAME.height);
      c.restore();
    }
    if (!softness) return out;
    const soft = canvas(out.width, out.height), sc = soft.getContext('2d');
    sc.filter = `blur(${softness}px)`; sc.drawImage(out, 0, 0); return soft;
  }
  function resolve(variant) {
    const id = typeof variant === 'object' ? variant?.id : variant;
    return variants.some(v => v.id === id) ? id : 'solid-flat';
  }
  function material(id) {
    id = resolve(id); if (cache.has(id)) return cache.get(id);
    const mask = makeMask();
    const result = { front: mask.mask, mask, frontPixels: mask.pixels,
      shadow: projectedShadow(mask, LIGHT.groundShadowTipOffset.x, LIGHT.groundShadowTipOffset.y, SHADOW.softness),
      contactShadow: projectedShadow(mask, 19, 8, 1) };
    geometry[id] = { inkBounds: mask.inkBounds, alphaBounds: mask.inkBounds, lastGlyphBounds: mask.lastGlyphBounds,
      xScale: mask.xScale, yScale: mask.yScale, font: FONT, placement: INK,
      placementChange: { x: 28, y: 110, originalBaseline: 1240 },
      faceColor: '#ffffff', light: LIGHT,
      shadow: { bounds: SHADOW_FRAME, tipOffset: LIGHT.groundShadowTipOffset, color: SHADOW.color,
        opacity: SHADOW.opacity, softness: SHADOW.softness, contactOpacity: SHADOW.contactOpacity } };
    cache.set(id, result); return result;
  }
  function drawGroundShadow(ctx, options = {}) {
    const id = resolve(options.variant);
    const tex = material(id);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.filter = 'none';
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.globalAlpha = SHADOW.opacity; ctx.drawImage(tex.shadow, SHADOW_FRAME.x, SHADOW_FRAME.y);
    ctx.globalAlpha = SHADOW.contactOpacity; ctx.drawImage(tex.contactShadow, SHADOW_FRAME.x, SHADOW_FRAME.y);
    ctx.restore(); return geometry[id].shadow;
  }
  function drawMiddle(ctx, options = {}) {
    const id = resolve(options.variant), tex = material(id);
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.drawImage(tex.front, FRAME.x, FRAME.y, FRAME.width, FRAME.height);
    ctx.restore(); return geometry[id];
  }
  function auditOcclusion(id, containsPoint) {
    if (typeof containsPoint !== 'function') throw new TypeError('A foreground containsPoint function is required.');
    const tex = material(resolve(id)), m = tex.mask; let finalGlyphInk = 0, hiddenFinalGlyphInk = 0;
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const k = (y * m.width + x) * 4;
      if (m.lastPixels[k + 3] < 128 || tex.frontPixels[k + 3] < 70) continue;
      finalGlyphInk++;
      if (containsPoint(FRAME.x + (x + .5) / SCALE, FRAME.y + (y + .5) / SCALE)) hiddenFinalGlyphInk++;
    }
    return { finalGlyphInk, hiddenFinalGlyphInk, hiddenFinalGlyphFraction: finalGlyphInk ? hiddenFinalGlyphInk / finalGlyphInk : 0,
      lastGlyphBounds: m.lastGlyphBounds };
  }
  global.NameStudies = { variants, bounds, geometry, drawMiddle, draw: drawMiddle, drawGroundShadow, auditOcclusion };
})(typeof window === 'undefined' ? globalThis : window);
