/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ============================================================
// Bot opponent — simulates another connected player
// ============================================================

const BOT_NAMES = ["sakura92", "ronin_kai", "yume.dev", "tatsumi", "kohana", "asahi_06", "shinrin", "kuro.neko"];
const BOT_AVATARS = ["桜", "刃", "夢", "竜", "華", "朝", "森", "黒"];

function makeBot(rank) {
  const idx = Math.floor(Math.random() * BOT_NAMES.length);
  return {
    name: BOT_NAMES[idx],
    avatar: BOT_AVATARS[idx],
    rank: rank + Math.floor((Math.random() - 0.5) * 80),
    health: 40,
    maxHealth: 40,
    deckCount: 10,
    powerups: [],
    buffs: { shield: false, bolt: false, reflect: false, frozenUntil: 0 },
    nextAnswerAt: 0,
    accuracy: 0.86 + Math.random() * 0.1, // 86-96% accuracy
    speedMs: 1400 + Math.random() * 1100,   // 1.4-2.5s per card
    combo: 0,
    bankedCards: 0,
    comboFlash: 0
  };
}

// ============================================================
// Player factory
// ============================================================

function makeMe() {
  // persist rank across matches via localStorage
  let rank = 1020;
  try {
    const saved = parseInt(localStorage.getItem("kana_battle_rank"));
    if (!isNaN(saved)) rank = saved;
  } catch {}
  return {
    name: "you",
    avatar: "私",
    rank,
    health: 40,
    maxHealth: 40,
    deck: [],
    correct: 0,
    incorrect: 0,
    charStats: {},
    powerups: [],
    buffs: { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 },
    input: "",
    flash: null,
    combo: 0,        // current correct-streak length since opp last scored
    bankedCards: 0,  // cards earned during the current streak (held until streak ends)
    comboFlash: 0    // timestamp — used to retrigger the combo-counter shake animation
  };
}

const INITIAL = () => ({
  phase: "main-menu",   // main-menu | practice-menu | practice-flashcards | textbook-menu | textbook-chapter | splash | lobby | vs | ruleset-vote | battle | round-end | modifier-pick | match-end
  round: 0,
  me: makeMe(),
  opp: makeBot(1020),
  ruleset: null,            // chosen ruleset for this match
  rulesetOptions: [],       // 4 options shown in vote
  rulesetChoices: { me: null, opp: null },
  rulesetTiebreak: null,    // { final, displayId, settled }
  modifiers: [],
  modChoices: { me: null, opp: null },
  modOptions: [],
  roundWinner: null,
  matchWinner: null,
  rankDelta: 0,
  log: [],
  searchSecs: 0,
  practice: null,  // { mode, title, chars, queue, current, input, flash, session: {correct, incorrect} }
  textbookChapterId: null,  // currently-open chapter id when phase === "textbook-chapter"
  // Friend-mode state. `friend` is the lobby/UI shell; `friendState` is the host's
  // authoritative game state; `friendRemoteState` is the most-recent state the
  // guest received from the host.
  friend: null,
  friendState: null,
  friendRemoteState: null
});

// ============================================================
// Helpers
// ============================================================

// ============================================================
// Friend-mode state cloning
//
// Friend mode keeps its own state in `state.friendState` so it doesn't
// fight with the ranked `me`/`opp` shape. Both players have full deck
// arrays (the host owns both), so we need a deep-ish clone before
// each mutation.
// ============================================================

function cloneFriendPlayer(p) {
  return {
    ...p,
    buffs: { ...p.buffs },
    powerups: [...p.powerups],
    deck: [...p.deck],
    charStats: { ...p.charStats },
    flash: p.flash ? { ...p.flash } : null
  };
}
function cloneFriendState(s) {
  if (!s) return s;
  return {
    ...s,
    me: cloneFriendPlayer(s.me),
    opp: cloneFriendPlayer(s.opp),
    log: [...s.log],
    modifiers: [...s.modifiers]
  };
}

function recordAttempt(me, char, correct) {
  const stats = me.charStats[char] || { correct: 0, incorrect: 0 };
  if (correct) stats.correct++;
  else stats.incorrect++;
  me.charStats[char] = stats;
  if (correct) me.correct++;
  else me.incorrect++;
}

function topCharsBy(me, n, kind) {
  const entries = Object.entries(me.charStats).map(([char, s]) => {
    const total = s.correct + s.incorrect;
    return { char, total, correct: s.correct, incorrect: s.incorrect, acc: total ? s.correct / total : 0 };
  });
  if (kind === "best") {
    return entries.filter(e => e.total >= 1).sort((a, b) => b.acc - a.acc || b.total - a.total).slice(0, n);
  }
  return entries.filter(e => e.incorrect >= 1).sort((a, b) => b.incorrect - a.incorrect || a.acc - b.acc).slice(0, n);
}

function scriptFilterFromMods(mods) {
  // legacy — ruleset now governs char pool. Kept for back-compat in case any modifier needs script filter.
  return null;
}

function deckChars(state) {
  return state.ruleset?.chars || [...window.HIRAGANA, ...window.KATAKANA].map(x => x[0]);
}

function rollPowerup(mods) {
  const rate = mods.includes("lucky") ? 0.5 : 0.28;
  if (Math.random() > rate) return null;
  return window.POWERUPS[Math.floor(Math.random() * window.POWERUPS.length)].id;
}

// ============================================================
// Deck cap / overflow damage
//
// When a player's deck would exceed DECK_CAP, the excess card is
// not added — instead, the receiving player takes 1 HP of overflow
// damage. This prevents stalemates where both players accumulate
// cards faster than they can clear them.
// ============================================================

const DECK_CAP = 25;

// Add `count` cards to my deck, capping at DECK_CAP. Returns the
// number that overflowed (each overflow = 1 HP damage applied here).
// Also surfaces match-end if HP drops to 0 from overflow.
function addCardsToMe(n, count) {
  const room = Math.max(0, DECK_CAP - n.me.deck.length);
  const added = Math.min(room, count);
  const overflow = count - added;
  if (added > 0) {
    n.me.deck.push(...window.makeDeckFromChars(added, deckChars(n)));
  }
  if (overflow > 0) {
    n.me.health = Math.max(0, n.me.health - overflow);
    n.log.unshift({ t: `deck overflow! you took ${overflow} damage`, kind: "round", at: Date.now() });
    if (n.me.health <= 0) {
      handleOverflowKO(n, "opp");
    }
  }
  return overflow;
}

// Add `count` cards to opponent's deck (tracked as a count, not a
// list). Same cap + overflow rules.
function addCardsToOpp(n, count) {
  const room = Math.max(0, DECK_CAP - n.opp.deckCount);
  const added = Math.min(room, count);
  const overflow = count - added;
  if (added > 0) {
    n.opp.deckCount += added;
  }
  if (overflow > 0) {
    n.opp.health = Math.max(0, n.opp.health - overflow);
    n.log.unshift({ t: `${n.opp.name}'s deck overflowed — ${overflow} damage`, kind: "round", at: Date.now() });
    if (n.opp.health <= 0) {
      handleOverflowKO(n, "me");
    }
  }
  return overflow;
}

// Overflow damage can end the match outside of a round-clear.
// Handle the same match-end bookkeeping endRound() does.
function handleOverflowKO(n, winner) {
  n.phase = "match-end";
  n.matchWinner = winner;
  n.roundWinner = winner;
  const scoreMe = winner === "me" ? 1 : 0;
  const delta = window.eloDelta(n.me.rank, n.opp.rank, scoreMe);
  n.rankDelta = delta;
  n.me.rank += delta;
  try { localStorage.setItem("kana_battle_rank", String(n.me.rank)); } catch {}
}

// ============================================================
// Combo system
//
// Each correct answer extends that player's combo and banks the
// would-be cards. When the OPPONENT answers correctly, the
// attacker's combo ends and the banked cards are released:
//   - streak < COMBO_THRESHOLD (3): release banked cards as-is
//   - streak >= COMBO_THRESHOLD:    floor(banked × COMBO_MULTIPLIER)
//
// Wrong/dunno answers don't reset combo — only the opp scoring does.
// ============================================================

const COMBO_THRESHOLD = 3;
const COMBO_MULTIPLIER = 1.5;

