import type { Quote } from './types'

/**
 * Shown once a day on the home screen. Nothing here shames a missed session —
 * the tone is the same whether you are on day three or day three hundred.
 */
export const QUOTES: Quote[] = [
  { id: 'q1', text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { id: 'q2', text: 'Little by little, a little becomes a lot.', author: 'Tanzanian proverb' },
  { id: 'q3', text: 'Motion is lotion.', author: 'Physiotherapy adage' },
  { id: 'q4', text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { id: 'q5', text: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Proverb' },
  { id: 'q6', text: 'Consistency is what transforms average into excellence.', author: 'Tony Robbins' },
  { id: 'q7', text: 'It is not the load that breaks you down, it is the way you carry it.', author: 'Lou Holtz' },
  { id: 'q8', text: 'Take care of your body. It is the only place you have to live.', author: 'Jim Rohn' },
  { id: 'q9', text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { id: 'q10', text: 'An hour of pain is worth a lifetime of glory — but ten quiet minutes will do.', author: 'Arohan' },
  { id: 'q11', text: 'Slow is smooth, and smooth is fast.', author: 'Adage' },
  { id: 'q12', text: 'Strength does not come from what you can do. It comes from overcoming what you thought you could not.', author: 'Rikki Rogers' },
  { id: 'q13', text: 'A river cuts through rock not because of its power, but its persistence.', author: 'Jim Watkins' },
  { id: 'q14', text: 'The only bad workout is the one that did not happen.', author: 'Anonymous' },
  { id: 'q15', text: 'Movement is a medicine for creating change in a person’s physical, emotional and mental states.', author: 'Carol Welch' },
  { id: 'q16', text: 'You are not behind. You are exactly where the work has brought you.', author: 'Arohan' },
  { id: 'q17', text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { id: 'q18', text: 'Do not count the days. Make the days count.', author: 'Muhammad Ali' },
  { id: 'q19', text: 'Rest is not the opposite of progress. It is part of it.', author: 'Arohan' },
  { id: 'q20', text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { id: 'q21', text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Anonymous' },
  { id: 'q22', text: 'Well begun is half done.', author: 'Aristotle' },
  { id: 'q23', text: 'A goal without a routine is a wish.', author: 'Anonymous' },
  { id: 'q24', text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { id: 'q25', text: 'The obstacle is the way.', author: 'Marcus Aurelius' },
  { id: 'q26', text: 'You cannot control the wind, but you can adjust your sails.', author: 'Proverb' },
  { id: 'q27', text: 'Be stronger than your excuses, and kinder than your inner critic.', author: 'Arohan' },
  { id: 'q28', text: 'Every day is a chance to get a little better.', author: 'Anonymous' },
  { id: 'q29', text: 'A healthy outside starts from the inside.', author: 'Robert Urich' },
  { id: 'q30', text: 'One session will not change your body. A hundred will change your life.', author: 'Arohan' },
  { id: 'q31', text: 'Ārohaṇa — the ascent. One step is still the climb.', author: 'Sanskrit' },
  { id: 'q32', text: 'Show up. That is most of it.', author: 'Arohan' },
]

/** Deterministic pick, so the quote is stable for a whole day. */
export function quoteForDate(dateKey: string, pool: Quote[] = QUOTES): Quote {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  return pool[hash % pool.length]
}
