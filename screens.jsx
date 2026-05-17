/* global React */
const { useEffect, useRef, useState } = React;

// ============================================================
// Reusable bits
// ============================================================

function HealthBar({ value, max, side = "me" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = value / max <= 0.3;
  const color = side === "me" ? "var(--p1)" : "var(--p2)";
  return (
    <div className={`hpbar ${side} ${isLow ? "low" : ""}`}>
      <div className="hpbar-track">
        <div className="hpbar-fill" style={{ width: pct + "%", background: color }}></div>
        <div className="hpbar-segments">
          {Array.from({ length: max }).map((_, i) => <span key={i}></span>)}
        </div>
      </div>
      <div className="hpbar-label">
        <span>HP</span>
        <span className="hpbar-value">{value}/{max}</span>
      </div>
    </div>
  );
}

function RankBadge({ rank, delta }) {
  const tier = rank >= 1400 ? "Master" : rank >= 1200 ? "Adept" : rank >= 1000 ? "Apprentice" : "Novice";
  return (
    <div className="rank-badge">
      <div className="rank-tier">{tier}</div>
      <div className="rank-elo">
        <span className="rank-num">{rank}</span>
        {delta != null && <span className={`rank-delta ${delta >= 0 ? "pos" : "neg"}`}>{delta >= 0 ? "+" : ""}{delta}</span>}
      </div>
    </div>
  );
}

function PowerUpChip({ id, onClick, dim }) {
  const def = window.POWERUP_MAP[id];
  if (!def) return null;
  return (
    <button className={`pup ${dim ? "dim" : ""}`} onClick={onClick} style={{ "--pup-color": def.color }} title={def.desc}>
      <span className="pup-glyph">{def.glyph}</span>
      <span className="pup-name">{def.name}</span>
    </button>
  );
}

function BuffStrip({ buffs, side }) {
  const active = [];
  if (buffs.shield) active.push({ id: "shield", glyph: "盾", color: "#FFD23F" });
  if (buffs.bolt) active.push({ id: "bolt", glyph: "雷", color: "#FF6B35" });
  if (buffs.reflect) active.push({ id: "reflect", glyph: "鏡", color: "#34D399" });
  if (buffs.peek > 0) active.push({ id: "peek", glyph: "目", color: "#A78BFA", n: buffs.peek });
  if (buffs.frozenUntil > Date.now()) active.push({ id: "freeze", glyph: "氷", color: "#7DD3FC" });
  if (!active.length) return <div className="buff-strip empty"></div>;
  return (
    <div className={`buff-strip ${side}`}>
      {active.map(b => (
        <div key={b.id} className="buff-chip" style={{ "--c": b.color }}>
          <span>{b.glyph}</span>
          {b.n != null && <span className="buff-n">×{b.n}</span>}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ComboMeter — glows green and shakes on each increment.
// Threshold (3) flips it from "neutral" to "active" (multiplier live).
// ============================================================
function ComboMeter({ combo, banked, flashKey, side = "me", compact = false }) {
  const threshold = window.COMBO_THRESHOLD || 3;
  const multiplier = window.COMBO_MULTIPLIER || 1.5;
  const active = combo >= threshold;
  const projected = active ? Math.floor(banked * multiplier) : banked;
  if (combo === 0 && banked === 0) {
    return (
      <div className={`combo-meter ${side} idle ${compact ? "compact" : ""}`}>
        <div className="combo-meter-label">COMBO</div>
        <div className="combo-meter-hint">
          {compact ? "—" : `chain ${threshold}+ to charge`}
        </div>
      </div>
    );
  }
  return (
    <div
      key={`shake-${flashKey || 0}`}
      className={`combo-meter ${side} ${active ? "active" : "warming"} ${compact ? "compact" : ""}`}
      data-combo={combo}
    >
      <div className="combo-meter-top">
        <span className="combo-meter-label">COMBO</span>
        {active && <span className="combo-meter-mult">×{multiplier}</span>}
      </div>
      <div className="combo-meter-n">
        <span className="combo-meter-x">×</span>
        <span className="combo-meter-count">{combo}</span>
      </div>
      <div className="combo-meter-bank">
        {active ? (
          <>
            <span className="combo-meter-banked">{banked}</span>
            <span className="combo-meter-arrow">→</span>
            <span className="combo-meter-projected">{projected}</span>
            <span className="combo-meter-banked-label">cards loaded</span>
          </>
        ) : (
          <>
            <span className="combo-meter-banked">{banked}</span>
            <span className="combo-meter-banked-label">
              {compact ? "held" : `held · ${threshold - combo} more to charge`}
            </span>
          </>
        )}
      </div>
      {active && <div className="combo-meter-ring"></div>}
    </div>
  );
}

// ============================================================
// Splash screen
// ============================================================

function SplashScreen({ state, onFind, onBack }) {
  useEffect(() => { ensureMenuStyles && ensureMenuStyles(); }, []);
  const best = window.topCharsBy(state.me, 5, "best");
  const worst = window.topCharsBy(state.me, 5, "worst");
  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      {onBack && <button className="mm-back" onClick={onBack}>← MENU</button>}
      <div className="splash-content">
        <div className="splash-brand">
          <div className="brand-mark">仮</div>
          <div>
            <div className="brand-title">KANA BATTLE</div>
            <div className="brand-sub">ranked · ひらがな vs カタカナ</div>
          </div>
        </div>

        <div className="splash-card">
          <div className="splash-profile">
            <div className="profile-avatar">{state.me.avatar}</div>
            <div>
              <div className="profile-name">{state.me.name}</div>
              <RankBadge rank={state.me.rank} />
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-block">
              <div className="stat-label">CORRECT</div>
              <div className="stat-value pos">{state.me.correct}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">INCORRECT</div>
              <div className="stat-value neg">{state.me.incorrect}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">ACCURACY</div>
              <div className="stat-value">{state.me.correct + state.me.incorrect ? Math.round(state.me.correct / (state.me.correct + state.me.incorrect) * 100) + "%" : "—"}</div>
            </div>
          </div>

          <button className="btn-primary" onClick={onFind}>
            <span className="btn-pulse"></span>
            FIND MATCH
          </button>
          <div className="btn-sub">est. wait &lt; 10s</div>
        </div>

        <div className="practice-row">
          <PracticeCard title="STRONGEST" entries={best} kind="best" />
          <PracticeCard title="NEEDS PRACTICE" entries={worst} kind="worst" />
        </div>
      </div>
    </div>
  );
}

function PracticeCard({ title, entries, kind }) {
  return (
    <div className={`practice-card ${kind}`}>
      <div className="practice-title">{title}</div>
      {entries.length === 0 ? (
        <div className="practice-empty">play a match to fill this list</div>
      ) : (
        <div className="practice-grid">
          {entries.map(e => (
            <div key={e.char} className="practice-cell">
              <div className="practice-char">{e.char}</div>
              <div className="practice-meta">
                <span className="practice-romaji">{window.canonicalRomaji(e.char)}</span>
                <span className="practice-acc">{Math.round(e.acc * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Lobby (matchmaking)
// ============================================================

function LobbyScreen({ state }) {
  const pct = Math.min(100, (state.searchSecs / 3.4) * 100);
  return (
    <div className="screen lobby">
      <div className="lobby-stack">
        <div className="lobby-status">SEARCHING FOR OPPONENT</div>
        <div className="lobby-spinner">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--p1)" strokeWidth="4"
              strokeDasharray="214" strokeDashoffset={214 - (pct / 100) * 214}
              transform="rotate(-90 40 40)" strokeLinecap="round" />
          </svg>
          <div className="lobby-time">{state.searchSecs.toFixed(1)}s</div>
        </div>
        <div className="lobby-meta">
          <div>your rank · <b>{state.me.rank}</b></div>
          <div className="lobby-tip">matching within ±100 elo</div>
        </div>
        <div className="lobby-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VS splash
// ============================================================

function VsScreen({ state }) {
  return (
    <div className="screen vs">
      <div className="vs-stage">
        <div className="vs-side left">
          <div className="vs-avatar p1">{state.me.avatar}</div>
          <div className="vs-name">{state.me.name}</div>
          <RankBadge rank={state.me.rank} />
        </div>
        <div className="vs-mid">
          <div className="vs-vs">VS</div>
          <div className="vs-round">FIRST TO DRAIN HP WINS</div>
        </div>
        <div className="vs-side right">
          <div className="vs-avatar p2">{state.opp.avatar}</div>
          <div className="vs-name">{state.opp.name}</div>
          <RankBadge rank={state.opp.rank} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Battle scene (main gameplay)
// ============================================================

function BattleScene({ state, submit, activatePowerup, chooseMod, setInput }) {
  const inputRef = useRef(null);
  useEffect(() => { ensureBattleStyles(); }, []);
  useEffect(() => { inputRef.current?.focus(); }, [state.round, state.phase]);

  const frozen = state.me.buffs.frozenUntil > Date.now();
  const [, force] = useState(0);
  useEffect(() => {
    if (!frozen) return;
    const iv = setInterval(() => force(x => x + 1), 100);
    return () => clearInterval(iv);
  }, [frozen]);

  const onKey = (e) => {
    if (e.key === "Enter") {
      submit(state.me.input, false);
    }
  };

  const currentChar = state.me.deck[0];
  const nextChars = state.me.deck.slice(1, 4);

  // Deck-cap visuals: near-cap (warning) below the cap, at-cap (danger) once full.
  // Once a deck is full, every additional card sent is converted to overflow damage.
  const cap = window.DECK_CAP || 25;
  const nearThreshold = cap - 5; // 20+ cards → warning
  const meDeckN = state.me.deck.length;
  const oppDeckN = state.opp.deckCount;
  const meCapState  = meDeckN  >= cap ? "overflow" : meDeckN  >= nearThreshold ? "near" : "";
  const oppCapState = oppDeckN >= cap ? "overflow" : oppDeckN >= nearThreshold ? "near" : "";

  return (
    <div className={`screen battle ${state.phase}`}>
      {/* opponent HUD (top) */}
      <div className="opp-hud">
        <div className="opp-id">
          <div className="opp-avatar">{state.opp.avatar}</div>
          <div className="opp-meta">
            <div className="opp-name">{state.opp.name}</div>
            <RankBadge rank={state.opp.rank} />
          </div>
        </div>
        <div className="opp-mid">
          <HealthBar value={state.opp.health} max={state.opp.maxHealth} side="opp" />
          <div className="opp-extras">
            <div className={`deck-pill opp cap-${oppCapState || "ok"}`}>
              <span className="deck-pill-glyph">札</span>
              <span className="deck-pill-n">{state.opp.deckCount}</span>
              <span className="deck-pill-label">cards</span>
            </div>
            <BuffStrip buffs={state.opp.buffs} side="opp" />
            <ComboMeter
              combo={state.opp.combo}
              banked={state.opp.bankedCards}
              flashKey={state.opp.comboFlash}
              side="opp"
              compact
            />
            <div className="opp-pups">
              {state.opp.powerups.map((id, i) => (
                <div key={i} className="opp-pup" style={{ "--c": window.POWERUP_MAP[id].color }}>{window.POWERUP_MAP[id].glyph}</div>
              ))}
              {state.opp.powerups.length === 0 && <div className="opp-pup-empty">no power-ups</div>}
            </div>
          </div>
        </div>
        <div className="opp-status">
          <div className={`live-dot ${frozen ? "frozen" : ""}`}></div>
          <span>online</span>
        </div>
      </div>

      {/* round modifiers banner */}
      {(state.ruleset || state.modifiers.length > 0) && (
        <div className="mod-banner">
          <span className="mod-banner-label">ROUND {state.round} ·</span>
          {state.ruleset && (
            <span className="mod-banner-chip ruleset">
              <span className="mod-banner-glyph">{state.ruleset.glyph}</span>
              {state.ruleset.name}
              <span className="mod-banner-meta">{state.ruleset.chars.length} chars</span>
            </span>
          )}
          {state.modifiers.map(m => (
            <span key={m} className="mod-banner-chip">
              <span className="mod-banner-glyph">{window.MOD_MAP[m].glyph}</span>
              {window.MOD_MAP[m].name}
            </span>
          ))}
        </div>
      )}

      {/* center battle stage */}
      <div className="battle-stage">
        {/* left rail — battle log */}
        <div className="battle-log">
          <div className="rail-title">BATTLE LOG</div>
          <div className="log-list">
            {state.log.slice(0, 12).map((l, i) => (
              <div key={l.at + "-" + i} className={`log-entry ${l.kind}`}>{l.t}</div>
            ))}
          </div>
        </div>

        {/* center cards */}
        <div className="card-stack">
          <div className="deck-shadow">
            {nextChars.slice().reverse().map((c, i) => {
              const depth = nextChars.length - i; // 1 = closest behind, larger = further back
              return (
                <div key={i} className="card behind" style={{ transform: `translate(${depth * 6}px, ${depth * 6}px) rotate(${depth * 1.5}deg)`, zIndex: -depth }}>
                  <div className="card-inner">
                    <div className="card-char dim">?</div>
                  </div>
                </div>
              );
            })}
            {currentChar ? (
              <div key={currentChar} className={`card front cap-${meCapState || "ok"} ${state.me.combo >= (window.COMBO_THRESHOLD || 3) ? "combo-active" : ""}`} style={{ zIndex: 10 }}>
                <div className="card-inner">
                  <div className="card-corner tl">
                    {(() => {
                      const meta = window.KANA_MAP[currentChar];
                      const base = meta.script === "hiragana" ? "ひらがな" : "カタカナ";
                      const tag =
                        meta.kind === "dakuten"    ? " ・゛" :
                        meta.kind === "handakuten" ? " ・゜" :
                        meta.kind === "digraph"    ? " ・拗" : "";
                      return base + tag;
                    })()}
                  </div>
                  <div className="card-corner br">{state.me.deck.length}</div>
                  <div className="card-char">{currentChar}</div>
                  {state.me.buffs.peek > 0 && (
                    <div className="card-peek">{window.displayRomaji(currentChar)}</div>
                  )}
                </div>
                {state.me.flash?.kind === "correct" && (
                  <div key={state.me.flash.at} className="flash-correct">
                    {state.me.flash.answer && state.me.flash.answer.includes(" / ") ? (
                      <>
                        <span className="flash-romaji">{state.me.flash.answer}</span>
                        <span className="flash-sent">⟶ sent</span>
                      </>
                    ) : (
                      <>⟶ sent</>
                    )}
                  </div>
                )}
                {state.me.flash?.kind === "dunno" && <div key={state.me.flash.at} className="flash-wrong">{state.me.flash.answer}</div>}
              </div>
            ) : (
              <div className="card empty"><div className="card-inner"><div className="card-char">✓</div></div></div>
            )}
          </div>
          <div className={`deck-counter cap-${meCapState || "ok"}`}>
            <div className="deck-counter-label">YOUR DECK</div>
            <div className="deck-counter-n">{state.me.deck.length}</div>
            {meCapState === "overflow" && <div className="deck-counter-cap">CAP · OVERFLOW</div>}
            {meCapState === "near" && <div className="deck-counter-cap">CAP {meDeckN}/{cap}</div>}
          </div>
        </div>

        {/* right rail — power-ups */}
        <div className="powerup-rail">
          <ComboMeter
            combo={state.me.combo}
            banked={state.me.bankedCards}
            flashKey={state.me.comboFlash}
            side="me"
          />
          <div className="rail-title">POWER-UPS</div>
          <div className="pup-grid">
            {state.me.powerups.map((id, i) => (
              <PowerUpChip key={i} id={id} onClick={() => activatePowerup(i)} />
            ))}
            {Array.from({ length: 4 - state.me.powerups.length }).map((_, i) => (
              <div key={"empty" + i} className="pup empty"></div>
            ))}
          </div>
          <div className="rail-help">click to activate · earned on correct answers</div>
        </div>
      </div>

      {/* input bar */}
      <div className={`input-bar ${frozen ? "frozen" : ""}`}>
        <button className="dunno" onClick={() => submit("", true)} disabled={frozen}>
          <span className="dunno-glyph">分</span>
          <span className="dunno-label">I don't know</span>
          <span className="dunno-sub">+{state.modifiers.includes("no_dunno") ? 5 : 3} cards</span>
        </button>
        <div className="answer-wrap">
          {frozen && <div className="frozen-overlay">❄ FROZEN {((state.me.buffs.frozenUntil - Date.now()) / 1000).toFixed(1)}s</div>}
          <input
            ref={inputRef}
            className="answer-input"
            type="text"
            placeholder={frozen ? "" : "type romaji…"}
            value={state.me.input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={frozen}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="answer-submit" onClick={() => submit(state.me.input, false)} disabled={frozen || !state.me.input}>
            ENTER ↵
          </button>
        </div>
      </div>

      {/* me HUD (bottom) */}
      <div className="me-hud">
        <div className="me-id">
          <div className="me-avatar">{state.me.avatar}</div>
          <div className="me-meta">
            <div className="me-name">{state.me.name}</div>
            <RankBadge rank={state.me.rank} />
          </div>
        </div>
        <div className="me-mid">
          <HealthBar value={state.me.health} max={state.me.maxHealth} side="me" />
          <div className="me-extras">
            <div className="me-counter pos"><span>✓</span> {state.me.correct}</div>
            <div className="me-counter neg"><span>✗</span> {state.me.incorrect}</div>
            <BuffStrip buffs={state.me.buffs} side="me" />
          </div>
        </div>
      </div>

      {/* round-end / modifier overlays */}
      {state.phase === "round-end" && (
        <RoundEndOverlay state={state} />
      )}
      {state.phase === "modifier-pick" && (
        <ModifierPickOverlay state={state} chooseMod={chooseMod} />
      )}
    </div>
  );
}

function RoundEndOverlay({ state }) {
  const win = state.roundWinner === "me";
  return (
    <div className="overlay round-end-overlay">
      <div className={`round-end-card ${win ? "win" : "lose"}`}>
        <div className="round-end-label">ROUND {state.round}</div>
        <div className="round-end-result">{win ? "YOU CLEARED" : "OPPONENT CLEARED"}</div>
        <div className="round-end-sub">preparing modifiers…</div>
      </div>
    </div>
  );
}

function ModifierPickOverlay({ state, chooseMod }) {
  const mePicked = state.modChoices.me;
  const oppPicked = state.modChoices.opp;
  return (
    <div className="overlay mod-pick-overlay">
      <div className="mod-pick-card">
        <div className="mod-pick-title">PICK A MODIFIER FOR ROUND {state.round + 1}</div>
        <div className="mod-pick-sub">whichever cards both players choose are stacked together next round</div>
        <div className="mod-options">
          {state.modOptions.map(m => (
            <button
              key={m.id}
              className={`mod-option ${mePicked === m.id ? "picked" : ""} ${mePicked && mePicked !== m.id ? "unpicked" : ""}`}
              onClick={() => chooseMod(m.id)}
              disabled={!!mePicked}
            >
              <div className="mod-option-glyph">{m.glyph}</div>
              <div className="mod-option-name">{m.name}</div>
              <div className="mod-option-desc">{m.desc}</div>
              <div className={`mod-option-tone tone-${m.tone}`}></div>
            </button>
          ))}
        </div>
        <div className="mod-pick-status">
          <div className={`mod-status-pill ${mePicked ? "done" : ""}`}>
            <span className="dot"></span>
            you {mePicked ? `· ${window.MOD_MAP[mePicked].name}` : "· thinking…"}
          </div>
          <div className={`mod-status-pill ${oppPicked ? "done" : ""}`}>
            <span className="dot"></span>
            {state.opp.name} {oppPicked ? `· ${window.MOD_MAP[oppPicked].name}` : "· thinking…"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Match end
// ============================================================

function MatchEndScreen({ state, onRestart, onMenu }) {
  useEffect(() => { ensureMenuStyles && ensureMenuStyles(); }, []);
  const win = state.matchWinner === "me";
  const best = window.topCharsBy(state.me, 6, "best");
  const worst = window.topCharsBy(state.me, 6, "worst");
  const acc = state.me.correct + state.me.incorrect ? Math.round(state.me.correct / (state.me.correct + state.me.incorrect) * 100) : 0;

  return (
    <div className={`screen match-end ${win ? "win" : "lose"}`}>
      {onMenu && <button className="mm-back" onClick={onMenu}>← MENU</button>}
      <div className="match-end-wrap">
        <div className="match-end-banner">
          <div className="match-end-result">{win ? "VICTORY" : "DEFEAT"}</div>
          <div className="match-end-sub">{win ? `you defeated ${state.opp.name}` : `${state.opp.name} defeated you`}</div>
        </div>

        <div className="match-end-grid">
          <div className="match-end-rank">
            <div className="me-card-title">RANK</div>
            <div className="me-rank-row">
              <div className="me-rank-old">{state.me.rank - state.rankDelta}</div>
              <div className="me-rank-arrow">→</div>
              <div className="me-rank-new">{state.me.rank}</div>
            </div>
            <div className={`me-rank-delta ${state.rankDelta >= 0 ? "pos" : "neg"}`}>
              {state.rankDelta >= 0 ? "+" : ""}{state.rankDelta} ELO
            </div>
          </div>

          <div className="match-end-stats">
            <div className="me-card-title">THIS MATCH</div>
            <div className="me-stats-row">
              <div><div className="ms-n pos">{state.me.correct}</div><div className="ms-l">correct</div></div>
              <div><div className="ms-n neg">{state.me.incorrect}</div><div className="ms-l">incorrect</div></div>
              <div><div className="ms-n">{acc}%</div><div className="ms-l">accuracy</div></div>
              <div><div className="ms-n">{state.round}</div><div className="ms-l">rounds</div></div>
            </div>
          </div>
        </div>

        <div className="practice-row">
          <PracticeCard title="STRONGEST" entries={best} kind="best" />
          <PracticeCard title="NEEDS PRACTICE" entries={worst} kind="worst" />
        </div>

        <div className="match-end-actions">
          <button className="btn-primary" onClick={onRestart}>
            <span className="btn-pulse"></span>
            FIND ANOTHER MATCH
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Ruleset vote (between VS and battle)
// ============================================================

function RulesetCard({ r, picked, dim, pulse, onClick, large }) {
  const previewChars = r.chars.slice(0, 6);
  const overflow = r.chars.length - previewChars.length;
  return (
    <button
      className={`rs-card ${picked ? "picked" : ""} ${dim ? "dim" : ""} ${pulse ? "pulse" : ""} ${large ? "large" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="rs-glyph">{r.glyph}</div>
      <div className="rs-name">{r.name}</div>
      <div className="rs-meta">
        <span className="rs-count">{r.chars.length} chars</span>
        <span className={`rs-fam fam-${r.family}`}>{r.family}</span>
      </div>
      <div className="rs-preview">
        {previewChars.map((c, i) => <span key={i} className="rs-prev-char">{c}</span>)}
        {overflow > 0 && <span className="rs-prev-more">+{overflow}</span>}
      </div>
    </button>
  );
}

function RulesetVoteScreen({ state, chooseRuleset, eyebrow }) {
  const mePick = state.rulesetChoices.me;
  const oppPick = state.rulesetChoices.opp;
  const tb = state.rulesetTiebreak;
  const ruleset = state.ruleset;
  const lowerRank = Math.min(state.me.rank, state.opp.rank);
  const tierName = window.tierFor(lowerRank);

  // Ruleset locked in → show confirmation
  if (ruleset) {
    return (
      <div className="screen rs-vote">
        <div className="rs-wrap">
          <div className="rs-locked">
            <div className="rs-locked-label">RULESET LOCKED</div>
            <RulesetCard r={ruleset} picked large pulse />
            <div className="rs-locked-sub">starting in a moment…</div>
          </div>
        </div>
      </div>
    );
  }

  // Tiebreak roulette
  if (tb) {
    const meOpt = window.RULESET_MAP[mePick];
    const oppOpt = window.RULESET_MAP[oppPick];
    const cur = window.RULESET_MAP[tb.displayId];
    return (
      <div className="screen rs-vote">
        <div className="rs-wrap">
          <div className="rs-tiebreak-title">TIE — ROLLING…</div>
          <div className="rs-tiebreak-sub">both players picked differently. random pick incoming.</div>
          <div className="rs-tiebreak-row">
            <div className={`rs-tb-side ${cur.id === meOpt.id ? "lit me" : ""}`}>
              <div className="rs-tb-who">YOU</div>
              <RulesetCard r={meOpt} />
            </div>
            <div className={`rs-tb-spinner ${tb.settled ? "settled" : ""}`}>
              <div className="rs-tb-current">
                <div className="rs-tb-glyph">{cur.glyph}</div>
                <div className="rs-tb-name">{cur.name}</div>
              </div>
              {tb.settled && <div className="rs-tb-confirm">→ LOCKED</div>}
            </div>
            <div className={`rs-tb-side ${cur.id === oppOpt.id ? "lit opp" : ""}`}>
              <div className="rs-tb-who">{state.opp.name.toUpperCase()}</div>
              <RulesetCard r={oppOpt} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal voting
  return (
    <div className="screen rs-vote">
      <div className="rs-wrap">
        <div className="rs-header">
          <div className="rs-eyebrow">{eyebrow || `TIER · ${tierName.toUpperCase()} · ${lowerRank} ELO`}</div>
          <div className="rs-title">CHOOSE YOUR RULESET</div>
          <div className="rs-sub">both players vote. agreement begins the match. ties go to a random roll.</div>
        </div>
        <div className="rs-options">
          {state.rulesetOptions.map(r => (
            <RulesetCard
              key={r.id}
              r={r}
              picked={mePick === r.id}
              dim={mePick && mePick !== r.id}
              onClick={mePick ? null : () => chooseRuleset(r.id)}
            />
          ))}
        </div>
        <div className="rs-status">
          <div className={`rs-status-pill ${mePick ? "done" : ""}`}>
            <span className="dot"></span>
            you {mePick ? `· voted ${window.RULESET_MAP[mePick].name}` : "· choose a ruleset…"}
          </div>
          <div className={`rs-status-pill ${oppPick ? "done" : ""}`}>
            <span className="dot"></span>
            {state.opp.name} {oppPick ? `· voted ${window.RULESET_MAP[oppPick].name}` : "· deciding…"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Inline styles for new menu / practice screens.
// Kept inline so the new code is self-contained — every selector
// here is prefixed `mm-`, `pm-`, or `pf-` to avoid colliding with
// the existing stylesheet.
// ============================================================

const MENU_STYLES = `
.mm-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  margin-bottom: 28px;
}
.mm-strip .mm-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 22px;
  background: linear-gradient(135deg, var(--p1), rgba(255,255,255,0.05));
  font-family: serif;
}
.mm-strip-info { flex: 1; }
.mm-strip-name { font-weight: 700; letter-spacing: 0.5px; }
.mm-strip-sub { font-size: 11px; opacity: 0.55; letter-spacing: 1px; margin-top: 2px; }
.mm-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 22px;
}
.mm-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 32px 22px 26px;
  text-align: center;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  overflow: hidden;
  color: inherit;
  font: inherit;
}
.mm-card:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.05);
}
.mm-card .mm-card-glyph {
  font-family: serif;
  font-size: 64px;
  line-height: 1;
  margin-bottom: 16px;
  color: var(--card-color, var(--p1));
  text-shadow: 0 0 24px var(--card-color, var(--p1));
  opacity: 0.95;
}
.mm-card .mm-card-name {
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  margin-bottom: 8px;
}
.mm-card .mm-card-desc {
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.5;
  letter-spacing: 0.3px;
}
.mm-card .mm-card-meta {
  margin-top: 14px;
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.5;
}
.mm-card.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.mm-card.disabled .mm-card-meta { color: var(--p2); opacity: 0.7; }
.mm-card.featured { border-color: var(--p1); background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); }

.mm-back, .pm-back, .pf-back {
  position: absolute;
  top: 22px; left: 22px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: inherit;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}
.mm-back:hover, .pm-back:hover, .pf-back:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.16);
}

.pm-header { margin-bottom: 24px; text-align: center; }
.pm-eyebrow { font-size: 11px; letter-spacing: 3px; opacity: 0.5; margin-bottom: 8px; }
.pm-title { font-size: 28px; font-weight: 800; letter-spacing: 2px; }
.pm-sub { font-size: 13px; opacity: 0.55; margin-top: 6px; }

.pm-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 22px;
}
.pm-mode {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}
.pm-mode:not(:disabled):hover {
  transform: translateX(4px);
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.05);
}
.pm-mode .pm-glyph {
  font-family: serif;
  font-size: 36px;
  line-height: 1;
  width: 56px;
  text-align: center;
  color: var(--mode-color, var(--p1));
  text-shadow: 0 0 16px var(--mode-color, var(--p1));
}
.pm-mode .pm-mode-body { flex: 1; }
.pm-mode .pm-mode-name { font-size: 16px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
.pm-mode .pm-mode-desc { font-size: 12px; opacity: 0.55; line-height: 1.45; }
.pm-mode .pm-mode-tag {
  font-size: 10px;
  letter-spacing: 1.5px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
}
.pm-mode .pm-mode-tag.soon { color: var(--p2); background: rgba(255,107,53,0.1); }
.pm-mode .pm-mode-tag.ready { color: var(--p1); background: rgba(255,210,63,0.12); }
.pm-mode.disabled { cursor: not-allowed; opacity: 0.45; }

.pm-rs-pane {
  margin-top: 24px;
  padding: 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
}
.pm-rs-pane-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.pm-rs-title { font-size: 12px; letter-spacing: 2px; opacity: 0.65; }
.pm-rs-hint { font-size: 10px; opacity: 0.45; letter-spacing: 0.5px; }
.pm-rs-family { font-size: 10px; letter-spacing: 1.5px; opacity: 0.45; margin: 14px 0 8px; text-transform: uppercase; }
.pm-rs-family:first-child { margin-top: 0; }
.pm-rs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;
}

/* ----- script tabs ----- */
.pm-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
}
.pm-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.55);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.pm-tab:hover { color: rgba(255,255,255,0.85); }
.pm-tab.active {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.12);
  color: #fff;
  box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
}
.pm-tab .pm-tab-label { white-space: nowrap; }
.pm-tab .pm-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--p1);
  color: #111;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}

/* ----- per-tab tools ----- */
.pm-tab-tools {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: flex-end;
}
.pm-tt-btn {
  font: inherit;
  font-size: 10px;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.55);
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;
}
.pm-tt-btn:hover:not(:disabled) {
  color: #fff;
  border-color: rgba(255,255,255,0.18);
}
.pm-tt-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ----- ruleset card (now a checkbox) ----- */
.pm-rs-body { max-height: 340px; overflow-y: auto; padding-right: 4px; }
.pm-rs-body::-webkit-scrollbar { width: 6px; }
.pm-rs-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

.pm-rs-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  position: relative;
}
.pm-rs-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.18);
}
.pm-rs-btn.checked {
  background: linear-gradient(135deg, rgba(255,210,63,0.12), rgba(255,210,63,0.04));
  border-color: var(--p1);
  box-shadow: 0 0 0 1px var(--p1), 0 0 18px rgba(255,210,63,0.18);
}
.pm-rs-check {
  width: 18px; height: 18px;
  flex-shrink: 0;
  border-radius: 5px;
  border: 1.5px solid rgba(255,255,255,0.25);
  background: rgba(0,0,0,0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: #111;
  transition: background 120ms ease, border-color 120ms ease;
}
.pm-rs-check.on {
  background: var(--p1);
  border-color: var(--p1);
  box-shadow: 0 0 10px rgba(255,210,63,0.5);
}
.pm-rs-btn .pm-rs-g {
  font-family: serif;
  font-size: 24px;
  line-height: 1;
  color: var(--p1);
  flex-shrink: 0;
  min-width: 26px;
  text-align: center;
}
.pm-rs-btn.checked .pm-rs-g { text-shadow: 0 0 12px rgba(255,210,63,0.55); }
.pm-rs-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.pm-rs-btn .pm-rs-n { font-size: 12px; font-weight: 600; line-height: 1.2; }
.pm-rs-btn .pm-rs-c { font-size: 10px; opacity: 0.55; margin-top: 2px; }

/* ----- footer / start ----- */
.pm-rs-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  padding: 14px 16px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  flex-wrap: wrap;
}
.pm-rs-foot.ready { border-color: rgba(255,210,63,0.4); box-shadow: 0 0 18px rgba(255,210,63,0.12); }
.pm-rs-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}
.pm-rs-summary-empty { opacity: 0.5; font-size: 12px; letter-spacing: 0.3px; }
.pm-rs-summary-n { font-size: 22px; font-weight: 800; color: var(--p1); font-variant-numeric: tabular-nums; }
.pm-rs-summary-lbl { font-size: 11px; opacity: 0.6; letter-spacing: 1px; text-transform: uppercase; }
.pm-rs-summary-dot { opacity: 0.3; margin: 0 4px; }
.pm-rs-start {
  font: inherit;
  font-weight: 800;
  letter-spacing: 2px;
  font-size: 13px;
  padding: 12px 22px;
  background: var(--p1);
  color: #111;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.pm-rs-start:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(255,210,63,0.4);
}
.pm-rs-start:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.4);
}

/* Flashcards drill */
.pf-screen { display: flex; flex-direction: column; height: 100%; padding: 22px; }
.pf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.pf-title-block { text-align: center; flex: 1; }
.pf-title { font-size: 18px; font-weight: 800; letter-spacing: 2px; }
.pf-sub { font-size: 11px; opacity: 0.55; letter-spacing: 1.5px; margin-top: 2px; }

.pf-stats {
  display: flex; justify-content: center; gap: 28px;
  padding: 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  margin-bottom: 24px;
}
.pf-stat { text-align: center; }
.pf-stat .pf-stat-n { font-size: 24px; font-weight: 800; }
.pf-stat .pf-stat-n.pos { color: var(--p1); }
.pf-stat .pf-stat-n.neg { color: var(--p2); }
.pf-stat .pf-stat-l { font-size: 10px; opacity: 0.55; letter-spacing: 1.5px; margin-top: 2px; }

.pf-card-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 280px;
}
.pf-card {
  width: 240px; height: 300px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
.pf-card .pf-card-corner {
  position: absolute;
  top: 14px; left: 16px;
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.55;
}
.pf-card .pf-card-char {
  font-family: serif;
  font-size: 140px;
  line-height: 1;
}
/* shared font-size for kana */
.pf-card.correct { animation: pf-flash-correct 400ms ease; }
.pf-card.wrong   { animation: pf-flash-wrong 400ms ease; }
.pf-card.dunno   { animation: pf-flash-dunno 400ms ease; }
@keyframes pf-flash-correct {
  0%, 100% { border-color: rgba(255,255,255,0.1); }
  50% { border-color: var(--p1); box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 60px var(--p1); }
}
@keyframes pf-flash-wrong {
  0%, 100% { border-color: rgba(255,255,255,0.1); transform: translateX(0); }
  20% { transform: translateX(-6px); border-color: var(--p2); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes pf-flash-dunno {
  0%, 100% { border-color: rgba(255,255,255,0.1); }
  50% { border-color: #A78BFA; box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 60px #A78BFA; }
}

.pf-reveal {
  position: absolute;
  bottom: -42px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 14px;
  letter-spacing: 1.5px;
  padding: 6px 14px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
}
.pf-reveal.correct { color: var(--p1); border-color: var(--p1); }
.pf-reveal.dunno   { color: #A78BFA; border-color: #A78BFA; }

.pf-input-row {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}
.pf-input-row input {
  flex: 1;
  padding: 16px 20px;
  font-size: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: inherit;
  font-family: inherit;
  letter-spacing: 2px;
  outline: none;
}
.pf-input-row input:focus { border-color: var(--p1); }
.pf-input-row button {
  padding: 0 22px;
  background: var(--p1);
  border: none;
  border-radius: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  cursor: pointer;
  color: #111;
  font: inherit;
  font-weight: 800;
  letter-spacing: 2px;
}
.pf-input-row button:disabled { opacity: 0.35; cursor: not-allowed; }
.pf-dunno {
  margin-top: 12px;
  align-self: center;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 11px;
  letter-spacing: 1.5px;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  opacity: 0.7;
}
.pf-dunno:hover { opacity: 1; border-color: rgba(255,255,255,0.2); }

@media (max-width: 720px) {
  .mm-options { grid-template-columns: 1fr; }
  .pm-modes { grid-template-columns: 1fr; }
  .pm-rs-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .pm-tab { padding: 9px 8px; font-size: 10px; letter-spacing: 1px; }
  .pm-tab .pm-tab-label { font-size: 9px; }
  .pm-rs-foot { flex-direction: column; align-items: stretch; }
  .pm-rs-summary { justify-content: center; }
  .pm-rs-start { width: 100%; }
  .tb-grid { grid-template-columns: 1fr !important; }
  .tb-ch-grid { grid-template-columns: 1fr !important; }
  .tb-ch-foot { flex-direction: column; align-items: stretch; }
  .tb-ch-drill { width: 100%; }
  .tb-pron-table { font-size: 12px; }
}

/* ============================================================
   Textbook screens — chapter list + chapter reader
   ============================================================ */

/* ---- chapter list ---- */
.tb-menu-head { margin-bottom: 28px; text-align: center; }
.tb-menu-eyebrow { font-size: 11px; letter-spacing: 3px; opacity: 0.5; margin-bottom: 8px; }
.tb-menu-title { font-size: 28px; font-weight: 800; letter-spacing: 2px; }
.tb-menu-sub { font-size: 13px; opacity: 0.55; margin-top: 6px; }

.tb-group { margin-bottom: 28px; }
.tb-group-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 2px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.tb-group-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.tb-group-sub {
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.45;
  text-transform: uppercase;
}
.tb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.tb-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  position: relative;
  overflow: hidden;
}
.tb-card::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(circle at 20% 50%, var(--card-color, var(--p1)), transparent 60%);
  opacity: 0;
  transition: opacity 160ms ease;
  pointer-events: none;
}
.tb-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.05);
}
.tb-card:hover::before { opacity: 0.06; }
.tb-card-glyph {
  font-family: serif;
  font-size: 38px;
  line-height: 1;
  width: 50px;
  text-align: center;
  color: var(--card-color, var(--p1));
  text-shadow: 0 0 18px var(--card-color, var(--p1));
  flex-shrink: 0;
}
.tb-card-body { min-width: 0; flex: 1; }
.tb-card-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.25;
  margin-bottom: 3px;
}
.tb-card-sub {
  font-size: 10px;
  opacity: 0.55;
  letter-spacing: 0.3px;
  line-height: 1.35;
}
.tb-card-arrow {
  font-size: 14px;
  opacity: 0.35;
  flex-shrink: 0;
  transition: transform 120ms ease, opacity 120ms ease;
}
.tb-card:hover .tb-card-arrow { opacity: 0.8; transform: translateX(2px); }

/* ---- chapter reader ---- */
.tb-ch-screen { padding-bottom: 100px; }
.tb-ch-head {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
  padding: 20px 22px;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
}
.tb-ch-glyph {
  font-family: serif;
  font-size: 72px;
  line-height: 1;
  width: 96px;
  text-align: center;
  color: var(--p1);
  text-shadow: 0 0 32px var(--p1);
  flex-shrink: 0;
}
.tb-ch-titles { flex: 1; min-width: 0; }
.tb-ch-eyebrow {
  font-size: 10px;
  letter-spacing: 2.5px;
  opacity: 0.5;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.tb-ch-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.1;
  margin-bottom: 6px;
}
.tb-ch-sub {
  font-size: 13px;
  opacity: 0.6;
  letter-spacing: 0.3px;
  line-height: 1.4;
}

.tb-ch-section { margin-bottom: 28px; }
.tb-ch-sec-label {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.45;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.tb-ch-intro p {
  font-size: 14px;
  line-height: 1.65;
  margin: 0 0 12px;
  opacity: 0.82;
}
.tb-ch-intro p:last-child { margin-bottom: 0; }

.tb-pron-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
  font-size: 13px;
}
.tb-pron-table td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: top;
}
.tb-pron-table tr:last-child td { border-bottom: none; }
.tb-pron-key {
  font-family: serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--p1);
  letter-spacing: 1px;
  width: 60px;
  white-space: nowrap;
}
.tb-pron-val { opacity: 0.75; line-height: 1.4; }

.tb-ch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.tb-char-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
}
.tb-char-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 64px;
  flex-shrink: 0;
}
.tb-char-glyph {
  font-family: serif;
  font-size: 56px;
  line-height: 1;
  color: #fff;
}
.tb-char-romaji {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--p1);
  text-transform: uppercase;
}
.tb-char-body { flex: 1; min-width: 0; }
.tb-char-row {
  font-size: 12.5px;
  line-height: 1.5;
  margin-bottom: 8px;
}
.tb-char-row:last-child { margin-bottom: 0; }
.tb-char-tag {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 1.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  margin-right: 8px;
  vertical-align: 2px;
  text-transform: uppercase;
}
.tb-char-tag.mnemonic { background: rgba(255,210,63,0.12); color: var(--p1); }
.tb-char-tag.shape    { background: rgba(125,211,252,0.12); color: #7DD3FC; }
.tb-char-tag.confuse  { background: rgba(255,107,53,0.12); color: var(--p2); }
.tb-char-row-text { opacity: 0.82; }
.tb-char-confuse-list {
  margin: 4px 0 0;
  padding: 0 0 0 16px;
  list-style: '— ';
}
.tb-char-confuse-list li {
  margin-bottom: 4px;
  opacity: 0.75;
}

/* ---- chapter footer / nav ---- */
.tb-ch-foot {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 24px;
  padding: 14px 18px;
  background: rgba(15,15,18,0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,210,63,0.35);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(255,210,63,0.1);
  flex-wrap: wrap;
}
.tb-ch-foot-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}
.tb-ch-foot-n {
  font-size: 18px;
  font-weight: 800;
  color: var(--p1);
  font-variant-numeric: tabular-nums;
}
.tb-ch-foot-lbl {
  font-size: 11px;
  letter-spacing: 1px;
  opacity: 0.6;
  text-transform: uppercase;
}
.tb-ch-drill {
  font: inherit;
  font-weight: 800;
  letter-spacing: 2px;
  font-size: 13px;
  padding: 12px 22px;
  background: var(--p1);
  color: #111;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.tb-ch-drill:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(255,210,63,0.45);
}
.tb-ch-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
}
.tb-ch-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}
.tb-ch-nav-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.05);
}
.tb-ch-nav-btn.next { text-align: right; align-items: flex-end; }
.tb-ch-nav-btn.empty {
  cursor: default;
  opacity: 0.25;
  pointer-events: none;
}
.tb-ch-nav-dir {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.45;
}
.tb-ch-nav-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
`;

function ensureMenuStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("menu-styles-injected")) return;
  const s = document.createElement("style");
  s.id = "menu-styles-injected";
  s.textContent = MENU_STYLES;
  document.head.appendChild(s);
}

// ============================================================
// Deck-cap glow — warns at 20+ cards (near cap), pulses red when at
// or beyond DECK_CAP (any further sends become overflow damage).
// ============================================================

const BATTLE_STYLES = `
/* ============================================================
 * Combo meter — glows green & shakes on each increment.
 * Threshold (≥3) flips it from "warming" to "active" (×1.5 live).
 * ============================================================ */

