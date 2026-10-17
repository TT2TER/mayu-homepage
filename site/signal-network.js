/* Asynchronous summit communications in original-photo coordinates.
   Fixed planning windows index events; they are not playback cycles. Two offset
   streams keep their real packet lifetimes across window boundaries. The caller
   owns visibility, redraw, RAF and timers. No DOM or pointer state is read here. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SignalNetwork = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const WINDOW_MS = 48000, MAX_EVENT_MS = 2900, MAX_ACTIVE_LINKS = 5;
  const DEFAULT_PERIOD = 5000; // Accepted legacy hint; scheduling never uses it.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const isPerson = n => /head|phone|person|human/i.test(n.kind || '') || /head|phone/i.test(n.id);
  const depthScale = n => n.depth === 'far' || n.depth === 'background' ? .76 : n.depth === 'near' || n.depth === 'foreground' ? 1.04 : .89;
  function hash(value) { let h = 2166136261; for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  function random(seed) { let state = seed >>> 0; return () => { state += 0x6d2b79f5; let t = Math.imul(state ^ state >>> 15, 1 | state); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function line(ctx, a, b, width, color, alpha) { if (alpha <= .001) return; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  function dot(ctx, p, radius, color, alpha) { if (alpha <= .001) return; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); }
  function ring(ctx, p, radius, width, color, alpha) { if (alpha <= .001) return; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.stroke(); }
  const pointAt = (edge, t) => ({ x: edge.from.x + (edge.to.x - edge.from.x) * t, y: edge.from.y + (edge.to.y - edge.from.y) * t });

  function create(options = {}) {
    if (!Array.isArray(options.nodes)) throw new TypeError('SignalNetwork needs a nodes array.');
    const ids = new Set();
    const nodes = options.nodes.map((n, index) => {
      if (!n || typeof n.id !== 'string' || !n.id.length || ids.has(n.id)) throw new TypeError(`Node ${index} needs a unique, non-empty string id.`);
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y) || n.x < 0 || n.y < 0) throw new TypeError(`Node ${n.id} needs finite, non-negative coordinates.`);
      ids.add(n.id); return Object.freeze({ id: n.id, x: n.x, y: n.y, depth: n.depth || 'middle', kind: n.kind || 'peak' });
    });
    if (options.period !== undefined && (!Number.isFinite(options.period) || options.period <= 0)) throw new RangeError('The legacy period hint must be a positive number.');
    const seed = hash(options.seed === undefined ? 'mayu-asynchronous-9' : options.seed);
    const pool = nodes.filter((n, i) => !nodes.slice(0, i).some(p => distance(p, n) < .01));
    const people = pool.filter(isPerson), windows = new Map();
    const canTransmit = pool.length >= 2;
    const streams = [{ id: 0, offset: 0 }, { id: 1, offset: -19317 }];
    const clock = now => Number.isFinite(now) ? Math.max(0, now) : 0;

    function neighbor(from, used, rng, angle, local) {
      let choices = pool.filter(n => !used.has(n.id) && distance(n, from) > 42);
      if (!choices.length) choices = pool.filter(n => !used.has(n.id) && distance(n, from) > .01);
      if (!choices.length) return null;
      const desired = local ? 170 + rng() * 400 : 380 + rng() * 740;
      return choices.map(n => {
        const d = distance(n, from), dot = ((n.x - from.x) * Math.cos(angle) + (n.y - from.y) * Math.sin(angle)) / d;
        return { n, score: Math.abs(d - desired) + (1 - dot) * 210 + rng() * 330 };
      }).sort((a, b) => a.score - b.score)[0].n;
    }

    function makeEvent(stream, block, index, start, rng) {
      const id = `s${stream.id}:w${block}:e${index}`;
      const kindRoll = rng();
      let kind = kindRoll < .24 ? 'unicast' : kindRoll < .66 ? 'train' : 'fanout';
      if (stream.id === 1 && kind === 'fanout') kind = 'train';
      if (kind === 'fanout' && pool.length < 4) kind = pool.length < 3 ? 'unicast' : 'train';
      const packetCount = kind === 'unicast' ? 1 + Math.floor(rng() * 2) : kind === 'train' ? 2 + Math.floor(rng() * 4) : 2 + Math.floor(rng() * 3);
      const interval = 135 + rng() * 70, relayDelay = 80 + rng() * 35;
      const source = people.length && rng() < .25 ? people[Math.floor(rng() * people.length)] : pool[Math.floor(rng() * pool.length)];
      const edges = [], used = new Set([source.id]);
      const angle = rng() * Math.PI * 2;
      const travel = (a, b) => clamp(305 + distance(a, b) * .17, 390, 700);
      function add(packet, hop, branch, from, to, at, parent) {
        const edge = { id: `${id}:p${packet}:h${hop}:b${branch}`, event: id, kind, stream: stream.id, packet, hop, branch,
          parent, from, to, start: at, travel: travel(from, to), relayDelay: parent ? relayDelay : 0, afterglow: 165, packetInterval: interval };
        edges.push(edge); return edge;
      }
      if (kind === 'fanout' && pool.length >= 4) {
        const relay = neighbor(source, used, rng, angle, false); used.add(relay.id);
        const branches = Math.min(pool.length - 2, 2), targets = [];
        const outgoingAngle = Math.atan2(relay.y - source.y, relay.x - source.x);
        for (let branch = 0; branch < branches; branch++) {
          const to = neighbor(relay, used, rng, outgoingAngle + (branch - (branches - 1) / 2) * 1.5, false);
          if (!to) break; used.add(to.id); targets.push({ to, delay: rng() * 44 });
        }
        for (let p = 0; p < packetCount; p++) {
          const input = add(p, 0, 0, source, relay, start + p * interval, null);
          targets.forEach((target, branch) => add(p, 1, branch + 1, relay, target.to, input.start + input.travel + relayDelay + target.delay, input.id));
        }
      } else {
        const hops = kind === 'unicast' ? 1 : Math.min(pool.length - 1, 2);
        const route = [source]; let direction = angle;
        for (let hop = 0; hop < hops; hop++) {
          const to = neighbor(route.at(-1), used, rng, direction, kind === 'unicast');
          if (!to) break; used.add(to.id); direction = Math.atan2(to.y - route.at(-1).y, to.x - route.at(-1).x) + (rng() - .5) * 1.25; route.push(to);
        }
        for (let p = 0; p < packetCount; p++) {
          let parent = null, at = start + p * interval;
          for (let hop = 0; hop < route.length - 1; hop++) {
            const e = add(p, hop, 0, route[hop], route[hop + 1], at, parent?.id || null);
            parent = e; at = e.start + e.travel + relayDelay;
          }
        }
      }
      const end = edges.length ? Math.max(...edges.map(e => e.start + e.travel + e.afterglow)) : start;
      if (end - start > MAX_EVENT_MS) throw new RangeError('A planned event exceeded its bounded lifetime.');
      const links = new Map();
      for (const e of edges) {
        const key = `${e.from.id}>${e.to.id}`;
        if (!links.has(key)) links.set(key, { id: `${id}:${key}`, from: e.from, to: e.to, start: e.start, lastArrival: e.start + e.travel });
        else links.get(key).lastArrival = Math.max(links.get(key).lastArrival, e.start + e.travel);
      }
      return { id, stream: stream.id, window: block, index, kind, packetCount, interval, relayDelay, start, end,
        source, edges, links: [...links.values()], stationIds: [...used] };
    }

    function windowPlan(stream, block) {
      const key = `${stream.id}:${block}`; if (windows.has(key)) return windows.get(key);
      const rng = random(hash(`${seed}:${key}`)), left = stream.offset + block * WINDOW_MS, right = left + WINDOW_MS;
      let cursor = left + MAX_EVENT_MS + 120 + rng() * 1150;
      // Opening the scene has a single short warm start; later time never resets to it.
      if (stream.id === 0 && block === 0) cursor = 110 + rng() * 200;
      const events = []; let index = 0;
      const primary = [];
      if (stream.id === 1) {
        const first=Math.floor((left-MAX_EVENT_MS)/WINDOW_MS),last=Math.floor((right+MAX_EVENT_MS)/WINDOW_MS);
        for(let w=first;w<=last;w++)primary.push(...windowPlan(streams[0],w));
      }
      while (cursor < right) {
        const event = makeEvent(stream, block, index++, cursor, rng);
        if (stream.id === 1) {
          const sending=new Set(event.edges.map(e=>e.from.id));
          // A second event waits when its sender is already a two-way fan-out relay.
          // Shifting the complete event preserves every packet's parent-arrival delay.
          let conflict;
          while((conflict=primary.find(e=>e.kind==='fanout'&&e.start<event.end&&e.end>event.start&&e.edges.some(p=>p.hop===1&&sending.has(p.from.id))))){
            const delta=conflict.end+120+rng()*160-event.start;
            event.start+=delta;event.end+=delta;
            for(const e of event.edges)e.start+=delta;
            for(const l of event.links){l.start+=delta;l.lastArrival+=delta;}
          }
        }
        if(event.start>=right)break;
        if (event.start >= 0) events.push(event);
        cursor = event.end + 500 + rng() * 1500;
      }
      windows.set(key, events);
      if (windows.size > 14) windows.delete(windows.keys().next().value);
      return events;
    }

    function timeline(now) {
      if (!canTransmit) return [];
      const result = [];
      for (const stream of streams) {
        const block = Math.floor((now - stream.offset) / WINDOW_MS);
        for (let w = block - 1; w <= block + 1; w++) result.push(...windowPlan(stream, w));
      }
      return result.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
    }

    function frame(now) {
      const events = timeline(now), current = events.filter(e => e.start <= now && now < e.end), edges = current.flatMap(e => e.edges);
      const visibleLinks = current.flatMap(e => e.links).filter(l => now >= l.start - 28 && now < l.lastArrival + 145);
      const activeNodes = new Map();
      for (const l of visibleLinks) { activeNodes.set(l.from.id, l.from); activeNodes.set(l.to.id, l.to); }
      const next = events.find(e => e.start > now);
      return { current, edges, visibleLinks, activeNodes: [...activeNodes.values()], active: current.length > 0, nextWake: current.length ? 0 : next ? next.start - now : Infinity };
    }

    function packetState(edge, now) {
      const age = now - edge.start, progress = clamp(age / edge.travel, 0, 1), moving = age >= 0 && age < edge.travel;
      const tail = Math.min(.14, 75 / Math.max(1, distance(edge.from, edge.to)));
      return { age, progress, tailStart: Math.max(0, progress - tail), moving, alpha: moving ? Math.min(1, age / 25) : 0,
        visible: age >= 0 && age < edge.travel + edge.afterglow };
    }

    function drawLink(ctx, link, now, staticMode) {
      const depth = (depthScale(link.from) + depthScale(link.to)) / 2;
      const opacity = staticMode ? .18 : clamp((now - link.start + 28) / 65, 0, 1) * (1 - clamp((now - link.lastArrival) / 145, 0, 1));
      ctx.globalCompositeOperation = 'screen';
      line(ctx, link.from, link.to, depth * 14, '#a7eaff', opacity * .065);
      line(ctx, link.from, link.to, depth * 3.5, '#bafaff', opacity * .32);
      line(ctx, link.from, link.to, depth * 1.65, '#f4ffff', opacity * .59);
    }

    function drawPacket(ctx, edge, now) {
      const s = packetState(edge, now); if (!s.moving || s.alpha <= .001) return;
      const depth = (depthScale(edge.from) + depthScale(edge.to)) / 2;
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 12; i++) {
        const a = s.tailStart + (s.progress - s.tailStart) * i / 12, b = s.tailStart + (s.progress - s.tailStart) * (i + 1) / 12;
        const strength = Math.pow((i + 1) / 12, 2.1) * s.alpha, aa = pointAt(edge, a), bb = pointAt(edge, b);
        line(ctx, aa, bb, depth * 27, '#a9ecff', strength * .18);
        line(ctx, aa, bb, depth * 9.3, '#aefbff', strength * .66);
        line(ctx, aa, bb, depth * 4.7, '#fcffff', strength);
      }
      const p = pointAt(edge, s.progress), closePerson = (isPerson(edge.from) && distance(p, edge.from) < 65) || (isPerson(edge.to) && distance(p, edge.to) < 65);
      const radius = (closePerson ? 17 : 41) * depth, glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      glow.addColorStop(0, '#ffffff'); glow.addColorStop(.13, '#d7ffff'); glow.addColorStop(.41, '#72edff45'); glow.addColorStop(1, '#a4eeff00');
      dot(ctx, p, radius, glow, s.alpha);
      ctx.globalCompositeOperation = 'screen'; dot(ctx, p, (closePerson ? 2.8 : 4.8) * depth, '#ffffff', s.alpha);
    }

    function drawResponses(ctx, edges, now) {
      const responses = new Map();
      for (const edge of edges) for (const event of [{ node: edge.from, at: edge.start, sending: true }, { node: edge.to, at: edge.start + edge.travel, sending: false }]) {
        const age = now - event.at, span = event.sending ? 105 : 165;
        if (age < 0 || age >= span) continue;
        const strength = 1 - age / span, old = responses.get(event.node.id);
        if (!old || old.strength < strength) responses.set(event.node.id, { ...event, age, span, strength });
      }
      ctx.globalCompositeOperation = 'screen';
      for (const r of responses.values()) {
        const p = r.node, person = isPerson(p), scale = depthScale(p), expansion = r.age / r.span;
        const radius = (person ? 3.5 + expansion * 8.5 : 5 + expansion * (r.sending ? 13 : 19)) * scale;
        ctx.globalCompositeOperation = 'screen'; ring(ctx, p, radius, 2.5 * scale, '#d9ffff', r.strength * .88);
        const haloRadius=(person?15:33)*scale,halo=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,haloRadius);
        halo.addColorStop(0,'#ddffff');halo.addColorStop(.25,'#8ff7ff4d');halo.addColorStop(1,'#a5efff00');
        dot(ctx,p,haloRadius,halo,r.strength*.76);
        dot(ctx, p, (person ? 2.5 : 4.1) * scale, '#ffffff', .98 * r.strength);
      }
    }

    function render(ctx, config = {}) {
      const now = clock(config.now), reduced = !!config.reducedMotion;
      const current = frame(reduced ? 750 : now);
      const active = !reduced && current.active;
      if (!ctx || (!active && !reduced)) return active;
      ctx.save();
      try {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (reduced) {
          // A stable, sparse topology is sufficient when motion is reduced.
          const links = current.visibleLinks.slice(0, 2);
          for (const l of links) drawLink(ctx, l, 750, true);
          const points = new Map(); for (const l of links) { points.set(l.from.id, l.from); points.set(l.to.id, l.to); }
          ctx.globalCompositeOperation = 'screen';
          for (const n of points.values()) dot(ctx, n, (isPerson(n) ? 1.5 : 2) * depthScale(n), '#eafcff', .2);
        } else {
          for (const l of current.visibleLinks) drawLink(ctx, l, now, false);
          ctx.globalCompositeOperation = 'screen';
          for (const n of current.activeNodes) dot(ctx, n, (isPerson(n) ? 1.8 : 2.6) * depthScale(n), '#eafcff', .24);
          for (const edge of current.edges) drawPacket(ctx, edge, now);
          drawResponses(ctx, current.edges, now);
        }
      } finally { ctx.restore(); }
      return active;
    }

    function nextWake(now) { return frame(clock(now)).nextWake; }
    function snapshot(now = 0) {
      const time = clock(now), current = frame(time);
      return {
        now: time, periodic: false, period: options.period === undefined ? null : options.period,
        planningWindow: WINDOW_MS, maxEventLifetime: MAX_EVENT_MS, maxActiveLinks: MAX_ACTIVE_LINKS,
        active: current.active, nextWake: current.nextWake, nodeCount: nodes.length,
        graphEdgeCount: pool.length * (pool.length - 1), activeEdgeCount: current.visibleLinks.length,
        activeNodes: current.activeNodes.map(n => ({ ...n })),
        events: current.current.map(e => ({ id: e.id, stream: e.stream, kind: e.kind, start: e.start, end: e.end, packetCount: e.packetCount,
          packetInterval: e.interval, relayDelay: e.relayDelay, source: e.source.id, stations: e.stationIds.slice(), window: e.window })),
        edges: current.edges.map(e => ({ id: e.id, event: e.event, route: e.event, kind: e.kind, stream: e.stream, packet: e.packet, hop: e.hop, branch: e.branch, parent: e.parent,
          from: e.from.id, to: e.to.id, fromKind: e.from.kind, toKind: e.to.kind, fromPoint: { x: e.from.x, y: e.from.y }, toPoint: { x: e.to.x, y: e.to.y },
          start: e.start, born: e.start, duration: e.travel, afterglow: e.afterglow, relayDelay: e.relayDelay, packetInterval: e.packetInterval, ...packetState(e, time) }))
      };
    }
    return Object.freeze({ nodes: Object.freeze(nodes), period: options.period === undefined ? null : options.period, activeWindow: null,
      render, nextWake, snapshot, sample: snapshot });
  }
  return Object.freeze({ create, DEFAULT_PERIOD, ACTIVE_MS: MAX_EVENT_MS, WINDOW_MS, MAX_EVENT_MS, MAX_ACTIVE_LINKS });
});
