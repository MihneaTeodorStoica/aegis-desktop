export interface MatchCandidate<T> {
  value: T;
  text: string;
}

export interface MatchResult<T> {
  value: T;
  score: number;
  strategy: 'exact' | 'contains';
}

export function findBestTextMatch<T>(
  query: string,
  candidates: MatchCandidate<T>[]
): MatchResult<T> | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  const exact = candidates.find(
    (candidate) => candidate.text.trim().toLowerCase() === normalizedQuery
  );
  if (exact) {
    return { value: exact.value, score: 1, strategy: 'exact' };
  }

  const contains = candidates
    .map((candidate) => {
      const text = candidate.text.trim().toLowerCase();
      const index = text.indexOf(normalizedQuery);
      if (index === -1) {
        return null;
      }

      const density = normalizedQuery.length / Math.max(text.length, 1);
      const startBonus = index === 0 ? 0.15 : 0;
      return {
        value: candidate.value,
        score: density + startBonus,
        strategy: 'contains' as const
      };
    })
    .filter(
      (
        value
      ): value is {
        value: T;
        score: number;
        strategy: 'contains';
      } => value !== null
    )
    .sort((left, right) => right.score - left.score)[0];

  return contains ?? null;
}