/* ---- player's combo meter (in right rail) ---- */
.combo-meter {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 14px 12px;
  margin-bottom: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease;
}
.combo-meter.idle {
  opacity: 0.55;
}
.combo-meter.idle .combo-meter-label {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.7;
}
.combo-meter.idle .combo-meter-hint {
  font-size: 10px;
  opacity: 0.55;
  letter-spacing: 0.5px;
}

/* Warming: combo 1-2, no multiplier yet */
.combo-meter.warming {
  border-color: rgba(52, 211, 153, 0.45);
  background: rgba(52, 211, 153, 0.06);
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.18), 0 0 16px rgba(52, 211, 153, 0.18);
  animation: combo-shake 320ms cubic-bezier(.36,.07,.19,.97);
}

/* Active: combo ≥ 3, multiplier live */
.combo-meter.active {
  border-color: rgba(52, 211, 153, 0.95);
  background: linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.06));
  box-shadow:
    0 0 0 1px rgba(52, 211, 153, 0.85),
    0 0 28px rgba(52, 211, 153, 0.55),
    0 0 56px rgba(52, 211, 153, 0.28),
    inset 0 0 18px rgba(52, 211, 153, 0.18);
  animation: combo-shake 420ms cubic-bezier(.36,.07,.19,.97), combo-pulse 1.4s ease-in-out infinite 420ms;
}

