const STORAGE_KEY = 'pixelFruit.records.v1';

export function getRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((record) => record && Number.isFinite(record.score) && typeof record.date === 'string')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
    return [];
  }
}

export function saveRecord(score) {
  const records = getRecords();
  const entry = {
    score: Math.max(0, Math.floor(score)),
    date: new Date().toISOString(),
  };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const trimmedRecords = records.slice(0, 10);

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedRecords)); }
  catch { /* The game still works if local storage is unavailable. */ }

  return {
    entry,
    records: trimmedRecords,
    isBest: trimmedRecords[0] === entry || (
      trimmedRecords[0]?.score === entry.score && trimmedRecords[0]?.date === entry.date
    ),
  };
}

export function clearRecords() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
}

export function bestScore() {
  return getRecords()[0]?.score || 0;
}
