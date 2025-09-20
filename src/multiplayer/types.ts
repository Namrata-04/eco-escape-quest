export type GameMode = 'solo' | 'team' | 'versus';

export type Role =
  | 'energy_engineer'
  | 'recycler'
  | 'water_guardian'
  | 'architect'
  | 'policy_maker';

export interface Player {
  id: string; // uuid
  name: string;
  avatarUrl?: string;
  role?: Role;
  ready: boolean;
}

export interface Team {
  id: string; // team code
  name: string;
  motto?: string;
  avatarUrl?: string;
  leaderId: string;
  mode: GameMode; // team or versus
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  members: Player[];
  createdAt: number;
  startedAt?: number;
}

export type BusEvent =
  | { type: 'team:update'; team: Team }
  | { type: 'team:start'; teamId: string; startedAt: number }
  | { type: 'chat:message'; teamId: string; from: string; text: string; ts: number };

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  mode: GameMode;
  timeSeconds: number;
  ecoPoints: number;
  createdAt: number;
}

export const RolesMeta: Record<Role, { label: string; icon: string } > = {
  energy_engineer: { label: 'Energy Engineer', icon: '⚡' },
  recycler: { label: 'Recycler', icon: '♻️' },
  water_guardian: { label: 'Water Guardian', icon: '💧' },
  architect: { label: 'Architect', icon: '🏠' },
  policy_maker: { label: 'Policy Maker', icon: '🌍' },
};