@keyframes combo-shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 1px, 0); }
  40%, 60% { transform: translate3d(3px, -1px, 0); }
}

@keyframes combo-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(52, 211, 153, 0.85),
      0 0 28px rgba(52, 211, 153, 0.55),
      0 0 56px rgba(52, 211, 153, 0.28),
      inset 0 0 18px rgba(52, 211, 153, 0.18);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(52, 211, 153, 1),
      0 0 44px rgba(52, 211, 153, 0.8),
      0 0 88px rgba(52, 211, 153, 0.45),
      inset 0 0 28px rgba(52, 211, 153, 0.3);
  }
}

.combo-meter-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.combo-meter-label {
  font-size: 10px;
  letter-spacing: 2.5px;
  color: rgba(52, 211, 153, 0.95);
  font-weight: 800;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}
.combo-meter.warming .combo-meter-label {
  color: rgba(52, 211, 153, 0.8);
  text-shadow: 0 0 6px rgba(52, 211, 153, 0.4);
}
.combo-meter-mult {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #fff;
  background: rgba(52, 211, 153, 0.85);
  padding: 2px 7px;
  border-radius: 999px;
  text-shadow: 0 0 6px rgba(0,0,0,0.4);
  animation: combo-mult-pop 420ms ease;
}
@keyframes combo-mult-pop {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.combo-meter-n {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1;
}
.combo-meter-x {
  font-size: 18px;
  font-weight: 700;
  color: rgba(52, 211, 153, 0.9);
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.7);
}
.combo-meter-count {
  font-size: 42px;
  font-weight: 900;
  color: #b8ffe0;
  text-shadow:
    0 0 12px rgba(52, 211, 153, 0.95),
    0 0 28px rgba(52, 211, 153, 0.55);
  font-variant-numeric: tabular-nums;
}
.combo-meter.active .combo-meter-count {
  color: #fff;
  text-shadow:
    0 0 14px rgba(52, 211, 153, 1),
    0 0 32px rgba(52, 211, 153, 0.85),
    0 0 60px rgba(52, 211, 153, 0.55);
}

