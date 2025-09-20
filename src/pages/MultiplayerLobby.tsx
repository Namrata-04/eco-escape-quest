import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LocalBus, getTeam, saveTeam } from '@/multiplayer/bus';
import { Player, Role, RolesMeta, Team } from '@/multiplayer/types';
import TeamStatusBar from '@/components/TeamStatusBar';
import { v4 as uuidv4 } from 'uuid';

const roles: Role[] = ['energy_engineer','recycler','water_guardian','architect','policy_maker'];

function makeTeam(name: string, leader: Player): Team {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-') + '-' + leader.id.slice(0, 4),
    name,
    motto: '',
    leaderId: leader.id,
    avatarUrl: '',
    mode: 'team',
    difficulty: 'Beginner',
    members: [leader],
    createdAt: Date.now(),
  };
}

export default function MultiplayerLobby() {
  const [bus] = useState(() => new LocalBus());
  const [me] = useState<Player>(() => ({ id: uuidv4(), name: 'Agent', ready: false }));

  const [team, setTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('Eco Avengers');
  const [joinId, setJoinId] = useState('');

  // subscribe to realtime team updates
  useEffect(() => {
    return bus.on((e) => {
      if (e.type === 'team:update') {
        setTeam((t) => (t && t.id === e.team.id ? e.team : t));
      }
    });
  }, [bus]);

  const isLeader = team?.leaderId === me.id;

  const handleCreate = () => {
    const t = makeTeam(teamName, me);
    setTeam(t);
    saveTeam(t);
    bus.emit({ type: 'team:update', team: t });
  };

  const handleJoin = () => {
    const t = getTeam(joinId);
    if (!t) return;
    if (!t.members.find((m) => m.id === me.id)) {
      t.members.push({ ...me });
      saveTeam(t);
      bus.emit({ type: 'team:update', team: t });
    }
    setTeam(t);
  };

  const toggleReady = () => {
    if (!team) return;
    const updated = { ...team, members: team.members.map(m => m.id === me.id ? { ...m, ready: !m.ready } : m) };
    setTeam(updated); saveTeam(updated); bus.emit({ type: 'team:update', team: updated });
  };

  const assignRole = (role: Role) => {
    if (!team) return;
    const taken = team.members.some((m) => m.role === role);
    if (taken) return;
    const updated = { ...team, members: team.members.map(m => m.id === me.id ? { ...m, role } : m) };
    setTeam(updated); saveTeam(updated); bus.emit({ type: 'team:update', team: updated });
  };

  const everyoneReady = team?.members.length && team.members.every(m => m.ready && m.role);

  const startTeam = () => {
    if (!team || !isLeader || !everyoneReady) return;
    const updated = { ...team, startedAt: Date.now() };
    setTeam(updated); saveTeam(updated); bus.emit({ type: 'team:start', teamId: team.id, startedAt: updated.startedAt! });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <TeamStatusBar teamName={team?.name || 'Lobby'} ecoPoints={0} timeLeftSec={60*20} risk={10} />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="climate-card p-6">
          <h2 className="font-gaming text-xl mb-4">Create Team</h2>
          <Label htmlFor="teamName">Team Name</Label>
          <Input id="teamName" value={teamName} onChange={(e)=>setTeamName(e.target.value)} className="mt-2 mb-4" />
          <Button onClick={handleCreate}>Create</Button>
        </Card>

        <Card className="climate-card p-6">
          <h2 className="font-gaming text-xl mb-4">Join Team</h2>
          <Label htmlFor="joinId">Enter Team ID</Label>
          <Input id="joinId" value={joinId} onChange={(e)=>setJoinId(e.target.value)} className="mt-2 mb-4" />
          <Button variant="outline" onClick={handleJoin}>Join</Button>
        </Card>
      </div>

      {team && (
        <Card className="climate-card mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-gaming text-lg">Lobby: {team.name}</h3>
              <p className="text-xs text-muted-foreground">Team ID: {team.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Mode: {team.mode}</Badge>
              <Badge variant="outline">Difficulty: {team.difficulty}</Badge>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border rounded p-3 bg-card/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback>{m.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-medium">{m.name} {m.id===team.leaderId && <span className="text-xs text-primary ml-1">(Leader)</span>}</div>
                    <div className="text-xs text-muted-foreground">{m.role ? `${RolesMeta[m.role].icon} ${RolesMeta[m.role].label}` : 'No role'}</div>
                  </div>
                </div>
                <Badge className={m.ready ? 'bg-gradient-solution' : ''}>{m.ready ? 'Ready' : 'Not Ready'}</Badge>
              </div>
            ))}
          </div>

          {/* Role selection */}
          <div className="mt-6">
            <h4 className="font-gaming mb-2">Select Your Role</h4>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <Button key={r} size="sm" variant="outline" onClick={()=>assignRole(r)} disabled={team.members.some(m=>m.role===r)}>
                  {RolesMeta[r].icon} {RolesMeta[r].label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={toggleReady}>{team.members.find(m=>m.id===me.id)?.ready ? 'Unready' : 'Ready Up'}</Button>
            {isLeader && (
              <Button variant="solution" disabled={!everyoneReady} onClick={startTeam}>Start Mission</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}







