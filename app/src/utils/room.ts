// helper to produce deterministic 1:1 room id for two user ids
export function getRoomId(a: string, b: string) {
  // stable ordering so both sides produce same id
  return [a, b].sort().join(':');
}
