/* global React, Peer */

// ============================================================
// FRIEND MODE — real cross-browser play over WebRTC (PeerJS).
//
// Architecture:
//   - HOST is authoritative for ALL game state. They run the full
//     simulation just like the bot version, but instead of a bot,
//     a real guest player drives the "opp" side via messages.
//   - GUEST receives full state snapshots (in their own POV: their
//     state in `me`, host's state in `opp`) and just forwards inputs.
//
// Wire protocol (JSON over PeerJS data channel):
//   GUEST → HOST:
//     { t: 'hello',   name }                — initial handshake, name reveal
//     { t: 'submit',  value, dunno }        — answer submission
//     { t: 'powerup', idx }                 — use powerup at index
//     { t: 'rematch' }                      — request rematch from match-end
//     { t: 'name',    name }                — name update from lobby
//   HOST → GUEST:
//     { t: 'lobby',   config, names }       — broadcast lobby state
//     { t: 'state',   payload }             — full game state, guest POV
//     { t: 'note',    text, kind }          — toast (e.g. host disconnected)
//
// Connection is established through `0.peerjs.com` (PeerJS's free
// public broker). We use a namespaced peer id so we don't collide
// with other apps using the same broker.
// ============================================================

const { useState: useStateF, useEffect: useEffectF, useRef: useRefF } = React;

// ----------------------------------------------------------------
// Code generation + peer-id helpers
// ----------------------------------------------------------------

const PEER_NAMESPACE = "kanabattle-v1-";
// Excludes I/O/0/1 to avoid ambiguous-looking codes when shared verbally.
const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let c = "";
  for (let i = 0; i < 6; i++) c += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return c;
}
const peerIdFor = (code) => PEER_NAMESPACE + code.toUpperCase().trim();

