import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple localStorage-backed scoreboard for agent lifetime points
const STORAGE_KEY = 'eeq_scoreboard_v1';

export interface ScoreEntry {
	agent: string;
	points: number; // lifetime total
	updatedAt: number;
}

function readStore(): Record<string, ScoreEntry> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function writeStore(data: Record<string, ScoreEntry>) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {}
}

export function getAgentScore(agent: string): ScoreEntry | null {
	const store = readStore();
	return store[agent.toLowerCase()] || null;
}

export function addAgentPoints(agent: string, delta: number): ScoreEntry {
	const key = agent.toLowerCase();
	const store = readStore();
	const current = store[key] || { agent, points: 0, updatedAt: Date.now() } as ScoreEntry;
	current.points = Math.max(0, current.points + delta);
	current.updatedAt = Date.now();
	store[key] = current;
	writeStore(store);
	return current;
}

export function setAgentPoints(agent: string, total: number): ScoreEntry {
	const key = agent.toLowerCase();
	const store = readStore();
	store[key] = { agent, points: Math.max(0, total), updatedAt: Date.now() };
	writeStore(store);
	return store[key];
}

export function listTopAgents(limit = 10): ScoreEntry[] {
	const store = readStore();
	return Object.values(store)
		.sort((a, b) => b.points - a.points)
		.slice(0, limit);
}