.combo-meter-bank {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  letter-spacing: 0.5px;
}
.combo-meter-banked {
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  font-variant-numeric: tabular-nums;
}
.combo-meter-arrow {
  opacity: 0.6;
  font-size: 12px;
}
.combo-meter-projected {
  font-weight: 800;
  color: #b8ffe0;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.7);
  font-variant-numeric: tabular-nums;
}
.combo-meter.active .combo-meter-projected {
  color: #fff;
  text-shadow: 0 0 10px rgba(52, 211, 153, 1);
}
.combo-meter-banked-label {
  opacity: 0.55;
  font-size: 10px;
  letter-spacing: 0.8px;
}

/* Decorative ring on active state */
.combo-meter-ring {
  position: absolute;
  inset: -2px;
  border-radius: 13px;
  pointer-events: none;
  border: 1px solid rgba(52, 211, 153, 0.35);
  animation: combo-ring 1.8s ease-out infinite;
}
@keyframes combo-ring {
  0%   { transform: scale(1);    opacity: 0.9; }
  100% { transform: scale(1.08); opacity: 0;   }
}

/* Compact variant — opponent's combo, fits in opp HUD */
.combo-meter.compact {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  margin-bottom: 0;
  border-radius: 999px;
}
.combo-meter.compact.idle {
  display: none; /* hide if opp has no combo at all */
}
.combo-meter.compact .combo-meter-top {
  flex-direction: row;
  gap: 6px;
}
.combo-meter.compact .combo-meter-label {
  font-size: 9px;
  letter-spacing: 1.8px;
}
.combo-meter.compact .combo-meter-mult {
  font-size: 9px;
  padding: 1px 5px;
}
.combo-meter.compact .combo-meter-n {
  gap: 1px;
}
.combo-meter.compact .combo-meter-x {
  font-size: 12px;
}
.combo-meter.compact .combo-meter-count {
  font-size: 20px;
}
.combo-meter.compact .combo-meter-bank {
  font-size: 10px;
}
.combo-meter.compact .combo-meter-banked-label {
  display: none;
}
.combo-meter.compact .combo-meter-ring {
  border-radius: 999px;
}

