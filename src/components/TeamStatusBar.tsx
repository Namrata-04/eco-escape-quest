import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame, Users } from 'lucide-react';

interface Props {
  teamName: string;
  ecoPoints: number;
  timeLeftSec: number;
  risk: number; // 0-100
}

export const TeamStatusBar: React.FC<Props> = ({ teamName, ecoPoints, timeLeftSec, risk }) => {
  const minutes = Math.max(0, Math.floor(timeLeftSec / 60));
  const seconds = Math.max(0, timeLeftSec % 60).toString().padStart(2, '0');
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-gaming">{teamName}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono">{minutes}:{seconds}</span>
          </div>
          <Badge className="bg-gradient-solution">{ecoPoints} Eco Points</Badge>
          <div className="flex items-center gap-3 w-52">
            <Flame className="w-4 h-4 text-danger" />
            <Progress value={risk} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatusBar;