// Send `count` cards from `attacker` ("me" or "opp") to the other side.
// Applies the receiver's shield/reflect buffs per card. Used by both
// immediate sends (no combo yet) and combo releases.
function sendCardsFromTo(n, attacker, count) {
  const defender = attacker === "me" ? "opp" : "me";
  const attackerObj = n[attacker];
  const defenderObj = n[defender];
  const attackerLabel = attacker === "me" ? "you" : attackerObj.name;
  const defenderLabel = defender === "me" ? "you" : defenderObj.name;
  const possAttacker = attacker === "me" ? "your" : `${attackerObj.name}'s`;

  let landed = 0;
  for (let i = 0; i < count; i++) {
    if (defenderObj.buffs.shield) {
      defenderObj.buffs.shield = false;
      n.log.unshift({ t: `${possAttacker} card was blocked by ${defender === "me" ? "your" : defenderObj.name + "'s"} shield`, kind: "block", at: Date.now() });
      continue;
    }
    if (defenderObj.buffs.reflect) {
      defenderObj.buffs.reflect = false;
      // bounced back to attacker — respect attacker's own shield/reflect not needed (cards already off them)
      if (attacker === "me") addCardsToMe(n, 1);
      else addCardsToOpp(n, 1);
      n.log.unshift({ t: `${defenderLabel} reflected a card!`, kind: "reflect", at: Date.now() });
      continue;
    }
    if (defender === "me") addCardsToMe(n, 1);
    else addCardsToOpp(n, 1);
    landed++;
  }
  if (landed > 0) {
    n.log.unshift({ t: `${attackerLabel} sent ${landed > 1 ? landed + " cards" : "a card"} to ${defender === "me" ? "you" : defenderObj.name}`, kind: "send", at: Date.now() });
  }
  return landed;
}

// Called when `attacker` lands a correct answer. Returns how many
// cards (if any) should be banked vs sent right now.
function bankOrSend(n, attacker, count) {
  const a = n[attacker];
  a.combo += 1;
  a.comboFlash = Date.now();
  // Once we've crossed the threshold, ALL cards from this streak are
  // held until the combo ends — so we always bank during a live streak.
  // Below threshold we still bank, then release without multiplier when
  // the streak ends; this keeps the rule simple and the math consistent
  // with the spec ("Combo of 3 → 3 × 1.5 = 4" — all 3 cards counted).
  a.bankedCards += count;
}

// Called when the OTHER side answers correctly: drain `attacker`'s
// streak and release any banked cards (with multiplier if earned).
function releaseCombo(n, attacker) {
  const a = n[attacker];
  if (a.bankedCards <= 0 && a.combo <= 0) return;
  const banked = a.bankedCards;
  const streak = a.combo;
  a.bankedCards = 0;
  a.combo = 0;
  if (banked <= 0) return;
  const useMultiplier = streak >= COMBO_THRESHOLD;
  const send = useMultiplier ? Math.floor(banked * COMBO_MULTIPLIER) : banked;
  if (useMultiplier) {
    const who = attacker === "me" ? "your" : `${n[attacker].name}'s`;
    n.log.unshift({
      t: `${who} ×${streak} combo released — ${send} cards (${banked}×${COMBO_MULTIPLIER})`,
      kind: "round",
      at: Date.now()
    });
  }
  sendCardsFromTo(n, attacker, send);
}

// ============================================================
// Root
// ============================================================