/* ---- player's center card — combo halo ---- */
.card.front.combo-active {
  border-color: rgba(52, 211, 153, 0.6) !important;
}

/* ---- deck-cap glow (existing) ---- */
.card.front.cap-near {
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.45), 0 0 28px rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5) !important;
  transition: box-shadow 200ms ease, border-color 200ms ease;
}
.card.front.cap-overflow {
  animation: cap-pulse-card 900ms ease-in-out infinite;
  border-color: rgba(239, 68, 68, 0.9) !important;
}
@keyframes cap-pulse-card {
  0%, 100% {
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.7), 0 0 32px rgba(239, 68, 68, 0.45);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 1), 0 0 64px rgba(239, 68, 68, 0.85);
  }
}

/* ---- player's deck counter ---- */
.deck-counter.cap-near {
  color: rgba(255, 180, 180, 0.95);
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.55);
  transition: color 200ms ease, text-shadow 200ms ease;
}
.deck-counter.cap-overflow {
  color: #ff5e5e;
  animation: cap-pulse-text 900ms ease-in-out infinite;
}
@keyframes cap-pulse-text {
  0%, 100% { text-shadow: 0 0 14px rgba(239, 68, 68, 0.7); }
  50%      { text-shadow: 0 0 28px rgba(239, 68, 68, 1), 0 0 48px rgba(239, 68, 68, 0.6); }
}
.deck-counter-cap {
  font-size: 10px;
  letter-spacing: 1.8px;
  margin-top: 4px;
  font-weight: 800;
  color: #ff5e5e;
}
.deck-counter.cap-overflow .deck-counter-cap {
  animation: cap-blink 700ms steps(2, end) infinite;
}
@keyframes cap-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

