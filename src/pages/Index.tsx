import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, Clock, Target } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { GameDashboard } from '@/components/GameDashboard';
import heroImage from '@/assets/climate-crisis-hero.jpg';
import { Link } from 'react-router-dom';

const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerData, setPlayerData] = useState<{ name: string; difficulty: string; avatarUrl?: string } | null>(null);

  const handleLogin = (data: { name: string; difficulty: string; avatarUrl?: string }) => {
    setPlayerData(data);
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleExitGame = () => {
    // Reset session back to landing screen; eco points are stored in dashboard state so this zeroes them
    setIsLoggedIn(false);
    setPlayerData(null);
    setShowLogin(false);
  };

  if (isLoggedIn && playerData) {
    return <GameDashboard playerData={playerData} onExitGame={handleExitGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-atmospheric">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Climate Crisis 2035" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background/90" />
        </div>

        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="font-gaming text-2xl font-bold text-primary retro-shadow">
              🌍 ECO ESCAPE QUEST
            </h1>
            <Button 
              onClick={() => setShowLogin(true)}
              variant="solution"
            >
              Enter the Challenge
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 fade-in-up">
              <Badge className="bg-crisis text-crisis-foreground px-4 py-2 text-sm font-gaming pulse-crisis">
                URGENT: YEAR 2035
              </Badge>
              
              <h2 className="font-gaming text-3xl md:text-4xl font-bold leading-tight retro-shadow">
                THE PLANET IS <span className="text-crisis">DYING</span>
                <br />
                CAN YOU <span className="text-primary">ESCAPE</span>?
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The city is drowning, forests are burning, and the air is toxic. 
                Navigate through five critical climate crisis scenarios and 
                <strong className="text-primary"> save humanity before time runs out.</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="climate-card p-6 glow-effect">
                <Zap className="w-8 h-8 text-energy mb-4 mx-auto" />
                <h3 className="font-gaming text-lg font-bold mb-2">INTERACTIVE PUZZLES</h3>
                <p className="text-sm text-muted-foreground">
                  Solve climate challenges through engaging mini-games and real-world connections
                </p>
              </Card>

              <Card className="climate-card p-6 glow-effect">
                <Users className="w-8 h-8 text-water mb-4 mx-auto" />
                <h3 className="font-gaming text-lg font-bold mb-2">TEAM OR SOLO</h3>
                <p className="text-sm text-muted-foreground">
                  Play individually or collaborate with your team to overcome crisis scenarios
                </p>
              </Card>

              <Card className="climate-card p-6 glow-effect">
                <Target className="w-8 h-8 text-primary mb-4 mx-auto" />
                <h3 className="font-gaming text-lg font-bold mb-2">REAL IMPACT</h3>
                <p className="text-sm text-muted-foreground">
                  Connect virtual solutions to actual environmental actions you can take
                </p>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                size="lg" 
                onClick={() => setShowLogin(true)}
                variant="solution"
                className="font-gaming button-text"
              >
                <Clock className="w-5 h-5 mr-2" />
                START YOUR ESCAPE
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Estimated time: 45-90 minutes
              </p>
              <Link to="/multiplayer">
                <Button size="lg" variant="outline" className="font-gaming button-text">MULTIPLAYER</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mission Brief */}
        <div className="relative z-10 bg-card/80 backdrop-blur-sm border-t border-border p-8">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-gaming text-2xl font-bold text-center mb-6">Mission Brief</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-gaming text-lg font-semibold mb-3 text-crisis">The Crisis</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Energy grid collapsed - cities in darkness</li>
                  <li>• Waste overflow choking ecosystems</li>
                  <li>• Water sources contaminated</li>
                  <li>• Climate refugees seeking shelter</li>
                  <li>• Global policies failing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-gaming text-lg font-semibold mb-3 text-primary">Your Mission</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Restore renewable energy systems</li>
                  <li>• Implement waste management solutions</li>
                  <li>• Purify water supplies</li>
                  <li>• Design sustainable shelters</li>
                  <li>• Negotiate climate policies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default Index;