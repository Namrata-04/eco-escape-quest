import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameOverlay } from '@/components/ui/overlay';
import { 
  Zap, 
  Sun, 
  Wind, 
  Factory, 
  Home,
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnergyRoomProps {
  onComplete: (points: number, timeBonus: number) => void;
  onExit: () => void;
  difficulty: string;
  onExitGame?: () => void;
}

interface EnergySource {
  id: string;
  name: string;
  type: 'renewable' | 'fossil';
  icon: React.ComponentType<any>;
  power: number;
  cost: number;
  emissions: number;
}

interface GridConnection {
  id: string;
  from: string;
  to: string;
  active: boolean;
}

export const EnergyRoom = ({ onComplete, onExit, difficulty, onExitGame }: EnergyRoomProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes for all difficulties
  const [gridPower, setGridPower] = useState(0);
  const [emissions, setEmissions] = useState(0);
  const [powerDemand] = useState(100);
  const [connections, setConnections] = useState<GridConnection[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [renewablePercentage, setRenewablePercentage] = useState(0);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [showRealWorldChallenge, setShowRealWorldChallenge] = useState(false);
  const [showSparks, setShowSparks] = useState(false);
  const [overlay, setOverlay] = useState<{ type: 'success' | 'fail'; title: string; description?: string; emoji?: string } | null>(null);
  const energyUploadRef = useRef<HTMLInputElement | null>(null);
  const [energyUploadPreview, setEnergyUploadPreview] = useState<string | null>(null);

  const energySources: EnergySource[] = [
    {
      id: 'solar',
      name: 'Solar Panel',
      type: 'renewable',
      icon: Sun,
      power: 25,
      cost: 30,
      emissions: 0
    },
    {
      id: 'wind',
      name: 'Wind Turbine',
      type: 'renewable',
      icon: Wind,
      power: 35,
      cost: 40,
      emissions: 0
    },
    {
      id: 'coal',
      name: 'Coal Plant',
      type: 'fossil',
      icon: Factory,
      power: 50,
      cost: 20,
      emissions: 80
    }
  ];

  const districts = [
    { id: 'residential', name: 'Residential', demand: 30, icon: Home },
    { id: 'commercial', name: 'Commercial', demand: 40, icon: Factory },
    { id: 'industrial', name: 'Industrial', demand: 30, icon: Zap }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - add failure consequences
          setOverlay({ type: 'fail', title: "Time's Up!", description: 'The city remains in darkness. Climate crisis worsens.', emoji: '⏰' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const addConnection = (sourceId: string, districtId: string) => {
    const source = energySources.find(s => s.id === sourceId);
    if (!source) return;

    const newConnection: GridConnection = {
      id: `${sourceId}-${districtId}`,
      from: sourceId,
      to: districtId,
      active: true
    };

    setConnections(prev => {
      const filtered = prev.filter(c => c.to !== districtId); // Remove existing connection to district
      return [...filtered, newConnection];
    });

    // Recalculate grid stats
    updateGridStats([...connections.filter(c => c.to !== districtId), newConnection]);
  };

  const updateGridStats = (currentConnections: GridConnection[]) => {
    let totalPower = 0;
    let totalEmissions = 0;
    let renewablePower = 0;

    currentConnections.forEach(conn => {
      const source = energySources.find(s => s.id === conn.from);
      if (source && conn.active) {
        totalPower += source.power;
        totalEmissions += source.emissions;
        if (source.type === 'renewable') {
          renewablePower += source.power;
        }
      }
    });

    setGridPower(totalPower);
    setEmissions(totalEmissions);
    
    const renewablePercent = totalPower > 0 ? (renewablePower / totalPower) * 100 : 0;
    setRenewablePercentage(renewablePercent);

    // Calculate points: +15 for renewable connections, -10 for coal
    let points = 0;
    currentConnections.forEach(conn => {
      const source = energySources.find(s => s.id === conn.from);
      if (source && conn.active) {
        if (source.type === 'renewable') {
          points += 15;
        } else {
          points -= 10;
        }
      }
    });
    setEcoPoints(Math.max(0, points));

    // Check win condition: power >= demand AND >70% renewables
    if (totalPower >= powerDemand && renewablePercent >= 70 && !puzzleCompleted) {
      setPuzzleCompleted(true);
      const timeBonus = Math.floor(timeLeft / 10);
      const finalPoints = points + timeBonus;
      
      // Check for Green Engineer badge (100% renewable)
      const badge = renewablePercent >= 100 ? "Green Engineer" : "";
      
      setOverlay({ type: 'success', title: 'Power Restored!', description: `${renewablePercent.toFixed(1)}% renewable energy! +${finalPoints} Eco Points ${badge ? `🏆 ${badge} Badge!` : ''}`, emoji: '⚡' });
      
      setShowRealWorldChallenge(true);
      
      setTimeout(() => {
        onComplete(finalPoints, badge ? 50 : 0); // Bonus for badge
      }, 3000);
    } else if (currentConnections.length > 0 && (totalPower < powerDemand || renewablePercent < 70)) {
      // Show sparks for wrong connections
      setShowSparks(true);
      setTimeout(() => setShowSparks(false), 1000);
      
      if (renewablePercent < 70) {
        setOverlay({ type: 'fail', title: 'Grid Unstable!', description: `Need ${(70 - renewablePercent).toFixed(1)}% more renewable energy!`, emoji: '🚨' });
        setTimeout(() => setOverlay(null), 1200);
      }
    }
  };

  const removeConnection = (connectionId: string) => {
    const newConnections = connections.filter(c => c.id !== connectionId);
    setConnections(newConnections);
    updateGridStats(newConnections);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const powerProgress = Math.min((gridPower / powerDemand) * 100, 100);
  const emissionStatus = emissions <= 40 ? 'safe' : emissions <= 80 ? 'warning' : 'danger';

  return (
    <div className="min-h-screen bg-gradient-atmospheric-anim">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Room
              </Button>
              <h1 className="font-gaming text-xl font-bold text-energy retro-shadow">⚡ ENERGY BLACKOUT CRISIS</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-crisis" />
                <span className={`timer-display text-lg ${timeLeft < 60 ? 'text-danger pulse-crisis' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Badge className="bg-energy/10 text-energy border-energy/20">
                Room 1 of 5
              </Badge>
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

      <div className="ambient-layer" aria-hidden>
        {[...Array(30)].map((_, i) => (
          <span key={i} className="ambient-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 40}vh`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: 0.4 + Math.random() * 0.6
          }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 animate-in-up">
        {/* Mission Brief */}
        <Card className="climate-card mb-8 p-6">
          <div className="flex items-start space-x-4">
            <Zap className="w-8 h-8 text-energy mt-1" />
            <div>
              <h2 className="font-gaming text-xl font-bold mb-2 retro-shadow">MISSION: RESTORE POWER GRID</h2>
              <p className="text-muted-foreground mb-4">
                The city's power grid has collapsed, leaving millions in darkness. You must connect energy sources 
                to districts while prioritizing renewable energy to minimize emissions.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Target: {powerDemand}MW power</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-energy" />
                  <span>Max emissions: 40 units</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Energy Sources */}
          <div>
            <h3 className="font-gaming text-lg font-bold mb-4">Available Energy Sources</h3>
            <div className="space-y-4">
              {energySources.map(source => {
                const Icon = source.icon;
                return (
                  <Card 
                    key={source.id}
                    className={`p-4 cursor-pointer transition-all puzzle-piece ${
                      selectedSource === source.id ? 'ring-2 ring-primary bg-primary/10' : 
                      source.type === 'renewable' ? 'border-primary/30' : 'border-crisis/30'
                    }`}
                    onClick={() => setSelectedSource(source.id)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className={`w-5 h-5 ${source.type === 'renewable' ? 'text-primary' : 'text-crisis'}`} />
                      <h4 className="font-gaming font-semibold">{source.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={source.type === 'renewable' ? 'border-primary/50 text-primary' : 'border-crisis/50 text-crisis'}
                      >
                        {source.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Power</div>
                        <div className="font-semibold">{source.power}MW</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cost</div>
                        <div className="font-semibold">${source.cost}M</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Emissions</div>
                        <div className={`font-semibold ${source.emissions === 0 ? 'text-primary' : 'text-crisis'}`}>
                          {source.emissions}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Districts */}
          <div>
            <h3 className="font-gaming text-lg font-bold mb-4">City Districts</h3>
            <div className="space-y-4">
              {districts.map(district => {
                const Icon = district.icon;
                const connection = connections.find(c => c.to === district.id);
                const connectedSource = connection ? energySources.find(s => s.id === connection.from) : null;

                return (
                  <Card 
                    key={district.id}
                    className={`p-4 transition-all ${
                      connection ? 'border-primary/50 bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-water" />
                        <h4 className="font-gaming font-semibold">{district.name}</h4>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {district.demand}MW needed
                      </div>
                    </div>

                    {connection && connectedSource ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span className="text-sm">Connected to {connectedSource.name}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeConnection(connection.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        disabled={!selectedSource}
                        onClick={() => selectedSource && addConnection(selectedSource, district.id)}
                        className="w-full"
                      >
                        {selectedSource ? 'Connect Source' : 'Select Source First'}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Grid Status */}
          <div>
            <h3 className="font-gaming text-lg font-bold mb-4">Grid Status</h3>
            <div className="space-y-4">
              {/* Power Output */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-gaming text-sm">Power Output</span>
                  <span className="font-bold">{gridPower}/{powerDemand}MW</span>
                </div>
                <Progress value={powerProgress} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {gridPower >= powerDemand ? 'Power demand met!' : `Need ${powerDemand - gridPower}MW more`}
                </p>
              </Card>

              {/* Emissions */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-gaming text-sm">Emissions</span>
                  <span className={`font-bold ${
                    emissionStatus === 'safe' ? 'text-primary' : 
                    emissionStatus === 'warning' ? 'text-energy' : 'text-danger'
                  }`}>
                    {emissions}/40 units
                  </span>
                </div>
                <Progress 
                  value={Math.min((emissions / 120) * 100, 100)} 
                  className={`mb-2 ${emissionStatus === 'danger' ? 'bg-danger/20' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  {emissionStatus === 'safe' ? 'Clean energy! 🌱' : 
                   emissionStatus === 'warning' ? 'Acceptable levels ⚠️' : 'Too much pollution! 💀'}
                </p>
              </Card>

              {/* Active Connections */}
              <Card className="p-4">
                <h4 className="font-gaming text-sm font-bold mb-3">Active Connections</h4>
                {connections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No connections established</p>
                ) : (
                  <div className="space-y-2">
                    {connections.map(conn => {
                      const source = energySources.find(s => s.id === conn.from);
                      const district = districts.find(d => d.id === conn.to);
                      return (
                        <div key={conn.id} className="flex items-center justify-between text-xs">
                          <span>{source?.name} → {district?.name}</span>
                          <span className="text-primary">{source?.power}MW</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Success State */}
              {puzzleCompleted && (
                <Card className="solution-card p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
                  <h4 className="font-gaming font-bold text-white mb-1">Grid Restored!</h4>
                  <p className="text-xs text-white/80">
                    Clean energy is powering the city. Moving to next challenge...
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Real World Connection */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-3">Real World Connection</h3>
          <p className="text-muted-foreground mb-4">
            This simulation reflects real challenges in transitioning to renewable energy. 
            Solar and wind power are becoming cheaper, but require smart grid management.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Did You Know?</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Solar energy is now the cheapest electricity source</li>
                <li>• Wind turbines can power 1,500 homes each</li>
                <li>• Smart grids reduce energy waste by 30%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Take Action:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Switch to renewable energy providers</li>
                <li>• Install solar panels if possible</li>
                <li>• Reduce energy consumption at home</li>
              </ul>
              <input
                ref={energyUploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e)=>{
                  const file = e.target.files?.[0];
                  if(!file) return;
                  
                  // Basic file validation
                  if(!file.type.startsWith('image/')){
                    toast({ title: 'Wrong Image Uploaded', description: 'Please upload a valid image file (JPG, PNG, etc.)', variant: 'destructive' });
                    return;
                  }
                  
                  if(file.size < 50*1024){
                    toast({ title: 'Wrong Image Uploaded', description: 'Image too small. Please upload a clear photo (>50KB).', variant: 'destructive' });
                    return;
                  }
                  
                  if(file.size > 10*1024*1024){
                    toast({ title: 'Wrong Image Uploaded', description: 'Image too large. Please upload a smaller file (<10MB).', variant: 'destructive' });
                    return;
                  }
                  
                  // Load and analyze image
                  const url = URL.createObjectURL(file);
                  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const i = new Image();
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = url;
                  });
                  
                  if(img.width < 300 || img.height < 300){
                    toast({ title: 'Wrong Image Uploaded', description: 'Image resolution too low. Use a clearer photo (min 300x300px).', variant: 'destructive' });
                    return;
                  }
                  
                  // Check for energy-related content (basic color analysis)
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    toast({ title: 'Wrong Image Uploaded', description: 'Could not analyze image. Please try again.', variant: 'destructive' });
                    return;
                  }
                  
                  const SAMPLE_W = 160;
                  const SAMPLE_H = Math.floor((img.height / img.width) * SAMPLE_W);
                  canvas.width = SAMPLE_W;
                  canvas.height = SAMPLE_H;
                  ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
                  const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
                  
                  // Look for blue (solar panels), white (wind turbines), or green (renewable energy)
                  let bluePixels = 0, whitePixels = 0, greenPixels = 0;
                  for (let p = 0; p < data.length; p += 4 * 20) {
                    const r = data[p], g = data[p+1], b = data[p+2];
                    const sum = r + g + b + 1;
                    const rn = r / sum, gn = g / sum, bn = b / sum;
                    
                    if (bn > 0.4 && bn > rn + 0.1 && bn > gn + 0.1) bluePixels++;
                    else if (rn > 0.8 && gn > 0.8 && bn > 0.8) whitePixels++;
                    else if (gn > 0.4 && gn > rn + 0.1 && gn > bn + 0.1) greenPixels++;
                  }
                  
                  const energyIndicators = bluePixels + whitePixels + greenPixels;
                  if (energyIndicators < 20) {
                    toast({ title: 'Wrong Image Uploaded', description: 'Image does not appear to show renewable energy sources. Please upload a photo of solar panels, wind turbines, or clean energy infrastructure.', variant: 'destructive' });
                    return;
                  }
                  
                  setEnergyUploadPreview(url);
                  setEcoPoints(prev=> prev + 50);
                  toast({ title: 'Photo Verified!', description: 'Renewable energy photo confirmed! +50 Eco Points awarded', variant: 'success' });
                }}
              />
              <Button size="sm" variant="solution" className="w-full mt-3" onClick={()=>energyUploadRef.current?.click()}>
                Upload Photo for +50 Eco Points
              </Button>
              {energyUploadPreview && (
                <img src={energyUploadPreview} alt="upload" className="mt-3 max-h-40 rounded border" />
              )}
            </div>
          </div>
        </Card>
      </div>

      <GameOverlay
        show={!!overlay}
        variant={overlay?.type === 'success' ? 'success' : 'fail'}
        title={overlay?.title || ''}
        description={overlay?.description}
        emoji={overlay?.emoji}
        primary={overlay?.type === 'fail' ? { label: 'Continue', onClick: () => setOverlay(null) } : undefined}
        secondary={overlay?.type === 'success' ? { label: 'Next', onClick: () => setOverlay(null) } : undefined}
      />
    </div>
  );
};