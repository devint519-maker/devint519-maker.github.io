// Textbook chapter content — mnemonics, shape notes, and confusables for each kana.
// One chapter per deck (ruleset) where possible; row-based chapters point at the
// matching ruleset so the "Drill these now" button drops the reader straight
// into Practice → Flashcards on the relevant character pool.
//
// Exposed on window as TEXTBOOK_CHAPTERS.

const TEXTBOOK_CHAPTERS = [

  // =========================================================
  // HIRAGANA — foundational rows
  // =========================================================

  {
    id: "h_vowels",
    rulesetId: "vowels",
    script: "hiragana",
    title: "Hiragana Vowels",
    subtitle: "The five sounds everything else is built from",
    glyph: "あ",
    intro: [
      "Every Japanese syllable is built on top of one of five vowel sounds. Learn these and you've cracked the pronunciation of the entire language — every other kana is one of these vowels with a consonant glued to the front.",
      "Japanese vowels are short, crisp, and never glide. There's no diphthong like the English long 'a' (eɪ) or long 'o' (oʊ). Aim for the pure single sounds you'd hear in 'father', 'machine', 'June', 'bed', and 'no'.",
      "Don't worry about reading speed yet — recognising the shapes is what matters here. Speed comes later, in the battle."
    ],
    pronunciationGuide: [
      ["a", "as in 'father' — open mouth, never 'ay'"],
      ["i", "as in 'machine' — short and tight, never 'eye'"],
      ["u", "as in 'put' but with rounded lips relaxed — almost 'oo'"],
      ["e", "as in 'bed' — flat, never 'ee'"],
      ["o", "as in 'no' but without the gliding 'oh-w'"]
    ],
    characters: [
      {
        char: "あ", romaji: "a",
        mnemonic: "An 'A'cademic with a crossed pencil and a curly bookworm tail. The horizontal line and vertical stroke on top spell out a tilted capital A; the loop is the worm wriggling out the side.",
        shape: "Three strokes: a flat line, then a long vertical that sweeps down, then a single loop curling counter-clockwise from upper-right to lower-left.",
        confusables: ["お (o) — お has its loop on the bottom and an extra dot; あ has the loop on the side."]
      },
      {
        char: "い", romaji: "i",
        mnemonic: "Two 'I'cicles dripping from a roof — one tall, one shorter. Or picture the two i's in the word 'iiiice' standing side by side.",
        shape: "Two strokes, both top-to-bottom. The left stroke is taller and curves slightly; the right stroke is short and straight.",
        confusables: ["り (ri) — り is also two strokes but they're taller, straighter, and lean inward; い is shorter and friendlier."]
      },
      {
        char: "う", romaji: "u",
        mnemonic: "A person bowing — head tucked down, back arched. 'Ooh,' they say as they bow. The tiny tick on top is the head, the curve below is the back.",
        shape: "Two strokes: a short tick at the top, then a single sweeping curve that opens to the right like a backwards C.",
        confusables: ["ら (ra) — ら has the same body but a longer top tick that hangs further left."]
      },
      {
        char: "え", romaji: "e",
        mnemonic: "An 'E'xotic ninja about to throw a shuriken. The tick is the throwing arm, the zigzag below is the spinning star.",
        shape: "Two strokes: a small tick at the top, then a stroke that goes right, then sharply down-left, then a small hook back to the right."
      },
      {
        char: "お", romaji: "o",
        mnemonic: "A figure skater spinning — one arm out, one leg kicked back with a 'pom' on the toe. The loop in the middle is the spin; the dot off the upper right is the pom.",
        shape: "Three strokes: a horizontal line with a long vertical sweep through it, a curling loop that crosses back, and a tiny isolated dot to the upper right.",
        confusables: ["あ (a) — あ has its loop on the right side; お has it on the bottom AND has an extra dot."]
      }
    ]
  },

  {
    id: "h_k_row",
    rulesetId: "k_row",
    script: "hiragana",
    title: "Hiragana K-Row",
    subtitle: "か き く け こ — adding K to the five vowels",
    glyph: "か",
    intro: [
      "The K-row is your first 'consonant + vowel' set. Every character is exactly the matching vowel sound (a, i, u, e, o) with a hard K stuck on the front: ka, ki, ku, ke, ko.",
      "Notice the pattern? Every row from here on follows it. Once you've learned a row, you've learned a whole consonant — five new syllables.",
      "Japanese K is identical to English K. No tricky pronunciation, no surprises. Just make sure it's a clean K and not a soft 'kh'."
    ],
    characters: [
      {
        char: "か", romaji: "ka",
        mnemonic: "A samurai mid-'KA'rate-chop — vertical sword arm, horizontal cut, and the tiny tick is the spray of motion lines. Think 'KA-pow!'",
        shape: "Three strokes: a horizontal line with a hooked vertical sweep, then a tick to the right of the hook."
      },
      {
        char: "き", romaji: "ki",
        mnemonic: "A 'KEY' with two teeth on the left and a long shaft underneath. Some people draw this with the bottom curl connected; both forms are correct.",
        shape: "Four strokes (or three if the bottom curl is one motion): two short horizontal teeth, a vertical shaft crossing both, and a small curl at the bottom."
      },
      {
        char: "く", romaji: "ku",
        mnemonic: "A bird's beak going 'KU-KU' (cuckoo). Or simply a less-than sign '<' that wants to say KU.",
        shape: "One stroke: a single sharp angle pointing left, drawn top-to-bottom.",
        confusables: ["へ (he) — へ is similar but flatter; く is steep and narrow."]
      },
      {
        char: "け", romaji: "ke",
        mnemonic: "A 'KEG' of beer on its side. The vertical stroke is the keg, the dash is the tap, and the hook on the right is the spigot dripping.",
        shape: "Three strokes: a vertical line on the left, a horizontal slash through the middle, and a hooked vertical on the right.",
        confusables: ["は (ha) — は has an extra short stroke at the bottom right; け is simpler."]
      },
      {
        char: "こ", romaji: "ko",
        mnemonic: "Two 'KO-i' fish swimming in formation, one above the other. The simplest hiragana — just two horizontal swipes.",
        shape: "Two strokes: a short top dash that curves slightly, and a longer bottom dash, both roughly horizontal."
      }
    ]
  },

  {
    id: "h_s_row",
    rulesetId: "s_row",
    script: "hiragana",
    title: "Hiragana S-Row",
    subtitle: "さ し す せ そ — but watch out for し",
    glyph: "さ",
    intro: [
      "The S-row would be 'sa, si, su, se, so' if everything were regular — but it isn't. The 'i' member becomes shi (し), pronounced like the English word 'she'. This irregular sound carries through every S-row variant later (じ ji, しゃ sha, etc).",
      "The other four are straightforward: sa, su, se, so. Just remember that Japanese 'u' is barely a vowel — すす sounds almost like 'sss' with a breath.",
      "Older Japanese keyboards and textbooks accept 'si' for し, but 'shi' is the standard romanisation and the one this game uses."
    ],
    characters: [
      {
        char: "さ", romaji: "sa",
        mnemonic: "A 'SA'lmon swimming upstream — a cross-shape for the gills and a curving tail trailing off to the bottom-left.",
        shape: "Two or three strokes: a horizontal slash, a vertical that crosses it and hooks left, and (depending on font) the tail curl as a separate stroke.",
        confusables: ["ち (chi) — ち is さ flipped horizontally; さ's tail curls left, ち's curls right."]
      },
      {
        char: "し", romaji: "shi",
        mnemonic: "'SHE' has long flowing hair that hooks at the bottom — a single graceful J-shape. Or: a fishing hook waiting to catch a 'shi'-fish.",
        shape: "One stroke: straight down from the top, then a smooth curve to the right at the bottom.",
        confusables: ["つ (tsu) — つ is the same hook lying on its side."]
      },
      {
        char: "す", romaji: "su",
        mnemonic: "A 'SU'shi chef's twisted apron knot — a cross with a curl looping down through it. Or: a swing on a tree with one rope.",
        shape: "Two strokes: a horizontal slash, then a vertical that loops counter-clockwise into a tail.",
        confusables: ["む (mu) — む has an extra dot on the top-right; す is bare."]
      },
      {
        char: "せ", romaji: "se",
        mnemonic: "'SE'tting the table — a horizontal placemat, a fork standing up, and a hook for the napkin on the right.",
        shape: "Three strokes: a horizontal slash, a vertical that crosses it, and a hooked stroke at the bottom-right."
      },
      {
        char: "そ", romaji: "so",
        mnemonic: "A 'SEW'ing needle zigzagging through fabric, dragging the thread behind it. The lightning-bolt top is the needle's path, the long tail is the thread.",
        shape: "One or two strokes (font-dependent): a zigzag at the top flowing into a long curving tail downward."
      }
    ]
  },

  {
    id: "h_t_row",
    rulesetId: "t_row",
    script: "hiragana",
    title: "Hiragana T-Row",
    subtitle: "た ち つ て と — and two more irregulars",
    glyph: "た",
    intro: [
      "The T-row has TWO irregular members. 'Ti' becomes chi (ち, like 'cheese') and 'tu' becomes tsu (つ, the 'ts' in 'cats' as a single sound).",
      "つ tsu is the trickiest sound in beginner Japanese. English speakers want to break it into 'tu-su' — don't. It's one quick sound: the 't' and 's' fire together, like the end of 'cats' but at the start of a syllable.",
      "Memorise the irregulars now and the rest of Japanese gets easier — ち and つ pop up constantly."
    ],
    characters: [
      {
        char: "た", romaji: "ta",
        mnemonic: "A 'TA'tami mat with a corner folded up — the こ-on-top + た-on-bottom looks like a half-rolled mat. Or: a sumo wrestler doing the splits.",
        shape: "Four strokes: a horizontal line, a vertical that crosses it, then a small こ-like pair tucked into the lower-right corner."
      },
      {
        char: "ち", romaji: "chi",
        mnemonic: "Looks like a backwards '5' — and 'five' in Japanese keigo gets close to 'go-CHI'. Or: a 'CHI'cken's profile, with the cross being its eye and beak.",
        shape: "Two strokes: a horizontal slash, then a stroke that curls counter-clockwise from upper-right down to lower-right.",
        confusables: ["さ (sa) — mirror image. さ's tail curls left, ち's curls right."]
      },
      {
        char: "つ", romaji: "tsu",
        mnemonic: "A 'tSU'nami curling back — a single wave-curl rolling from upper-right to lower-right. Picture a small wave about to crash.",
        shape: "One stroke: a smooth horizontal curve, opening downward.",
        confusables: ["し (shi) — same hook, rotated 90°. つ is horizontal, し is vertical."]
      },
      {
        char: "て", romaji: "te",
        mnemonic: "A 'TE'lephone receiver hanging by its cord. The tick at the top is the cord; the curving body is the handset.",
        shape: "One stroke: a tick at the top flowing into a long curve that sweeps down and around to the lower-left."
      },
      {
        char: "と", romaji: "to",
        mnemonic: "A big 'TOE' with a thorn stuck in it. The vertical line is the toe; the tiny dot is the thorn.",
        shape: "Two strokes: a small dot or tick on the upper-left, and a long vertical that hooks to the right at the bottom."
      }
    ]
  },

  {
    id: "h_n_row",
    rulesetId: "n_row",
    script: "hiragana",
    title: "Hiragana N-Row",
    subtitle: "な に ぬ ね の — friendly curls",
    glyph: "な",
    intro: [
      "The N-row is regular and easy: na, ni, nu, ne, no. The N sound is the same as English.",
      "But there's a trap: ぬ (nu), ね (ne), and め (me from the next row) all have a confusable loop. Pay attention to which side the loop sits on and how the stroke before it behaves. Get them straight here and the M-row will be free.",
      "Watch out also for の (no) — it shows up everywhere in real Japanese as a particle meaning 'of', so it's the kana you'll see most often."
    ],
    characters: [
      {
        char: "な", romaji: "na",
        mnemonic: "A 'NUN' praying — vertical body, a horizontal arm in front, and a little loop for clasped hands at the bottom-right.",
        shape: "Four strokes: horizontal cross-bar, vertical with a hook, a dot, and a counter-clockwise curl in the bottom-right."
      },
      {
        char: "に", romaji: "ni",
        mnemonic: "A bent 'KNEE' from the side — vertical shin, plus two horizontal lines for the kneecap and the foot.",
        shape: "Three strokes: a hooked vertical on the left, and two short horizontals stacked on the right."
      },
      {
        char: "ぬ", romaji: "nu",
        mnemonic: "Tangled 'NOO'dles — one strand crossing over another, with the loop being the tangle.",
        shape: "Two strokes: a curling slash, then a long stroke that loops back through itself.",
        confusables: ["め (me) — め has no inner loop; just a straight tail. ぬ tangles back on itself."]
      },
      {
        char: "ね", romaji: "ne",
        mnemonic: "A 'NE'ko (cat) with a curly tail. The vertical line is the cat's body; the loop is its smug coiled tail.",
        shape: "Two strokes: a hooked vertical, then a stroke that curls around like れ but with the extra inner loop.",
        confusables: ["れ (re) and わ (wa) — same body, different tails. ね's tail loops; れ's hooks; わ's hooks but more open."]
      },
      {
        char: "の", romaji: "no",
        mnemonic: "A 'NO'-entry sign — a circle with a slash through it, swept into one continuous loop. The most common kana in real text.",
        shape: "One stroke: a single counter-clockwise spiral from upper-right, looping back through itself."
      }
    ]
  },

  {
    id: "h_h_row",
    rulesetId: "h_row",
    script: "hiragana",
    title: "Hiragana H-Row",
    subtitle: "は ひ ふ へ ほ — and the curious ふ (fu)",
    glyph: "は",
    intro: [
      "One irregular here: 'hu' becomes ふ (fu) — but the 'f' is softer than English. It's made by blowing air between your lips, not biting your lower lip. Think of blowing out a candle gently and saying 'who'.",
      "The other four are regular: ha, hi, he, ho. Note that は often appears as a topic-marker particle in sentences, pronounced 'wa' — but you'll always type its romaji as 'ha'. The pronunciation shift is purely a grammar quirk.",
      "へ is also a particle meaning 'to/towards', pronounced 'e' when used that way. Same rule: still type it as 'he'."
    ],
    characters: [
      {
        char: "は", romaji: "ha",
        mnemonic: "A 'HA'ouse — vertical wall on the left, a cross-shape for the door and chimney, and a hook on the right for the gutter.",
        shape: "Three strokes: vertical, cross-shape on the right, all joining at the middle.",
        confusables: ["ほ (ho) — ほ has an extra horizontal bar; は is missing it. ほ = HA + extra crossbar."]
      },
      {
        char: "ひ", romaji: "hi",
        mnemonic: "A wide smile — a mouth grinning 'HEE-HEE'. Or: a nose seen from below.",
        shape: "One stroke: a low U-shape with a slight hook on the upper-right end."
      },
      {
        char: "ふ", romaji: "fu",
        mnemonic: "Mount 'FU'ji — the curving body is the mountain slope; the two dots on either side are clouds drifting past the peak.",
        shape: "Four strokes (font varies): a tiny tick at the top, a long curling body, and two dots flanking it like the wings of a butterfly."
      },
      {
        char: "へ", romaji: "he",
        mnemonic: "A 'HE'licopter rotor blade tilted, or a hill viewed from a distance. A simple wide caret '∧'.",
        shape: "One stroke: a shallow inverted V, rising then descending. The flattest kana of all.",
        confusables: ["く (ku) — く is steep and narrow; へ is wide and shallow."]
      },
      {
        char: "ほ", romaji: "ho",
        mnemonic: "A 'HO'tel — like は (the house), but with an extra floor (the extra crossbar). One more bar = one more storey.",
        shape: "Four strokes: vertical wall, two horizontal crossbars, and a hooked vertical on the right.",
        confusables: ["は (ha) — same shape minus the extra crossbar."]
      }
    ]
  },

  {
    id: "h_m_row",
    rulesetId: "m_row",
    script: "hiragana",
    title: "Hiragana M-Row",
    subtitle: "ま み む め も — and the loop trap",
    glyph: "ま",
    intro: [
      "Regular row: ma, mi, mu, me, mo. The M sound is the same as English.",
      "The big challenge here is め (me) versus ぬ (nu) — they look nearly identical. The difference: ぬ has an extra little 'tangle' loop inside; め is a clean stroke with no inner loop.",
      "Some readers also mix up む (mu) and す (su). Both have a horizontal-and-curl shape. The trick: む has an extra dot on the top-right. す is bare."
    ],
    characters: [
      {
        char: "ま", romaji: "ma",
        mnemonic: "A 'MA'ma — two horizontal eyes/cheeks, a vertical nose, and a loop for the bun in her hair at the bottom.",
        shape: "Three strokes: two horizontal crossbars, a vertical that pierces them and loops counter-clockwise into a tail."
      },
      {
        char: "み", romaji: "mi",
        mnemonic: "The number '21' tilted — 'MI' is shorthand for 21 in your head. Or: a snail's shell unwinding.",
        shape: "Two strokes: a curve that opens to the right, then a tail that swoops underneath."
      },
      {
        char: "む", romaji: "mu",
        mnemonic: "A 'MOO'ing cow — the dot is its eye, the horizontal is the snout, and the curl is its tongue mid-moo.",
        shape: "Three strokes: a horizontal slash, a vertical that loops, and a small dot to the upper-right.",
        confusables: ["す (su) — same body, no dot. む = SU + dot."]
      },
      {
        char: "め", romaji: "me",
        mnemonic: "An 'EYE' — and the Japanese word for eye is 'me'. Picture an eye with a single eyelash flicking up.",
        shape: "Two strokes: a curving slash, then a stroke that crosses and curls back. No inner loop.",
        confusables: ["ぬ (nu) — ぬ has an inner loop where the strokes cross; め does not."]
      },
      {
        char: "も", romaji: "mo",
        mnemonic: "A 'MO'rning fishing hook with two worms on it. The fish-hook curl with two horizontal bars hooked through it.",
        shape: "Three strokes: a fishhook curl, then two horizontal crossbars piercing the upper part of the hook."
      }
    ]
  },

  {
    id: "h_yw_row",
    rulesetId: "yw_row",
    script: "hiragana",
    title: "Hiragana Y/W-Row + ん",
    subtitle: "や ゆ よ わ を ん — the leftovers",
    glyph: "ん",
    intro: [
      "These six characters are what's left of hiragana after the regular rows. They're a mix of half-rows and lone wolves: Y-row has only three (ya, yu, yo), W-row has only two regularly used (wa, wo), and then there's ん — the only standalone consonant in Japanese.",
      "を (wo) is special: it's used almost exclusively as a particle marking the object of a verb. Even though it's spelled 'wo', many speakers say it like a plain 'o'. The game accepts both.",
      "ん (n) is the only kana that isn't a full syllable. It's a nasal sound — a hum at the end of words like 'pan' (bread) or 'sen' (thousand). You'll never see it at the start of a word."
    ],
    characters: [
      {
        char: "や", romaji: "ya",
        mnemonic: "A 'YA'cht with a single sail leaning into the wind. The curling body is the hull; the tick on the right is the sail's pennant.",
        shape: "Three strokes: a hooked vertical, a long horizontal slash that curls underneath, and a small tick to the upper-right."
      },
      {
        char: "ゆ", romaji: "yu",
        mnemonic: "A 'YOU'-nique fish in a bowl — the closed loop is the bowl; the long vertical pierces through like the fish's body.",
        shape: "Two strokes: a horizontal loop that closes back on itself, and a long vertical line piercing through it."
      },
      {
        char: "よ", romaji: "yo",
        mnemonic: "A 'YO'-yo dangling from a finger. The horizontal tick is the finger; the long curving body is the string and yo-yo body.",
        shape: "Two strokes: a horizontal tick, and a long vertical that loops back at the bottom."
      },
      {
        char: "わ", romaji: "wa",
        mnemonic: "A 'WAG'ging tail — vertical body on the left, a hook curling out to the right like a happy dog's tail.",
        shape: "Two strokes: a hooked vertical, then a stroke that curves outward to the lower-right without a loop.",
        confusables: ["れ (re) and ね (ne) — same body, different tails. わ's tail bends outward; れ's hooks back; ね's coils into a loop."]
      },
      {
        char: "を", romaji: "wo / o",
        mnemonic: "A figure 'WOB'bling on one leg — top-heavy cross with a thin curving leg at the bottom. Often pronounced just 'o', but always spelled 'wo'.",
        shape: "Three strokes: horizontal slash, vertical with hooks, ending in a curling base."
      },
      {
        char: "ん", romaji: "n",
        mnemonic: "A cursive lowercase 'n' — the only kana that's basically the romaji it represents. Even the shape mirrors the English letter.",
        shape: "One stroke: a low arch flowing from upper-left to lower-right with a small hook at the end."
      }
    ]
  },

  {
    id: "h_r_row",
    rulesetId: "r_row",
    script: "hiragana",
    title: "Hiragana R-Row",
    subtitle: "ら り る れ ろ — the flicked R",
    glyph: "ら",
    intro: [
      "Pronunciation alert: Japanese R is not English R. It's halfway between R, L, and D. The tip of your tongue lightly taps the ridge behind your upper teeth — almost like the soft D in 'ladder' said quickly.",
      "Don't curl your tongue back like American R, and don't hold it against the roof of your mouth like a clean L. A quick, light tap is what you're after.",
      "The shapes here are also where many learners hit a wall — る (ru) and ろ (ro) differ only by a tiny loop at the bottom. れ (re), ね (ne), わ (wa) all share a body. Practice them as a group."
    ],
    characters: [
      {
        char: "ら", romaji: "ra",
        mnemonic: "A 'RA'bbit with one long ear hanging down. The tick on top is the second ear; the curving body is its drooping ear.",
        shape: "Two strokes: a tick at the top, then a curve that opens to the right.",
        confusables: ["う (u) — same shape but ら has a stronger top tick and more curve. ら = う with attitude."]
      },
      {
        char: "り", romaji: "ri",
        mnemonic: "Two tall 'REE'ds standing in a pond, one slightly taller. Like い (i) but stretched upward and stricter.",
        shape: "Two strokes: a tall left stroke (sometimes hooked), and a shorter right stroke.",
        confusables: ["い (i) — い is shorter and friendlier; り is taller and stiffer."]
      },
      {
        char: "る", romaji: "ru",
        mnemonic: "'ROO'-the-kangaroo's coiled tail — the curve ends in a tight little loop at the bottom.",
        shape: "One stroke: a zigzag opening downward, ending in a small closed loop at the bottom.",
        confusables: ["ろ (ro) — same shape minus the loop. る = ろ + loop."]
      },
      {
        char: "れ", romaji: "re",
        mnemonic: "A person leaning on one elbow — vertical body, an arm reaching outward and curling at the end.",
        shape: "Two strokes: hooked vertical, then a curving stroke that ends in an upward hook on the right.",
        confusables: ["ね (ne), わ (wa) — same body. れ's tail hooks back without a full loop; ね's loops fully; わ's swings out and stops."]
      },
      {
        char: "ろ", romaji: "ro",
        mnemonic: "A bendy 'ROAD' — a single zigzag flowing down without finishing. No loop = no roundabout.",
        shape: "One stroke: a zigzag opening downward, ending in a tail with no loop.",
        confusables: ["る (ru) — る has a closed loop at the end; ろ does not."]
      }
    ]
  },

  // =========================================================
  // HIRAGANA — voiced, semi-voiced, digraphs
  // =========================================================

  {
    id: "h_dakuten",
    rulesetId: "h_dak_han",
    script: "hiragana",
    title: "Hiragana Dakuten ゛& Handakuten ゜",
    subtitle: "How two tiny marks unlock a whole new set of sounds",
    glyph: "が",
    intro: [
      "Once you know basic hiragana, you get 25 more characters almost for free. The two little marks on the top-right corner of certain kana change the consonant: ゛ (dakuten, 'tenten' = two ticks) voices it, and ゜ (handakuten, the tiny circle) softens H into P.",
      "The pattern is fixed and you only need to remember the four pairings:",
      "• K → G   (か → が, ki → gi, etc)",
      "• S → Z   (さ → ざ, but し → じ JI, not zi)",
      "• T → D   (た → だ, but ち → ぢ and つ → づ make the same sounds as じ じ)",
      "• H → B with ゛, H → P with ゜   (は → ば BA or ぱ PA)",
      "じ/ぢ and ず/づ are pronounced identically. ぢ and づ are rare in modern Japanese — you'll meet じ and ず far more often."
    ],
    characters: [
      // G row
      { char: "が", romaji: "ga", mnemonic: "か (ka) + ゛ = voiced GA. The samurai chops with extra force.", shape: "Add two small ticks ゛ to the upper-right of か." },
      { char: "ぎ", romaji: "gi", mnemonic: "き (ki) + ゛ = GI. The key now turns a heavy lock.", shape: "Two ticks on the upper-right of き." },
      { char: "ぐ", romaji: "gu", mnemonic: "く (ku) + ゛ = GU. The cuckoo cleared its throat and said 'gu' instead.", shape: "Two ticks above the angle of く." },
      { char: "げ", romaji: "ge", mnemonic: "け (ke) + ゛ = GE. The keg is heavier, full of dark beer.", shape: "Two ticks above the upper-right of け." },
      { char: "ご", romaji: "go", mnemonic: "こ (ko) + ゛ = GO. The koi are now grumbling.", shape: "Two ticks above the upper-right of こ." },
      // Z row
      { char: "ざ", romaji: "za", mnemonic: "さ (sa) + ゛ = ZA. The salmon zigzags.", shape: "Two ticks on さ." },
      { char: "じ", romaji: "ji", mnemonic: "し (shi) + ゛ = JI (not 'zi'). Like 'gee whiz'.", shape: "Two ticks on the top-right of し's hook." },
      { char: "ず", romaji: "zu", mnemonic: "す (su) + ゛ = ZU. The chef is humming 'zzzz' as he ties his apron.", shape: "Two ticks on the upper-right of す." },
      { char: "ぜ", romaji: "ze", mnemonic: "せ (se) + ゛ = ZE. The table is set with buzzing flies.", shape: "Two ticks on the upper-right of せ." },
      { char: "ぞ", romaji: "zo", mnemonic: "そ (so) + ゛ = ZO. The needle hums as it threads.", shape: "Two ticks at the top of そ." },
      // D row
      { char: "だ", romaji: "da", mnemonic: "た (ta) + ゛ = DA. The tatami is heavy with dampness.", shape: "Two ticks at the upper-right of た." },
      {
        char: "ぢ", romaji: "ji",
        mnemonic: "ち (chi) + ゛ — pronounced JI, identical to じ. Rare; appears in compound words like はなぢ (nosebleed = hana + chi → hana-ji).",
        shape: "Two ticks on ち.",
        confusables: ["じ (ji from し) — same sound. じ is far more common in modern writing."]
      },
      {
        char: "づ", romaji: "zu",
        mnemonic: "つ (tsu) + ゛ — pronounced ZU, identical to ず. Rare; appears in compounds like みかづき (crescent moon).",
        shape: "Two ticks on つ.",
        confusables: ["ず (zu from す) — same sound, written far more often."]
      },
      { char: "で", romaji: "de", mnemonic: "て (te) + ゛ = DE. The phone is buzzing.", shape: "Two ticks at the upper-right of て." },
      { char: "ど", romaji: "do", mnemonic: "と (to) + ゛ = DO. The toe stubs into something heavy.", shape: "Two ticks above the right side of と." },
      // B row
      { char: "ば", romaji: "ba", mnemonic: "は (ha) + ゛ = BA. The house has a booming bass speaker.", shape: "Two ticks at the upper-right of は." },
      { char: "び", romaji: "bi", mnemonic: "ひ (hi) + ゛ = BI. The smile is full of bees.", shape: "Two ticks above ひ." },
      { char: "ぶ", romaji: "bu", mnemonic: "ふ (fu) + ゛ = BU. Fuji is rumbling.", shape: "Two ticks at the upper-right of ふ." },
      { char: "べ", romaji: "be", mnemonic: "へ (he) + ゛ = BE. The hill is now a beehive.", shape: "Two ticks above the right side of へ." },
      { char: "ぼ", romaji: "bo", mnemonic: "ほ (ho) + ゛ = BO. The hotel's bass party is in full swing.", shape: "Two ticks at the upper-right of ほ." },
      // P row
      { char: "ぱ", romaji: "pa", mnemonic: "は (ha) + ゜ = PA. The little circle is a balloon — and balloons go POP.", shape: "A small circle ゜ at the upper-right of は." },
      { char: "ぴ", romaji: "pi", mnemonic: "ひ (hi) + ゜ = PI. A piggy snorting.", shape: "A small circle above ひ." },
      { char: "ぷ", romaji: "pu", mnemonic: "ふ (fu) + ゜ = PU. Fuji puffs out smoke.", shape: "A small circle at the upper-right of ふ." },
      { char: "ぺ", romaji: "pe", mnemonic: "へ (he) + ゜ = PE. Tiny pebble bouncing on the hill.", shape: "A small circle above the right side of へ." },
      { char: "ぽ", romaji: "po", mnemonic: "ほ (ho) + ゜ = PO. The hotel's pop-art neon sign.", shape: "A small circle at the upper-right of ほ." }
    ]
  },

  {
    id: "h_digraphs",
    rulesetId: "h_digraphs_all",
    script: "hiragana",
    title: "Hiragana Digraphs (Yōon)",
    subtitle: "Combining consonants with や ゆ よ",
    glyph: "ょ",
    intro: [
      "Digraphs (yōon, 拗音) are how Japanese writes consonants like 'kya', 'shu', 'cho' — sounds that need to glide through a Y before the vowel.",
      "The recipe is simple: take any kana that ends in -i (き, し, ち, に, ひ, み, り, ぎ, じ, び, ぴ), then attach a SMALL や, ゆ, or よ. The small character replaces the 'i' sound and slides into ya, yu, or yo.",
      "Example: き (ki) + small ゃ → きゃ kya. NOT 'kiya' — it's a single syllable, one beat. The small や/ゆ/よ are written slightly lower-right than full-size, which is the only visual cue.",
      "Voiced digraphs (gya, ja, bya, pya) follow the same rule using the dakuten/handakuten versions of the i-kana."
    ],
    characters: [
      { char: "きゃ", romaji: "kya", mnemonic: "き + small ゃ. 'KI-ya' compressed to one beat: KYA.", shape: "Standard き followed by a noticeably smaller ゃ." },
      { char: "きゅ", romaji: "kyu", mnemonic: "き + small ゅ = KYU. As in 'cute'.", shape: "き with a small ゅ." },
      { char: "きょ", romaji: "kyo", mnemonic: "き + small ょ = KYO. As in 'Tokyo'.", shape: "き with a small ょ." },
      { char: "しゃ", romaji: "sha", mnemonic: "し + small ゃ = SHA. Because し is 'shi', the digraph slides to sha (not 'shya').", shape: "し with a small ゃ." },
      { char: "しゅ", romaji: "shu", mnemonic: "し + small ゅ = SHU. As in 'shoes'.", shape: "し with a small ゅ." },
      { char: "しょ", romaji: "sho", mnemonic: "し + small ょ = SHO. As in 'show'.", shape: "し with a small ょ." },
      { char: "ちゃ", romaji: "cha", mnemonic: "ち + small ゃ = CHA. As in 'cha-cha'.", shape: "ち with a small ゃ." },
      { char: "ちゅ", romaji: "chu", mnemonic: "ち + small ゅ = CHU. As in 'choose'.", shape: "ち with a small ゅ." },
      { char: "ちょ", romaji: "cho", mnemonic: "ち + small ょ = CHO. As in 'cho-cho train'.", shape: "ち with a small ょ." },
      { char: "にゃ", romaji: "nya", mnemonic: "に + small ゃ = NYA. The sound a Japanese cat makes (にゃー).", shape: "に with a small ゃ." },
      { char: "にゅ", romaji: "nyu", mnemonic: "に + small ゅ = NYU. As in 'menu' (without the 'me-').", shape: "に with a small ゅ." },
      { char: "にょ", romaji: "nyo", mnemonic: "に + small ょ = NYO. Rare; appears in words like にょろにょろ (wiggling).", shape: "に with a small ょ." },
      { char: "ひゃ", romaji: "hya", mnemonic: "ひ + small ゃ = HYA. A surprised squeak.", shape: "ひ with a small ゃ." },
      { char: "ひゅ", romaji: "hyu", mnemonic: "ひ + small ゅ = HYU. The whoosh of a sudden gust.", shape: "ひ with a small ゅ." },
      { char: "ひょ", romaji: "hyo", mnemonic: "ひ + small ょ = HYO. A leopard's sneeze.", shape: "ひ with a small ょ." },
      { char: "みゃ", romaji: "mya", mnemonic: "み + small ゃ = MYA. Almost never used; mostly in proper names.", shape: "み with a small ゃ." },
      { char: "みゅ", romaji: "myu", mnemonic: "み + small ゅ = MYU. Rare; loanword exception (a 'museum' might use it).", shape: "み with a small ゅ." },
      { char: "みょ", romaji: "myo", mnemonic: "み + small ょ = MYO. As in 'myo-shogun-style'.", shape: "み with a small ょ." },
      { char: "りゃ", romaji: "rya", mnemonic: "り + small ゃ = RYA. The flicked R + YA.", shape: "り with a small ゃ." },
      { char: "りゅ", romaji: "ryu", mnemonic: "り + small ゅ = RYU. The 'dragon' sound (竜 ryū).", shape: "り with a small ゅ." },
      { char: "りょ", romaji: "ryo", mnemonic: "り + small ょ = RYO. As in 'ryori' (cooking).", shape: "り with a small ょ." },
      { char: "ぎゃ", romaji: "gya", mnemonic: "ぎ + small ゃ = GYA. A shout of pain.", shape: "ぎ with a small ゃ." },
      { char: "ぎゅ", romaji: "gyu", mnemonic: "ぎ + small ゅ = GYU. As in 'gyū-niku' (beef).", shape: "ぎ with a small ゅ." },
      { char: "ぎょ", romaji: "gyo", mnemonic: "ぎ + small ょ = GYO. As in 'gyōza' (dumplings).", shape: "ぎ with a small ょ." },
      { char: "じゃ", romaji: "ja", mnemonic: "じ + small ゃ = JA. Not 'jya' — 'ja', like 'jam'.", shape: "じ with a small ゃ." },
      { char: "じゅ", romaji: "ju", mnemonic: "じ + small ゅ = JU. As in 'judo'.", shape: "じ with a small ゅ." },
      { char: "じょ", romaji: "jo", mnemonic: "じ + small ょ = JO. As in 'joke'.", shape: "じ with a small ょ." },
      { char: "びゃ", romaji: "bya", mnemonic: "び + small ゃ = BYA. Mostly in classical or counting words.", shape: "び with a small ゃ." },
      { char: "びゅ", romaji: "byu", mnemonic: "び + small ゅ = BYU. The whoosh of speed.", shape: "び with a small ゅ." },
      { char: "びょ", romaji: "byo", mnemonic: "び + small ょ = BYO. As in 'byōin' (hospital).", shape: "び with a small ょ." },
      { char: "ぴゃ", romaji: "pya", mnemonic: "ぴ + small ゃ = PYA. Tiny, rare, mostly in counters.", shape: "ぴ with a small ゃ." },
      { char: "ぴゅ", romaji: "pyu", mnemonic: "ぴ + small ゅ = PYU. The sound of a balloon deflating fast.", shape: "ぴ with a small ゅ." },
      { char: "ぴょ", romaji: "pyo", mnemonic: "ぴ + small ょ = PYO. The hop of a frog (ぴょんぴょん).", shape: "ぴ with a small ょ." }
    ]
  },

  // =========================================================
  // KATAKANA — chapters grouped by rows
  // =========================================================

  {
    id: "k_vowels",
    rulesetId: "ka_vowels",
    script: "katakana",
    title: "Katakana Vowels",
    subtitle: "ア イ ウ エ オ — same sounds, sharper shapes",
    glyph: "ア",
    intro: [
      "Katakana is the angular, harder-edged cousin of hiragana. Same exact sounds — every katakana character maps 1:1 to a hiragana one (ア = あ = 'a'). The shapes are different because katakana evolved from clipped pieces of kanji, while hiragana came from cursive ones.",
      "Katakana is used mostly for: foreign loanwords (コーヒー coffee, テレビ TV), foreign names (ジョン John), onomatopoeia, scientific terms, and emphasis (like italics in English).",
      "Many katakana characters look very similar to each other — more than in hiragana — so pay extra attention to small differences in stroke direction and length."
    ],
    characters: [
      {
        char: "ア", romaji: "a",
        mnemonic: "Looks like a capital 'A' with the cross-bar broken off. The right side is missing — picture an A leaning against a wall.",
        shape: "Two strokes: a tick on top-left flowing into a long horizontal, then a long vertical curving down to the lower-left.",
        confusables: ["マ (ma) — マ is similar but has no horizontal cap. ア = 'A'rch, マ = 'Ma'sk."]
      },
      {
        char: "イ", romaji: "i",
        mnemonic: "An 'EE'l standing upright, leaning slightly. Or: the lowercase 'i' from a romaji keyboard, hat off.",
        shape: "Two strokes: a short diagonal slash at the top, and a long vertical stroke that supports it."
      },
      {
        char: "ウ", romaji: "u",
        mnemonic: "A person crouching 'U'nder an umbrella — the tick on top is the umbrella point, the curving body is the person huddled below.",
        shape: "Three strokes: a small tick at the top, a horizontal lid below it, and a curving stroke that hangs down from the lid.",
        confusables: ["ワ (wa) — ワ has no tick on top. ウ = umbrella; ワ is bare-headed."]
      },
      {
        char: "エ", romaji: "e",
        mnemonic: "An 'E'ngineer's H-beam — capital I rotated, or capital E without the middle bar. Two horizontals joined by a vertical.",
        shape: "Three strokes: top horizontal, vertical down the middle, bottom horizontal."
      },
      {
        char: "オ", romaji: "o",
        mnemonic: "An 'O'ffice building's TV antenna — vertical pole, horizontal crossbar, and a long swooping diagonal.",
        shape: "Three strokes: a horizontal slash, a vertical that crosses it, and a long diagonal from the cross down to the lower-left."
      }
    ]
  },

  {
    id: "k_k_row",
    rulesetId: "ka_k_row",
    script: "katakana",
    title: "Katakana K-Row",
    subtitle: "カ キ ク ケ コ — almost the same as hiragana",
    glyph: "カ",
    intro: [
      "The K-row is one of the easiest crossovers between scripts. Many of these characters strongly resemble their hiragana counterparts: カ ≈ か, キ ≈ き, ク is close to く. Use that to your advantage."
    ],
    characters: [
      {
        char: "カ", romaji: "ka",
        mnemonic: "Looks like a stripped-down か — sword strike + hook. Or: an electric 'KA-zap' lightning shape.",
        shape: "Two strokes: a horizontal with a sharp hook downward, then a single sweeping diagonal that cuts through.",
        confusables: ["力 (kanji 'power') — they're literally identical-looking. Context tells them apart."]
      },
      {
        char: "キ", romaji: "ki",
        mnemonic: "A 'KEY' — and it looks like hiragana き with the tail cut off. Two teeth and a shaft.",
        shape: "Three strokes: two short horizontal teeth, then a vertical shaft that pierces both."
      },
      {
        char: "ク", romaji: "ku",
        mnemonic: "Same cuckoo's beak as く, but sharper and more angular. A capital K shape compressed.",
        shape: "Two strokes: a short diagonal tick at the top, then a longer diagonal that meets and continues down.",
        confusables: ["ワ (wa), ケ (ke), 7 (the number) — all share the 'angled top-down' shape. ク has the cleanest beak."]
      },
      {
        char: "ケ", romaji: "ke",
        mnemonic: "A 'KE'g, like け — but more angular. A horizontal bar with a slash through it, plus a vertical leg.",
        shape: "Three strokes: a horizontal cap, a sharp diagonal that cuts down through it, and a final vertical on the right.",
        confusables: ["ク (ku) — ケ has an extra horizontal cap. ク is bare."]
      },
      {
        char: "コ", romaji: "ko",
        mnemonic: "Same as こ but angular — two corners forming a sideways bracket [.",
        shape: "Two strokes: a top horizontal hooking into a vertical, then a bottom horizontal closing it off."
      }
    ]
  },

  {
    id: "k_s_row",
    rulesetId: "ka_s_row",
    script: "katakana",
    title: "Katakana S-Row",
    subtitle: "サ シ ス セ ソ — the シ vs ツ trap starts here",
    glyph: "サ",
    intro: [
      "シ (shi) and ツ (tsu) are the most-confused pair in katakana. Both are three short strokes plus a longer one — the difference is direction.",
      "ON シ (shi): the two short strokes are HORIZONTAL (left-to-right), and the long stroke sweeps UP from the bottom-left to the upper-right. Think: 'shi' has eyes looking up to see her.",
      "ON ツ (tsu): the two short strokes are VERTICAL (top-to-bottom), and the long stroke sweeps DOWN from the upper-right to the bottom-left. Think: 'tsu' drops down like a tsunami.",
      "Same trap applies later to ソ (so) vs ン (n) — same up/down direction rule."
    ],
    characters: [
      {
        char: "サ", romaji: "sa",
        mnemonic: "A 'SA'lt shaker with two holes and a handle below. Or: hiragana さ flattened and squared off.",
        shape: "Three strokes: two short verticals at the top, joined by a horizontal, with a fourth long vertical piercing through."
      },
      {
        char: "シ", romaji: "shi",
        mnemonic: "'SHE' is smiling with two horizontal eye-glints and her hair sweeping UP from below. The sweep goes upward.",
        shape: "Three strokes: two short horizontal dots stacked vertically on the left, then a long stroke sweeping from lower-left to upper-right.",
        confusables: ["ツ (tsu) — ツ's dots are vertical, and its long stroke goes DOWN. シ's dots are horizontal, sweep goes UP."]
      },
      {
        char: "ス", romaji: "su",
        mnemonic: "Like the letter 'Z' or '7' with an extra leg — picture 'SU'e running with a long ponytail trailing.",
        shape: "Two strokes: a small angled hook at the top, then a long stroke that sweeps down-left into a tail."
      },
      {
        char: "セ", romaji: "se",
        mnemonic: "Hiragana せ with the hook squared off — angular table-setter.",
        shape: "Two strokes: a horizontal hook on top, then a vertical that sweeps down-right with a small curl."
      },
      {
        char: "ソ", romaji: "so",
        mnemonic: "'SO' the short stroke is on top and the long one sweeps DOWN. SO and TSU both sweep down — but SO has only ONE short dot, TSU has TWO.",
        shape: "Two strokes: a single short tick at the top, then a long stroke sweeping from upper-right down to lower-left.",
        confusables: ["ン (n) — ソ's long stroke goes DOWN; ン's goes UP. Same rule as シ vs ツ."]
      }
    ]
  },

  {
    id: "k_t_row",
    rulesetId: "ka_t_row",
    script: "katakana",
    title: "Katakana T-Row",
    subtitle: "タ チ ツ テ ト — and the partner to シ",
    glyph: "タ",
    intro: [
      "ツ (tsu) is the partner to シ (shi). Same general shape, opposite direction.",
      "TSU rule: dots are vertical, long stroke sweeps DOWN. Memorise that and you've solved the trickiest pair in katakana."
    ],
    characters: [
      {
        char: "タ", romaji: "ta",
        mnemonic: "Like a person 'TA'king a bow — head down, foot kicking back. Or: a hood with a stitch.",
        shape: "Three strokes: a long sweeping diagonal, a horizontal across the top, and a small interior stroke.",
        confusables: ["ク (ku), ナ (na) — タ has an extra small stroke inside the upper-left."]
      },
      {
        char: "チ", romaji: "chi",
        mnemonic: "Cheerleader holding a pompom up high. Resembles hiragana ち but more angular.",
        shape: "Three strokes: a short diagonal slash at the top, a horizontal below it, and a curving vertical that sweeps down-left."
      },
      {
        char: "ツ", romaji: "tsu",
        mnemonic: "A 'tSU'nami: two raindrops falling vertically, with a wave sweeping DOWN-LEFT below.",
        shape: "Three strokes: two short vertical dots on top, then a long stroke from upper-right down to lower-left.",
        confusables: ["シ (shi) — see chapter intro. ツ's dots stand UP, ツ's tail sweeps DOWN."]
      },
      {
        char: "テ", romaji: "te",
        mnemonic: "A 'TE'lephone pole with crossbars and a hanging wire (the long curving tail at the bottom).",
        shape: "Three strokes: top horizontal, second horizontal below it, and a curving vertical that hangs from the middle."
      },
      {
        char: "ト", romaji: "to",
        mnemonic: "A big 'TOE' with a thorn — same idea as hiragana と but stiffer. Vertical leg, small tick poking out to the right.",
        shape: "Two strokes: a long vertical line, then a single short tick on the right side."
      }
    ]
  },

  {
    id: "k_n_row",
    rulesetId: "ka_n_row",
    script: "katakana",
    title: "Katakana N-Row",
    subtitle: "ナ ニ ヌ ネ ノ — minimalist shapes",
    glyph: "ナ",
    intro: [
      "Many of these are some of the simplest characters in either script. ノ (no) is a single diagonal stroke. ニ (ni) is two horizontal lines.",
      "Take care with ヌ (nu) and ス (su) — they're nearly identical except ヌ has a horizontal cap that ス doesn't."
    ],
    characters: [
      {
        char: "ナ", romaji: "na",
        mnemonic: "A 'NA'ughty cross. Just a horizontal and a vertical that cuts down through it.",
        shape: "Two strokes: horizontal slash, then a vertical that pierces and curves slightly down-left."
      },
      {
        char: "ニ", romaji: "ni",
        mnemonic: "Two knees, side by side, lying down. Two simple horizontal lines, top shorter than bottom.",
        shape: "Two strokes: a short top horizontal, a longer bottom horizontal.",
        confusables: ["二 (kanji 'two') — they look identical, and ni 二 even means 'two'. Same shape, different system."]
      },
      {
        char: "ヌ", romaji: "nu",
        mnemonic: "'NOO'dles crossed. Like ス but with an extra horizontal cap on top.",
        shape: "Two strokes: a horizontal cap, then a long stroke that crosses and sweeps down-left.",
        confusables: ["ス (su) — same body, no cap. ヌ = ス + cap."]
      },
      {
        char: "ネ", romaji: "ne",
        mnemonic: "A 'NET' catching fish — multiple crossing strokes form a mesh.",
        shape: "Four strokes: a top tick, a horizontal slash, and two diagonals crossing below."
      },
      {
        char: "ノ", romaji: "no",
        mnemonic: "The 'NO' slash — a single diagonal line from upper-right to lower-left, like the slash in a 'no-entry' sign.",
        shape: "One stroke: a single diagonal sweep, top-right to bottom-left."
      }
    ]
  },

  {
    id: "k_h_row",
    rulesetId: "ka_h_row",
    script: "katakana",
    title: "Katakana H-Row",
    subtitle: "ハ ヒ フ ヘ ホ — the laughing strokes",
    glyph: "ハ",
    intro: [
      "ハ (ha) is one of the most distinctive katakana — just two diagonal slashes leaning outward, like the two halves of a laugh: 'HA HA'.",
      "ヘ (he) is identical to hiragana へ. They are literally the same shape. Context tells you which script you're reading.",
      "フ (fu) and ワ (wa) and ウ (u) all share a similar 'hood' shape — be careful with these."
    ],
    characters: [
      {
        char: "ハ", romaji: "ha",
        mnemonic: "Two strokes of laughter, 'HA HA' — one going down-left, one going down-right.",
        shape: "Two strokes: a left diagonal slash, then a right diagonal slash, separate at the top.",
        confusables: ["八 (kanji 'eight') — same shape, same pronunciation 'hachi/ha'. Context is your guide."]
      },
      {
        char: "ヒ", romaji: "hi",
        mnemonic: "A 'HEEL' of a shoe with a vertical body and a small tick — like a boot.",
        shape: "Two strokes: a tick at the top-left flowing into a hooked vertical, then a horizontal slash at the bottom."
      },
      {
        char: "フ", romaji: "fu",
        mnemonic: "A 'FU'ji hood — like ウ minus the tick and bottom curve. The top of the umbrella alone.",
        shape: "One stroke: a horizontal that hooks downward at the right end.",
        confusables: ["ワ (wa), ウ (u) — フ has no bottom; ワ is a box; ウ has a tick on top."]
      },
      {
        char: "ヘ", romaji: "he",
        mnemonic: "Identical to hiragana へ. A simple wide caret '∧'. Same shape across both scripts.",
        shape: "One stroke: a shallow inverted V, rising then descending."
      },
      {
        char: "ホ", romaji: "ho",
        mnemonic: "A 'HO'ly cross — vertical post, horizontal arm, plus two small ticks at the base like a steady plinth.",
        shape: "Four strokes: a horizontal, a vertical that pierces it, and two short ticks flanking the lower part of the vertical.",
        confusables: ["木 (kanji 'tree') — looks identical. The kanji means 'tree'; the katakana is 'ho'."]
      }
    ]
  },

  {
    id: "k_m_row",
    rulesetId: "ka_m_row",
    script: "katakana",
    title: "Katakana M-Row",
    subtitle: "マ ミ ム メ モ — easy except for メ",
    glyph: "マ",
    intro: [
      "Most of these are highly distinctive. The one to watch is メ (me), which is essentially an X — but the strokes are deliberate: one diagonal sweeps down-right, the other crosses it.",
      "ミ (mi) is three horizontal slashes — easy to remember because '3' = 'mi' in Japanese counting (一二三 ichi-ni-san)."
    ],
    characters: [
      {
        char: "マ", romaji: "ma",
        mnemonic: "'MA'ma's hood — a curving cap shape. Like ア with no left tick.",
        shape: "Two strokes: a horizontal at the top, then a curving stroke that sweeps down-left and back."
      },
      {
        char: "ミ", romaji: "mi",
        mnemonic: "Three '3's — and 三 (kanji for 'three') is read 'san' or 'mi' depending. Three slashes stacked.",
        shape: "Three strokes: three short horizontal slashes stacked vertically, each slightly offset.",
        confusables: ["三 (kanji 'three') — same exact shape, also read 'mi/san'."]
      },
      {
        char: "ム", romaji: "mu",
        mnemonic: "A 'MOO'ing cow's face — the dot is the nose, the curve below is the open mouth.",
        shape: "Two strokes: a tick on the upper-left, then a curving stroke that sweeps down and across to form a small enclosure."
      },
      {
        char: "メ", romaji: "me",
        mnemonic: "An 'X' marking the spot — picture an 'M'arksman's target.",
        shape: "Two strokes: a long diagonal from upper-right to lower-left, crossed by a shorter diagonal from upper-left to lower-right.",
        confusables: ["ヌ (nu) — メ is just an X; ヌ has a horizontal cap on top."]
      },
      {
        char: "モ", romaji: "mo",
        mnemonic: "Like a 'MO'm's hair-curler. A horizontal with a hooked vertical and an extra crossbar.",
        shape: "Three strokes: a horizontal, a vertical that hooks at the bottom, and a second horizontal crossing the upper part."
      }
    ]
  },

  {
    id: "k_yw_row",
    rulesetId: "ka_yw_row",
    script: "katakana",
    title: "Katakana Y/R/W-Row + ン",
    subtitle: "The rest of katakana base kana",
    glyph: "ン",
    intro: [
      "Final stretch of base katakana. The biggest trap here is ソ (so) vs ン (n) — same direction rule as シ vs ツ from earlier.",
      "ン rule: the single short dot is positioned LOW, and the long stroke sweeps UP from lower-left to upper-right. ン feels like it's looking 'up' — n nodding.",
      "ソ rule: dot is HIGH, long stroke sweeps DOWN. ソ drops down like its hiragana counterpart そ.",
      "ワ (wa) and ヲ (wo) are rare in modern Japanese — ヲ in particular almost never appears outside very stylised text. Recognise them, don't stress about them."
    ],
    characters: [
      {
        char: "ヤ", romaji: "ya",
        mnemonic: "Like the hiragana や but simpler — picture a yacht's flag.",
        shape: "Two strokes: a tick at the upper-right, and a long stroke that sweeps from upper-left down-right."
      },
      {
        char: "ユ", romaji: "yu",
        mnemonic: "A 'U'-shaped pot or pitcher — a horizontal lid above an open container.",
        shape: "Two strokes: a vertical hook flowing into a horizontal base, then a top horizontal lid."
      },
      {
        char: "ヨ", romaji: "yo",
        mnemonic: "A '3' on its side — three rungs of a tiny ladder, all on the right side of an invisible vertical.",
        shape: "Three strokes: three horizontals (top, middle, bottom) joined on the left by an implied vertical."
      },
      {
        char: "ラ", romaji: "ra",
        mnemonic: "'RA'bbit ears — a short top tick and a long curving stroke below.",
        shape: "Two strokes: a short horizontal tick at the top, then a curving stroke that sweeps from upper-left down-right."
      },
      {
        char: "リ", romaji: "ri",
        mnemonic: "Two tall reeds, same as hiragana り but more angular and rigid.",
        shape: "Two strokes: a short vertical on the left, and a taller vertical on the right.",
        confusables: ["り (hiragana ri) — same idea, less curly."]
      },
      {
        char: "ル", romaji: "ru",
        mnemonic: "Two figures walking together — left leg short, right leg long with a hook.",
        shape: "Two strokes: a short slash on the left, and a longer slash on the right that hooks upward at the top."
      },
      {
        char: "レ", romaji: "re",
        mnemonic: "A check mark — like ticking 'REAd'.",
        shape: "One stroke: a vertical that sweeps down-right at the bottom and curls upward."
      },
      {
        char: "ロ", romaji: "ro",
        mnemonic: "A square 'RO'om. Just a small box.",
        shape: "Three strokes: top horizontal, right vertical, and bottom horizontal closing the box.",
        confusables: ["口 (kanji 'mouth') — identical shape, completely different word."]
      },
      {
        char: "ワ", romaji: "wa",
        mnemonic: "A 'WA'-shaped hood, like a stylised 'P' opening downward.",
        shape: "Two strokes: a horizontal top with a small downward hook on the right, and a long stroke that swings down-left.",
        confusables: ["ウ (u), フ (fu) — ワ has the simplest top of the three; ウ has a tick above, フ has no bottom curve."]
      },
      {
        char: "ヲ", romaji: "wo / o",
        mnemonic: "Like ヨ with a slash through it. Almost never appears in modern writing — when it does, it's stylised or archaic.",
        shape: "Three strokes: a horizontal top, a long diagonal slash, and a hooked bottom."
      },
      {
        char: "ン", romaji: "n",
        mnemonic: "A small smile or a wink — short dot LOW, long stroke sweeping UP.",
        shape: "Two strokes: a short tick low on the left, and a long stroke sweeping from lower-left up to upper-right.",
        confusables: ["ソ (so) — see chapter intro. ン sweeps UP; ソ sweeps DOWN."]
      }
    ]
  },

  {
    id: "k_dakuten",
    rulesetId: "k_dak_han",
    script: "katakana",
    title: "Katakana Dakuten ゛ & Handakuten ゜",
    subtitle: "The same marks, same rules, sharper script",
    glyph: "ガ",
    intro: [
      "Katakana voiced sounds follow the exact same rules as hiragana: K→G, S→Z, T→D, H→B or P. Two ticks (゛) for voiced, one circle (゜) for the P-row.",
      "You'll see katakana dakuten constantly in loanwords: ハンバーガー (hamburger), ゴルフ (golf), ビール (beer). Internalise the four pairings here and most foreign words become readable instantly."
    ],
    characters: [
      { char: "ガ", romaji: "ga", mnemonic: "カ + ゛ = GA. Same logic as が.", shape: "Two ticks at the upper-right of カ." },
      { char: "ギ", romaji: "gi", mnemonic: "キ + ゛ = GI.", shape: "Two ticks above キ." },
      { char: "グ", romaji: "gu", mnemonic: "ク + ゛ = GU.", shape: "Two ticks at the upper-right of ク." },
      { char: "ゲ", romaji: "ge", mnemonic: "ケ + ゛ = GE.", shape: "Two ticks above ケ." },
      { char: "ゴ", romaji: "go", mnemonic: "コ + ゛ = GO.", shape: "Two ticks at the upper-right of コ." },
      { char: "ザ", romaji: "za", mnemonic: "サ + ゛ = ZA.", shape: "Two ticks above サ." },
      { char: "ジ", romaji: "ji", mnemonic: "シ + ゛ = JI. As in 'jeep'.", shape: "Two ticks at the upper-right of シ." },
      { char: "ズ", romaji: "zu", mnemonic: "ス + ゛ = ZU.", shape: "Two ticks above ス." },
      { char: "ゼ", romaji: "ze", mnemonic: "セ + ゛ = ZE.", shape: "Two ticks at the upper-right of セ." },
      { char: "ゾ", romaji: "zo", mnemonic: "ソ + ゛ = ZO.", shape: "Two ticks above ソ." },
      { char: "ダ", romaji: "da", mnemonic: "タ + ゛ = DA.", shape: "Two ticks at the upper-right of タ." },
      { char: "ヂ", romaji: "ji", mnemonic: "チ + ゛ — pronounced JI, same as ジ. Very rare.", shape: "Two ticks above チ.", confusables: ["ジ — same sound, common version."] },
      { char: "ヅ", romaji: "zu", mnemonic: "ツ + ゛ — pronounced ZU, same as ズ. Very rare.", shape: "Two ticks above ツ.", confusables: ["ズ — same sound, common version."] },
      { char: "デ", romaji: "de", mnemonic: "テ + ゛ = DE. As in デパート (department store).", shape: "Two ticks at the upper-right of テ." },
      { char: "ド", romaji: "do", mnemonic: "ト + ゛ = DO. As in ドア (door).", shape: "Two ticks above ト." },
      { char: "バ", romaji: "ba", mnemonic: "ハ + ゛ = BA. As in バナナ (banana).", shape: "Two ticks above ハ." },
      { char: "ビ", romaji: "bi", mnemonic: "ヒ + ゛ = BI. As in ビール (beer).", shape: "Two ticks at the upper-right of ヒ." },
      { char: "ブ", romaji: "bu", mnemonic: "フ + ゛ = BU.", shape: "Two ticks above フ." },
      { char: "ベ", romaji: "be", mnemonic: "ヘ + ゛ = BE.", shape: "Two ticks above ヘ." },
      { char: "ボ", romaji: "bo", mnemonic: "ホ + ゛ = BO.", shape: "Two ticks at the upper-right of ホ." },
      { char: "パ", romaji: "pa", mnemonic: "ハ + ゜ = PA. As in パン (bread).", shape: "A small circle above ハ." },
      { char: "ピ", romaji: "pi", mnemonic: "ヒ + ゜ = PI. As in ピアノ (piano).", shape: "A small circle above ヒ." },
      { char: "プ", romaji: "pu", mnemonic: "フ + ゜ = PU.", shape: "A small circle above フ." },
      { char: "ペ", romaji: "pe", mnemonic: "ヘ + ゜ = PE. As in ペン (pen).", shape: "A small circle above ヘ." },
      { char: "ポ", romaji: "po", mnemonic: "ホ + ゜ = PO. As in ポスト (post / mailbox).", shape: "A small circle at the upper-right of ホ." }
    ]
  },

  {
    id: "k_digraphs",
    rulesetId: "k_digraphs_all",
    script: "katakana",
    title: "Katakana Digraphs (Yōon)",
    subtitle: "Same rule as hiragana — small ャ ュ ョ glide off a consonant",
    glyph: "ョ",
    intro: [
      "Identical mechanic to hiragana digraphs: take any -i ending kana (キ, シ, チ, ニ, ヒ, ミ, リ + voiced variants), attach a SMALL ャ, ュ, or ョ.",
      "Katakana digraphs show up constantly in loanwords: ニュース (news = NYU-SU), キャベツ (cabbage = KYA-BE-TSU), ジャズ (jazz). Many imported English sounds require them.",
      "Practice tip: when you see a small character that's noticeably lower-right than its neighbour, it's a digraph — read them together as one syllable, never two."
    ],
    characters: [
      { char: "キャ", romaji: "kya", mnemonic: "キ + small ャ. As in キャンプ (camp).", shape: "キ followed by a smaller ャ." },
      { char: "キュ", romaji: "kyu", mnemonic: "キ + small ュ. As in キュート (cute).", shape: "キ with a small ュ." },
      { char: "キョ", romaji: "kyo", mnemonic: "キ + small ョ. As in トーキョー (Tokyo).", shape: "キ with a small ョ." },
      { char: "シャ", romaji: "sha", mnemonic: "シ + small ャ. As in シャツ (shirt).", shape: "シ with a small ャ." },
      { char: "シュ", romaji: "shu", mnemonic: "シ + small ュ. As in シューズ (shoes).", shape: "シ with a small ュ." },
      { char: "ショ", romaji: "sho", mnemonic: "シ + small ョ. As in ショー (show).", shape: "シ with a small ョ." },
      { char: "チャ", romaji: "cha", mnemonic: "チ + small ャ. As in チャンス (chance).", shape: "チ with a small ャ." },
      { char: "チュ", romaji: "chu", mnemonic: "チ + small ュ. As in チューブ (tube).", shape: "チ with a small ュ." },
      { char: "チョ", romaji: "cho", mnemonic: "チ + small ョ. As in チョコ (choco).", shape: "チ with a small ョ." },
      { char: "ニャ", romaji: "nya", mnemonic: "ニ + small ャ. Cat sounds. Rare otherwise.", shape: "ニ with a small ャ." },
      { char: "ニュ", romaji: "nyu", mnemonic: "ニ + small ュ. As in ニュース (news).", shape: "ニ with a small ュ." },
      { char: "ニョ", romaji: "nyo", mnemonic: "ニ + small ョ. Rare; mostly in foreign names.", shape: "ニ with a small ョ." },
      { char: "ヒャ", romaji: "hya", mnemonic: "ヒ + small ャ. Mostly classical sounds and counters.", shape: "ヒ with a small ャ." },
      { char: "ヒュ", romaji: "hyu", mnemonic: "ヒ + small ュ. Rare in loanwords; appears in names.", shape: "ヒ with a small ュ." },
      { char: "ヒョ", romaji: "hyo", mnemonic: "ヒ + small ョ. Rare.", shape: "ヒ with a small ョ." },
      { char: "ミャ", romaji: "mya", mnemonic: "ミ + small ャ. Very rare.", shape: "ミ with a small ャ." },
      { char: "ミュ", romaji: "myu", mnemonic: "ミ + small ュ. As in ミュージック (music).", shape: "ミ with a small ュ." },
      { char: "ミョ", romaji: "myo", mnemonic: "ミ + small ョ. Rare.", shape: "ミ with a small ョ." },
      { char: "リャ", romaji: "rya", mnemonic: "リ + small ャ. Rare in loanwords.", shape: "リ with a small ャ." },
      { char: "リュ", romaji: "ryu", mnemonic: "リ + small ュ. As in リュック (backpack).", shape: "リ with a small ュ." },
      { char: "リョ", romaji: "ryo", mnemonic: "リ + small ョ. Rare in loanwords.", shape: "リ with a small ョ." },
      { char: "ギャ", romaji: "gya", mnemonic: "ギ + small ャ. As in ギャング (gang).", shape: "ギ with a small ャ." },
      { char: "ギュ", romaji: "gyu", mnemonic: "ギ + small ュ. As in ギュッ (squeeze).", shape: "ギ with a small ュ." },
      { char: "ギョ", romaji: "gyo", mnemonic: "ギ + small ョ. Mostly Japanese-origin words.", shape: "ギ with a small ョ." },
      { char: "ジャ", romaji: "ja", mnemonic: "ジ + small ャ. As in ジャズ (jazz).", shape: "ジ with a small ャ." },
      { char: "ジュ", romaji: "ju", mnemonic: "ジ + small ュ. As in ジュース (juice).", shape: "ジ with a small ュ." },
      { char: "ジョ", romaji: "jo", mnemonic: "ジ + small ョ. As in ジョーク (joke).", shape: "ジ with a small ョ." },
      { char: "ビャ", romaji: "bya", mnemonic: "ビ + small ャ. Very rare.", shape: "ビ with a small ャ." },
      { char: "ビュ", romaji: "byu", mnemonic: "ビ + small ュ. As in ビューティー (beauty).", shape: "ビ with a small ュ." },
      { char: "ビョ", romaji: "byo", mnemonic: "ビ + small ョ. Rare in loanwords.", shape: "ビ with a small ョ." },
      { char: "ピャ", romaji: "pya", mnemonic: "ピ + small ャ. Very rare.", shape: "ピ with a small ャ." },
      { char: "ピュ", romaji: "pyu", mnemonic: "ピ + small ュ. As in ピューマ (puma).", shape: "ピ with a small ュ." },
      { char: "ピョ", romaji: "pyo", mnemonic: "ピ + small ョ. Rare.", shape: "ピ with a small ョ." }
    ]
  }
];

// Build a master ID list for navigation. Group by script for menu sections.
const TEXTBOOK_GROUPS = [
  {
    id: "hiragana",
    label: "ひらがな  Hiragana",
    sub: "Foundational rows and beyond",
    chapterIds: ["h_vowels","h_k_row","h_s_row","h_t_row","h_n_row","h_h_row","h_m_row","h_yw_row","h_r_row","h_dakuten","h_digraphs"]
  },
  {
    id: "katakana",
    label: "カタカナ  Katakana",
    sub: "Loanwords and emphasis",
    chapterIds: ["k_vowels","k_k_row","k_s_row","k_t_row","k_n_row","k_h_row","k_m_row","k_yw_row","k_dakuten","k_digraphs"]
  }
];

const TEXTBOOK_MAP = {};
TEXTBOOK_CHAPTERS.forEach(c => { TEXTBOOK_MAP[c.id] = c; });

Object.assign(window, {
  TEXTBOOK_CHAPTERS,
  TEXTBOOK_GROUPS,
  TEXTBOOK_MAP
});
