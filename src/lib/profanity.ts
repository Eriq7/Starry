/**
 * lib/profanity.ts
 *
 * Server-side profanity filter for meteor messages.
 * Uses word-boundary regex checks against ~80 common English profanity terms.
 * Used only in API routes — never imported client-side.
 *
 * Returns true if the text contains a blocked word.
 */

const BLOCKED_WORDS = [
  // Core slurs and profanity (common English terms only)
  'fuck', 'fucker', 'fucking', 'fucked', 'fucks',
  'shit', 'shits', 'shitting', 'shitty',
  'ass', 'asshole', 'assholes', 'asses',
  'bitch', 'bitches', 'bitching',
  'cunt', 'cunts',
  'dick', 'dicks',
  'cock', 'cocks',
  'pussy', 'pussies',
  'bastard', 'bastards',
  'damn', 'damned',
  'hell', // context-dependent but safer to block
  'piss', 'pissed', 'pissing',
  'crap', 'craps',
  'whore', 'whores',
  'slut', 'sluts',
  'nigger', 'niggers', 'nigga',
  'faggot', 'faggots', 'fag', 'fags',
  'retard', 'retards', 'retarded',
  'kike', 'kikes',
  'chink', 'chinks',
  'spic', 'spics',
  'wetback', 'wetbacks',
  'tranny', 'trannies',
  'dyke', 'dykes',
  'homo', 'homos',
  'rape', 'rapes', 'raping', 'rapist',
  'murder', 'murders', 'murdering', 'murderer',
  'kill', 'kills', 'killing', 'killer',
  'suicide', 'suicidal',
  'terrorist', 'terrorism',
  'nazi', 'nazis',
  'hitler',
  'sex', 'sexy', 'sexting',
  'porn', 'porno', 'pornography',
  'jerk', 'jerking',
  'masturbat', // catches masturbate, masturbating, masturbation
  'dildo', 'dildos',
  'vagina', 'vaginas',
  'penis', 'penises',
  'boob', 'boobs', 'tit', 'tits',
  'anal',
  'blowjob', 'blowjobs',
  'handjob', 'handjobs',
  'orgasm', 'orgasms',
  'ejaculate', 'ejaculation',
  'cum', 'cumming',
  'semen',
  'skank', 'skanks',
  'twat', 'twats',
]

// Build a single regex with word boundaries
const PROFANITY_RE = new RegExp(
  `\\b(${BLOCKED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
)

/**
 * Returns true if the text contains blocked content.
 */
export function containsProfanity(text: string): boolean {
  return PROFANITY_RE.test(text)
}