function App() {
  const [state, setState] = useState(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((mut) => {
    setState(prev => {
      const next = {
        ...prev,
        me: { ...prev.me, buffs: { ...prev.me.buffs }, charStats: { ...prev.me.charStats }, powerups: [...prev.me.powerups], deck: [...prev.me.deck] },
        opp: { ...prev.opp, buffs: { ...prev.opp.buffs }, powerups: [...prev.opp.powerups] },
        modChoices: { ...prev.modChoices },
        log: [...prev.log]
      };
      mut(next);
      return next;
    });
  }, []);

  // ---------- splash → lobby → vs → battle ----------
  const findMatch = () => {
    setState(s => ({
      ...s,
      phase: "lobby",
      searchSecs: 0,
      opp: makeBot(s.me.rank),
      ruleset: null,
      rulesetOptions: [],
      rulesetChoices: { me: null, opp: null },
      rulesetTiebreak: null,
      round: 0,
      modifiers: [],
      modChoices: { me: null, opp: null },
      modOptions: [],
      roundWinner: null,
      matchWinner: null,
      rankDelta: 0,
      log: [],
      // reset health back to full for a new match — preserves rank, charStats, lifetime correct/incorrect
      me: { ...s.me, health: s.me.maxHealth, deck: [], powerups: [], buffs: { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 }, input: "", flash: null, combo: 0, bankedCards: 0, comboFlash: 0 }
    }));
  };

  // matchmaking timer (auto-finds in ~3.5s)
  useEffect(() => {
    if (state.phase !== "lobby") return;
    const tick = setInterval(() => {
      setState(s => {
        if (s.phase !== "lobby") return s;
        const nx = s.searchSecs + 0.1;
        if (nx >= 3.4) {
          clearInterval(tick);
          return { ...s, phase: "vs", searchSecs: nx };
        }
        return { ...s, searchSecs: nx };
      });
    }, 100);
    return () => clearInterval(tick);
  }, [state.phase]);

  // vs splash → ruleset vote
  useEffect(() => {
    if (state.phase !== "vs") return;
    const t = setTimeout(() => {
      setState(s => {
        const lowerRank = Math.min(s.me.rank, s.opp.rank);
        return {
          ...s,
          phase: "ruleset-vote",
          rulesetOptions: window.availableRulesets(lowerRank),
          rulesetChoices: { me: null, opp: null },
          rulesetTiebreak: null,
          ruleset: null
        };
      });
    }, 2400);
    return () => clearTimeout(t);
  }, [state.phase]);

  // bot picks a ruleset 1.3-2.6s after entering the vote
  useEffect(() => {
    if (state.phase !== "ruleset-vote") return;
    if (state.rulesetChoices.opp) return;
    const t = setTimeout(() => {
      setState(s => {
        if (s.phase !== "ruleset-vote") return s;
        if (s.rulesetChoices.opp) return s;
        const pick = s.rulesetOptions[Math.floor(Math.random() * s.rulesetOptions.length)].id;
        return { ...s, rulesetChoices: { ...s.rulesetChoices, opp: pick } };
      });
    }, 1300 + Math.random() * 1300);
    return () => clearTimeout(t);
  }, [state.phase, state.rulesetChoices.opp]);

  // when both players have picked, agree or run tiebreak roulette
  useEffect(() => {
    if (state.phase !== "ruleset-vote") return;
    const { me: mePick, opp: oppPick } = state.rulesetChoices;
    if (!mePick || !oppPick) return;
    if (state.ruleset) return; // already resolving

    if (mePick === oppPick) {
      // unanimous — brief celebrate, then commit
      const tCommit = setTimeout(() => {
        setState(s => ({ ...s, ruleset: window.RULESET_MAP[mePick] }));
      }, 1000);
      return () => clearTimeout(tCommit);
    }

    // tiebreak roulette
    const final = Math.random() < 0.5 ? mePick : oppPick;
    const options = [mePick, oppPick];
    setState(s => ({ ...s, rulesetTiebreak: { final, displayId: options[0], settled: false } }));

    // decelerating cycle
    const schedule = [70, 70, 80, 90, 110, 140, 180, 230, 320, 450, 600];
    let idx = 0;
    let timer = null;
    function tick() {
      if (idx >= schedule.length) {
        setState(s => ({ ...s, rulesetTiebreak: { ...s.rulesetTiebreak, displayId: final, settled: true } }));
        timer = setTimeout(() => {
          setState(s => ({ ...s, ruleset: window.RULESET_MAP[final] }));
        }, 900);
        return;
      }
      const d = schedule[idx];
      const showId = options[idx % 2];
      idx++;
      setState(s => ({ ...s, rulesetTiebreak: { ...s.rulesetTiebreak, displayId: showId } }));
      timer = setTimeout(tick, d);
    }
    timer = setTimeout(tick, 250);
    return () => { if (timer) clearTimeout(timer); };
  }, [state.rulesetChoices.me, state.rulesetChoices.opp, state.phase]);

  // once ruleset is locked in, start the battle
  useEffect(() => {
    if (state.phase !== "ruleset-vote") return;
    if (!state.ruleset) return;
    const t = setTimeout(() => {
      update(n => {
        n.phase = "battle";
        n.round = 1;
        n.modifiers = [];
        n.me.deck = window.makeDeckFromChars(10, n.ruleset.chars);
        n.opp.deckCount = 10;
        n.opp.nextAnswerAt = Date.now() + n.opp.speedMs;
        n.log = [{ t: `ROUND 1 — ${n.ruleset.name.toUpperCase()}`, kind: "round", at: Date.now() }];
      });
    }, 700);
    return () => clearTimeout(t);
  }, [state.ruleset, state.phase, update]);

  // round-end → modifier pick
  useEffect(() => {
    if (state.phase !== "round-end") return;
    const t = setTimeout(() => {
      setState(s => ({
        ...s,
        phase: "modifier-pick",
        modOptions: window.pickN(window.MODIFIERS, 3),
        modChoices: { me: null, opp: null }
      }));
    }, 2000);
    return () => clearTimeout(t);
  }, [state.phase]);

  // bot picks a modifier ~1.5s after entering pick screen
  useEffect(() => {
    if (state.phase !== "modifier-pick") return;
    const t = setTimeout(() => {
      setState(s => {
        if (s.phase !== "modifier-pick") return s;
        const pick = s.modOptions[Math.floor(Math.random() * s.modOptions.length)].id;
        return { ...s, modChoices: { ...s.modChoices, opp: pick } };
      });
    }, 1400 + Math.random() * 1200);
    return () => clearTimeout(t);
  }, [state.phase]);

  // ---------- bot AI tick ----------
  useEffect(() => {
    if (state.phase !== "battle") return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== "battle") return;
      const now = Date.now();
      if (s.opp.buffs.frozenUntil > now) return;
      if (s.opp.deckCount <= 0) return;
      if (now < s.opp.nextAnswerAt) return;
      // bot answers
      const correct = Math.random() < s.opp.accuracy;
      botAnswers(correct);
    }, 120);
    return () => clearInterval(iv);
  }, [state.phase]);

  // bot also occasionally uses a power-up
  useEffect(() => {
    if (state.phase !== "battle") return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== "battle") return;
      if (!s.opp.powerups.length) return;
      // pick a powerup to use based on situation
      let useId = null;
      const pups = s.opp.powerups;
      if (s.opp.health <= 5 && pups.includes("shield")) useId = "shield";
      else if (s.me.deck.length <= 3 && pups.includes("freeze")) useId = "freeze";
      else if (pups.includes("bolt") && s.opp.deckCount > 3) useId = "bolt";
      else if (Math.random() < 0.18) useId = pups[Math.floor(Math.random() * pups.length)];
      if (useId) botUsesPowerup(useId);
    }, 1800);
    return () => clearInterval(iv);
  }, [state.phase]);

  // ----------------------------------------------------------
  // Battle actions
  // ----------------------------------------------------------

  const submit = useCallback((value, dunno) => {
    const s = stateRef.current;
    if (s.phase !== "battle") return;
    if (!s.me.deck.length) return;
    if (s.me.buffs.frozenUntil > Date.now() && !dunno) return;

    update(n => {
      const char = n.me.deck[0];
      const meta = window.KANA_MAP[char];
      const guess = (value || "").trim().toLowerCase();
      const correct = !dunno && window.isCorrectRomaji(char, guess);
      const reveal = window.displayRomaji(char);
      n.me.input = "";

      if (dunno) {
        recordAttempt(n.me, char, false);
        n.me.deck = n.me.deck.slice(1);
        const penalty = n.modifiers.includes("no_dunno") ? 5 : 3;
        addCardsToMe(n, penalty);
        n.me.flash = { kind: "dunno", at: Date.now(), answer: reveal };
        n.log.unshift({ t: `you skipped ${char} — +${penalty} cards`, kind: "skip", at: Date.now() });
      } else if (correct) {
        recordAttempt(n.me, char, true);
        n.me.deck = n.me.deck.slice(1);
        n.me.flash = { kind: "correct", at: Date.now(), answer: reveal };

        // I scored → release OPP's combo (their banked cards fly at me)
        releaseCombo(n, "opp");

        if (n.modifiers.includes("vampire") && n.me.correct % 5 === 0) {
          n.me.health = Math.min(n.me.maxHealth, n.me.health + 1);
          n.log.unshift({ t: `vampire +1 HP`, kind: "drop", at: Date.now() });
        }

        let sends = 1;
        if (n.me.buffs.bolt) { sends = 2; n.me.buffs.bolt = false; }
        if (n.modifiers.includes("double_send")) sends *= 2;

        // Bank into combo instead of sending immediately. Cards are
        // released when the opponent answers correctly (see botAnswers).
        bankOrSend(n, "me", sends);

        const drop = rollPowerup(n.modifiers);
        if (drop && n.me.powerups.length < 4) {
          n.me.powerups.push(drop);
          n.log.unshift({ t: `power-up: ${window.POWERUP_MAP[drop].name}!`, kind: "drop", at: Date.now() });
        }

        if (n.me.buffs.peek > 0) n.me.buffs.peek -= 1;

        // round win? (skip if overflow KO already ended the match)
        if (n.phase === "battle" && n.me.deck.length === 0) endRound(n, "me");
      } else {
        recordAttempt(n.me, char, false);
        // no answer reveal, no transition — player just keeps trying
        if (n.modifiers.includes("tax")) {
          addCardsToMe(n, 1);
        }
      }
    });
  }, [update]);

  function endRound(n, winner) {
    const loser = winner === "me" ? "opp" : "me";
    const loserObj = n[loser];
    const remaining = loser === "me" ? loserObj.deck.length : loserObj.deckCount;
    let dmg = remaining;
    if (n.modifiers.includes("glass_cannon")) dmg *= 2;
    loserObj.health = Math.max(0, loserObj.health - dmg);
    n.roundWinner = winner;
    n.log.unshift({ t: `${winner === "me" ? "you" : n.opp.name} cleared deck — ${dmg} dmg dealt`, kind: "round", at: Date.now() });

    // Round is over — clear combo state for both players (deck-clear
    // damage IS the combo's payoff this round).
    n.me.combo = 0;  n.me.bankedCards = 0;
    n.opp.combo = 0; n.opp.bankedCards = 0;

    if (loserObj.health <= 0) {
      n.phase = "match-end";
      n.matchWinner = winner;
      const scoreMe = winner === "me" ? 1 : 0;
      const delta = window.eloDelta(n.me.rank, n.opp.rank, scoreMe);
      n.rankDelta = delta;
      n.me.rank += delta;
      try { localStorage.setItem("kana_battle_rank", String(n.me.rank)); } catch {}
    } else {
      n.phase = "round-end";
    }
  }

  function botAnswers(correct) {
    update(n => {
      if (correct) {
        n.opp.deckCount = Math.max(0, n.opp.deckCount - 1);
        // Opponent scored → release MY combo (banked cards fly out at me)
        releaseCombo(n, "me");
        // sends
        let sends = 1;
        if (n.opp.buffs.bolt) { sends = 2; n.opp.buffs.bolt = false; }
        if (n.modifiers.includes("double_send")) sends *= 2;
        bankOrSend(n, "opp", sends);
        // bot drops a powerup
        const drop = rollPowerup(n.modifiers);
        if (drop && n.opp.powerups.length < 4) n.opp.powerups.push(drop);

        if (n.phase === "battle" && n.opp.deckCount === 0) endRound(n, "opp");
        else n.opp.nextAnswerAt = Date.now() + n.opp.speedMs;
      } else {
        n.opp.nextAnswerAt = Date.now() + n.opp.speedMs + 400;
      }
    });
  }

  function botUsesPowerup(pid) {
    update(n => {
      const idx = n.opp.powerups.indexOf(pid);
      if (idx < 0) return;
      n.opp.powerups.splice(idx, 1);
      const def = window.POWERUP_MAP[pid];
      if (pid === "shield") n.opp.buffs.shield = true;
      else if (pid === "bolt") n.opp.buffs.bolt = true;
      else if (pid === "reflect") n.opp.buffs.reflect = true;
      else if (pid === "freeze") n.me.buffs.frozenUntil = Date.now() + 3000;
      else if (pid === "peek") {/* hidden */}
      else if (pid === "purge") {
        n.opp.deckCount = Math.max(0, n.opp.deckCount - 1);
        if (n.phase === "battle" && n.opp.deckCount === 0) endRound(n, "opp");
      }
      n.log.unshift({ t: `${n.opp.name} used ${def.name}`, kind: "powerup", at: Date.now() });
    });
  }

  const activatePowerup = useCallback((idx) => {
    update(n => {
      const pid = n.me.powerups[idx];
      if (!pid) return;
      n.me.powerups = n.me.powerups.filter((_, i) => i !== idx);
      const def = window.POWERUP_MAP[pid];
      if (pid === "shield") n.me.buffs.shield = true;
      else if (pid === "bolt") n.me.buffs.bolt = true;
      else if (pid === "reflect") n.me.buffs.reflect = true;
      else if (pid === "peek") n.me.buffs.peek = 3;
      else if (pid === "freeze") n.opp.buffs.frozenUntil = Date.now() + 3000;
      else if (pid === "purge") {
        n.me.deck = n.me.deck.slice(1);
        // If purging just cleared our last card, we win the round.
        if (n.phase === "battle" && n.me.deck.length === 0) endRound(n, "me");
      }
      n.log.unshift({ t: `you used ${def.name}`, kind: "powerup", at: Date.now() });
    });
  }, [update]);

  const chooseRuleset = (rsId) => {
    setState(prev => {
      if (prev.rulesetChoices.me) return prev;
      return { ...prev, rulesetChoices: { ...prev.rulesetChoices, me: rsId } };
    });
  };

  const chooseMod = (modId) => {
    setState(prev => {
      if (prev.modChoices.me) return prev;
      const choices = { ...prev.modChoices, me: modId };
      if (choices.me && choices.opp) {
        return applyRoundStart(prev, choices);
      }
      return { ...prev, modChoices: choices };
    });
  };

  // when both choices land, start the next round
  useEffect(() => {
    if (state.phase !== "modifier-pick") return;
    if (state.modChoices.me && state.modChoices.opp) {
      const t = setTimeout(() => {
        setState(prev => applyRoundStart(prev, prev.modChoices));
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [state.modChoices, state.phase]);

  function applyRoundStart(prev, choices) {
    const mods = Array.from(new Set([choices.me, choices.opp]));
    let deckSize = 10;
    if (mods.includes("small_deck")) deckSize = 7;
    if (mods.includes("big_deck")) deckSize = 14;
    const chars = prev.ruleset?.chars || [...window.HIRAGANA, ...window.KATAKANA].map(x => x[0]);
    const me = {
      ...prev.me,
      deck: window.makeDeckFromChars(deckSize, chars),
      input: "",
      buffs: { shield: false, bolt: false, reflect: false, peek: 0, frozenUntil: 0 },
      combo: 0,
      bankedCards: 0,
      comboFlash: 0
    };
    const opp = {
      ...prev.opp,
      deckCount: deckSize,
      buffs: { shield: false, bolt: false, reflect: false, frozenUntil: 0 },
      nextAnswerAt: Date.now() + prev.opp.speedMs,
      combo: 0,
      bankedCards: 0,
      comboFlash: 0
    };
    if (mods.includes("starter_hp")) {
      me.health = Math.min(me.maxHealth, me.health + 3);
      opp.health = Math.min(opp.maxHealth, opp.health + 3);
    }
    return {
      ...prev,
      phase: "battle",
      round: prev.round + 1,
      modifiers: mods,
      me, opp,
      roundWinner: null,
      modChoices: { me: null, opp: null },
      log: [{ t: `ROUND ${prev.round + 1} — ${mods.map(m => window.MOD_MAP[m].name).join(" + ")}`, kind: "round", at: Date.now() }, ...prev.log]
    };
  }

  // ----------------------------------------------------------
  // Menu / practice navigation
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // FRIEND MODE (peer-to-peer over PeerJS)
  //
  // The friend mode lives in friend.jsx — controller, game logic,
  // and screens. This block hooks it into app state + handles all
  // message routing between host and guest.
  //
  // Phases:
  //   friend-menu          → choose host or join
  //   friend-host-lobby    → host configures, waits for guest
  //   friend-guest-lobby   → guest enters code, then waits for start
  //   friend-vs            → brief VS splash
  //   friend-battle        → live match (host-authoritative)
  //   friend-round-end     → between-round pause
  //   friend-match-end     → end screen with rematch
  // ----------------------------------------------------------

  const friendCtrlRef = useRef(null);
  const friendStateRef = useRef(null);   // host: full state. guest: last received state.
  // Guest-only local input — kept out of remoteState so host's broadcasts
  // don't blow away what the guest is currently typing.
  const [friendGuestLocalInput, setFriendGuestLocalInput] = useState("");

  function ensureFriendCtrl() {
    if (!friendCtrlRef.current) friendCtrlRef.current = new window.FriendController();
    return friendCtrlRef.current;
  }

  function teardownFriend() {
    if (friendCtrlRef.current) {
      try { friendCtrlRef.current.disconnect(); } catch {}
      friendCtrlRef.current = null;
    }
    friendStateRef.current = null;
    setFriendGuestLocalInput("");
  }

  const goFriendMenu = () => {
    teardownFriend();
    setState(s => ({
      ...s,
      phase: "friend-menu",
      friend: {
        role: null,
        code: "",
        status: "idle",
        error: null,
        myName: s.friend?.myName ?? "",
        oppName: "",
        config: { ...window.DEFAULT_FRIEND_CONFIG },
        hostConfig: null,
        copyState: "idle",
        rematchMine: false,
        rematchTheirs: false
      }
    }));
  };

  // Phases where a connection drop should kick off a reconnect attempt
  // instead of bailing straight to the disconnected screen.
  const FRIEND_MATCH_PHASES = [
    "friend-vs", "friend-ruleset-vote", "friend-modifier-pick",
    "friend-countdown", "friend-battle", "friend-round-end", "friend-match-end"
  ];

  const friendHostStart = async () => {
    const ctrl = ensureFriendCtrl();
    setState(s => ({ ...s, phase: "friend-host-lobby", friend: { ...s.friend, role: "host", status: "creating", error: null } }));
    // Register handlers BEFORE attempting to host so we don't miss events.
    ctrl.clearHandlers();
    ctrl.on('connected', () => {
      setState(s => {
        // Mid-match reconnect: clear the flag and re-broadcast state on next tick.
        if (s.friend?.reconnecting) {
          setTimeout(() => {
            const fs = stateRef.current.friendState;
            if (fs) {
              const view = window.friendBuildGuestView(fs);
              friendCtrlRef.current?.send({ t: 'state', payload: view });
            }
          }, 0);
          return { ...s, friend: { ...s.friend, reconnecting: false, reconnectAttempts: 0, reconnectError: null, error: null } };
        }
        // First-time connect: announce lobby state.
        setTimeout(() => {
          friendCtrlRef.current?.send({ t: 'lobby', config: stateRef.current.friend.config, hostName: stateRef.current.friend.myName });
        }, 0);
        return { ...s, friend: { ...s.friend, status: "guest-joined", error: null } };
      });
    });
    ctrl.on('disconnected', () => {
      setState(s => {
        if (s.phase === "friend-host-lobby") {
          return { ...s, friend: { ...s.friend, status: "waiting", oppName: "", error: "Friend left the room." } };
        }
        if (FRIEND_MATCH_PHASES.includes(s.phase)) {
          // Keep current phase; just flag reconnecting. Overlay renders on top.
          return { ...s, friend: { ...s.friend, reconnecting: true, reconnectAttempts: 0, reconnectError: null } };
        }
        return { ...s, friend: { ...s.friend, error: "Friend disconnected." }, phase: "friend-disconnected" };
      });
    });
    ctrl.on('error', (err) => {
      console.warn('friend error', err);
      const msg = (err && err.message) || (err && err.type) || "connection error";
      setState(s => ({ ...s, friend: { ...s.friend, error: String(msg) } }));
    });
    ctrl.on('msg', (msg) => handleHostMsg(msg));

    try {
      const code = await ctrl.hostCreate();
      setState(s => ({ ...s, friend: { ...s.friend, code, status: "waiting", error: null } }));
    } catch (err) {
      const msg = (err && err.message) || "Couldn't open a room. Try again.";
      setState(s => ({ ...s, friend: { ...s.friend, status: "error", error: msg } }));
    }
  };

  const friendGuestStart = () => {
    teardownFriend();
    setState(s => ({
      ...s,
      phase: "friend-guest-lobby",
      friend: {
        role: "guest",
        code: "",
        status: "idle",
        error: null,
        myName: s.friend?.myName ?? "",
        oppName: "",
        config: { ...window.DEFAULT_FRIEND_CONFIG },
        hostConfig: null,
        copyState: "idle",
        rematchMine: false,
        rematchTheirs: false
      }
    }));
  };

  const friendGuestDoJoin = async () => {
    const s = stateRef.current;
    const code = s.friend?.code || "";
    const myName = (s.friend?.myName ?? "") || "friend";
    if (window.normalizeRoomCode(code).length !== 6) {
      setState(s2 => ({ ...s2, friend: { ...s2.friend, error: "Code must be 6 characters." } }));
      return;
    }
    const ctrl = ensureFriendCtrl();
    ctrl.clearHandlers();
    ctrl.on('connected', () => {
      setState(s2 => {
        if (s2.friend?.reconnecting) {
          // Mid-match reconnect succeeded.
          setTimeout(() => {
            friendCtrlRef.current?.send({ t: 'hello', name: stateRef.current.friend.myName });
          }, 0);
          return { ...s2, friend: { ...s2.friend, reconnecting: false, reconnectAttempts: 0, reconnectError: null, error: null } };
        }
        return { ...s2, friend: { ...s2.friend, status: "connected", error: null } };
      });
      // First-time: announce our name to host.
      if (!stateRef.current.friend?.reconnecting) {
        ctrl.send({ t: 'hello', name: myName });
      }
    });
    ctrl.on('disconnected', () => {
      setState(s2 => {
        if (s2.phase === "friend-guest-lobby") {
          return { ...s2, friend: { ...s2.friend, status: "error", error: "Host closed the room." } };
        }
        if (FRIEND_MATCH_PHASES.includes(s2.phase)) {
          return { ...s2, friend: { ...s2.friend, reconnecting: true, reconnectAttempts: 0, reconnectError: null } };
        }
        return { ...s2, friend: { ...s2.friend, error: "Host disconnected." }, phase: "friend-disconnected" };
      });
    });
    ctrl.on('error', (err) => {
      const msg = (err && err.message) || (err && err.type) || "connection error";
      setState(s2 => ({ ...s2, friend: { ...s2.friend, error: String(msg) } }));
    });
    ctrl.on('msg', (msg) => handleGuestMsg(msg));

    setState(s2 => ({ ...s2, friend: { ...s2.friend, status: "connecting", error: null } }));
    try {
      await ctrl.guestJoin(code);
    } catch (err) {
      const msg = (err && err.message) || "Couldn't connect.";
      setState(s2 => ({ ...s2, friend: { ...s2.friend, status: "error", error: msg } }));
    }
  };

  // ----- HOST: receive a message from the guest -----

  function handleHostMsg(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'hello') {
      setState(s => ({ ...s, friend: { ...s.friend, oppName: msg.name || "friend" } }));
      // Echo back the lobby state with names so guest sees host's settings.
      const f = stateRef.current.friend;
      friendCtrlRef.current?.send({ t: 'lobby', config: f.config, hostName: f.myName });
      return;
    }
    if (msg.t === 'name') {
      setState(s => ({ ...s, friend: { ...s.friend, oppName: msg.name || "friend" } }));
      return;
    }
    if (msg.t === 'submit') {
      hostApplyGuestAction(n => window.friendApplyAnswer(n, 'opp', msg.value, !!msg.dunno));
      return;
    }
    if (msg.t === 'powerup') {
      hostApplyGuestAction(n => window.friendApplyPowerup(n, 'opp', msg.idx | 0));
      return;
    }
    if (msg.t === 'ruleset_vote') {
      hostApplyGuestAction(n => window.friendVoteRuleset(n, 'opp', msg.id));
      return;
    }
    if (msg.t === 'mod_vote') {
      hostApplyGuestAction(n => window.friendVoteMod(n, 'opp', msg.id));
      return;
    }
    if (msg.t === 'rematch') {
      setState(s => ({ ...s, friend: { ...s.friend, rematchTheirs: true } }));
      // If we'd already requested, fire it.
      if (stateRef.current.friend.rematchMine) doFriendRematchHost();
      return;
    }
  }

  // Apply a mutation to the host's friendState; broadcast guest view after.
  function hostApplyGuestAction(mutate) {
    setState(prev => {
      if (!prev.friendState) return prev;
      const n = cloneFriendState(prev.friendState);
      mutate(n);
      return { ...prev, friendState: n, phase: n.phase };
    });
    // Broadcast happens in useEffect below.
  }

  // Unified "choose ruleset/mod" handlers — work for both host and guest.
  // For host, mutate locally. For guest, send a message; the host's own
  // state mutation + broadcast will round-trip back as confirmation.
  function friendChooseRuleset(id) {
    const role = stateRef.current.friend?.role;
    if (role === 'host') {
      setState(prev => {
        if (!prev.friendState) return prev;
        const n = cloneFriendState(prev.friendState);
        window.friendVoteRuleset(n, 'me', id);
        return { ...prev, friendState: n };
      });
    } else if (role === 'guest') {
      const fs = stateRef.current.friendRemoteState;
      // Block redundant clicks locally
      if (fs?.rulesetVote?.me) return;
      friendCtrlRef.current?.send({ t: 'ruleset_vote', id });
    }
  }

  function friendChooseMod(id) {
    const role = stateRef.current.friend?.role;
    if (role === 'host') {
      setState(prev => {
        if (!prev.friendState) return prev;
        const n = cloneFriendState(prev.friendState);
        window.friendVoteMod(n, 'me', id);
        return { ...prev, friendState: n };
      });
    } else if (role === 'guest') {
      const fs = stateRef.current.friendRemoteState;
      if (fs?.modVote?.me) return;
      friendCtrlRef.current?.send({ t: 'mod_vote', id });
    }
  }

  // ----- HOST: locally-initiated actions (host typed / clicked) -----

  function hostMeSubmit(value, dunno) {
    setState(prev => {
      if (prev.phase !== "friend-battle") return prev;
      const n = cloneFriendState(prev.friendState);
      window.friendApplyAnswer(n, 'me', value, dunno);
      return { ...prev, friendState: n, phase: n.phase };
    });
  }
  function hostMePowerup(idx) {
    setState(prev => {
      if (prev.phase !== "friend-battle") return prev;
      const n = cloneFriendState(prev.friendState);
      window.friendApplyPowerup(n, 'me', idx);
      return { ...prev, friendState: n, phase: n.phase };
    });
  }
  function hostMeSetInput(v) {
    setState(prev => {
      if (prev.phase !== "friend-battle" || !prev.friendState) return prev;
      const n = cloneFriendState(prev.friendState);
      n.me.input = v;
      return { ...prev, friendState: n };
    });
  }

  // ----- GUEST: receive a message from the host -----

  function handleGuestMsg(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'lobby') {
      setState(s => ({
        ...s,
        friend: {
          ...s.friend,
          hostConfig: msg.config || null,
          oppName: msg.hostName || "host",
          status: s.friend.status === "connecting" ? "in-lobby" : (s.friend.status === "connected" ? "in-lobby" : s.friend.status)
        }
      }));
      return;
    }
    if (msg.t === 'state') {
      const remote = msg.payload;
      friendStateRef.current = remote;
      setState(s => {
        const targetPhase = remote.phase || "friend-battle";
        const FRIEND_PHASES = [
          "friend-battle", "friend-round-end", "friend-match-end", "friend-vs",
          "friend-ruleset-vote", "friend-modifier-pick", "friend-countdown"
        ];
        let next = { ...s, friendRemoteState: remote };
        if (s.phase !== targetPhase && FRIEND_PHASES.includes(targetPhase)) {
          next.phase = targetPhase;
          // Reset local input when host kicks off a new round.
          if (targetPhase === "friend-battle" && s.phase !== "friend-battle") {
            setFriendGuestLocalInput("");
          }
        }
        return next;
      });
      return;
    }
    if (msg.t === 'rematch_armed') {
      setState(s => ({ ...s, friend: { ...s.friend, rematchTheirs: true } }));
      return;
    }
    if (msg.t === 'note') {
      setState(s => ({ ...s, friend: { ...s.friend, error: msg.text || null } }));
      return;
    }
  }

  // ----- GUEST: actions sent over the wire -----

  function guestSubmit(value, dunno) {
    const ctrl = friendCtrlRef.current;
    if (!ctrl) return;
    // We don't know yet whether this answer is correct — the host will tell us.
    // But we DO want to track char-stats locally; we'll do it from the next
    // state update by comparing deck top before/after.
    ctrl.send({ t: 'submit', value: value || "", dunno: !!dunno });
    setFriendGuestLocalInput("");
  }
  function guestPowerup(idx) {
    const ctrl = friendCtrlRef.current;
    if (!ctrl) return;
    ctrl.send({ t: 'powerup', idx });
  }

  // Track guest char-stats from host's broadcast: when guest's me.flash changes
  // from null → correct/dunno, the character that was on top before the change
  // is the one to record. We snapshot the previous-top in a ref.
  const friendGuestPrevTopRef = useRef(null);
  useEffect(() => {
    if (state.phase !== "friend-battle") return;
    if (stateRef.current.friend?.role !== 'guest') return;
    const remote = state.friendRemoteState;
    if (!remote || !remote.me) return;
    const flash = remote.me.flash;
    const topNow = remote.me.deck && remote.me.deck[0];
    const prevTop = friendGuestPrevTopRef.current;
    if (flash && (flash.kind === 'correct' || flash.kind === 'dunno') && prevTop && prevTop !== topNow) {
      // Record on local state.me.charStats
      setState(s => {
        const newMe = { ...s.me, charStats: { ...s.me.charStats } };
        const c = flash.kind === 'correct';
        const stat = newMe.charStats[prevTop] || { correct: 0, incorrect: 0 };
        newMe.charStats[prevTop] = c
          ? { correct: stat.correct + 1, incorrect: stat.incorrect }
          : { correct: stat.correct, incorrect: stat.incorrect + 1 };
        newMe.correct = s.me.correct + (c ? 1 : 0);
        newMe.incorrect = s.me.incorrect + (c ? 0 : 1);
        return { ...s, me: newMe };
      });
    }
    friendGuestPrevTopRef.current = topNow;
  }, [state.friendRemoteState, state.phase]);

  // ----- Reconnect: guest auto-retries the data channel every few seconds. -----
  useEffect(() => {
    if (state.friend?.role !== 'guest') return;
    if (!state.friend?.reconnecting) return;
    let cancelled = false;
    let timer;
    const attempt = async (n) => {
      if (cancelled) return;
      const MAX = 7;
      if (n > MAX) {
        setState(s => {
          if (!s.friend?.reconnecting) return s;
          return {
            ...s,
            phase: "friend-disconnected",
            friend: { ...s.friend, reconnecting: false, error: "Couldn't reconnect to host after several tries." }
          };
        });
        return;
      }
      setState(s => ({ ...s, friend: { ...s.friend, reconnectAttempts: n } }));
      try {
        await friendCtrlRef.current?.guestReconnect();
        // success: the 'connected' handler clears the reconnecting flag
      } catch (err) {
        if (cancelled) return;
        const msg = (err && err.message) || "failed";
        setState(s => ({ ...s, friend: { ...s.friend, reconnectError: String(msg) } }));
        timer = setTimeout(() => attempt(n + 1), 3500);
      }
    };
    timer = setTimeout(() => attempt(1), 1500);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [state.friend?.reconnecting, state.friend?.role]);

  // ----- Reconnect: hard timeout (host too). Bail to disconnected after 30s. -----
  useEffect(() => {
    if (!state.friend?.reconnecting) return;
    const t = setTimeout(() => {
      setState(s => {
        if (!s.friend?.reconnecting) return s;
        return {
          ...s,
          phase: "friend-disconnected",
          friend: { ...s.friend, reconnecting: false, error: "Connection lost — no reconnect within 30s." }
        };
      });
    }, 30000);
    return () => clearTimeout(t);
  }, [state.friend?.reconnecting]);

  // ----- HOST: broadcast on every friendState change -----

  useEffect(() => {
    if (
      state.phase !== "friend-battle" &&
      state.phase !== "friend-round-end" &&
      state.phase !== "friend-match-end" &&
      state.phase !== "friend-vs" &&
      state.phase !== "friend-ruleset-vote" &&
      state.phase !== "friend-modifier-pick" &&
      state.phase !== "friend-countdown"
    ) return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (!state.friendState) return;
    const guestView = window.friendBuildGuestView(state.friendState);
    friendCtrlRef.current?.send({ t: 'state', payload: guestView });
  }, [state.friendState, state.phase]);

  // ----- HOST: also broadcast lobby config changes -----

  useEffect(() => {
    if (state.phase !== "friend-host-lobby") return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (!friendCtrlRef.current || !friendCtrlRef.current.conn || !friendCtrlRef.current.conn.open) return;
    const f = state.friend;
    friendCtrlRef.current.send({ t: 'lobby', config: f.config, hostName: f.myName });
  }, [state.friend?.config, state.friend?.myName, state.phase]);

  // ----- HOST: round-end auto-advance + record char stats from host's POV -----

  // After a round-end pause (1.6s), launch the modifier vote for the next
  // round. The vote → countdown → round transitions are handled by their
  // own useEffects further down.
  useEffect(() => {
    if (state.phase !== "friend-round-end") return;
    if (stateRef.current.friend?.role !== 'host') return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.phase !== "friend-round-end") return prev;
        const n = cloneFriendState(prev.friendState);
        window.friendStartModVote(n);
        return { ...prev, friendState: n, phase: n.phase };
      });
    }, 1600);
    return () => clearTimeout(t);
  }, [state.phase]);

  // Sync host's own charStats into me.charStats so practice lists update.
  // (We do this off of friendState.me.charStats, which is mutated during
  // the match.)
  useEffect(() => {
    if (state.phase !== "friend-match-end") return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (!state.friendState) return;
    const fs = state.friendState;
    setState(s => {
      const newMe = { ...s.me, charStats: { ...s.me.charStats } };
      Object.entries(fs.me.charStats || {}).forEach(([k, v]) => {
        const cur = newMe.charStats[k] || { correct: 0, incorrect: 0 };
        newMe.charStats[k] = { correct: cur.correct + v.correct, incorrect: cur.incorrect + v.incorrect };
      });
      newMe.correct = (s.me.correct || 0) + (fs.me.correct || 0);
      newMe.incorrect = (s.me.incorrect || 0) + (fs.me.incorrect || 0);
      return { ...s, me: newMe };
    });
  }, [state.phase]);

  // ----- HOST: start the actual match -----
  //
  // Build the pre-match state (with vote pool if multi-deck), then auto-
  // transition through the relevant phases via dedicated useEffects below.

  function friendHostStartMatch() {
    const s = stateRef.current;
    if (!s.friend || !s.friend.config) return;
    const initial = window.friendStartFromLobby(s.friend.config, s.friend.myName, s.friend.oppName);
    setState(prev => ({
      ...prev,
      phase: initial.phase,
      friendState: initial,
      friend: { ...prev.friend, rematchMine: false, rematchTheirs: false }
    }));
  }

  // ----- friend-vs splash → round 1 begins -----
  useEffect(() => {
    if (state.phase !== "friend-vs") return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (!state.friendState || state.friendState.round > 0) return;  // round 1 only
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.phase !== "friend-vs") return prev;
        const n = cloneFriendState(prev.friendState);
        window.friendStartRound1(n);
        return { ...prev, friendState: n, phase: n.phase };
      });
    }, 2200);
    return () => clearTimeout(t);
  }, [state.phase, state.friendState?.round]);

  // ----- ruleset vote resolution (host-side) -----
  //
  // When both players have voted, either commit immediately (unanimous)
  // or run a decelerating tiebreak roulette before locking in the final.
  const rulesetTbRef = useRef(null);
  useEffect(() => {
    if (state.phase !== "friend-ruleset-vote") return;
    if (stateRef.current.friend?.role !== 'host') return;
    const fs = state.friendState;
    if (!fs || !fs.rulesetVote) return;
    const { me: mePick, opp: oppPick, resolved } = fs.rulesetVote;
    if (resolved) return;
    if (!mePick || !oppPick) return;

    if (mePick === oppPick) {
      const t = setTimeout(() => {
        setState(prev => {
          if (prev.phase !== "friend-ruleset-vote") return prev;
          const n = cloneFriendState(prev.friendState);
          window.friendCommitRuleset(n, mePick);
          return { ...prev, friendState: n, phase: n.phase };
        });
      }, 950);
      return () => clearTimeout(t);
    }

    // tiebreak roulette
    const final = Math.random() < 0.5 ? mePick : oppPick;
    const options = [mePick, oppPick];
    setState(prev => {
      const n = cloneFriendState(prev.friendState);
      n.rulesetVote = { ...n.rulesetVote, tiebreak: { final, displayId: options[0], settled: false } };
      return { ...prev, friendState: n };
    });
    const schedule = [70, 70, 80, 90, 110, 140, 180, 230, 320, 450, 600];
    let idx = 0;
    const tick = () => {
      if (idx >= schedule.length) {
        setState(prev => {
          const n = cloneFriendState(prev.friendState);
          if (n.rulesetVote) {
            n.rulesetVote.tiebreak = { ...n.rulesetVote.tiebreak, displayId: final, settled: true };
          }
          return { ...prev, friendState: n };
        });
        rulesetTbRef.current = setTimeout(() => {
          setState(prev => {
            if (prev.phase !== "friend-ruleset-vote") return prev;
            const n = cloneFriendState(prev.friendState);
            window.friendCommitRuleset(n, final);
            return { ...prev, friendState: n, phase: n.phase };
          });
        }, 900);
        return;
      }
      const d = schedule[idx];
      const showId = options[idx % 2];
      idx++;
      setState(prev => {
        const n = cloneFriendState(prev.friendState);
        if (n.rulesetVote) {
          n.rulesetVote.tiebreak = { ...n.rulesetVote.tiebreak, displayId: showId };
        }
        return { ...prev, friendState: n };
      });
      rulesetTbRef.current = setTimeout(tick, d);
    };
    rulesetTbRef.current = setTimeout(tick, 250);
    return () => {
      if (rulesetTbRef.current) clearTimeout(rulesetTbRef.current);
    };
  }, [state.friendState?.rulesetVote?.me, state.friendState?.rulesetVote?.opp, state.phase]);

  // ----- modifier vote resolution -----
  useEffect(() => {
    if (state.phase !== "friend-modifier-pick") return;
    if (stateRef.current.friend?.role !== 'host') return;
    const fs = state.friendState;
    if (!fs || !fs.modVote) return;
    if (!fs.modVote.me || !fs.modVote.opp) return;
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.phase !== "friend-modifier-pick") return prev;
        const n = cloneFriendState(prev.friendState);
        window.friendCommitMods(n);
        return { ...prev, friendState: n, phase: n.phase };
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [state.friendState?.modVote?.me, state.friendState?.modVote?.opp, state.phase]);

  // ----- countdown ticker (host) -----
  useEffect(() => {
    if (state.phase !== "friend-countdown") return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (state.friendState?.countdown == null) return;
    if (state.friendState.countdown <= 0) {
      // start the round
      const t = setTimeout(() => {
        setState(prev => {
          if (prev.phase !== "friend-countdown") return prev;
          const n = cloneFriendState(prev.friendState);
          window.friendBeginNextRound(n);
          return { ...prev, friendState: n, phase: n.phase };
        });
      }, 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setState(prev => {
        if (prev.phase !== "friend-countdown") return prev;
        const n = cloneFriendState(prev.friendState);
        n.countdown = Math.max(0, (n.countdown ?? 0) - 1);
        return { ...prev, friendState: n };
      });
    }, 900);
    return () => clearTimeout(t);
  }, [state.friendState?.countdown, state.phase]);

  // ----- Rematch flow -----

  function doFriendRematchHost() {
    const ctrl = friendCtrlRef.current;
    if (!ctrl) return;
    // Reset rematch flags and re-enter the host lobby for both sides.
    // Easier: bounce back to host lobby so host can tweak rules if they want.
    setState(s => ({
      ...s,
      phase: "friend-host-lobby",
      friend: { ...s.friend, rematchMine: false, rematchTheirs: false, status: "guest-joined" }
    }));
    // Tell guest we're back in lobby.
    ctrl.send({ t: 'lobby', config: stateRef.current.friend.config, hostName: stateRef.current.friend.myName });
  }

  function friendRematch() {
    const s = stateRef.current;
    const role = s.friend?.role;
    if (role === 'host') {
      // Host clicks rematch
      if (s.friend.rematchTheirs) {
        // both agreed — go
        doFriendRematchHost();
      } else {
        setState(prev => ({ ...prev, friend: { ...prev.friend, rematchMine: true } }));
      }
    } else if (role === 'guest') {
      // Guest clicks rematch → notify host
      const ctrl = friendCtrlRef.current;
      ctrl?.send({ t: 'rematch' });
      setState(prev => ({ ...prev, friend: { ...prev.friend, rematchMine: true } }));
    }
  }

  // When host's both flags are set, advance
  useEffect(() => {
    if (state.phase !== "friend-match-end") return;
    if (stateRef.current.friend?.role !== 'host') return;
    if (state.friend?.rematchMine && state.friend?.rematchTheirs) {
      doFriendRematchHost();
    }
  }, [state.friend?.rematchMine, state.friend?.rematchTheirs, state.phase]);

  // ----- friend config setters bound to UI -----

  const setFriendConfig = (next) => setState(s => ({ ...s, friend: { ...s.friend, config: next } }));
  const setFriendMyName = (name) => {
    setState(s => ({ ...s, friend: { ...s.friend, myName: name } }));
    // If we're connected (host or guest), broadcast name change
    const ctrl = friendCtrlRef.current;
    if (ctrl && ctrl.conn && ctrl.conn.open) {
      if (stateRef.current.friend?.role === 'guest') {
        ctrl.send({ t: 'name', name });
      } else {
        // host name is included in 'lobby'; that useEffect will fire
      }
    }
  };
  const setFriendCode = (code) => setState(s => ({ ...s, friend: { ...s.friend, code, error: null } }));
  const setFriendCopyState = (st) => setState(s => ({ ...s, friend: { ...s.friend, copyState: st } }));
  const friendCopyCode = async () => {
    const code = stateRef.current.friend?.code;
    if (!code) return;
    let ok = false;
    // Try the modern clipboard API first.
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {}
    // Fallback for iframes / non-secure contexts where the modern API is blocked.
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    setFriendCopyState(ok ? "copied" : "failed");
    setTimeout(() => setFriendCopyState("idle"), 1800);
  };

  const goMenu = () => {
    teardownFriend();
    setState(s => ({
      ...s,
      phase: "main-menu",
      practice: null,
      textbookChapterId: null
    }));
  };

  const goRanked = () => setState(s => ({ ...s, phase: "splash" }));

  const goPracticeMenu = () => setState(s => ({ ...s, phase: "practice-menu", practice: null }));

  // Textbook navigation. The chapter list and chapter reader are siblings of
  // the practice menu — same back button takes you up one level. Opening a
  // chapter just swaps the id; the screen handles its own scroll reset.
  const goTextbookMenu = () => setState(s => ({ ...s, phase: "textbook-menu", textbookChapterId: null }));
  const openChapter = (cid) => setState(s => ({ ...s, phase: "textbook-chapter", textbookChapterId: cid }));

  // Build a shuffled queue from a char pool
  function shuffleQueue(chars) {
    const q = [...chars];
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  }

  const startFlashcards = (rsIds) => {
    // Accept either an array (new multi-select picker) or a single id
    // (kept for back-compat in case something else calls this).
    const ids = Array.isArray(rsIds) ? rsIds : [rsIds];
    const rulesets = ids.map(id => window.RULESET_MAP[id]).filter(Boolean);
    if (!rulesets.length) return;

    // Merge char pools across all selected decks, deduping so the same
    // character appearing in multiple decks is only drilled once per pass.
    const merged = [];
    const seen = new Set();
    rulesets.forEach(r => {
      r.chars.forEach(c => {
        if (!seen.has(c)) { seen.add(c); merged.push(c); }
      });
    });

    let title, glyph;
    if (rulesets.length === 1) {
      title = rulesets[0].name;
      glyph = rulesets[0].glyph;
    } else {
      title = `${rulesets.length} decks · ${merged.length} chars`;
      glyph = "札";
    }

    setState(s => {
      const queue = shuffleQueue(merged);
      return {
        ...s,
        phase: "practice-flashcards",
        practice: {
          mode: "flashcards",
          title,
          glyph,
          chars: merged,
          queue: queue.slice(1),
          current: queue[0],
          input: "",
          flash: null,
          session: { correct: 0, incorrect: 0 }
        }
      };
    });
  };

  const startMissedDrill = () => {
    // Pull chars with lowest accuracy (at least 1 incorrect attempt). Cap at 20 to keep it focused.
    const worst = topCharsBy(stateRef.current.me, 20, "worst").map(e => e.char);
    if (worst.length === 0) return; // shouldn't happen — caller should disable button
    setState(s => {
      const queue = shuffleQueue(worst);
      return {
        ...s,
        phase: "practice-flashcards",
        practice: {
          mode: "missed",
          title: "Missed Characters",
          glyph: "省",
          chars: worst,
          queue: queue.slice(1),
          current: queue[0],
          input: "",
          flash: null,
          session: { correct: 0, incorrect: 0 }
        }
      };
    });
  };

  const setPracticeInput = (v) => setState(s => {
    if (!s.practice) return s;
    return { ...s, practice: { ...s.practice, input: v } };
  });

  const submitPractice = (dunno) => {
    setState(s => {
      if (!s.practice) return s;
      const p = s.practice;
      const guess = (p.input || "").trim().toLowerCase();
      const correct = !dunno && window.isCorrectRomaji(p.current, guess);
      const reveal = window.displayRomaji(p.current);

      // Record stats globally so it shows up in trouble-char lists across menu/match.
      const newMe = {
        ...s.me,
        charStats: { ...s.me.charStats },
        correct: s.me.correct + (correct ? 1 : 0),
        incorrect: s.me.incorrect + (correct ? 0 : 1)
      };
      const stat = newMe.charStats[p.current] || { correct: 0, incorrect: 0 };
      newMe.charStats[p.current] = correct
        ? { correct: stat.correct + 1, incorrect: stat.incorrect }
        : { correct: stat.correct, incorrect: stat.incorrect + 1 };

      // On wrong, keep current char so player can retry. On correct/dunno, advance.
      if (!correct && !dunno) {
        return {
          ...s,
          me: newMe,
          practice: {
            ...p,
            input: "",
            flash: { kind: "wrong", at: Date.now() },
            session: { ...p.session, incorrect: p.session.incorrect + 1 }
          }
        };
      }

      let queue = p.queue;
      if (queue.length === 0) queue = shuffleQueue(p.chars);
      const nextChar = queue[0];
      const nextQueue = queue.slice(1);

      return {
        ...s,
        me: newMe,
        practice: {
          ...p,
          current: nextChar,
          queue: nextQueue,
          input: "",
          flash: dunno
            ? { kind: "dunno", at: Date.now(), answer: reveal, char: p.current }
            : { kind: "correct", at: Date.now(), answer: reveal },
          session: dunno
            ? { ...p.session, incorrect: p.session.incorrect + 1 }
            : { ...p.session, correct: p.session.correct + 1 }
        }
      };
    });
  };

  const restart = () => setState(s => {
    const fresh = INITIAL();
    fresh.phase = "splash";   // restart from match-end goes to ranked landing so FIND ANOTHER MATCH flows naturally
    fresh.me.rank = s.me.rank;
    // carry over charStats so practice list persists
    fresh.me.charStats = s.me.charStats;
    fresh.me.correct = s.me.correct;
    fresh.me.incorrect = s.me.incorrect;
    return fresh;
  });

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  // Helper: wrap a render with the reconnect overlay when the connection
  // dropped mid-match. Phase stays put; overlay sits on top.
  function withReconnect(content) {
    if (!state.friend?.reconnecting) return content;
    return (
      <>
        {content}
        <FriendReconnectOverlay
          role={state.friend.role}
          attempts={state.friend.reconnectAttempts || 0}
          maxAttempts={7}
          error={state.friend.reconnectError}
          onGiveUp={goMenu}
        />
      </>
    );
  }

  if (state.phase === "main-menu") return <MainMenuScreen state={state} onRanked={goRanked} onPractice={goPracticeMenu} onFriend={goFriendMenu} />;
  if (state.phase === "friend-menu") return <FriendMenuScreen onHost={friendHostStart} onJoin={friendGuestStart} onBack={goMenu} />;
  if (state.phase === "friend-host-lobby") return (
    <FriendHostLobbyScreen
      code={state.friend?.code || ""}
      status={state.friend?.status || "idle"}
      error={state.friend?.error}
      guestName={state.friend?.oppName}
      guestConnected={state.friend?.status === "guest-joined"}
      config={state.friend?.config || window.DEFAULT_FRIEND_CONFIG}
      setConfig={setFriendConfig}
      myName={state.friend?.myName ?? ""}
      setMyName={setFriendMyName}
      onStart={friendHostStartMatch}
      onCancel={goMenu}
      copyState={state.friend?.copyState || "idle"}
      onCopy={friendCopyCode}
    />
  );
  if (state.phase === "friend-guest-lobby") return (
    <FriendGuestLobbyScreen
      status={state.friend?.status || "idle"}
      error={state.friend?.error}
      code={state.friend?.code || ""}
      setCode={setFriendCode}
      myName={state.friend?.myName ?? ""}
      setMyName={setFriendMyName}
      hostName={state.friend?.oppName}
      hostConfig={state.friend?.hostConfig}
      onJoin={friendGuestDoJoin}
      onCancel={goMenu}
    />
  );
  if (state.phase === "friend-vs") {
    // Re-use the ranked VS splash with friend-mode state shaped to look like ranked
    const role = state.friend?.role;
    const vsState = role === 'host'
      ? { me: state.friendState.me, opp: state.friendState.opp }
      : (state.friendRemoteState
          ? { me: state.friendRemoteState.me, opp: state.friendRemoteState.opp }
          : null);
    if (!vsState) return null;
    return withReconnect(<VsScreen state={vsState} />);
  }
  if (state.phase === "friend-ruleset-vote") {
    const role = state.friend?.role;
    const fs = role === 'host' ? state.friendState : state.friendRemoteState;
    if (!fs || !fs.rulesetVote) return null;
    // Shim into the shape RulesetVoteScreen expects from ranked.
    const shim = {
      me: fs.me,
      opp: fs.opp,
      rulesetOptions: fs.rulesetVote.options,
      rulesetChoices: { me: fs.rulesetVote.me, opp: fs.rulesetVote.opp },
      rulesetTiebreak: fs.rulesetVote.tiebreak,
      ruleset: fs.rulesetVote.resolved
    };
    return withReconnect(
      <RulesetVoteScreen
        state={shim}
        chooseRuleset={friendChooseRuleset}
        eyebrow="FRIEND MATCH · vote on the deck"
      />
    );
  }
  if (state.phase === "friend-modifier-pick") {
    const role = state.friend?.role;
    const fs = role === 'host' ? state.friendState : state.friendRemoteState;
    if (!fs || !fs.modVote) return null;
    // Re-use the ranked overlay by piggybacking on BattleScene's render.
    const scene = {
      ...fs,
      phase: "modifier-pick",
      modOptions: fs.modVote.options,
      modChoices: { me: fs.modVote.me, opp: fs.modVote.opp }
    };
    if (role === 'host') {
      return withReconnect(
        <BattleScene
          state={scene}
          submit={() => {}}
          activatePowerup={() => {}}
          chooseMod={friendChooseMod}
          setInput={() => {}}
        />
      );
    } else {
      const sceneGuest = { ...scene, me: { ...scene.me, input: friendGuestLocalInput } };
      return withReconnect(
        <BattleScene
          state={sceneGuest}
          submit={() => {}}
          activatePowerup={() => {}}
          chooseMod={friendChooseMod}
          setInput={setFriendGuestLocalInput}
        />
      );
    }
  }
  if (state.phase === "friend-countdown") {
    const role = state.friend?.role;
    const fs = role === 'host' ? state.friendState : state.friendRemoteState;
    if (!fs) return null;
    const scene = { ...fs, phase: "battle" };
    if (role === 'guest') {
      scene.me = { ...scene.me, input: friendGuestLocalInput };
    }
    const handlers = role === 'host'
      ? { submit: () => {}, activatePowerup: () => {}, setInput: () => {} }
      : { submit: () => {}, activatePowerup: () => {}, setInput: setFriendGuestLocalInput };
    return withReconnect(
      <>
        <BattleScene
          state={scene}
          submit={handlers.submit}
          activatePowerup={handlers.activatePowerup}
          chooseMod={() => {}}
          setInput={handlers.setInput}
        />
        <FriendCountdownOverlay n={Math.max(1, fs.countdown ?? 1)} />
      </>
    );
  }
  if (state.phase === "friend-battle" || state.phase === "friend-round-end") {
    const role = state.friend?.role;
    if (role === 'host') {
      if (!state.friendState) return null;
      const scene = {
        ...state.friendState,
        phase: state.phase === "friend-round-end" ? "round-end" : "battle"
      };
      return withReconnect(
        <BattleScene
          state={scene}
          submit={hostMeSubmit}
          activatePowerup={hostMePowerup}
          chooseMod={() => {}}
          setInput={hostMeSetInput}
        />
      );
    } else if (role === 'guest') {
      const remote = state.friendRemoteState;
      if (!remote) return null;
      const scene = {
        ...remote,
        me: { ...remote.me, input: friendGuestLocalInput },
        phase: state.phase === "friend-round-end" ? "round-end" : "battle"
      };
      return withReconnect(
        <BattleScene
          state={scene}
          submit={guestSubmit}
          activatePowerup={guestPowerup}
          chooseMod={() => {}}
          setInput={setFriendGuestLocalInput}
        />
      );
    }
  }
  if (state.phase === "friend-match-end") {
    const role = state.friend?.role;
    const fs = role === 'host' ? state.friendState : state.friendRemoteState;
    if (!fs) return null;
    return withReconnect(
      <FriendMatchEndScreen
        state={fs}
        role={role}
        onRematch={friendRematch}
        onLeave={goMenu}
        rematchMine={!!state.friend?.rematchMine}
        rematchTheirs={!!state.friend?.rematchTheirs}
      />
    );
  }
  if (state.phase === "friend-disconnected") {
    return (
      <div className="screen splash">
        <div className="splash-bg"></div>
        <div className="splash-content" style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 32, letterSpacing: '0.1em', marginBottom: 10 }}>DISCONNECTED</div>
          <div style={{ fontFamily: 'var(--mono)', color: 'var(--ink-dim)', letterSpacing: '0.1em', marginBottom: 24 }}>
            {state.friend?.error || "The connection to your friend was lost."}
          </div>
          <button className="btn-primary" onClick={goMenu}>
            <span className="btn-pulse"></span>
            BACK TO MENU
          </button>
        </div>
      </div>
    );
  }
  if (state.phase === "practice-menu") return <PracticeMenuScreen state={state} onBack={goMenu} onFlashcards={startFlashcards} onMissed={startMissedDrill} onTextbook={goTextbookMenu} />;
  if (state.phase === "practice-flashcards") return <PracticeFlashcardsScreen state={state} onBack={goPracticeMenu} setInput={setPracticeInput} submit={submitPractice} />;
  if (state.phase === "textbook-menu") return <TextbookMenuScreen onBack={goPracticeMenu} onOpen={openChapter} />;
  if (state.phase === "textbook-chapter") return (
    <TextbookChapterScreen
      chapterId={state.textbookChapterId}
      onBack={goTextbookMenu}
      onOpen={openChapter}
      onDrill={startFlashcards}
    />
  );
  if (state.phase === "splash") return <SplashScreen state={state} onFind={findMatch} onBack={goMenu} />;
  if (state.phase === "lobby") return <LobbyScreen state={state} />;
  if (state.phase === "vs") return <VsScreen state={state} />;
  if (state.phase === "ruleset-vote") return <RulesetVoteScreen state={state} chooseRuleset={chooseRuleset} />;
  if (state.phase === "match-end") return <MatchEndScreen state={state} onRestart={restart} onMenu={goMenu} />;

  return (
    <BattleScene
      state={state}
      submit={submit}
      activatePowerup={activatePowerup}
      chooseMod={chooseMod}
      setInput={(v) => update(n => { n.me.input = v; })}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

window.recordAttempt = recordAttempt;
window.topCharsBy = topCharsBy;
window.DECK_CAP = DECK_CAP;
window.COMBO_THRESHOLD = COMBO_THRESHOLD;
window.COMBO_MULTIPLIER = COMBO_MULTIPLIER;