function normalizeRoomCode(s) {
  return (s || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

// ----------------------------------------------------------------
// FriendController — wraps PeerJS, exposes a tiny event API.
// ----------------------------------------------------------------

class FriendController {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.role = null;
    this.code = null;
    this.handlers = {};
  }
  on(type, fn) {
    (this.handlers[type] = this.handlers[type] || []).push(fn);
  }
  emit(type, payload) {
    (this.handlers[type] || []).forEach(fn => { try { fn(payload); } catch {} });
  }
  clearHandlers() { this.handlers = {}; }

  async hostCreate(retries = 4) {
    this.role = 'host';
    const tryOnce = () => new Promise((resolve, reject) => {
      const code = generateRoomCode();
      const peer = new Peer(peerIdFor(code), {});
      let done = false;
      peer.on('open', () => {
        if (done) return; done = true;
        this.peer = peer;
        this.code = code;
        peer.on('connection', (c) => this._acceptIncoming(c));
        peer.on('error', (err) => this.emit('error', err));
        peer.on('disconnected', () => this.emit('disconnected', null));
        resolve(code);
      });
      peer.on('error', (err) => {
        if (done) return; done = true;
        try { peer.destroy(); } catch {}
        reject(err);
      });
    });
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try { return await tryOnce(); }
      catch (e) {
        lastErr = e;
        // unavailable-id collision → just try again with a fresh code
        if (e && e.type === 'unavailable-id') continue;
        // network / signaling error → bail
        throw e;
      }
    }
    throw lastErr || new Error("Couldn't open a room");
  }

  _acceptIncoming(conn) {
    if (this.conn && this.conn.open) {
      // already have a friend, reject second connector
      try { conn.send({ t: 'note', text: 'Room is full', kind: 'error' }); } catch {}
      setTimeout(() => { try { conn.close(); } catch {} }, 200);
      return;
    }
    this.conn = conn;
    conn.on('open', () => this.emit('connected', null));
    conn.on('data', (msg) => this.emit('msg', msg));
    conn.on('close', () => this.emit('disconnected', null));
    conn.on('error', (err) => this.emit('error', err));
  }

  async guestJoin(rawCode) {
    this.role = 'guest';
    const code = normalizeRoomCode(rawCode);
    if (code.length !== 6) throw new Error("Code must be 6 characters.");
    this.code = code;
    const peer = new Peer(undefined, {});
    this.peer = peer;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (err) => {
        if (settled) return; settled = true;
        if (err) reject(err); else resolve();
      };
      peer.on('open', () => {
        const conn = peer.connect(peerIdFor(code), { reliable: true });
        this.conn = conn;
        const timer = setTimeout(() => {
          if (!conn.open) {
            try { conn.close(); } catch {}
            finish(new Error("Couldn't find a room with that code."));
          }
        }, 12000);
        conn.on('open', () => {
          clearTimeout(timer);
          conn.on('data', (msg) => this.emit('msg', msg));
          conn.on('close', () => this.emit('disconnected', null));
          conn.on('error', (err) => this.emit('error', err));
          this.emit('connected', null);
          finish();
        });
        conn.on('error', (err) => { clearTimeout(timer); finish(err); });
      });
      peer.on('error', (err) => {
        // peer-unavailable means the host code doesn't exist
        if (err && (err.type === 'peer-unavailable' || /could not connect/i.test(err.message || ''))) {
          finish(new Error("Couldn't find a room with that code."));
        } else if (!settled) {
          finish(err);
        } else {
          this.emit('error', err);
        }
      });
    });
  }

  send(msg) {
    if (this.conn && this.conn.open) {
      try { this.conn.send(msg); } catch {}
    }
  }

  // Guest-only: re-open the data channel against the same room code.
  // The Peer (broker connection) stays alive on conn-close, so this is
  // a fresh `peer.connect` rather than rebuilding the whole peer.
  async guestReconnect() {
    if (this.role !== 'guest') throw new Error('host doesn\'t reconnect; it waits');
    if (!this.peer || this.peer.destroyed) throw new Error('peer destroyed');
    if (!this.code) throw new Error('no room code on file');
    // If the broker disconnected us, re-establish first.
    if (this.peer.disconnected) {
      try { this.peer.reconnect(); } catch {}
      // Wait briefly for broker reconnect
      await new Promise(res => setTimeout(res, 600));
    }
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(peerIdFor(this.code), { reliable: true });
      this.conn = conn;
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return; settled = true;
        try { conn.close(); } catch {}
        reject(new Error('reconnect timeout'));
      }, 6000);
      conn.on('open', () => {
        if (settled) return; settled = true;
        clearTimeout(timer);
        conn.on('data', (msg) => this.emit('msg', msg));
        conn.on('close', () => this.emit('disconnected', null));
        conn.on('error', (err) => this.emit('error', err));
        this.emit('connected', null);
        resolve();
      });
      conn.on('error', (err) => {
        if (settled) return; settled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  disconnect() {
    if (this.conn) { try { this.conn.close(); } catch {} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch {} this.peer = null; }
    this.role = null;
    this.code = null;
    this.clearHandlers();
  }
}

// ============================================================
// HOST-SIDE GAME LOGIC
//
// Mirror of app.jsx's ranked-mode rules engine, but:
//   - both `me` and `opp` carry full deck arrays (host owns both)
//   - bot AI is gone; opp's actions come from guest messages
//   - no per-round modifier vote (host's config is fixed for match)
//   - no ELO updates
//
// Each mutator function takes a draft `n` (next state) and mutates
// in place; the React wrapper around them produces a fresh copy first.
// ============================================================

const DEFAULT_FRIEND_CONFIG = {
  hp: 40,
  deckSize: 10,
  rulesetIds: ["full_hira"],
  modifiers: [],
  powerupsEnabled: true
};

function mergedCharsFor(rulesetIds) {
  const seen = new Set();
  const merged = [];
  (rulesetIds || []).forEach(id => {
    const r = window.RULESET_MAP[id];
    if (!r) return;
    r.chars.forEach(c => { if (!seen.has(c)) { seen.add(c); merged.push(c); } });
  });
  return merged;
}

function rulesetDescriptorFor(config) {
  const ids = config.rulesetIds || [];
  if (ids.length === 1) {
    const r = window.RULESET_MAP[ids[0]];
    if (r) return { id: r.id, name: r.name, glyph: r.glyph, chars: r.chars };
  }
  const chars = mergedCharsFor(ids);
  return {
    id: "_friend_custom",
    name: ids.length > 1 ? `${ids.length} decks · ${chars.length} chars` : "Custom",
    glyph: "友",
    chars
  };
}

function makeFriendPlayer(name, avatar, hp) {
  return {
    name, avatar,
    rank: 0,                  // unused in friend mode
    health: hp, maxHealth: hp,
    deck: [],
    correct: 0,
    incorrect: 0,
    charStats: {},
    powerups: [],
    buffs: { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 },
    input: "",
    flash: null,
    combo: 0, bankedCards: 0, comboFlash: 0,
    deckCount: 0              // mirrors deck.length for the render
  };
}

function pickRandomN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

// Build the host's initial pre-match state, BEFORE any decks are dealt.
// Decides between going straight to the VS splash (single deck → no vote)
// or kicking off a ruleset vote (multi-deck pool).
function friendStartFromLobby(config, hostName, guestName) {
  const cfg = { ...DEFAULT_FRIEND_CONFIG, ...config };
  const hp = Math.max(5, Math.min(99, cfg.hp));
  const me = makeFriendPlayer(hostName || "host", "\u79c1", hp);
  const opp = makeFriendPlayer(guestName || "friend", "\u79c1", hp);
  const houseRules = [...(cfg.modifiers || [])];

  const ids = (cfg.rulesetIds || []).filter(id => window.RULESET_MAP[id]);
  // Cap vote pool at 4 like ranked. If host picked more, sample 4 randomly
  // each match so repeated rematches don't always show the same 4.
  const poolIds = ids.length <= 4 ? ids : pickRandomN(ids, 4);
  const options = poolIds.map(id => window.RULESET_MAP[id]);

  const base = {
    me, opp,
    ruleset: null,
    modifiers: [...houseRules],
    houseRules,
    roundModifiers: [],
    config: cfg,
    round: 0,
    roundWinner: null,
    matchWinner: null,
    log: [],
    rulesetVote: null,
    modVote: null,
    countdown: null
  };

  if (options.length >= 2) {
    base.phase = "friend-ruleset-vote";
    base.rulesetVote = { options, me: null, opp: null, tiebreak: null, resolved: null };
  } else {
    base.ruleset = options[0] || rulesetDescriptorFor(cfg);
    base.phase = "friend-vs";
  }
  return base;
}

// Register a vote in the current ruleset-vote.
function friendVoteRuleset(state, who, id) {
  if (state.phase !== "friend-ruleset-vote" || !state.rulesetVote) return;
  if (state.rulesetVote[who] != null) return;
  state.rulesetVote[who] = id;
}

// Lock in the winning ruleset and transition to VS.
function friendCommitRuleset(state, rulesetId) {
  const fromOptions = (state.rulesetVote?.options || []).find(x => x.id === rulesetId);
  const r = fromOptions || window.RULESET_MAP[rulesetId];
  if (!r) return;
  state.ruleset = r;
  if (state.rulesetVote) state.rulesetVote.resolved = r;
  state.phase = "friend-vs";
}

// Generate round-1 decks and transition into battle (called after VS splash).
function friendStartRound1(state) {
  const cfg = state.config;
  let deckSize = cfg.deckSize;
  if (state.modifiers.includes("small_deck")) deckSize = 7;
  if (state.modifiers.includes("big_deck"))   deckSize = 14;
  state.round = 1;
  state.me.deck = window.makeDeckFromChars(deckSize, state.ruleset.chars);
  state.opp.deck = window.makeDeckFromChars(deckSize, state.ruleset.chars);
  state.me.deckCount = state.me.deck.length;
  state.opp.deckCount = state.opp.deck.length;
  state.phase = "friend-battle";
  const modNames = state.modifiers.map(m => window.MOD_MAP[m]?.name).filter(Boolean).join(" + ");
  state.log.unshift({
    t: `ROUND 1 \u2014 ${state.ruleset.name.toUpperCase()}${modNames ? " \u00b7 " + modNames : ""}`,
    kind: "round", at: Date.now()
  });
}

// Open a modifier vote between rounds. Pulls 3 random options from the
// MODIFIERS table, excluding any house rules already active for the match.
function friendStartModVote(state) {
  const pool = window.MODIFIERS.filter(m => !state.houseRules.includes(m.id));
  if (pool.length === 0) {
    // Host enabled every modifier as a house rule; skip the vote.
    state.modVote = null;
    state.roundModifiers = [];
    state.countdown = 3;
    state.phase = "friend-countdown";
    return;
  }
  const n = Math.min(3, pool.length);
  const options = pickRandomN(pool, n);
  state.modVote = { options, me: null, opp: null };
  state.phase = "friend-modifier-pick";
}

function friendVoteMod(state, who, id) {
  if (state.phase !== "friend-modifier-pick" || !state.modVote) return;
  if (state.modVote[who] != null) return;
  state.modVote[who] = id;
}

function friendCommitMods(state) {
  if (!state.modVote) return;
  const picks = Array.from(new Set([state.modVote.me, state.modVote.opp].filter(Boolean)));
  state.roundModifiers = picks;
  // House rules ALWAYS apply; per-round picks stack on top.
  state.modifiers = Array.from(new Set([...state.houseRules, ...picks]));
  state.modVote = null;
  state.countdown = 3;
  state.phase = "friend-countdown";
}

// Equivalent of fStartNextRound but respects deck-size modifiers and the
// house-rules + per-round-pick combined modifier list.
function friendBeginNextRound(state) {
  const cfg = state.config;
  let deckSize = cfg.deckSize;
  if (state.modifiers.includes("small_deck")) deckSize = 7;
  if (state.modifiers.includes("big_deck"))   deckSize = 14;
  state.round += 1;
  state.me.deck = window.makeDeckFromChars(deckSize, state.ruleset.chars);
  state.opp.deck = window.makeDeckFromChars(deckSize, state.ruleset.chars);
  state.me.deckCount = state.me.deck.length;
  state.opp.deckCount = state.opp.deck.length;
  state.me.buffs = { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 };
  state.opp.buffs = { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 };
  state.me.combo = 0; state.me.bankedCards = 0;
  state.opp.combo = 0; state.opp.bankedCards = 0;
  state.me.input = ""; state.me.flash = null;
  state.opp.input = ""; state.opp.flash = null;
  if (state.modifiers.includes("starter_hp")) {
    state.me.health = Math.min(state.me.maxHealth, state.me.health + 3);
    state.opp.health = Math.min(state.opp.maxHealth, state.opp.health + 3);
  }
  state.roundWinner = null;
  state.countdown = null;
  state.phase = "friend-battle";
  const modNames = state.modifiers.map(m => window.MOD_MAP[m]?.name).filter(Boolean).join(" + ") || "no modifiers";
  state.log.unshift({
    t: `ROUND ${state.round} \u2014 ${modNames.toUpperCase()}`,
    kind: "round", at: Date.now()
  });
}

// Build the host's initial friend-battle state for round 1.
function friendInitMatch(config, hostName, guestName) {
  const cfg = { ...DEFAULT_FRIEND_CONFIG, ...config };
  const ruleset = rulesetDescriptorFor(cfg);
  const hp = Math.max(5, Math.min(99, cfg.hp));
  const deckSize = Math.max(3, Math.min(25, cfg.deckSize));

  const me = makeFriendPlayer(hostName || "host", "私", hp);
  const opp = makeFriendPlayer(guestName || "friend", "友", hp);
  me.deck = window.makeDeckFromChars(deckSize, ruleset.chars);
  opp.deck = window.makeDeckFromChars(deckSize, ruleset.chars);
  me.deckCount = me.deck.length;
  opp.deckCount = opp.deck.length;

  return {
    phase: "friend-battle",
    round: 1,
    me, opp,
    ruleset,
    modifiers: cfg.modifiers || [],
    config: cfg,
    roundWinner: null,
    matchWinner: null,
    log: [{ t: `ROUND 1 — ${ruleset.name.toUpperCase()}`, kind: "round", at: Date.now() }]
  };
}

// --- damage / cards plumbing ---

function fAddCards(n, target, count) {
  const cap = window.DECK_CAP || 25;
  const t = n[target];
  const room = Math.max(0, cap - t.deck.length);
  const added = Math.min(room, count);
  const overflow = count - added;
  if (added > 0) {
    t.deck.push(...window.makeDeckFromChars(added, n.ruleset.chars));
  }
  t.deckCount = t.deck.length;
  if (overflow > 0) {
    t.health = Math.max(0, t.health - overflow);
    const who = target === 'me' ? "you" : n[target].name;
    n.log.unshift({ t: `${who} deck overflow — ${overflow} damage`, kind: "round", at: Date.now() });
    if (t.health <= 0) {
      fEndMatch(n, target === 'me' ? 'opp' : 'me');
    }
  }
}

function fSendCardsFromTo(n, attacker, count) {
  const defender = attacker === "me" ? "opp" : "me";
  const A = n[attacker], D = n[defender];
  const attackerLabel = attacker === "me" ? "you" : A.name;
  const defenderLabel = defender === "me" ? "you" : D.name;
  const possA = attacker === "me" ? "your" : `${A.name}'s`;
  let landed = 0;
  for (let i = 0; i < count; i++) {
    if (D.buffs.shield) {
      D.buffs.shield = false;
      n.log.unshift({ t: `${possA} card blocked by ${defender === "me" ? "your" : D.name + "'s"} shield`, kind: "block", at: Date.now() });
      continue;
    }
    if (D.buffs.reflect) {
      D.buffs.reflect = false;
      fAddCards(n, attacker, 1);
      n.log.unshift({ t: `${defenderLabel} reflected a card!`, kind: "reflect", at: Date.now() });
      continue;
    }
    fAddCards(n, defender, 1);
    landed++;
  }
  if (landed > 0) {
    n.log.unshift({ t: `${attackerLabel} sent ${landed > 1 ? landed + " cards" : "a card"} to ${defenderLabel}`, kind: "send", at: Date.now() });
  }
  return landed;
}

function fBankOrSend(n, attacker, count) {
  const a = n[attacker];
  a.combo += 1;
  a.comboFlash = Date.now();
  a.bankedCards += count;
}

function fReleaseCombo(n, attacker) {
  const a = n[attacker];
  if (a.bankedCards <= 0 && a.combo <= 0) return;
  const banked = a.bankedCards, streak = a.combo;
  a.bankedCards = 0; a.combo = 0;
  if (banked <= 0) return;
  const threshold = window.COMBO_THRESHOLD || 3;
  const mult = window.COMBO_MULTIPLIER || 1.5;
  const useMult = streak >= threshold;
  const send = useMult ? Math.floor(banked * mult) : banked;
  if (useMult) {
    const who = attacker === "me" ? "your" : `${n[attacker].name}'s`;
    n.log.unshift({ t: `${who} ×${streak} combo released — ${send} cards (${banked}×${mult})`, kind: "round", at: Date.now() });
  }
  fSendCardsFromTo(n, attacker, send);
}

function fEndRound(n, winner) {
  const loser = winner === "me" ? "opp" : "me";
  const L = n[loser];
  let dmg = L.deck.length;
  if (n.modifiers.includes("glass_cannon")) dmg *= 2;
  L.health = Math.max(0, L.health - dmg);
  n.roundWinner = winner;
  n.log.unshift({ t: `${winner === "me" ? "you" : n[winner].name} cleared deck — ${dmg} dmg`, kind: "round", at: Date.now() });
  n.me.combo = 0; n.me.bankedCards = 0;
  n.opp.combo = 0; n.opp.bankedCards = 0;
  if (L.health <= 0) {
    fEndMatch(n, winner);
  } else {
    n.phase = "friend-round-end";
  }
}

function fEndMatch(n, winner) {
  n.phase = "friend-match-end";
  n.matchWinner = winner;
  n.roundWinner = winner;
}

function fStartNextRound(n) {
  const cfg = n.config;
  n.round += 1;
  n.me.deck = window.makeDeckFromChars(cfg.deckSize, n.ruleset.chars);
  n.opp.deck = window.makeDeckFromChars(cfg.deckSize, n.ruleset.chars);
  n.me.deckCount = n.me.deck.length;
  n.opp.deckCount = n.opp.deck.length;
  n.me.buffs = { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 };
  n.opp.buffs = { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 };
  n.me.combo = 0; n.me.bankedCards = 0;
  n.opp.combo = 0; n.opp.bankedCards = 0;
  n.me.input = ""; n.me.flash = null;
  n.opp.input = ""; n.opp.flash = null;
  n.roundWinner = null;
  n.phase = "friend-battle";
  n.log.unshift({
    t: `ROUND ${n.round} — ${n.ruleset.name.toUpperCase()}`,
    kind: "round", at: Date.now()
  });
}

function fRollPowerup(n) {
  if (!n.config.powerupsEnabled) return null;
  const rate = n.modifiers.includes("lucky") ? 0.5 : 0.28;
  if (Math.random() > rate) return null;
  return window.POWERUPS[Math.floor(Math.random() * window.POWERUPS.length)].id;
}

function fRecordStat(player, char, correct) {
  const s = player.charStats[char] || { correct: 0, incorrect: 0 };
  if (correct) s.correct++; else s.incorrect++;
  player.charStats[char] = s;
  if (correct) player.correct++; else player.incorrect++;
}

// --- main action: a player answers ---

function friendApplyAnswer(n, who, value, dunno) {
  if (n.phase !== "friend-battle") return;
  const A = n[who];
  const other = who === "me" ? "opp" : "me";
  if (!A.deck.length) return;
  // Frozen players can dunno but can't submit text.
  if (A.buffs.frozenUntil > Date.now() && !dunno) return;

  const char = A.deck[0];
  const guess = (value || "").trim().toLowerCase();
  const correct = !dunno && window.isCorrectRomaji(char, guess);
  const reveal = window.displayRomaji(char);
  A.input = "";

  if (dunno) {
    fRecordStat(A, char, false);
    A.deck = A.deck.slice(1);
    A.deckCount = A.deck.length;
    const penalty = n.modifiers.includes("no_dunno") ? 5 : 3;
    fAddCards(n, who, penalty);
    A.flash = { kind: "dunno", at: Date.now(), answer: reveal };
    n.log.unshift({ t: `${who === "me" ? "you" : A.name} skipped ${char} — +${penalty} cards`, kind: "skip", at: Date.now() });
  } else if (correct) {
    fRecordStat(A, char, true);
    A.deck = A.deck.slice(1);
    A.deckCount = A.deck.length;
    A.flash = { kind: "correct", at: Date.now(), answer: reveal };

    fReleaseCombo(n, other);

    if (n.modifiers.includes("vampire") && A.correct % 5 === 0) {
      A.health = Math.min(A.maxHealth, A.health + 1);
      n.log.unshift({ t: `${who === "me" ? "you" : A.name} vampire +1 HP`, kind: "drop", at: Date.now() });
    }

    let sends = 1;
    if (A.buffs.bolt) { sends = 2; A.buffs.bolt = false; }
    if (n.modifiers.includes("double_send")) sends *= 2;
    fBankOrSend(n, who, sends);

    const drop = fRollPowerup(n);
    if (drop && A.powerups.length < 4) {
      A.powerups.push(drop);
      n.log.unshift({ t: `${who === "me" ? "you" : A.name} found ${window.POWERUP_MAP[drop].name}!`, kind: "drop", at: Date.now() });
    }
    if (A.buffs.peek > 0) A.buffs.peek -= 1;

    if (n.phase === "friend-battle" && A.deck.length === 0) fEndRound(n, who);
  } else {
    fRecordStat(A, char, false);
    if (n.modifiers.includes("tax")) fAddCards(n, who, 1);
  }
}

// --- main action: a player uses a powerup ---

function friendApplyPowerup(n, who, idx) {
  if (n.phase !== "friend-battle") return;
  const A = n[who];
  const other = who === "me" ? "opp" : "me";
  const pid = A.powerups[idx];
  if (!pid) return;
  A.powerups = A.powerups.filter((_, i) => i !== idx);
  const def = window.POWERUP_MAP[pid];
  if (pid === "shield") A.buffs.shield = true;
  else if (pid === "bolt") A.buffs.bolt = true;
  else if (pid === "reflect") A.buffs.reflect = true;
  else if (pid === "peek") A.buffs.peek = 3;
  else if (pid === "freeze") n[other].buffs.frozenUntil = Date.now() + 3000;
  else if (pid === "purge") {
    A.deck = A.deck.slice(1);
    A.deckCount = A.deck.length;
    // Purging the last card clears our deck — we win the round.
    if (n.phase === "friend-battle" && A.deck.length === 0) fEndRound(n, who);
  }
  n.log.unshift({ t: `${who === "me" ? "you" : A.name} used ${def.name}`, kind: "powerup", at: Date.now() });
}

// --- guest POV: swap me/opp and hide host's deck contents ---

function friendBuildGuestView(n) {
  if (!n || !n.me || !n.opp) return null;
  const swapWinner = (w) => w == null ? null : (w === "me" ? "opp" : "me");
  // Swap any vote state from host POV → guest POV.
  const swapVote = (v) => v ? { ...v, me: v.opp, opp: v.me } : null;
  return {
    phase: n.phase,
    round: n.round,
    ruleset: n.ruleset,
    modifiers: n.modifiers,
    houseRules: n.houseRules,
    roundModifiers: n.roundModifiers,
    rulesetVote: swapVote(n.rulesetVote),
    modVote: swapVote(n.modVote),
    countdown: n.countdown,
    log: n.log,
    roundWinner: swapWinner(n.roundWinner),
    matchWinner: swapWinner(n.matchWinner),
    me: {
      name: n.opp.name, avatar: n.opp.avatar, rank: 0,
      health: n.opp.health, maxHealth: n.opp.maxHealth,
      deck: n.opp.deck.slice(),
      deckCount: n.opp.deck.length,
      correct: n.opp.correct, incorrect: n.opp.incorrect,
      charStats: {},                 // guest tracks its own char stats locally
      powerups: n.opp.powerups.slice(),
      buffs: { ...n.opp.buffs },
      input: "", flash: n.opp.flash,
      combo: n.opp.combo, bankedCards: n.opp.bankedCards, comboFlash: n.opp.comboFlash
    },
    opp: {
      name: n.me.name, avatar: n.me.avatar, rank: 0,
      health: n.me.health, maxHealth: n.me.maxHealth,
      deckCount: n.me.deck.length,
      powerups: n.me.powerups.slice(),
      buffs: { ...n.me.buffs },
      combo: n.me.combo, bankedCards: n.me.bankedCards, comboFlash: n.me.comboFlash,
      flash: n.me.flash
    }
  };
}

// ============================================================
// SCREENS
// ============================================================

function ensureFriendStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("friend-styles-injected")) return;
  const s = document.createElement("style");
  s.id = "friend-styles-injected";
  s.textContent = FRIEND_STYLES;
  document.head.appendChild(s);
}

