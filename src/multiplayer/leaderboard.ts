import { LeaderboardEntry } from './types';

const KEY = 'eeq_team_leaderboard_v1';

export function addResult(entry: LeaderboardEntry) {
  const list = readAll();
  list.push(entry);
  list.sort((a,b) => a.timeSeconds - b.timeSeconds);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function readAll(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}







