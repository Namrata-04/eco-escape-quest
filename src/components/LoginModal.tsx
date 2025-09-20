import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Zap, Target, Brain } from 'lucide-react';
import { getAgentScore } from '@/lib/utils';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (data: { name: string; difficulty: string; avatarUrl?: string }) => void;
}

export const LoginModal = ({ open, onOpenChange, onLogin }: LoginModalProps) => {
  const [step, setStep] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [teamMode, setTeamMode] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const difficulties = [
    {
      id: 'beginner',
      name: 'Beginner',
      icon: User,
      description: 'New to environmental challenges',
      features: ['Guided tutorials', 'Extra hints', 'More time per room'],
      color: 'text-primary'
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      icon: Target,
      description: 'Some climate knowledge',
      features: ['Balanced gameplay', 'Moderate challenges', 'Standard time limits'],
      color: 'text-water'
    },
    {
      id: 'expert',
      name: 'Expert',
      icon: Brain,
      description: 'Climate action veteran',
      features: ['Advanced puzzles', 'Minimal hints', 'Tight time constraints'],
      color: 'text-crisis'
    }
  ];

  const handleStart = () => {
    if (playerName && difficulty) {
      onLogin({ name: playerName, difficulty, avatarUrl: avatarUrl || undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-center">
            {step === 1 ? 'Join the Mission' : 'Select Difficulty'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="playerName" className="font-gaming">Agent Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your agent name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="mt-2"
                />
                {playerName && getAgentScore(playerName) && (
                  <p className="text-xs text-primary mt-2">
                    Welcome back, Agent! Previous lifetime points: {getAgentScore(playerName)?.points}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="avatarUrl" className="font-gaming">Avatar URL (optional)</Label>
                <Input
                  id="avatarUrl"
                  placeholder="Paste an image URL for your avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="font-gaming mb-4 block">Mission Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`p-4 cursor-pointer transition-all ${!teamMode ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setTeamMode(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="font-gaming font-semibold">Solo Agent</h3>
                        <p className="text-sm text-muted-foreground">Face the crisis alone</p>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    className={`p-4 cursor-pointer transition-all ${teamMode ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setTeamMode(true)}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-water" />
                      <div>
                        <h3 className="font-gaming font-semibold">Team Mission</h3>
                        <p className="text-sm text-muted-foreground">Collaborate with others</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!playerName}
              variant="solution"
            >
              <Zap className="w-4 h-4 mr-2" />
              Continue to Difficulty
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 p-6">
            <div className="grid gap-4">
              {difficulties.map((diff) => {
                const Icon = diff.icon;
                return (
                  <Card
                    key={diff.id}
                    className={`p-4 cursor-pointer transition-all ${
                      difficulty === diff.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setDifficulty(diff.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className={`w-6 h-6 ${diff.color} mt-1`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-gaming font-semibold">{diff.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {diff.description}
                          </Badge>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {diff.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleStart}
                disabled={!difficulty}
                variant="solution"
                className="flex-1"
              >
                Start Mission
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};