const LOCAL_STORAGE_KEY = 'highscores';
const MAX_SCORES = 5;

export interface HighScore {
  name: string;
  score: number;
}

const ALLOWABLE_CHARACTERS = /[a-z0-9!@#$%^&*()_+=,<.>/?;:'"{-}\\|`~\[\]]{1,3}/i;

const DEFAULT_SCORES: HighScore[] = [
  { name: 'LMN', score: 2000 },
  { name: 'CG!', score: 974 },
  { name: 'FIS', score: 800 },
  { name: 'SJM', score: 700 },
  { name: 'ASS', score: 200 },
];

// Read the scores from storage and check if the given score should fit in there
// If yes, it will be returned in `yours`, otherwise `yours` will be undefined
export function getHighScoresWithPlaceholder(score: number): { scores: HighScore[], yours: HighScore | undefined } {
  const scores = readHighScores();
  let yours: HighScore | undefined;
  for (let i = 0; i < scores.length; ++i) {
    if (score > scores[i].score) {
      yours = { name: '', score };
      scores.splice(i, 0, yours);
      scores.pop();
      break;
    }
  }
  return { scores, yours };
}

export function readHighScores(): HighScore[] {
  let values: HighScore[] = [];
  try {
    values = JSON.parse(
      window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]'
    );
  } catch { }

  if (values.length < MAX_SCORES) {
    values.push(...DEFAULT_SCORES);
  }
  return values.sort(byScore).slice(0, MAX_SCORES);
}

export function setHighScores(scores: HighScore[]) {
  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(scores.toSorted(byScore).slice(0, MAX_SCORES))
  );
}

export function clearHighScores(): void {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

function byScore(a: HighScore, b: HighScore): number {
  return b.score - a.score;
}

export function applyUserInputTo(score: HighScore, key: string): void {
  if (key === 'Backspace') {
    score.name = score.name.slice(0, -1);
  } else if (score.name.length < 3 && key.length === 1 && ALLOWABLE_CHARACTERS.test(key)) {
    score.name += key.toUpperCase();
  }
}

export function isValidHighScore(score: HighScore): boolean {
  return score.name.length === 3 && ALLOWABLE_CHARACTERS.test(score.name);
}