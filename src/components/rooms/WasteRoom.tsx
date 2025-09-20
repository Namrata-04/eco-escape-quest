import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameOverlay } from '@/components/ui/overlay';
import { 
  Trash2, 
  Recycle,
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  X,
  Shirt,
  Smartphone,
  LogOut
} from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WasteRoomProps {
  onComplete: (points: number, timeBonus: number) => void;
  onExit: () => void;
  difficulty: string;
  onExitGame?: () => void;
}

interface WasteItem {
  id: string;
  name: string;
  type: 'biodegradable' | 'recyclable' | 'ewaste' | 'hazardous';
  icon: string;
  points: number;
}

interface Bin {
  id: string;
  name: string;
  type: 'biodegradable' | 'recyclable' | 'ewaste' | 'hazardous';
  color: string;
  items: WasteItem[];
}

export const WasteRoom = ({ onComplete, onExit, difficulty, onExitGame }: WasteRoomProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [sortedCorrectly, setSortedCorrectly] = useState(0);
  const [totalItems] = useState(20);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [showFastFashion, setShowFastFashion] = useState(false);
  const [fastFashionChoice, setFastFashionChoice] = useState<string | null>(null);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [lastAction, setLastAction] = useState<{ binId: string; isCorrect: boolean; ts: number } | null>(null);
  const [overlay, setOverlay] = useState<{ type: 'success' | 'fail'; title: string; description?: string; emoji?: string } | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'pending' | 'passed' | 'failed' | null>(null);

  const validateWasteSegregationPhoto = async (file: File): Promise<{ ok: boolean; reason?: string; previewUrl?: string }> => {
    if (!file.type.startsWith('image/')) return { ok: false, reason: 'Please upload an image file.' };
    if (file.size < 50 * 1024) return { ok: false, reason: 'Image too small. Please upload a clear photo (>50KB).' };
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    if (img.width < 300 || img.height < 300) return { ok: false, reason: 'Image resolution too low. Use a clearer photo.' };

    // Analyze colors to detect presence of multiple bin-like colors (green, blue, red, yellow)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, reason: 'Could not analyze image.' };
    const SAMPLE_W = 160; const SAMPLE_H = Math.floor((img.height / img.width) * SAMPLE_W);
    canvas.width = SAMPLE_W; canvas.height = SAMPLE_H;
    ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
    const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    let green = 0, blue = 0, red = 0, yellow = 0;
    for (let p = 0; p < data.length; p += 4 * 20) { // subsample
      const r = data[p], g = data[p+1], b = data[p+2];
      const sum = r + g + b + 1;
      const rn = r / sum, gn = g / sum, bn = b / sum;
      if (gn > 0.45 && gn > rn + 0.1 && gn > bn + 0.1) green++;
      else if (bn > 0.45 && bn > rn + 0.1 && bn > gn + 0.1) blue++;
      else if (rn > 0.45 && rn > gn + 0.1 && rn > bn + 0.1) red++;
      else if (rn > 0.35 && gn > 0.35 && bn < 0.2) yellow++;
    }
    const binsDetected = [green>40, blue>40, red>30, yellow>30].filter(Boolean).length;
    if (binsDetected >= 2) return { ok: true, previewUrl: url };
    return { ok: false, reason: 'Could not detect multiple waste bins. Ensure the photo clearly shows separate bins.' };
  };

  const initialWasteItems: WasteItem[] = [
    { id: '1', name: 'Apple Core', type: 'biodegradable', icon: '🍎', points: 5 },
    { id: '2', name: 'Plastic Bottle', type: 'recyclable', icon: '🍶', points: 5 },
    { id: '3', name: 'Old Phone', type: 'ewaste', icon: '📱', points: 10 },
    { id: '4', name: 'Battery', type: 'hazardous', icon: '🔋', points: 15 },
    { id: '5', name: 'Banana Peel', type: 'biodegradable', icon: '🍌', points: 5 },
    { id: '6', name: 'Glass Jar', type: 'recyclable', icon: '🫙', points: 5 },
    { id: '7', name: 'Laptop', type: 'ewaste', icon: '💻', points: 10 },
    { id: '8', name: 'Paint Can', type: 'hazardous', icon: '🎨', points: 15 },
    { id: '9', name: 'Newspaper', type: 'recyclable', icon: '📰', points: 5 },
    { id: '10', name: 'Food Scraps', type: 'biodegradable', icon: '🥗', points: 5 },
    { id: '11', name: 'Aluminum Can', type: 'recyclable', icon: '🥤', points: 5 },
    { id: '12', name: 'Tablet', type: 'ewaste', icon: '📱', points: 10 },
    { id: '13', name: 'Leaves', type: 'biodegradable', icon: '🍃', points: 5 },
    { id: '14', name: 'Cardboard Box', type: 'recyclable', icon: '📦', points: 5 },
    { id: '15', name: 'Light Bulb', type: 'hazardous', icon: '💡', points: 15 },
    { id: '16', name: 'Orange Peel', type: 'biodegradable', icon: '🍊', points: 5 },
    { id: '17', name: 'Plastic Bag', type: 'recyclable', icon: '👜', points: 5 },
    { id: '18', name: 'Old Charger', type: 'ewaste', icon: '🔌', points: 10 },
    { id: '19', name: 'Cleaning Product', type: 'hazardous', icon: '🧽', points: 15 },
    { id: '20', name: 'Paper', type: 'recyclable', icon: '📄', points: 5 },
  ];

  const initialBins: Bin[] = [
    { id: 'biodegradable', name: 'Compost', type: 'biodegradable', color: 'bg-green-600', items: [] },
    { id: 'recyclable', name: 'Recycle', type: 'recyclable', color: 'bg-blue-600', items: [] },
    { id: 'ewaste', name: 'E-Waste', type: 'ewaste', color: 'bg-purple-600', items: [] },
    { id: 'hazardous', name: 'Hazardous', type: 'hazardous', color: 'bg-red-600', items: [] },
  ];

  useEffect(() => {
    setWasteItems(initialWasteItems);
    setBins(initialBins);

    // Show fast fashion curveball after 3 minutes
    const fastFashionTimer = setTimeout(() => {
      if (!puzzleCompleted) {
        setShowFastFashion(true);
      }
    }, 180000); // 3 minutes

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOverlay({ type: 'fail', title: "Time's Up!", description: 'The waste overflow continues. Try the level again.', emoji: '⏰' });
          // Notify and exit back to rooms page
          toast({ title: "Level Failed", description: "You lost. Try this room again to move forward.", variant: 'destructive' });
          setTimeout(() => onExit(), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(fastFashionTimer);
    };
  }, [puzzleCompleted, toast]);

  const resetLevel = () => {
    setWasteItems(initialWasteItems);
    setBins(initialBins);
    setSortedCorrectly(0);
    setEcoPoints(0);
    setTimeLeft(600);
    setDraggedItem(null);
    setPuzzleCompleted(false);
    setOverlay(null);
    setUploadedPreview(null);
    setUploadStatus(null);
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, binType: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const item = wasteItems.find(i => i.id === draggedItem);
    if (!item) return;

    const isCorrect = item.type === binType;
    
    // Remove item from available items
    setWasteItems(prev => prev.filter(i => i.id !== draggedItem));
    
    // Add to bin
    setBins(prev => prev.map(bin => 
      bin.id === binType 
        ? { ...bin, items: [...bin.items, { ...item, _anim: 'pop' as any }] as any }
        : bin
    ));

    if (isCorrect) {
      setSortedCorrectly(prev => prev + 1);
      setEcoPoints(prev => prev + item.points);
      
      toast({
        title: "Correct!",
        description: `+${item.points} Eco Points`,
      });
    } else {
      toast({
        title: "Wrong Bin!",
        description: "Try again - check the waste type",
        variant: "destructive"
      });
      setOverlay({ type: 'fail', title: 'Mis-Sorted!', description: `${item.name} doesn’t belong here. Check the icons and try again.`, emoji: '⚠️' });
      setTimeout(() => setOverlay(null), 1200);
    }

    // Trigger visual feedback on the target bin
    const now = Date.now();
    setLastAction({ binId: binType, isCorrect, ts: now });
    // Auto-clear effect after animation duration
    setTimeout(() => {
      setLastAction(prev => (prev && prev.ts === now ? null : prev));
    }, isCorrect ? 900 : 450);

    setDraggedItem(null);

    // Check win condition: 80% correctly sorted
    const newSortedCorrectly = isCorrect ? sortedCorrectly + 1 : sortedCorrectly;
    const remainingItems = wasteItems.length - 1;
    const totalSorted = totalItems - remainingItems;
    const correctPercentage = totalSorted > 0 ? (newSortedCorrectly / totalSorted) * 100 : 0;

    if (remainingItems === 0) {
      const finalPercentage = (newSortedCorrectly / totalItems) * 100;
      if (finalPercentage >= 80) {
        setPuzzleCompleted(true);
        const timeBonus = Math.floor(timeLeft / 10);
        const bonusPoints = fastFashionChoice === 'sustainable' ? 50 : 0;
        
        toast({
          title: "Waste Crisis Solved!",
          description: `${finalPercentage.toFixed(1)}% correctly sorted! +${ecoPoints + timeBonus + bonusPoints} Eco Points`,
        });
        setOverlay({ type: 'success', title: 'Waste Crisis Solved!', description: `${finalPercentage.toFixed(1)}% correctly sorted`, emoji: '🌟' });
        
        setTimeout(() => {
          onComplete(ecoPoints + timeBonus, bonusPoints);
        }, 2000);
      } else {
        setOverlay({ type: 'fail', title: 'Level Failed', description: `Only ${finalPercentage.toFixed(1)}% correct. Need 80% to escape!`, emoji: '💥' });
        // Inform and exit to rooms grid; room 2 stays available
        toast({ title: 'You Lost', description: 'Try this room again to move forward.', variant: 'destructive' });
        setTimeout(() => onExit(), 1200);
      }
    }
  };

  const handleFastFashionChoice = (choice: string) => {
    setFastFashionChoice(choice);
    setShowFastFashion(false);
    
    if (choice === 'sustainable') {
      toast({
        title: "Wise Choice!",
        description: "Sustainability over fast fashion! +50 bonus points awaiting",
      });
    } else {
      toast({
        title: "Think Again...",
        description: "Fast fashion contributes to 10% of global emissions",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortingProgressRaw = totalItems > 0 ? ((totalItems - wasteItems.length) / totalItems) * 100 : 0;
  const sortingProgress = Math.max(0, Math.min(100, sortingProgressRaw));
  const correctPercentageRaw = (totalItems - wasteItems.length) > 0 ? (sortedCorrectly / (totalItems - wasteItems.length)) * 100 : 0;
  const correctPercentage = Math.max(0, Math.min(100, correctPercentageRaw));

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
              <h1 className="font-gaming text-xl font-bold text-crisis retro-shadow">🗑️ WASTE OVERFLOW CRISIS</h1>
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
              <Badge className="bg-crisis/10 text-crisis border-crisis/20">
                Room 2 of 5
              </Badge>
              <Button variant="outline" onClick={resetLevel}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
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
        {[...Array(24)].map((_, i) => (
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
            <Trash2 className="w-8 h-8 text-crisis mt-1" />
            <div>
              <h2 className="font-gaming text-xl font-bold mb-2 retro-shadow">MISSION: CLEAR THE DIGITAL LANDFILL</h2>
              <p className="text-muted-foreground mb-4">
                The city's waste management system has collapsed. Drag and drop waste items into correct bins 
                to prevent environmental disaster. Sort at least 80% correctly to escape.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Target: 80% correct sorting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Recycle className="w-4 h-4 text-primary" />
                  <span>Items remaining: {wasteItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Waste Items */}
          <div className="lg:col-span-2">
            <h3 className="font-gaming text-lg font-bold mb-4">Waste Items to Sort</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {wasteItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className="puzzle-piece bg-card border border-border rounded-lg p-4 text-center cursor-grab active:cursor-grabbing"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-xs font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.points}pts</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Items Sorted</span>
                    <span>{totalItems - wasteItems.length}/{totalItems}</span>
                  </div>
                  <Progress value={sortingProgress} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Accuracy</span>
                    <span className={correctPercentage >= 80 ? 'text-primary' : 'text-crisis'}>
                      {correctPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={correctPercentage} className={correctPercentage >= 80 ? 'bg-primary/20' : 'bg-crisis/20'} />
                </div>
              </div>
            </Card>
          </div>

          {/* Waste Bins */}
          <div className="lg:col-span-2">
            <h3 className="font-gaming text-lg font-bold mb-4">Sorting Bins</h3>
            <div className="grid grid-cols-2 gap-4">
              {bins.map(bin => (
                <div
                  key={bin.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, bin.id)}
                  className={`${bin.color} relative overflow-hidden min-h-[200px] rounded-lg p-4 text-white transition-all ${
                    draggedItem ? 'ring-2 ring-white/50 scale-105' : ''
                  } ${lastAction && lastAction.binId === bin.id && lastAction.isCorrect ? 'anim-bin-pulse anim-glow' : ''} ${lastAction && lastAction.binId === bin.id && !lastAction.isCorrect ? 'anim-shake' : ''}`}
                >
                  <h4 className="font-gaming font-bold text-center mb-4">{bin.name}</h4>
                  <div className="space-y-2">
                    {bin.items.map(item => (
                      <div key={item.id} className="bg-white/20 rounded p-2 text-sm flex items-center space-x-2 anim-pop-in">
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        <CheckCircle2 className="w-4 h-4 ml-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-sm mt-4 opacity-75">
                    {bin.items.length} items
                  </div>
                  {/* Sparkles on correct drop */}
                  {lastAction && lastAction.binId === bin.id && lastAction.isCorrect && (
                    <>
                      {[...Array(10)].map((_, i) => (
                        <span
                          key={i}
                          className="sparkle text-primary"
                          style={{
                            left: `${50 + (Math.random() * 60 - 30)}%`,
                            top: `${20 + (Math.random() * 60 - 30)}%`,
                            // @ts-ignore custom CSS vars for sparkle animation
                            ['--dx' as any]: `${(Math.random() * 80 - 40)}px`,
                            ['--dy' as any]: `${(-30 - Math.random() * 60)}px`,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fast Fashion Curveball Modal */}
        {showFastFashion && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="max-w-md mx-4 p-6 crisis-card">
              <div className="text-center space-y-4">
                <Shirt className="w-12 h-12 text-white mx-auto" />
                <h3 className="font-gaming text-xl font-bold text-white">Fast Fashion Sale!</h3>
                <p className="text-white/90">
                  A popup ad appears: "MEGA SALE! 90% off fast fashion clothes!" 
                  The fashion industry produces 10% of global carbon emissions. What do you choose?
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleFastFashionChoice('buy')}
                    variant="outline"
                    className="w-full text-black bg-white hover:bg-gray-100"
                  >
                    Buy Fast Fashion (Save Money)
                  </Button>
                  <Button 
                    onClick={() => handleFastFashionChoice('sustainable')}
                    variant="solution"
                    className="w-full"
                  >
                    Choose Sustainable Fashion
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Success State */}
        {puzzleCompleted && (
          <Card className="solution-card mt-8 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="font-gaming text-2xl font-bold text-white mb-2">Waste Crisis Solved!</h3>
            <p className="text-white/90">
              Excellent waste sorting! The landfill crisis is under control. 
              Moving to the next environmental challenge...
            </p>
          </Card>
        )}

        {/* Dramatic overlay */}
        <GameOverlay
          show={!!overlay}
          variant={overlay?.type === 'success' ? 'success' : 'fail'}
          title={overlay?.title || ''}
          description={overlay?.description}
          emoji={overlay?.emoji}
        primary={overlay?.type === 'fail' ? { label: 'Try Again', onClick: resetLevel } : undefined}
          secondary={overlay?.type === 'success' ? { label: 'Next', onClick: () => setOverlay(null) } : undefined}
        />

        {/* Real World Connection */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-3">Real World Impact</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Proper waste sorting reduces landfill methane emissions by 70% and enables recycling that saves energy.
              </p>
              <h4 className="font-semibold mb-2">Did You Know?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Recycling one aluminum can saves enough energy to power a TV for 3 hours</li>
                <li>• E-waste contains valuable metals worth $57 billion annually</li>
                <li>• Composting reduces methane emissions by 50%</li>
              </ul>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-gaming font-semibold mb-2 text-primary">Real World Challenge</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Take a photo of yourself properly segregating waste in your hostel/home. 
                Show separate bins for different waste types.
              </p>
          <input 
            ref={uploadInputRef}
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadStatus('pending');
              const result = await validateWasteSegregationPhoto(file);
              if (result.ok) {
                setUploadedPreview(result.previewUrl || null);
                setEcoPoints(prev => prev + 50);
                setUploadStatus('passed');
                toast({ title: 'Photo Verified!', description: '+50 Eco Points awarded', variant: 'success' });
              } else {
                setUploadedPreview(null);
                setUploadStatus('failed');
                toast({ title: 'Incorrect Photo', description: result.reason || 'Please upload a clear photo showing separate bins.', variant: 'destructive' });
              }
            }}
          />
          <Button 
            size="sm" 
            variant="solution" 
            className="w-full"
            onClick={() => uploadInputRef.current?.click()}
          >
            Upload Photo for +50 Eco Points
          </Button>
          {uploadedPreview && (
            <div className="mt-3 text-center">
              <img src={uploadedPreview} alt="Uploaded preview" className="mx-auto max-h-40 rounded border" />
              <p className="text-xs text-muted-foreground mt-1">Preview saved locally</p>
            </div>
          )}
          {uploadStatus === 'failed' && (
            <p className="text-xs text-danger mt-2">Wrong image uploaded. Please show separate waste bins clearly.</p>
          )}
          {uploadStatus === 'passed' && (
            <p className="text-xs text-primary mt-2">Verified ✅</p>
          )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};