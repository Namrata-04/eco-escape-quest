import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameOverlay } from '@/components/ui/overlay';
import { 
  Droplets, 
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  ArrowDown,
  Beaker,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaterRoomProps {
  onComplete: (points: number, timeBonus: number) => void;
  onExit: () => void;
  difficulty: string;
  onExitGame?: () => void;
}

interface FilterStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  correctOrder: number;
  placed: boolean;
  position: number | null;
}

export const WaterRoom = ({ onComplete, onExit, difficulty, onExitGame }: WaterRoomProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes
  const [filterStages, setFilterStages] = useState<FilterStage[]>([]);
  const [placedStages, setPlacedStages] = useState<(FilterStage | null)[]>([null, null, null, null, null, null]);
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [waterPurity, setWaterPurity] = useState(0);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [showWaterAnimation, setShowWaterAnimation] = useState(false);
  const [overlay, setOverlay] = useState<{ type: 'success' | 'fail'; title: string; description?: string; emoji?: string } | null>(null);
  const waterUploadRef = useRef<HTMLInputElement | null>(null);
  const [waterUploadPreview, setWaterUploadPreview] = useState<string | null>(null);

  const initialFilterStages: FilterStage[] = [
    { id: 'gravel', name: 'Gravel', icon: '🪨', description: 'Removes large debris', correctOrder: 1, placed: false, position: null },
    { id: 'sand', name: 'Sand', icon: '🏖️', description: 'Filters sediment', correctOrder: 2, placed: false, position: null },
    { id: 'charcoal', name: 'Charcoal', icon: '⚫', description: 'Absorbs chemicals', correctOrder: 3, placed: false, position: null },
    { id: 'cotton', name: 'Cotton', icon: '🤍', description: 'Fine filtration', correctOrder: 4, placed: false, position: null },
    { id: 'uv', name: 'UV Light', icon: '💡', description: 'Kills bacteria', correctOrder: 5, placed: false, position: null },
    { id: 'tank', name: 'Water Tank', icon: '🪣', description: 'Clean water storage', correctOrder: 6, placed: false, position: null },
  ];

  useEffect(() => {
    setFilterStages(initialFilterStages);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOverlay({ type: 'fail', title: "Time's Up!", description: 'The water crisis continues. People are dying of thirst.', emoji: '⏰' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const handleDragStart = (stageId: string) => {
    setDraggedStage(stageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (!draggedStage) return;

    const stage = filterStages.find(s => s.id === draggedStage);
    if (!stage || stage.placed) return;

    // Remove any existing stage at this position
    const newPlacedStages = [...placedStages];
    const existingStage = newPlacedStages[position];
    if (existingStage) {
      // Return existing stage to available stages
      setFilterStages(prev => prev.map(s => 
        s.id === existingStage.id ? { ...s, placed: false, position: null } : s
      ));
    }

    // Place new stage
    newPlacedStages[position] = stage;
    setPlacedStages(newPlacedStages);

    // Update stage as placed
    setFilterStages(prev => prev.map(s => 
      s.id === draggedStage ? { ...s, placed: true, position } : s
    ));

    setDraggedStage(null);
    checkFilterSequence(newPlacedStages);
  };

  const checkFilterSequence = (currentPlacement: (FilterStage | null)[]) => {
    let correctSequence = 0;
    let purityLevel = 0;

    // Check sequence accuracy
    for (let i = 0; i < currentPlacement.length; i++) {
      const stage = currentPlacement[i];
      if (stage && stage.correctOrder === i + 1) {
        correctSequence++;
        purityLevel += 16.67; // Each correct stage adds ~16.67% purity
      } else if (stage) {
        // Wrong position - muddy water animation
        setShowWaterAnimation(true);
        setTimeout(() => setShowWaterAnimation(false), 1000);
        
        setOverlay({ type: 'fail', title: 'Wrong Order!', description: `${stage.name} is in the wrong position!`, emoji: '💧' });
        setTimeout(() => setOverlay(null), 1000);
      }
    }

    setWaterPurity(Math.min(purityLevel, 100));
    setEcoPoints(correctSequence * 20);

    // Check win condition: 70% water purified (at least 5 stages correct)
    if (purityLevel >= 70 && !puzzleCompleted) {
      setPuzzleCompleted(true);
      const timeBonus = Math.floor(timeLeft / 10);
      
      setOverlay({ type: 'success', title: 'Water Purified!', description: `${purityLevel.toFixed(1)}% purity achieved! +${ecoPoints + timeBonus} Eco Points`, emoji: '💦' });
      
      setTimeout(() => {
        onComplete(ecoPoints + timeBonus, 0);
      }, 2000);
    }
  };

  const removeStage = (position: number) => {
    const stage = placedStages[position];
    if (!stage) return;

    // Remove from placement
    const newPlacedStages = [...placedStages];
    newPlacedStages[position] = null;
    setPlacedStages(newPlacedStages);

    // Return to available stages
    setFilterStages(prev => prev.map(s => 
      s.id === stage.id ? { ...s, placed: false, position: null } : s
    ));

    checkFilterSequence(newPlacedStages);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWaterColor = () => {
    if (waterPurity >= 80) return 'text-blue-400';
    if (waterPurity >= 50) return 'text-blue-600';
    if (waterPurity >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const availableStages = filterStages.filter(s => !s.placed);

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
              <h1 className="font-gaming text-xl font-bold text-water retro-shadow">💧 WATER CRISIS</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-crisis" />
                <span className={`timer-display text-lg ${timeLeft < 60 ? 'text-danger pulse-crisis' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="eco-points">
                {ecoPoints} Eco Points
              </div>
              <Badge className="bg-water/10 text-water border-water/20">
                Room 3 of 5
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
        {[...Array(26)].map((_, i) => (
          <span key={i} className="ambient-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 40}vh`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: 0.3 + Math.random() * 0.7
          }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 animate-in-up">
        {/* Mission Brief */}
        <Card className="climate-card mb-8 p-6">
          <div className="flex items-start space-x-4">
            <Droplets className="w-8 h-8 text-water mt-1" />
            <div>
              <h2 className="font-gaming text-xl font-bold mb-2 retro-shadow">MISSION: PURIFY WATER SUPPLY</h2>
              <p className="text-muted-foreground mb-4">
                The city's water is contaminated and pipes are running dry. Build a proper filtration system 
                by arranging materials in the correct sequence to achieve at least 70% water purity.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Target: 70% water purity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Beaker className="w-4 h-4 text-water" />
                  <span>Sequence matters!</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Filter Materials */}
          <div>
            <h3 className="font-gaming text-lg font-bold mb-4">Filter Materials</h3>
            <div className="space-y-3">
              {availableStages.map(stage => (
                <Card
                  key={stage.id}
                  draggable
                  onDragStart={() => handleDragStart(stage.id)}
                  className="p-4 cursor-grab active:cursor-grabbing puzzle-piece hover:bg-primary/5 border-primary/20"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                      <h4 className="font-gaming font-semibold">{stage.name}</h4>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Water Purity Status */}
            <Card className="mt-6 p-4">
              <h4 className="font-gaming text-sm font-bold mb-3">Water Purity</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Purity Level</span>
                  <span className={`font-bold ${getWaterColor()}`}>
                    {waterPurity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={waterPurity} 
                  className={waterPurity >= 70 ? 'bg-blue-200' : 'bg-red-200'} 
                />
                <div className="flex items-center space-x-2 text-xs">
                  <Droplets className={`w-4 h-4 ${getWaterColor()}`} />
                  <span className="text-muted-foreground">
                    {waterPurity >= 80 ? 'Crystal clear! 💎' : 
                     waterPurity >= 70 ? 'Clean water ✨' :
                     waterPurity >= 50 ? 'Partially filtered ⚠️' :
                     waterPurity >= 20 ? 'Still murky 😔' : 'Contaminated water ☠️'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Filtration System */}
          <div className="lg:col-span-2">
            <h3 className="font-gaming text-lg font-bold mb-4">Build Your Filtration System</h3>
            
            {/* Water Input */}
            <div className="mb-4 text-center">
              <div className="text-4xl mb-2">🚰</div>
              <p className="text-sm text-muted-foreground">Contaminated Water Input</p>
            </div>

            {/* Filter Stages */}
            <div className="space-y-4">
              {placedStages.map((stage, index) => (
                <div key={index}>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`min-h-[80px] border-2 border-dashed rounded-lg p-4 transition-all ${
                      draggedStage ? 'border-primary bg-primary/5 scale-105' : 'border-muted'
                    } ${stage ? 'bg-card border-solid border-primary/30' : ''}`}
                  >
                    {stage ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{stage.icon}</span>
                          <div>
                            <h4 className="font-gaming font-semibold">{stage.name}</h4>
                            <p className="text-xs text-muted-foreground">{stage.description}</p>
                          </div>
                          {stage.correctOrder === index + 1 && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeStage(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <div className="text-2xl mb-2">⬇️</div>
                        <p className="text-sm">Drop filter stage {index + 1} here</p>
                      </div>
                    )}
                  </div>
                  
                  {index < placedStages.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className={`w-6 h-6 ${showWaterAnimation ? 'text-red-500 animate-pulse' : getWaterColor()}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Water Output */}
            <div className="mt-6 text-center">
              <div className={`text-4xl mb-2 ${showWaterAnimation ? 'animate-pulse' : ''}`}>
                {waterPurity >= 80 ? '💧' : waterPurity >= 50 ? '🌊' : waterPurity >= 20 ? '🟤' : '☠️'}
              </div>
              <p className="text-sm text-muted-foreground">
                {waterPurity >= 70 ? 'Pure Water Output' : 'Contaminated Output'}
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {puzzleCompleted && (
          <Card className="solution-card mt-8 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="font-gaming text-2xl font-bold text-white mb-2">Water Crisis Solved!</h3>
            <p className="text-white/90">
              Excellent filtration system! Clean water is now flowing to the city. 
              Thousands of lives saved. Moving to next challenge...
            </p>
          </Card>
        )}

        {/* Real World Connection */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-3">Real World Impact</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-4">
                2.2 billion people lack access to clean water. Simple filtration can prevent waterborne diseases 
                that kill 485,000 people annually.
              </p>
              <h4 className="font-semibold mb-2">DIY Water Filter Facts:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Gravel removes large particles (99% debris)</li>
                <li>• Sand filters sediment (95% particles)</li>
                <li>• Charcoal absorbs chemicals (80% toxins)</li>
                <li>• Cotton provides fine filtration</li>
                <li>• UV light kills 99.9% of bacteria</li>
              </ul>
            </div>
            <div className="bg-water/10 p-4 rounded-lg border border-water/20">
              <h4 className="font-gaming font-semibold mb-2 text-water">Real World Challenge</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Build a mini water filter using a plastic bottle, sand, charcoal, cotton, and gravel. 
                Test it with muddy water and upload your results!
              </p>
              <input
                ref={waterUploadRef}
                type="file" accept="image/*" className="hidden"
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
                  
                  // Check for water filtration content (basic color analysis)
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
                  
                  // Look for blue (water), brown (sand/gravel), black (charcoal), or white (cotton)
                  let bluePixels = 0, brownPixels = 0, blackPixels = 0, whitePixels = 0;
                  for (let p = 0; p < data.length; p += 4 * 20) {
                    const r = data[p], g = data[p+1], b = data[p+2];
                    const sum = r + g + b + 1;
                    const rn = r / sum, gn = g / sum, bn = b / sum;
                    
                    if (bn > 0.4 && bn > rn + 0.1 && bn > gn + 0.1) bluePixels++;
                    else if (rn > 0.3 && gn > 0.2 && bn < 0.2) brownPixels++;
                    else if (rn < 0.3 && gn < 0.3 && bn < 0.3) blackPixels++;
                    else if (rn > 0.8 && gn > 0.8 && bn > 0.8) whitePixels++;
                  }
                  
                  const filterIndicators = bluePixels + brownPixels + blackPixels + whitePixels;
                  if (filterIndicators < 30) {
                    toast({ title: 'Wrong Image Uploaded', description: 'Image does not appear to show a water filter. Please upload a photo of your DIY water filtration system with materials like sand, gravel, charcoal, or cotton.', variant: 'destructive' });
                    return;
                  }
                  
                  setWaterUploadPreview(url);
                  setEcoPoints(prev=> prev + 50);
                  toast({ title: 'Photo Verified!', description: 'Water filter photo confirmed! +50 Eco Points awarded', variant: 'success' });
                }}
              />
              <Button size="sm" variant="water" className="w-full" onClick={()=>waterUploadRef.current?.click()}>
                Upload DIY Filter Photo
              </Button>
              {waterUploadPreview && (
                <img src={waterUploadPreview} alt="upload" className="mt-3 max-h-40 rounded border" />
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