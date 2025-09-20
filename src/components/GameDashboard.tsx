import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addAgentPoints, getAgentScore, listTopAgents } from '@/lib/utils';
import { 
  Zap, 
  Trash2, 
  Droplets, 
  Home, 
  Scale, 
  Clock, 
  Star,
  Lock,
  CheckCircle2,
  Play,
  UserRound,
  LogOut
} from 'lucide-react';
import { EnergyRoom } from '@/components/rooms/EnergyRoom';
import { WasteRoom } from '@/components/rooms/WasteRoom';
import { WaterRoom } from '@/components/rooms/WaterRoom';
import { ShelterRoom } from '@/components/rooms/ShelterRoom';
import { PolicyRoom } from '@/components/rooms/PolicyRoom';
import energyIcon from '@/assets/energy-room-icon.jpg';
import wasteIcon from '@/assets/waste-room-icon.jpg';

interface GameDashboardProps {
  playerData: { name: string; difficulty: string };
  onExitGame?: () => void;
}

export const GameDashboard = ({ playerData, onExitGame }: GameDashboardProps) => {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [completedRooms, setCompletedRooms] = useState<string[]>([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const lifetime = getAgentScore(playerData.name)?.points || 0;

  const rooms = [
    {
      id: 'energy',
      name: 'Energy Blackout',
      description: 'Restore power to the city using renewable energy',
      icon: Zap,
      image: energyIcon,
      difficulty: 'Medium',
      estimatedTime: '12 min',
      points: 100,
      status: 'available'
    },
    {
      id: 'waste',
      name: 'Waste Overflow',
      description: 'Clear the digital landfill through proper sorting',
      icon: Trash2,
      image: wasteIcon,
      difficulty: 'Easy',
      estimatedTime: '10 min',
      points: 80,
      status: completedRooms.includes('energy') ? 'available' : 'locked'
    },
    {
      id: 'water',
      name: 'Water Crisis',
      description: 'Purify contaminated water supply systems',
      icon: Droplets,
      image: null,
      difficulty: 'Hard',
      estimatedTime: '15 min',
      points: 120,
      status: completedRooms.includes('waste') ? 'available' : 'locked'
    },
    {
      id: 'shelter',
      name: 'Climate Refugee Zone',
      description: 'Build sustainable shelters for displaced families',
      icon: Home,
      image: null,
      difficulty: 'Medium',
      estimatedTime: '13 min',
      points: 110,
      status: completedRooms.includes('water') ? 'available' : 'locked'
    },
    {
      id: 'policy',
      name: 'Climate Policy Chamber',
      description: 'Negotiate global policies to save the planet',
      icon: Scale,
      image: null,
      difficulty: 'Expert',
      estimatedTime: '20 min',
      points: 150,
      status: completedRooms.includes('shelter') ? 'available' : 'locked'
    }
  ];

  const handleRoomComplete = (roomId: string, points: number, timeBonus: number) => {
    setCompletedRooms(prev => [...prev, roomId]);
    setEcoPoints(prev => prev + points + timeBonus);
    // update lifetime scoreboard
    addAgentPoints(playerData.name, points + timeBonus);
    setCurrentRoom(null);
  };

  const totalProgress = (completedRooms.length / rooms.length) * 100;

  if (currentRoom === 'energy') {
    return (
      <EnergyRoom 
        onComplete={(points, timeBonus) => handleRoomComplete('energy', points, timeBonus)}
        onExit={() => setCurrentRoom(null)}
        difficulty={playerData.difficulty}
        onExitGame={onExitGame}
      />
    );
  }

  if (currentRoom === 'waste') {
    return (
      <WasteRoom 
        onComplete={(points, timeBonus) => handleRoomComplete('waste', points, timeBonus)}
        onExit={() => setCurrentRoom(null)}
        difficulty={playerData.difficulty}
        onExitGame={onExitGame}
      />
    );
  }
  if (currentRoom === 'shelter') {
    return (
      <ShelterRoom 
        onComplete={(points, timeBonus) => handleRoomComplete('shelter', points, timeBonus)}
        onExit={() => setCurrentRoom(null)}
        difficulty={playerData.difficulty}
        onExitGame={onExitGame}
      />
    );
  }

  if (currentRoom === 'policy') {
    return (
      <PolicyRoom 
        onComplete={(points, timeBonus) => handleRoomComplete('policy', points, timeBonus)}
        onExit={() => setCurrentRoom(null)}
        difficulty={playerData.difficulty}
        onExitGame={onExitGame}
      />
    );
  }

  if (currentRoom === 'water') {
    return (
      <WaterRoom 
        onComplete={(points, timeBonus) => handleRoomComplete('water', points, timeBonus)}
        onExit={() => setCurrentRoom(null)}
        difficulty={playerData.difficulty}
        onExitGame={onExitGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-atmospheric">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="font-gaming text-xl font-bold retro-shadow">🌍 ECO ESCAPE QUEST</h1>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                  <AvatarImage src={playerData.avatarUrl} alt={playerData.name} />
                  <AvatarFallback>
                    {playerData.name?.slice(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Agent: {playerData.name}
                </Badge>
              </div>
              <Badge variant="outline" className="capitalize">
                {playerData.difficulty}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-energy" />
                <span className="eco-points font-gaming">{ecoPoints} Eco Points</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">Lifetime: {lifetime}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="timer-display text-base">
                  {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {onExitGame && (
                <Button variant="outline" onClick={onExitGame}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Game
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-gaming text-2xl font-bold retro-shadow">MISSION PROGRESS</h2>
            <Badge className={`${totalProgress === 100 ? 'bg-gradient-solution' : 'bg-gradient-crisis'}`}>
              {completedRooms.length}/{rooms.length} Rooms Complete
            </Badge>
          </div>
          <Progress value={totalProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Complete all rooms to save humanity from climate disaster
          </p>
        </div>

        {/* Storyline Reminder */}
        <Card className="climate-card mb-8 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-2 h-16 bg-gradient-crisis rounded-full pulse-crisis" />
            <div>
              <h3 className="font-gaming text-lg font-bold mb-2">Current Situation</h3>
              <p className="text-muted-foreground">
                Year 2035: The climate crisis has reached a breaking point. 
                {completedRooms.length === 0 && " The city's power grid has failed, leaving millions in darkness."}
                {completedRooms.length === 1 && " Power is restored, but waste systems are overwhelmed."}
                {completedRooms.length === 2 && " Waste crisis solved, but water supplies are contaminated."}
                {completedRooms.length === 3 && " Clean water secured, but climate refugees need shelter."}
                {completedRooms.length === 4 && " Shelters built, but global policies must change to prevent future disasters."}
                {completedRooms.length === 5 && " Congratulations! You've successfully navigated all climate challenges!"}
              </p>
            </div>
          </div>
        </Card>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, index) => {
          const Icon = room.icon;
          const isCompleted = completedRooms.includes(room.id);
          const isLocked = room.status === 'locked';
          const isAvailable = room.status === 'available';

          return (
              <Card 
                key={room.id}
                className={`climate-card relative overflow-hidden transition-all ${
                  isCompleted ? 'room-completed' : 
                  isAvailable ? 'room-active' : 
                  'room-locked'
                }`}
              >
                {/* Room Image */}
                {room.image && (
                  <div className="aspect-video relative">
                    <img 
                      src={room.image} 
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-primary" />
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                      {isLocked && (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Room {index + 1}
                    </Badge>
                  </div>

                  <h3 className="font-gaming text-lg font-bold mb-2">{room.name.toUpperCase()}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {room.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Difficulty: {room.difficulty}</span>
                    <span>~{room.estimatedTime}</span>
                    <span>{room.points} points</span>
                  </div>

                  {isCompleted ? (
                    <Badge className="w-full bg-gradient-solution justify-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completed
                    </Badge>
                  ) : isAvailable ? (
                    <Button 
                      onClick={() => setCurrentRoom(room.id)}
                      variant="solution"
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Enter Room
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      <Lock className="w-4 h-4 mr-2" />
                      Locked
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Scoreboard */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-4">Top Agents</h3>
          {listTopAgents(6).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {listTopAgents(6).map((entry, idx) => (
                <div key={entry.agent} className="flex items-center justify-between bg-card/50 border rounded p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{entry.agent.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">#{idx + 1} {entry.agent}</span>
                  </div>
                  <span className="font-gaming">{entry.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No agents have played yet. Be the first to set a record!</p>
            </div>
          )}
        </Card>

        {/* Next Steps */}
        {completedRooms.length > 0 && completedRooms.length < 5 && (
          <Card className="climate-card mt-8 p-6">
            <h3 className="font-gaming text-lg font-bold mb-2">What's Next?</h3>
            <p className="text-muted-foreground">
              Great progress, Agent {playerData.name}! You've completed {completedRooms.length} out of 5 critical missions. 
              The next challenge awaits - every room you complete brings humanity closer to survival.
            </p>
          </Card>
        )}

        {/* Victory Cinematic */}
        {completedRooms.length === 5 && (
          <Card className="solution-card mt-8 p-8 text-center">
            <div className="text-6xl mb-4">🌍✨</div>
            <h3 className="font-gaming text-3xl font-bold text-white mb-4">🎉 ESCAPE SUCCESSFUL! 🎉</h3>
            <p className="text-xl text-white/90 mb-6">
              Congratulations, Agent {playerData.name}! You've successfully navigated all climate challenges 
              and helped save humanity from the 2035 crisis.
            </p>
            <div className="text-white/80 mb-6">
              <p className="text-lg">🌱 The planet is healing... 🌊 Seas are receding... 🌳 Forests are regrowing... ☀️ Skies are clearing...</p>
            </div>
            <div className="flex justify-center space-x-8 text-sm">
              <div>
                <div className="font-gaming text-3xl font-bold text-white">{ecoPoints}</div>
                <div className="text-white/80">Total Eco Points</div>
              </div>
              <div>
                <div className="font-gaming text-3xl font-bold text-white">{Math.floor(gameTime / 60)}m</div>
                <div className="text-white/80">Total Time</div>
              </div>
              <div>
                <div className="font-gaming text-3xl font-bold text-white">100%</div>
                <div className="text-white/80">Planet Saved</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};