// ----- entry screen: host or join -----

function FriendMenuScreen({ onHost, onJoin, onBack }) {
  useEffectF(() => { ensureFriendStyles(); }, []);
  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="mm-back" onClick={onBack}>← MENU</button>
      <div className="splash-content fr-menu-wrap">
        <div className="fr-menu-header">
          <div className="fr-menu-glyph">友</div>
          <div className="fr-menu-title">PLAY WITH A FRIEND</div>
          <div className="fr-menu-sub">private match · no ELO · char stats still track</div>
        </div>
        <div className="fr-menu-options">
          <button className="fr-menu-card host" onClick={onHost}>
            <div className="fr-menu-card-glyph">主</div>
            <div className="fr-menu-card-name">CREATE ROOM</div>
            <div className="fr-menu-card-desc">Get a 6-letter code, set the rules, share with your friend.</div>
            <div className="fr-menu-card-tag">HOST</div>
          </button>
          <button className="fr-menu-card join" onClick={onJoin}>
            <div className="fr-menu-card-glyph">客</div>
            <div className="fr-menu-card-name">JOIN ROOM</div>
            <div className="fr-menu-card-desc">Enter the 6-letter code your friend sent you.</div>
            <div className="fr-menu-card-tag">GUEST</div>
          </button>
        </div>
        <div className="fr-menu-footer">
          peer-to-peer · runs entirely between your two browsers
        </div>
      </div>
    </div>
  );
}

