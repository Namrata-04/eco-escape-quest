import { BusEvent, Team } from './types';

const CHANNEL = 'eeq_multiplayer_v1';

export class LocalBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(e: BusEvent) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (ev) => {
        this.listeners.forEach((cb) => cb(ev.data as BusEvent));
      };
    }
  }

  on(cb: (e: BusEvent) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== cb);
    };
  }

  emit(event: BusEvent) {
    if (this.channel) this.channel.postMessage(event);
  }
}

// Simple local persistence for teams and leaderboard
const TEAM_KEY = 'eeq_teams_v1';

export function saveTeam(team: Team) {
  const map = readTeams();
  map[team.id] = team;
  localStorage.setItem(TEAM_KEY, JSON.stringify(map));
}

export function readTeams(): Record<string, Team> {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getTeam(teamId: string): Team | null {
  return readTeams()[teamId] || null;
}