/* ---- opponent's deck-pill ---- */
.deck-pill.cap-near {
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.45), 0 0 18px rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.55) !important;
  transition: box-shadow 200ms ease, border-color 200ms ease;
}
.deck-pill.cap-near .deck-pill-n { color: rgba(255, 180, 180, 0.95); }
.deck-pill.cap-overflow {
  animation: cap-pulse-pill 900ms ease-in-out infinite;
  border-color: rgba(239, 68, 68, 0.95) !important;
}
.deck-pill.cap-overflow .deck-pill-n {
  color: #ff5e5e;
  font-weight: 800;
}
@keyframes cap-pulse-pill {
  0%, 100% {
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.75), 0 0 22px rgba(239, 68, 68, 0.45);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 1), 0 0 44px rgba(239, 68, 68, 0.8);
  }
}
`;

function ensureBattleStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("battle-styles-injected")) return;
  const s = document.createElement("style");
  s.id = "battle-styles-injected";
  s.textContent = BATTLE_STYLES;
  document.head.appendChild(s);
}

// ============================================================
// MainMenuScreen — Practice / Ranked / Play with Friends
// ============================================================

function MainMenuScreen({ state, onRanked, onPractice, onFriend }) {
  useEffect(() => { ensureMenuStyles(); }, []);
  const tier = window.tierFor(state.me.rank);
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <div className="splash-content">
        <div className="splash-brand">
          <div className="brand-mark">仮</div>
          <div>
            <div className="brand-title">KANA BATTLE</div>
            <div className="brand-sub">ranked · ひらがな vs カタカナ</div>
          </div>
        </div>

        <div className="mm-strip">
          <div className="mm-avatar">{state.me.avatar}</div>
          <div className="mm-strip-info">
            <div className="mm-strip-name">{state.me.name}</div>
            <div className="mm-strip-sub">{tierLabel.toUpperCase()} · {state.me.rank} ELO · {state.me.correct + state.me.incorrect} ATTEMPTS</div>
          </div>
          <RankBadge rank={state.me.rank} />
        </div>

        <div className="mm-options">
          <button className="mm-card" style={{ "--card-color": "#A78BFA" }} onClick={onPractice}>
            <div className="mm-card-glyph">習</div>
            <div className="mm-card-name">PRACTICE</div>
            <div className="mm-card-desc">Drill characters at your own pace. No timer, no opponent.</div>
            <div className="mm-card-meta">5 MODES</div>
          </button>

          <button className="mm-card featured" style={{ "--card-color": "var(--p1)" }} onClick={onRanked}>
            <div className="mm-card-glyph">戦</div>
            <div className="mm-card-name">RANKED</div>
            <div className="mm-card-desc">Battle other players for ELO. Win to climb tiers and unlock new rulesets.</div>
            <div className="mm-card-meta">{state.me.rank} ELO</div>
          </button>

          <button className="mm-card" style={{ "--card-color": "#7DD3FC" }} onClick={onFriend}>
            <div className="mm-card-glyph">友</div>
            <div className="mm-card-name">PLAY WITH FRIENDS</div>
            <div className="mm-card-desc">Challenge a friend with a private code. Custom rules, no ELO impact.</div>
            <div className="mm-card-meta">PEER-TO-PEER</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PracticeMenuScreen — list of practice modes; flashcards opens
// a tabbed multi-select picker (Hiragana / Katakana).
// Selected decks are merged into one flashcard pool.
// ============================================================

function PracticeMenuScreen({ state, onBack, onFlashcards, onMissed, onTextbook }) {
  useEffect(() => { ensureMenuStyles(); }, []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState("hiragana"); // hiragana | katakana
  const [selected, setSelected] = useState(() => new Set());
  const missedCount = window.topCharsBy(state.me, 20, "worst").length;

  // Classify each ruleset into a tab by inspecting its chars.
  // "Mixed" kana decks appear in BOTH kana tabs so they're discoverable
  // from either side. Selection is keyed by id, so toggling from either
  // tab affects the same checkbox.
  function classify(r) {
    let hasHira = false, hasKata = false;
    for (const c of r.chars) {
      const meta = window.KANA_MAP[c];
      if (!meta) continue;
      if (meta.script === "hiragana") hasHira = true;
      else if (meta.script === "katakana") hasKata = true;
      if (hasHira && hasKata) break;
    }
    if (hasHira && hasKata) return ["hiragana", "katakana"];
    if (hasHira) return ["hiragana"];
    if (hasKata) return ["katakana"];
    return [];
  }

  const familyOrder = [
    "row", "bundle", "full", "dakuten", "handakuten",
    "extended", "digraph", "mixed", "complete"
  ];
  const familyLabels = {
    row: "Rows", bundle: "Bundles", full: "Full sets", mixed: "Mixed scripts",
    dakuten: "Dakuten ゛", handakuten: "Handakuten ゜", extended: "Extended",
    digraph: "Digraphs (yōon)", complete: "Complete"
  };
  const tabContent = { hiragana: {}, katakana: {} };
  window.RULESETS.forEach(r => {
    classify(r).forEach(tab => {
      (tabContent[tab][r.family] = tabContent[tab][r.family] || []).push(r);
    });
  });

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearAll = () => setSelected(new Set());
  const selectAllInTab = () => {
    setSelected(prev => {
      const next = new Set(prev);
      Object.values(tabContent[pickerTab]).flat().forEach(r => next.add(r.id));
      return next;
    });
  };

  const selectedRulesets = Array.from(selected).map(id => window.RULESET_MAP[id]).filter(Boolean);
  const mergedChars = new Set();
  selectedRulesets.forEach(r => r.chars.forEach(c => mergedChars.add(c)));
  const totalChars = mergedChars.size;

  const startSelected = () => {
    if (selected.size === 0) return;
    onFlashcards(Array.from(selected));
  };

  const tabLabel = { hiragana: "ひらがな  HIRAGANA", katakana: "カタカナ  KATAKANA" };

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="pm-back" onClick={onBack}>← MENU</button>
      <div className="splash-content">
        <div className="pm-header">
          <div className="pm-eyebrow">SOLO</div>
          <div className="pm-title">PRACTICE</div>
          <div className="pm-sub">No timer, no ELO. Drill at your own pace.</div>
        </div>

        <div className="pm-modes">
          <button className="pm-mode" style={{ "--mode-color": "#A78BFA" }} onClick={() => setPickerOpen(o => !o)}>
            <div className="pm-glyph">札</div>
            <div className="pm-mode-body">
              <div className="pm-mode-name">FLASHCARDS</div>
              <div className="pm-mode-desc">Pick one or more decks across hiragana and katakana — they'll be drilled together.</div>
            </div>
            <div className="pm-mode-tag ready">READY</div>
          </button>

          <button
            className={`pm-mode ${missedCount === 0 ? "disabled" : ""}`}
            style={{ "--mode-color": "#FF6B35" }}
            onClick={() => missedCount > 0 && onMissed()}
            disabled={missedCount === 0}
          >
            <div className="pm-glyph">省</div>
            <div className="pm-mode-body">
              <div className="pm-mode-name">MISSED CHARACTERS</div>
              <div className="pm-mode-desc">
                {missedCount > 0
                  ? `Drill the ${missedCount} characters you've been getting wrong.`
                  : "Once you start missing characters, they'll show up here."}
              </div>
            </div>
            <div className="pm-mode-tag ready">{missedCount > 0 ? `${missedCount} CHARS` : "EMPTY"}</div>
          </button>

          <button className="pm-mode disabled" style={{ "--mode-color": "#7DD3FC" }} disabled>
            <div className="pm-glyph">書</div>
            <div className="pm-mode-body">
              <div className="pm-mode-name">WRITING PRACTICE</div>
              <div className="pm-mode-desc">Trace stroke order on a canvas. Get instant feedback on letter shape.</div>
            </div>
            <div className="pm-mode-tag soon">SOON</div>
          </button>

          <button className="pm-mode" style={{ "--mode-color": "#F472B6" }} onClick={onTextbook}>
            <div className="pm-glyph">本</div>
            <div className="pm-mode-body">
              <div className="pm-mode-name">TEXTBOOK</div>
              <div className="pm-mode-desc">Read mnemonics, shape notes, and confusables — then drop into a drill on those exact characters.</div>
            </div>
            <div className="pm-mode-tag ready">READY</div>
          </button>
        </div>

        {pickerOpen && (
          <div className="pm-rs-pane">
            <div className="pm-rs-pane-head">
              <div className="pm-rs-title">CHOOSE YOUR DECKS</div>
              <div className="pm-rs-hint">tap to check · combine across tabs · the same kana isn't repeated</div>
            </div>

            <div className="pm-tabs">
              {["hiragana", "katakana"].map(t => {
                const tabIds = new Set(Object.values(tabContent[t]).flat().map(r => r.id));
                let checkedHere = 0;
                selected.forEach(id => { if (tabIds.has(id)) checkedHere++; });
                return (
                  <button
                    key={t}
                    className={`pm-tab ${pickerTab === t ? "active" : ""}`}
                    onClick={() => setPickerTab(t)}
                  >
                    <span className="pm-tab-label">{tabLabel[t]}</span>
                    {checkedHere > 0 && <span className="pm-tab-badge">{checkedHere}</span>}
                  </button>
                );
              })}
            </div>

            <div className="pm-tab-tools">
              <button className="pm-tt-btn" onClick={selectAllInTab}>select all in tab</button>
              <button className="pm-tt-btn" onClick={clearAll} disabled={selected.size === 0}>clear selection</button>
            </div>

            <div className="pm-rs-body">
              {familyOrder.map(fam => {
                const list = tabContent[pickerTab][fam];
                if (!list || !list.length) return null;
                return (
                  <div key={fam}>
                    <div className="pm-rs-family">{familyLabels[fam] || fam}</div>
                    <div className="pm-rs-grid">
                      {list.map(r => {
                        const isOn = selected.has(r.id);
                        return (
                          <button
                            key={r.id}
                            className={`pm-rs-btn ${isOn ? "checked" : ""}`}
                            onClick={() => toggle(r.id)}
                            aria-pressed={isOn}
                          >
                            <span className={`pm-rs-check ${isOn ? "on" : ""}`}>
                              {isOn ? "✓" : ""}
                            </span>
                            <span className="pm-rs-g">{r.glyph}</span>
                            <span className="pm-rs-text">
                              <span className="pm-rs-n">{r.name}</span>
                              <span className="pm-rs-c">{r.chars.length} chars</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`pm-rs-foot ${selected.size > 0 ? "ready" : ""}`}>
              <div className="pm-rs-summary">
                {selected.size === 0 ? (
                  <span className="pm-rs-summary-empty">select at least one deck to start</span>
                ) : (
                  <>
                    <span className="pm-rs-summary-n">{selected.size}</span>
                    <span className="pm-rs-summary-lbl">deck{selected.size === 1 ? "" : "s"}</span>
                    <span className="pm-rs-summary-dot">·</span>
                    <span className="pm-rs-summary-n">{totalChars}</span>
                    <span className="pm-rs-summary-lbl">unique chars</span>
                  </>
                )}
              </div>
              <button
                className="pm-rs-start"
                onClick={startSelected}
                disabled={selected.size === 0}
              >
                START DRILL ↵
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PracticeFlashcardsScreen — solo drill
// ============================================================

function PracticeFlashcardsScreen({ state, onBack, setInput, submit }) {
  useEffect(() => { ensureMenuStyles(); }, []);
  const inputRef = useRef(null);
  const p = state.practice;
  useEffect(() => { inputRef.current?.focus(); }, [p?.current]);

  if (!p) return null;
  const seen = p.session.correct + p.session.incorrect;
  const acc = seen ? Math.round((p.session.correct / seen) * 100) : 0;
  const flashClass = p.flash?.kind === "correct" ? "correct" : p.flash?.kind === "wrong" ? "wrong" : p.flash?.kind === "dunno" ? "dunno" : "";

  const onKey = (e) => { if (e.key === "Enter") submit(false); };
  const meta = window.KANA_MAP[p.current];

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="pf-back" onClick={onBack}>← PRACTICE</button>
      <div className="splash-content pf-screen">
        <div className="pf-header">
          <div style={{ width: 80 }}></div>
          <div className="pf-title-block">
            <div className="pf-title">{p.title.toUpperCase()}</div>
            <div className="pf-sub">{p.chars.length} CHARS · ENDLESS</div>
          </div>
          <div style={{ width: 80 }}></div>
        </div>

        <div className="pf-stats">
          <div className="pf-stat"><div className="pf-stat-n pos">{p.session.correct}</div><div className="pf-stat-l">CORRECT</div></div>
          <div className="pf-stat"><div className="pf-stat-n neg">{p.session.incorrect}</div><div className="pf-stat-l">INCORRECT</div></div>
          <div className="pf-stat"><div className="pf-stat-n">{acc}%</div><div className="pf-stat-l">ACCURACY</div></div>
          <div className="pf-stat"><div className="pf-stat-n">{seen}</div><div className="pf-stat-l">SEEN</div></div>
        </div>

        <div className="pf-card-area">
          <div key={p.current + "-" + (p.flash?.at || 0)} className={`pf-card ${flashClass}`}>
            <div className="pf-card-corner">
              {(() => {
                const base =
                  meta.script === "hiragana" ? "ひらがな" :
                  meta.script === "katakana" ? "カタカナ" :
                  "";
                const tag =
                  meta.kind === "dakuten"    ? " ・゛" :
                  meta.kind === "handakuten" ? " ・゜" :
                  meta.kind === "digraph"    ? " ・拗" : "";
                return base + tag;
              })()}
            </div>
            <div className="pf-card-char">{p.current}</div>
          </div>
          {p.flash?.kind === "dunno" && (
            <div className="pf-reveal dunno">{p.flash.char} → {p.flash.answer}</div>
          )}
        </div>

        <div className="pf-input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="type romaji…"
            value={p.input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            spellCheck={false}
          />
          <button onClick={() => submit(false)} disabled={!p.input}>ENTER ↵</button>
        </div>
        <button className="pf-dunno" onClick={() => submit(true)}>I DON'T KNOW · reveal</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  SplashScreen, LobbyScreen, VsScreen, BattleScene, MatchEndScreen,
  RulesetVoteScreen, MainMenuScreen, PracticeMenuScreen, PracticeFlashcardsScreen,
  TextbookMenuScreen, TextbookChapterScreen
});

// ============================================================
// TextbookMenuScreen — chapter index, grouped by script
// ============================================================

function TextbookMenuScreen({ onBack, onOpen }) {
  useEffect(() => { ensureMenuStyles(); }, []);

  const groups = window.TEXTBOOK_GROUPS || [];
  const groupColors = { hiragana: "#A78BFA", katakana: "#7DD3FC" };

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="pm-back" onClick={onBack}>← PRACTICE</button>
      <div className="splash-content">
        <div className="tb-menu-head">
          <div className="tb-menu-eyebrow">STUDY</div>
          <div className="tb-menu-title">TEXTBOOK</div>
          <div className="tb-menu-sub">Mnemonics, shape notes, and confusables — chapter by chapter.</div>
        </div>

        {groups.map(g => (
          <div key={g.id} className="tb-group">
            <div className="tb-group-head">
              <div className="tb-group-label">{g.label}</div>
              <div className="tb-group-sub">{g.sub}</div>
            </div>
            <div className="tb-grid">
              {g.chapterIds.map(cid => {
                const c = window.TEXTBOOK_MAP[cid];
                if (!c) return null;
                return (
                  <button
                    key={cid}
                    className="tb-card"
                    style={{ "--card-color": groupColors[g.id] || "var(--p1)" }}
                    onClick={() => onOpen(cid)}
                  >
                    <div className="tb-card-glyph">{c.glyph}</div>
                    <div className="tb-card-body">
                      <div className="tb-card-title">{c.title}</div>
                      <div className="tb-card-sub">{c.subtitle}</div>
                    </div>
                    <div className="tb-card-arrow">→</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TextbookChapterScreen — read intro + characters; drill on demand
// ============================================================

function TextbookChapterScreen({ chapterId, onBack, onDrill, onOpen }) {
  useEffect(() => { ensureMenuStyles(); }, []);
  // Scroll to top when chapter changes, so prev/next feels like turning a page.
  useEffect(() => {
    const el = document.querySelector(".splash-content");
    if (el) el.scrollTop = 0;
    window.scrollTo?.(0, 0);
  }, [chapterId]);

  const chapter = window.TEXTBOOK_MAP?.[chapterId];
  if (!chapter) {
    return (
      <div className="screen splash">
        <div className="splash-bg"></div>
        <button className="pm-back" onClick={onBack}>← TEXTBOOK</button>
        <div className="splash-content">
          <div className="tb-menu-head">
            <div className="tb-menu-title">CHAPTER NOT FOUND</div>
            <div className="tb-menu-sub">This chapter could not be loaded.</div>
          </div>
        </div>
      </div>
    );
  }

  // Build a flat list of all chapter IDs in display order, so we can offer
  // a "next chapter" / "prev chapter" button that crosses script boundaries.
  const orderedIds = [];
  (window.TEXTBOOK_GROUPS || []).forEach(g => {
    g.chapterIds.forEach(id => { if (window.TEXTBOOK_MAP?.[id]) orderedIds.push(id); });
  });
  const idx = orderedIds.indexOf(chapterId);
  const prev = idx > 0 ? window.TEXTBOOK_MAP[orderedIds[idx - 1]] : null;
  const next = idx >= 0 && idx < orderedIds.length - 1 ? window.TEXTBOOK_MAP[orderedIds[idx + 1]] : null;

  // The drill target. If the chapter has a 1:1 ruleset, use it. Otherwise
  // (custom char sets) fall back to drillRulesetId so the existing
  // flashcards pipeline still has a valid pool.
  const drillId = chapter.rulesetId || chapter.drillRulesetId;
  const charCount = chapter.characters?.length || 0;

  return (
    <div className="screen splash">
      <div className="splash-bg"></div>
      <button className="pm-back" onClick={onBack}>← TEXTBOOK</button>
      <div className="splash-content tb-ch-screen">
        <div className="tb-ch-head">
          <div className="tb-ch-glyph">{chapter.glyph}</div>
          <div className="tb-ch-titles">
            <div className="tb-ch-eyebrow">
              {chapter.script === "hiragana" ? "ひらがな · HIRAGANA" : "カタカナ · KATAKANA"}
            </div>
            <div className="tb-ch-title">{chapter.title}</div>
            <div className="tb-ch-sub">{chapter.subtitle}</div>
          </div>
        </div>

        {Array.isArray(chapter.intro) && chapter.intro.length > 0 && (
          <div className="tb-ch-section tb-ch-intro">
            <div className="tb-ch-sec-label">Overview</div>
            {chapter.intro.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        )}

        {Array.isArray(chapter.pronunciationGuide) && chapter.pronunciationGuide.length > 0 && (
          <div className="tb-ch-section">
            <div className="tb-ch-sec-label">Pronunciation</div>
            <table className="tb-pron-table">
              <tbody>
                {chapter.pronunciationGuide.map(([k, v], i) => (
                  <tr key={i}>
                    <td className="tb-pron-key">{k}</td>
                    <td className="tb-pron-val">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {charCount > 0 && (
          <div className="tb-ch-section">
            <div className="tb-ch-sec-label">Characters · {charCount}</div>
            <div className="tb-ch-grid">
              {chapter.characters.map((c, i) => (
                <div key={c.char + "-" + i} className="tb-char-card">
                  <div className="tb-char-left">
                    <div className="tb-char-glyph">{c.char}</div>
                    <div className="tb-char-romaji">{c.romaji}</div>
                  </div>
                  <div className="tb-char-body">
                    {c.mnemonic && (
                      <div className="tb-char-row">
                        <span className="tb-char-tag mnemonic">Mnemonic</span>
                        <span className="tb-char-row-text">{c.mnemonic}</span>
                      </div>
                    )}
                    {c.shape && (
                      <div className="tb-char-row">
                        <span className="tb-char-tag shape">Shape</span>
                        <span className="tb-char-row-text">{c.shape}</span>
                      </div>
                    )}
                    {Array.isArray(c.confusables) && c.confusables.length > 0 && (
                      <div className="tb-char-row">
                        <span className="tb-char-tag confuse">Watch for</span>
                        <ul className="tb-char-confuse-list">
                          {c.confusables.map((x, j) => <li key={j}>{x}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {drillId && (
          <div className="tb-ch-foot">
            <div className="tb-ch-foot-info">
              <span className="tb-ch-foot-n">{charCount}</span>
              <span className="tb-ch-foot-lbl">char{charCount === 1 ? "" : "s"} ready to drill</span>
            </div>
            <button className="tb-ch-drill" onClick={() => onDrill(drillId)}>
              DRILL THESE NOW ↵
            </button>
          </div>
        )}

        <div className="tb-ch-nav">
          {prev ? (
            <button className="tb-ch-nav-btn prev" onClick={() => onOpen(prev.id)}>
              <span className="tb-ch-nav-dir">← PREV</span>
              <span className="tb-ch-nav-title">{prev.title}</span>
            </button>
          ) : (
            <div className="tb-ch-nav-btn empty"></div>
          )}
          {next ? (
            <button className="tb-ch-nav-btn next" onClick={() => onOpen(next.id)}>
              <span className="tb-ch-nav-dir">NEXT →</span>
              <span className="tb-ch-nav-title">{next.title}</span>
            </button>
          ) : (
            <div className="tb-ch-nav-btn empty"></div>
          )}
        </div>
      </div>
    </div>
  );
}