// ----- host lobby: code + config + waiting + start -----

function FriendHostLobbyScreen({
  code, status, error,
  guestName, guestConnected,
  config, setConfig,
  myName, setMyName,
  onStart, onCancel,
  copyState, onCopy
}) {
  useEffectF(() => { ensureFriendStyles(); }, []);
  const ready = guestConnected;

  const allRulesets = window.RULESETS;
  const selectedSet = new Set(config.rulesetIds);
  const toggleRs = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setConfig({ ...config, rulesetIds: Array.from(next) });
  };

  const totalChars = mergedCharsFor(config.rulesetIds).length;

  const toggleMod = (id) => {
    const has = config.modifiers.includes(id);
    setConfig({
      ...config,
      modifiers: has ? config.modifiers.filter(m => m !== id) : [...config.modifiers, id]
    });
  };

  return (
    <div className="screen splash fr-lobby-screen">
      <div className="splash-bg"></div>
      <button className="mm-back" onClick={onCancel}>← LEAVE ROOM</button>
      <div className="splash-content fr-lobby-wrap">

        <div className="fr-lobby-header">
          <div className="fr-eyebrow">ROOM CODE · share this with your friend</div>
          <div className={`fr-code ${status === "creating" ? "loading" : ""}`}>
            {status === "creating" ? "······" : code || "······"}
          </div>
          <div className="fr-code-actions">
            <button className="fr-code-btn" onClick={onCopy} disabled={!code}>
              {copyState === "copied" ? "✓ COPIED" :
               copyState === "failed" ? "× COPY FAILED — select manually" :
               "COPY CODE"}
            </button>
          </div>
          {error && <div className="fr-error">{error}</div>}
        </div>

        <div className="fr-lobby-grid">
          <div className="fr-lobby-col">
            <div className="fr-section-title">PLAYERS</div>
            <div className="fr-players">
              <div className="fr-player you">
                <div className="fr-player-avatar">私</div>
                <div className="fr-player-info">
                  <input
                    className="fr-name-input"
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value.slice(0, 16))}
                    placeholder="your name"
                  />
                  <div className="fr-player-role">HOST · YOU</div>
                </div>
                <div className="fr-player-dot ready"></div>
              </div>
              <div className={`fr-player friend ${guestConnected ? "connected" : "waiting"}`}>
                <div className="fr-player-avatar">{guestConnected ? "私" : "·"}</div>
                <div className="fr-player-info">
                  <div className="fr-player-name">
                    {guestConnected ? (guestName || "friend") : "waiting…"}
                  </div>
                  <div className="fr-player-role">GUEST</div>
                </div>
                <div className={`fr-player-dot ${guestConnected ? "ready" : "wait"}`}></div>
              </div>
            </div>

            <div className="fr-section-title">RULES</div>
            <div className="fr-rules">
              <div className="fr-rule-row">
                <div className="fr-rule-label">
                  <span>STARTING HP</span>
                  <span className="fr-rule-val">{config.hp}</span>
                </div>
                <input
                  type="range"
                  min={10} max={60} step={1}
                  value={config.hp}
                  onChange={(e) => setConfig({ ...config, hp: parseInt(e.target.value) })}
                  className="fr-slider"
                />
              </div>
              <div className="fr-rule-row">
                <div className="fr-rule-label">
                  <span>DECK SIZE</span>
                  <span className="fr-rule-val">{config.deckSize}</span>
                </div>
                <input
                  type="range"
                  min={5} max={20} step={1}
                  value={config.deckSize}
                  onChange={(e) => setConfig({ ...config, deckSize: parseInt(e.target.value) })}
                  className="fr-slider"
                />
              </div>
              <div className="fr-rule-row toggle">
                <label className="fr-toggle">
                  <input
                    type="checkbox"
                    checked={config.powerupsEnabled}
                    onChange={(e) => setConfig({ ...config, powerupsEnabled: e.target.checked })}
                  />
                  <span className="fr-toggle-box"></span>
                  <span className="fr-toggle-label">POWER-UPS</span>
                </label>
                <span className="fr-toggle-sub">drops on correct answers</span>
              </div>
            </div>

            <div className="fr-section-title">MODIFIERS · {config.modifiers.length} active</div>
            <div className="fr-mods">
              {window.MODIFIERS.map(m => (
                <button
                  key={m.id}
                  className={`fr-mod ${config.modifiers.includes(m.id) ? "on" : ""}`}
                  onClick={() => toggleMod(m.id)}
                  title={m.desc}
                >
                  <span className="fr-mod-glyph">{m.glyph}</span>
                  <span className="fr-mod-name">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fr-lobby-col">
            <div className="fr-section-title">DECKS · {config.rulesetIds.length} selected · {totalChars} chars</div>
            <div className="fr-rs-list">
              {allRulesets.map(r => {
                const on = selectedSet.has(r.id);
                return (
                  <button
                    key={r.id}
                    className={`fr-rs ${on ? "on" : ""}`}
                    onClick={() => toggleRs(r.id)}
                  >
                    <span className={`fr-rs-check ${on ? "on" : ""}`}>{on ? "✓" : ""}</span>
                    <span className="fr-rs-glyph">{r.glyph}</span>
                    <span className="fr-rs-info">
                      <span className="fr-rs-name">{r.name}</span>
                      <span className="fr-rs-count">{r.chars.length} chars · {r.family}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fr-lobby-footer">
          <div className="fr-footer-status">
            {ready
              ? <span className="ready"><span className="dot ready"></span>READY · waiting on you</span>
              : <span className="waiting"><span className="dot wait"></span>WAITING FOR FRIEND TO JOIN</span>}
          </div>
          <button
            className="fr-start"
            disabled={!ready || config.rulesetIds.length === 0 || totalChars === 0}
            onClick={onStart}
          >
            START MATCH →
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- guest: enter code -----

function FriendGuestLobbyScreen({
  status, error, code, setCode,
  myName, setMyName,
  hostName, hostConfig,
  onJoin, onCancel
}) {
  useEffectF(() => { ensureFriendStyles(); }, []);
  const canJoin = code.length === 6 && status !== "connecting" && status !== "connected";

  // Once connected, show the read-only lobby state from host
  if (status === "connected" || status === "in-lobby") {
    return (
      <div className="screen splash fr-lobby-screen">
        <div className="splash-bg"></div>
        <button className="mm-back" onClick={onCancel}>← LEAVE ROOM</button>
        <div className="splash-content fr-lobby-wrap">

          <div className="fr-lobby-header">
            <div className="fr-eyebrow">CONNECTED · room {code}</div>
            <div className="fr-code connected">{code}</div>
          </div>

          <div className="fr-guest-status-card">
            <div className="fr-guest-status-title">WAITING FOR HOST TO START</div>
            <div className="fr-guest-status-spinner">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div className="fr-section-title">PLAYERS</div>
          <div className="fr-players">
            <div className="fr-player you">
              <div className="fr-player-avatar">私</div>
              <div className="fr-player-info">
                <input
                  className="fr-name-input"
                  type="text"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value.slice(0, 16))}
                  placeholder="your name"
                />
                <div className="fr-player-role">GUEST · YOU</div>
              </div>
              <div className="fr-player-dot ready"></div>
            </div>
            <div className="fr-player friend connected">
              <div className="fr-player-avatar">私</div>
              <div className="fr-player-info">
                <div className="fr-player-name">{hostName || "host"}</div>
                <div className="fr-player-role">HOST</div>
              </div>
              <div className="fr-player-dot ready"></div>
            </div>
          </div>

          {hostConfig && <FriendConfigReadout config={hostConfig} />}
        </div>
      </div>
    );
  }

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="mm-back" onClick={onCancel}>← BACK</button>
      <div className="splash-content fr-join-wrap">
        <div className="fr-join-header">
          <div className="fr-menu-glyph">客</div>
          <div className="fr-menu-title">JOIN A ROOM</div>
          <div className="fr-menu-sub">enter the 6-letter code your friend sent you</div>
        </div>

        <div className="fr-join-form">
          <input
            className="fr-code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(window.normalizeRoomCode(e.target.value))}
            placeholder="ABCDEF"
            maxLength={6}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            disabled={status === "connecting"}
          />
          <input
            className="fr-name-input wide"
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value.slice(0, 16))}
            placeholder="your name"
            disabled={status === "connecting"}
          />
          <button
            className="fr-join-btn"
            disabled={!canJoin}
            onClick={onJoin}
          >
            {status === "connecting" ? "CONNECTING…" : "JOIN ROOM"}
          </button>
          {error && <div className="fr-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function FriendConfigReadout({ config }) {
  if (!config) return null;
  const rsNames = (config.rulesetIds || [])
    .map(id => window.RULESET_MAP[id]?.name)
    .filter(Boolean);
  const totalChars = mergedCharsFor(config.rulesetIds || []).length;
  return (
    <>
      <div className="fr-section-title">HOST'S RULES</div>
      <div className="fr-readout">
        <div className="fr-readout-row">
          <span className="fr-readout-k">HP</span>
          <span className="fr-readout-v">{config.hp}</span>
        </div>
        <div className="fr-readout-row">
          <span className="fr-readout-k">DECK SIZE</span>
          <span className="fr-readout-v">{config.deckSize}</span>
        </div>
        <div className="fr-readout-row">
          <span className="fr-readout-k">POWER-UPS</span>
          <span className="fr-readout-v">{config.powerupsEnabled ? "ON" : "OFF"}</span>
        </div>
        <div className="fr-readout-row">
          <span className="fr-readout-k">DECKS</span>
          <span className="fr-readout-v fr-readout-decks">
            {rsNames.length === 0 ? "—" : rsNames.join(" · ")}
            <span className="fr-readout-count">{totalChars} chars</span>
          </span>
        </div>
        {(config.modifiers || []).length > 0 && (
          <div className="fr-readout-row">
            <span className="fr-readout-k">MODIFIERS</span>
            <span className="fr-readout-v fr-readout-mods">
              {config.modifiers.map(id => {
                const m = window.MOD_MAP[id];
                return m ? (
                  <span key={id} className="fr-readout-mod">
                    <span className="fr-readout-mod-g">{m.glyph}</span>
                    {m.name}
                  </span>
                ) : null;
              })}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ----- countdown overlay shown after the modifier vote, before round starts -----

function FriendCountdownOverlay({ n, label }) {
  return (
    <div className="overlay countdown-overlay">
      <div className="countdown-card">
        <div className="countdown-label">{label || "NEXT ROUND IN"}</div>
        <div key={n} className="countdown-n">{n}</div>
      </div>
    </div>
  );
}

// ----- reconnect overlay shown when the data connection drops mid-match -----

function FriendReconnectOverlay({ role, attempts, maxAttempts, error, onGiveUp }) {
  return (
    <div className="overlay friend-reconnect-overlay">
      <div className="reconnect-card">
        <div className="reconnect-glyph">◌</div>
        <div className="reconnect-title">CONNECTION LOST</div>
        <div className="reconnect-sub">
          {role === 'guest'
            ? `attempting to reconnect… (${attempts}/${maxAttempts})`
            : "waiting for friend to reconnect…"}
        </div>
        {error && <div className="reconnect-error">{error}</div>}
        <div className="reconnect-dots">
          <span></span><span></span><span></span>
        </div>
        <button className="reconnect-give-up" onClick={onGiveUp}>GIVE UP · BACK TO MENU</button>
      </div>
    </div>
  );
}

// ----- match end (friend) -----

function FriendMatchEndScreen({
  state, role, onRematch, onLeave,
  rematchMine, rematchTheirs
}) {
  useEffectF(() => { ensureFriendStyles(); }, []);
  const win = state.matchWinner === "me";
  return (
    <div className={`screen match-end fr-match-end ${win ? "win" : "lose"}`}>
      <button className="mm-back" onClick={onLeave}>← LEAVE</button>
      <div className="match-end-wrap">
        <div className="match-end-banner">
          <div className="match-end-result">{win ? "VICTORY" : "DEFEAT"}</div>
          <div className="match-end-sub">
            {win ? `you defeated ${state.opp.name}` : `${state.opp.name} defeated you`}
          </div>
        </div>

        <div className="fr-end-stats">
          <div className="fr-end-stat"><div className="ms-n pos">{state.me.correct}</div><div className="ms-l">correct</div></div>
          <div className="fr-end-stat"><div className="ms-n neg">{state.me.incorrect}</div><div className="ms-l">incorrect</div></div>
          <div className="fr-end-stat">
            <div className="ms-n">
              {state.me.correct + state.me.incorrect
                ? Math.round(state.me.correct / (state.me.correct + state.me.incorrect) * 100) + "%"
                : "—"}
            </div>
            <div className="ms-l">accuracy</div>
          </div>
          <div className="fr-end-stat"><div className="ms-n">{state.round}</div><div className="ms-l">rounds</div></div>
        </div>

        <div className="fr-end-rematch">
          <button
            className={`fr-end-btn primary ${rematchMine ? "armed" : ""}`}
            onClick={onRematch}
            disabled={rematchMine}
          >
            {rematchMine
              ? (rematchTheirs ? "REMATCHING…" : "WAITING ON FRIEND…")
              : "PLAY AGAIN"}
          </button>
          <button className="fr-end-btn secondary" onClick={onLeave}>
            LEAVE ROOM
          </button>
          {rematchTheirs && !rematchMine && (
            <div className="fr-end-note">
              {state.opp.name} wants a rematch — click PLAY AGAIN to accept
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FRIEND STYLES
// ============================================================

const FRIEND_STYLES = `
/* Layout */
.fr-menu-wrap, .fr-lobby-wrap, .fr-join-wrap {
  max-width: 1080px;
  margin: 0 auto;
}
.fr-menu-header, .fr-join-header {
  text-align: center;
  margin-bottom: 28px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.fr-menu-glyph {
  font-family: var(--jp); font-weight: 900;
  font-size: 64px; line-height: 1;
  color: var(--p1); text-shadow: 0 0 28px var(--p1-glow);
  margin-bottom: 4px;
}
.fr-menu-title {
  font-family: var(--display); font-size: 36px; letter-spacing: 0.15em;
}
.fr-menu-sub {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.15em;
  color: var(--ink-dim);
}
.fr-menu-options {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  margin-top: 8px;
}
.fr-menu-card {
  position: relative;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.2));
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  padding: 36px 26px;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
  display: flex; flex-direction: column; gap: 10px;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 200ms ease;
  overflow: hidden;
}
.fr-menu-card:hover {
  transform: translateY(-4px);
  border-color: var(--p1);
  box-shadow: 0 16px 36px -10px var(--p1-glow);
}
.fr-menu-card.join:hover { border-color: var(--p2); box-shadow: 0 16px 36px -10px var(--p2-glow); }
.fr-menu-card-glyph {
  font-family: var(--jp); font-weight: 900; font-size: 56px;
  line-height: 1; color: var(--p1);
}
.fr-menu-card.join .fr-menu-card-glyph { color: var(--p2); }
.fr-menu-card-name {
  font-family: var(--display); font-size: 22px; letter-spacing: 0.1em;
}
.fr-menu-card-desc {
  font-family: var(--ui); font-size: 13px; line-height: 1.5; color: var(--ink-dim);
}
.fr-menu-card-tag {
  position: absolute; top: 14px; right: 14px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
  padding: 3px 8px; border-radius: 99px;
  background: rgba(255,255,255,0.08);
  color: var(--ink-dim);
}
.fr-menu-card.host .fr-menu-card-tag { background: rgba(255,61,94,0.18); color: var(--p1-soft); }
.fr-menu-card.join .fr-menu-card-tag { background: rgba(63,182,255,0.18); color: var(--p2-soft); }
.fr-menu-footer {
  margin-top: 28px; text-align: center;
  font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.1em;
}

/* Lobby */
.fr-lobby-screen { padding: 38px 24px; }
.fr-lobby-header {
  text-align: center;
  margin-bottom: 24px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.fr-eyebrow {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.25em;
  color: var(--gold);
}
.fr-code {
  font-family: var(--mono); font-weight: 600;
  font-size: 64px; letter-spacing: 0.3em;
  padding: 12px 28px 10px 38px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.3));
  border: 2px dashed var(--gold);
  border-radius: 16px;
  color: var(--gold);
  text-shadow: 0 0 24px rgba(255,200,58,0.4);
}
.fr-code.loading { color: var(--ink-faint); border-color: var(--line-strong); }
.fr-code.connected { color: var(--green); border-color: var(--green); text-shadow: 0 0 24px rgba(61,220,151,0.4); }
.fr-code-actions { display: flex; gap: 10px; }
.fr-code-btn {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em;
  padding: 8px 16px; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line-strong);
  color: var(--ink); cursor: pointer;
}
.fr-code-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: var(--gold); color: var(--gold); }
.fr-code-btn:disabled { opacity: 0.4; cursor: default; }
.fr-error {
  font-family: var(--mono); font-size: 12px; color: var(--red);
  padding: 8px 14px; border-radius: 8px;
  background: rgba(255,77,94,0.1); border: 1px solid rgba(255,77,94,0.4);
  margin-top: 8px;
}

.fr-lobby-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  margin-top: 8px;
}
.fr-lobby-col { display: flex; flex-direction: column; gap: 12px; }

.fr-section-title {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em;
  color: var(--ink-faint);
  margin-top: 14px; margin-bottom: 4px;
}
.fr-section-title:first-child { margin-top: 0; }

.fr-players { display: flex; flex-direction: column; gap: 8px; }
.fr-player {
  display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center;
  padding: 12px 14px;
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.fr-player.connected { border-color: rgba(61,220,151,0.4); }
.fr-player.waiting { opacity: 0.7; border-style: dashed; }
.fr-player-avatar {
  width: 44px; height: 44px; border-radius: 10px;
  display: grid; place-items: center;
  font-family: var(--jp); font-weight: 900; font-size: 24px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--line-strong);
  color: var(--p1);
}
.fr-player.friend .fr-player-avatar { color: var(--p2); }
.fr-player-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fr-player-name {
  font-family: var(--display); font-size: 15px; letter-spacing: 0.04em;
}
.fr-player-role {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
  color: var(--ink-faint);
}
.fr-player-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--ink-faint);
}
.fr-player-dot.ready { background: var(--green); box-shadow: 0 0 8px var(--green); }
.fr-player-dot.wait {
  background: var(--gold);
  animation: livepulse 1.4s ease-in-out infinite;
}
.fr-name-input {
  background: transparent;
  border: none; border-bottom: 1px dashed var(--line-strong);
  font-family: var(--display); font-size: 15px; letter-spacing: 0.04em;
  color: var(--ink); padding: 2px 0; outline: none;
  width: 100%; max-width: 200px;
}
.fr-name-input:focus { border-bottom-color: var(--p1); }
.fr-name-input.wide { max-width: 280px; }

/* Rules sliders / toggles */
.fr-rules { display: flex; flex-direction: column; gap: 10px; }
.fr-rule-row {
  padding: 10px 14px;
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.fr-rule-label {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.15em;
  color: var(--ink-dim);
  margin-bottom: 8px;
}
.fr-rule-val {
  font-family: var(--display); font-size: 20px; letter-spacing: 0;
  color: var(--p1);
}
.fr-slider {
  width: 100%; -webkit-appearance: none; appearance: none;
  background: transparent;
}
.fr-slider::-webkit-slider-runnable-track {
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, var(--p1), rgba(255,61,94,0.2));
}
.fr-slider::-moz-range-track {
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, var(--p1), rgba(255,61,94,0.2));
}
.fr-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  margin-top: -5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  cursor: pointer;
}
.fr-slider::-moz-range-thumb {
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  cursor: pointer;
}

.fr-rule-row.toggle {
  display: flex; align-items: center; justify-content: space-between;
}
.fr-toggle {
  display: inline-flex; align-items: center; gap: 10px;
  cursor: pointer; user-select: none;
}
.fr-toggle input { display: none; }
.fr-toggle-box {
  width: 36px; height: 20px; border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid var(--line-strong);
  position: relative;
  transition: background 150ms ease, border-color 150ms ease;
}
.fr-toggle-box::after {
  content: ""; position: absolute;
  top: 2px; left: 2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--ink-dim);
  transition: transform 150ms ease, background 150ms ease;
}
.fr-toggle input:checked + .fr-toggle-box {
  background: rgba(255,61,94,0.3); border-color: var(--p1);
}
.fr-toggle input:checked + .fr-toggle-box::after {
  transform: translateX(16px); background: var(--p1);
}
.fr-toggle-label {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em;
}
.fr-toggle-sub {
  font-family: var(--mono); font-size: 10px; color: var(--ink-faint);
  letter-spacing: 0.1em;
}

/* Modifier chips */
.fr-mods {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
.fr-mod {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  font: inherit; color: var(--ink-dim); cursor: pointer;
  text-align: left;
}
.fr-mod:hover { border-color: var(--line-strong); color: var(--ink); }
.fr-mod.on {
  background: linear-gradient(135deg, rgba(255,200,58,0.18), rgba(255,200,58,0.04));
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 16px rgba(255,200,58,0.18);
}
.fr-mod-glyph {
  font-family: var(--jp); font-weight: 900; font-size: 18px; line-height: 1;
}
.fr-mod-name {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
}

/* Ruleset list */
.fr-rs-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 560px; overflow-y: auto;
  padding-right: 6px;
}
.fr-rs-list::-webkit-scrollbar { width: 6px; }
.fr-rs-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.fr-rs {
  display: grid; grid-template-columns: 22px 28px 1fr; gap: 10px; align-items: center;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  font: inherit; color: inherit; cursor: pointer;
  text-align: left;
}
.fr-rs:hover { border-color: var(--line-strong); }
.fr-rs.on {
  background: linear-gradient(135deg, rgba(255,61,94,0.14), rgba(255,61,94,0.02));
  border-color: var(--p1);
  box-shadow: 0 0 14px rgba(255,61,94,0.18);
}
.fr-rs-check {
  width: 18px; height: 18px; border-radius: 5px;
  border: 1.5px solid var(--line-strong);
  background: rgba(0,0,0,0.3);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-weight: 800; font-size: 11px; color: #fff;
}
.fr-rs-check.on { background: var(--p1); border-color: var(--p1); color: #fff; }
.fr-rs-glyph {
  font-family: var(--jp); font-weight: 900; font-size: 22px; line-height: 1; color: var(--p1);
  text-align: center;
}
.fr-rs-info { display: flex; flex-direction: column; min-width: 0; }
.fr-rs-name {
  font-family: var(--display); font-size: 13px; letter-spacing: 0.04em;
}
.fr-rs-count {
  font-family: var(--mono); font-size: 10px; color: var(--ink-faint); letter-spacing: 0.1em;
}

/* Lobby footer / start */
.fr-lobby-footer {
  display: flex; justify-content: space-between; align-items: center;
  gap: 14px;
  margin-top: 22px; padding: 14px 18px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.fr-footer-status {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.15em;
}
.fr-footer-status .ready { color: var(--green); }
.fr-footer-status .waiting { color: var(--gold); }
.fr-footer-status .dot {
  width: 10px; height: 10px; border-radius: 50%; display: inline-block;
}
.fr-footer-status .dot.ready { background: var(--green); box-shadow: 0 0 8px var(--green); }
.fr-footer-status .dot.wait {
  background: var(--gold); animation: livepulse 1.4s ease-in-out infinite;
}
.fr-start {
  font-family: var(--display); font-size: 16px; letter-spacing: 0.18em;
  padding: 14px 28px; border-radius: 10px;
  background: linear-gradient(180deg, var(--p1), #c41e3c);
  color: #fff; border: none; cursor: pointer;
  box-shadow: 0 8px 24px -8px var(--p1-glow);
  transition: transform 100ms ease, filter 150ms ease;
}
.fr-start:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
.fr-start:disabled { opacity: 0.35; cursor: not-allowed; filter: grayscale(0.7); }

/* Guest join screen */
.fr-join-wrap { max-width: 520px; }
.fr-join-form { display: flex; flex-direction: column; gap: 14px; align-items: stretch; }
.fr-code-input {
  font-family: var(--mono); font-weight: 600;
  font-size: 48px; letter-spacing: 0.4em; text-align: center;
  padding: 20px;
  background: rgba(13,17,36,0.5);
  border: 2px dashed var(--gold);
  border-radius: 14px;
  color: var(--gold);
  text-transform: uppercase;
  outline: none;
}
.fr-code-input:focus { border-color: var(--p1); color: var(--p1); }
.fr-name-input.wide {
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  padding: 14px 16px;
  font-family: var(--display); font-size: 16px; letter-spacing: 0.06em;
  color: var(--ink); outline: none; width: 100%; max-width: none;
}
.fr-name-input.wide:focus { border-color: var(--p1); }
.fr-join-btn {
  font-family: var(--display); font-size: 16px; letter-spacing: 0.18em;
  padding: 16px; border-radius: 10px;
  background: linear-gradient(180deg, var(--p2), #1a7cb8);
  color: #fff; border: none; cursor: pointer;
  box-shadow: 0 8px 24px -8px var(--p2-glow);
}
.fr-join-btn:hover:not(:disabled) { filter: brightness(1.1); }
.fr-join-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.fr-guest-status-card {
  text-align: center;
  padding: 28px;
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 20px;
}
.fr-guest-status-title {
  font-family: var(--display); font-size: 18px; letter-spacing: 0.2em;
  color: var(--gold);
}
.fr-guest-status-spinner {
  margin-top: 14px;
  display: inline-flex; gap: 8px;
}
.fr-guest-status-spinner span {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--gold);
  animation: livepulse 1.2s ease-in-out infinite;
}
.fr-guest-status-spinner span:nth-child(2) { animation-delay: 0.2s; }
.fr-guest-status-spinner span:nth-child(3) { animation-delay: 0.4s; }

.fr-readout {
  background: rgba(13,17,36,0.5);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.fr-readout-row {
  display: grid; grid-template-columns: 120px 1fr; gap: 10px; align-items: baseline;
}
.fr-readout-k {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
  color: var(--ink-faint);
}
.fr-readout-v {
  font-family: var(--display); font-size: 15px; letter-spacing: 0.04em;
  color: var(--ink);
}
.fr-readout-decks { display: flex; flex-direction: column; gap: 2px; }
.fr-readout-count {
  font-family: var(--mono); font-size: 10px; color: var(--ink-faint); letter-spacing: 0.1em;
}
.fr-readout-mods { display: flex; flex-wrap: wrap; gap: 6px; }
.fr-readout-mod {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px;
  background: rgba(255,200,58,0.12);
  border: 1px solid rgba(255,200,58,0.35);
  color: var(--gold);
  font-family: var(--mono); font-size: 11px;
}
.fr-readout-mod-g {
  font-family: var(--jp); font-weight: 900; font-size: 13px;
}

/* Match end */
.fr-match-end .fr-end-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  padding: 24px;
  background: rgba(13,17,36,0.6);
  border: 1px solid var(--line);
  border-radius: 18px;
  margin: 20px 0;
}
.fr-end-stat { text-align: center; }

.fr-end-rematch {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  margin-top: 18px;
}
.fr-end-btn {
  padding: 14px 32px; border-radius: 10px; border: none; cursor: pointer;
  font-family: var(--display); font-size: 15px; letter-spacing: 0.18em;
  min-width: 260px;
}
.fr-end-btn.primary {
  background: linear-gradient(180deg, var(--p1), #c41e3c);
  color: #fff;
  box-shadow: 0 8px 24px -8px var(--p1-glow);
}
.fr-end-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.fr-end-btn.primary.armed {
  background: rgba(255,200,58,0.2);
  color: var(--gold);
  border: 1px solid var(--gold);
  box-shadow: 0 0 18px rgba(255,200,58,0.4);
  animation: livepulse 1.4s ease-in-out infinite;
}
.fr-end-btn.secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line-strong);
  color: var(--ink-dim);
}
.fr-end-btn.secondary:hover { color: var(--ink); border-color: var(--ink-dim); }
.fr-end-note {
  font-family: var(--mono); font-size: 11px; color: var(--gold);
  letter-spacing: 0.1em;
  padding: 8px 14px;
  background: rgba(255,200,58,0.1);
  border: 1px solid rgba(255,200,58,0.3);
  border-radius: 8px;
}

/* ============================================================
 * Countdown / reconnect overlays
 * ============================================================ */
.countdown-overlay { background: rgba(7,9,18,0.85); }
.countdown-card {
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  padding: 60px 80px;
}
.countdown-label {
  font-family: var(--mono); font-size: 14px; letter-spacing: 0.35em;
  color: var(--gold);
  text-shadow: 0 0 16px rgba(255,200,58,0.5);
}
.countdown-n {
  font-family: var(--display); font-weight: 900;
  font-size: 220px; line-height: 1;
  color: #fff;
  text-shadow:
    0 0 32px rgba(255,200,58,0.7),
    0 0 64px rgba(255,200,58,0.4),
    0 8px 24px rgba(0,0,0,0.5);
  animation: countdown-pop 1s cubic-bezier(0.2, 0.9, 0.3, 1.4);
}
@keyframes countdown-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  20%  { transform: scale(1.4); opacity: 1; }
  40%  { transform: scale(1); }
  100% { transform: scale(1); opacity: 1; }
}

.friend-reconnect-overlay { z-index: 30; }
.reconnect-card {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 36px 48px;
  background: linear-gradient(180deg, var(--bg-2), var(--bg-1));
  border: 1px solid rgba(255,200,58,0.5);
  border-radius: 18px;
  box-shadow: var(--shadow-strong), 0 0 32px rgba(255,200,58,0.25);
  max-width: 480px;
  text-align: center;
}
.reconnect-glyph {
  font-family: var(--jp); font-weight: 900;
  font-size: 56px; line-height: 1; color: var(--gold);
  text-shadow: 0 0 24px rgba(255,200,58,0.6);
  animation: livepulse 1.4s ease-in-out infinite;
}
.reconnect-title {
  font-family: var(--display); font-size: 24px; letter-spacing: 0.18em;
  color: var(--gold);
}
.reconnect-sub {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em;
  color: var(--ink-dim);
}
.reconnect-error {
  font-family: var(--mono); font-size: 11px; color: var(--red);
  padding: 6px 12px; border-radius: 6px;
  background: rgba(255,77,94,0.1); border: 1px solid rgba(255,77,94,0.4);
}
.reconnect-dots {
  display: flex; gap: 8px; margin: 6px 0;
}
.reconnect-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--gold);
  animation: livepulse 1.2s ease-in-out infinite;
}
.reconnect-dots span:nth-child(2) { animation-delay: 0.2s; }
.reconnect-dots span:nth-child(3) { animation-delay: 0.4s; }
.reconnect-give-up {
  margin-top: 8px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em;
  padding: 8px 18px; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line-strong);
  color: var(--ink-dim); cursor: pointer;
}
.reconnect-give-up:hover {
  color: var(--ink); border-color: var(--ink-dim);
}

/* responsive */
@media (max-width: 1080px) {
  .fr-lobby-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .fr-menu-options { grid-template-columns: 1fr; }
  .fr-mods { grid-template-columns: 1fr 1fr; }
  .fr-code { font-size: 40px; letter-spacing: 0.2em; padding: 10px 18px 8px 26px; }
  .fr-code-input { font-size: 32px; letter-spacing: 0.3em; }
  .fr-end-stats { grid-template-columns: repeat(2, 1fr); }
}
`;

// ============================================================
// Export to window
// ============================================================

Object.assign(window, {
  FriendController,
  FriendMenuScreen,
  FriendHostLobbyScreen,
  FriendGuestLobbyScreen,
  FriendMatchEndScreen,
  FriendCountdownOverlay,
  FriendReconnectOverlay,
  // helpers used by app.jsx
  friendInitMatch,
  friendStartFromLobby,
  friendApplyAnswer,
  friendApplyPowerup,
  friendBuildGuestView,
  friendVoteRuleset,
  friendCommitRuleset,
  friendStartRound1,
  friendStartModVote,
  friendVoteMod,
  friendCommitMods,
  friendBeginNextRound,
  fStartNextRound,
  mergedCharsFor,
  rulesetDescriptorFor,
  normalizeRoomCode,
  DEFAULT_FRIEND_CONFIG
});
