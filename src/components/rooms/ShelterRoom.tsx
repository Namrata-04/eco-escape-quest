import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameOverlay } from '@/components/ui/overlay';
import { 
  Home, 
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  Hammer,
  TreePine,
  Sun,
  Factory,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShelterRoomProps {
  onComplete: (points: number, timeBonus: number) => void;
  onExit: () => void;
  difficulty: string;
  onExitGame?: () => void;
}

interface Resource {
  id: string;
  name: string;
  icon: string;
  available: number;
  used: number;
  emissions: number;
  sustainability: number;
}

interface Shelter {
  id: string;
  materials: string[];
  emissions: number;
  sustainability: number;
  complete: boolean;
}

export const ShelterRoom = ({ onComplete, onExit, difficulty, onExitGame }: ShelterRoomProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutes
  const [resources, setResources] = useState<Resource[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [ecoScore, setEcoScore] = useState(0);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [overlay, setOverlay] = useState<{ type: 'success' | 'fail'; title: string; description?: string; emoji?: string } | null>(null);
  const shelterUploadRef = useRef<HTMLInputElement | null>(null);
  const [shelterUploadPreview, setShelterUploadPreview] = useState<string | null>(null);

  const initialResources: Resource[] = [
    { id: 'bamboo', name: 'Bamboo', icon: '🎋', available: 20, used: 0, emissions: 2, sustainability: 95 },
    { id: 'recycled-bricks', name: 'Recycled Bricks', icon: '🧱', available: 15, used: 0, emissions: 8, sustainability: 80 },
    { id: 'solar-sheets', name: 'Solar Sheets', icon: '☀️', available: 10, used: 0, emissions: 12, sustainability: 90 },
    { id: 'cement', name: 'Cement', icon: '🏗️', available: 25, used: 0, emissions: 50, sustainability: 20 },
  ];

  useEffect(() => {
    setResources(initialResources);
    setShelters(Array(5).fill(null).map((_, i) => ({
      id: `shelter-${i + 1}`,
      materials: [],
      emissions: 0,
      sustainability: 0,
      complete: false
    })));

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOverlay({ type: 'fail', title: "Time's Up!", description: 'Climate refugees remain without shelter. Crisis continues.', emoji: '⏰' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const addMaterialToShelter = (shelterId: string, resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    const shelter = shelters.find(s => s.id === shelterId);
    
    if (!resource || !shelter || resource.available - resource.used <= 0) {
      toast({
        title: "No Resources!",
        description: `Not enough ${resource?.name} available`,
        variant: "destructive"
      });
      return;
    }

    // Update resource usage
    setResources(prev => prev.map(r => 
      r.id === resourceId ? { ...r, used: r.used + 1 } : r
    ));

    // Update shelter
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        const newMaterials = [...s.materials, resourceId];
        const newEmissions = newMaterials.reduce((acc, matId) => {
          const mat = resources.find(r => r.id === matId);
          return acc + (mat?.emissions || 0);
        }, 0);
        const newSustainability = newMaterials.reduce((acc, matId) => {
          const mat = resources.find(r => r.id === matId);
          return acc + (mat?.sustainability || 0);
        }, 0) / newMaterials.length;
        
        return {
          ...s,
          materials: newMaterials,
          emissions: newEmissions,
          sustainability: newSustainability,
          complete: newMaterials.length >= 3 // Need 3 materials per shelter
        };
      }
      return s;
    }));

    updateScores();
  };

  const removeMaterialFromShelter = (shelterId: string, materialIndex: number) => {
    const shelter = shelters.find(s => s.id === shelterId);
    if (!shelter) return;

    const materialId = shelter.materials[materialIndex];
    
    // Return resource
    setResources(prev => prev.map(r => 
      r.id === materialId ? { ...r, used: r.used - 1 } : r
    ));

    // Update shelter
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        const newMaterials = s.materials.filter((_, i) => i !== materialIndex);
        const newEmissions = newMaterials.reduce((acc, matId) => {
          const mat = resources.find(r => r.id === matId);
          return acc + (mat?.emissions || 0);
        }, 0);
        const newSustainability = newMaterials.length > 0 ? 
          newMaterials.reduce((acc, matId) => {
            const mat = resources.find(r => r.id === matId);
            return acc + (mat?.sustainability || 0);
          }, 0) / newMaterials.length : 0;
        
        return {
          ...s,
          materials: newMaterials,
          emissions: newEmissions,
          sustainability: newSustainability,
          complete: newMaterials.length >= 3
        };
      }
      return s;
    }));

    updateScores();
  };

  const updateScores = () => {
    const totalEmissions = shelters.reduce((acc, s) => acc + s.emissions, 0);
    const avgSustainability = shelters.filter(s => s.complete).reduce((acc, s) => acc + s.sustainability, 0) / Math.max(1, shelters.filter(s => s.complete).length);
    
    setTotalEmissions(totalEmissions);
    setEcoScore(avgSustainability);

    // Calculate points: +25 for eco-friendly, -20 for high emissions
    let points = 0;
    shelters.forEach(shelter => {
      if (shelter.complete) {
        if (shelter.sustainability >= 80) {
          points += 25;
        }
        if (shelter.emissions > 80) {
          points -= 20;
        }
      }
    });
    setEcoPoints(Math.max(0, points));

    // Check win condition: at least 3 sustainable shelters
    const completedSustainableShelters = shelters.filter(s => s.complete && s.sustainability >= 70).length;
    
    if (completedSustainableShelters >= 3 && !puzzleCompleted) {
      setPuzzleCompleted(true);
      const timeBonus = Math.floor(timeLeft / 10);
      
      setOverlay({ type: 'success', title: 'Shelters Built!', description: `${completedSustainableShelters} sustainable shelters completed! +${points + timeBonus} Eco Points`, emoji: '🏕️' });
      
      setTimeout(() => {
        onComplete(points + timeBonus, 0);
      }, 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedShelters = shelters.filter(s => s.complete).length;
  const sustainableShelters = shelters.filter(s => s.complete && s.sustainability >= 70).length;

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
              <h1 className="font-gaming text-xl font-bold text-primary retro-shadow">🏠 CLIMATE REFUGEE ZONE</h1>
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
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Room 4 of 5
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
        {[...Array(22)].map((_, i) => (
          <span key={i} className="ambient-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 40}vh`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: 0.3 + Math.random() * 0.7
          }} />
        ))}
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

      <div className="max-w-7xl mx-auto px-6 py-8 animate-in-up">
        {/* Mission Brief */}
        <Card className="climate-card mb-8 p-6">
          <div className="flex items-start space-x-4">
            <Home className="w-8 h-8 text-primary mt-1" />
            <div>
              <h2 className="font-gaming text-xl font-bold mb-2 retro-shadow">MISSION: BUILD SUSTAINABLE SHELTERS</h2>
              <p className="text-muted-foreground mb-4">
                Thousands are displaced by floods and need immediate shelter. Use limited resources wisely 
                to build at least 3 sustainable shelters while minimizing carbon emissions.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Target: 3 sustainable shelters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TreePine className="w-4 h-4 text-primary" />
                  <span>Minimize emissions!</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resources */}
          <div>
            <h3 className="font-gaming text-lg font-bold mb-4">Available Resources</h3>
            <div className="space-y-4">
              {resources.map(resource => (
                <Card 
                  key={resource.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedResource === resource.id ? 'ring-2 ring-primary bg-primary/10' : 
                    resource.sustainability >= 80 ? 'border-primary/30' : resource.sustainability >= 50 ? 'border-energy/30' : 'border-crisis/30'
                  } ${resource.available - resource.used <= 0 ? 'opacity-50 cursor-not-allowed' : 'puzzle-piece'}`}
                  onClick={() => resource.available - resource.used > 0 && setSelectedResource(resource.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{resource.icon}</span>
                      <div>
                        <h4 className="font-gaming font-semibold">{resource.name}</h4>
                        <div className="flex items-center space-x-2 text-xs">
                          <Badge variant="outline" className={resource.sustainability >= 80 ? 'border-primary text-primary' : resource.sustainability >= 50 ? 'border-energy text-energy' : 'border-crisis text-crisis'}>
                            {resource.sustainability}% sustainable
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{resource.available - resource.used}</div>
                      <div className="text-muted-foreground">left</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Emissions</div>
                      <div className={`font-semibold ${resource.emissions <= 10 ? 'text-primary' : resource.emissions <= 30 ? 'text-energy' : 'text-crisis'}`}>
                        {resource.emissions} CO₂
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Used</div>
                      <div className="font-semibold">{resource.used}/{resource.available}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Overall Stats */}
            <Card className="mt-6 p-4">
              <h4 className="font-gaming text-sm font-bold mb-3">Construction Stats</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Shelters Built</span>
                    <span>{completedShelters}/5</span>
                  </div>
                  <Progress value={(completedShelters / 5) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sustainable Shelters</span>
                    <span className={sustainableShelters >= 3 ? 'text-primary' : 'text-crisis'}>
                      {sustainableShelters}/3
                    </span>
                  </div>
                  <Progress value={(sustainableShelters / 3) * 100} className={sustainableShelters >= 3 ? 'bg-primary/20' : 'bg-crisis/20'} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Emissions</span>
                    <span className={totalEmissions <= 200 ? 'text-primary' : totalEmissions <= 400 ? 'text-energy' : 'text-crisis'}>
                      {totalEmissions} CO₂
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalEmissions <= 200 ? 'Low impact 🌱' : totalEmissions <= 400 ? 'Moderate impact ⚠️' : 'High impact 💀'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Shelters */}
          <div className="lg:col-span-2">
            <h3 className="font-gaming text-lg font-bold mb-4">Refugee Shelters</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {shelters.map((shelter, index) => (
                <Card key={shelter.id} className={`p-4 min-h-[200px] ${shelter.complete ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-gaming font-semibold">Shelter {index + 1}</h4>
                    {shelter.complete && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {shelter.materials.map((materialId, matIndex) => {
                      const resource = resources.find(r => r.id === materialId);
                      return (
                        <div key={matIndex} className="flex items-center justify-between bg-card/50 p-2 rounded text-sm">
                          <div className="flex items-center space-x-2">
                            <span>{resource?.icon}</span>
                            <span>{resource?.name}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeMaterialFromShelter(shelter.id, matIndex)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                    
                    {shelter.materials.length < 3 && (
                      <div className="text-center p-4 border-2 border-dashed border-muted rounded">
                        <Hammer className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-2">
                          Need {3 - shelter.materials.length} more materials
                        </p>
                        <Button 
                          size="sm" 
                          disabled={!selectedResource}
                          onClick={() => selectedResource && addMaterialToShelter(shelter.id, selectedResource)}
                        >
                          {selectedResource ? 'Add Material' : 'Select Resource'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {shelter.complete && (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Sustainability:</span>
                        <span className={shelter.sustainability >= 70 ? 'text-primary' : 'text-crisis'}>
                          {shelter.sustainability.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emissions:</span>
                        <span className={shelter.emissions <= 40 ? 'text-primary' : 'text-crisis'}>
                          {shelter.emissions} CO₂
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Success State */}
        {puzzleCompleted && (
          <Card className="solution-card mt-8 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="font-gaming text-2xl font-bold text-white mb-2">Shelters Built Successfully!</h3>
            <p className="text-white/90">
              {sustainableShelters} sustainable shelters provide safe homes for climate refugees. 
              Your resource management prevented unnecessary emissions. Final challenge awaits...
            </p>
          </Card>
        )}

        {/* Real World Connection */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-3">Real World Impact</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-4">
                By 2050, climate change could displace 1.2 billion people. Sustainable building materials 
                reduce construction emissions by up to 80%.
              </p>
              <h4 className="font-semibold mb-2">Sustainable Building Facts:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Bamboo grows 35x faster than trees</li>
                <li>• Recycled bricks use 80% less energy</li>
                <li>• Solar roofing provides energy independence</li>
                <li>• Cement produces 8% of global CO₂ emissions</li>
              </ul>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-gaming font-semibold mb-2 text-primary">Design Challenge</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sketch an eco-friendly shelter design using sustainable materials. 
                Include solar panels, rainwater collection, and natural ventilation.
              </p>
              <input ref={shelterUploadRef} type="file" accept="image/*" className="hidden"
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
                  
                  // Check for shelter/building content (basic color analysis)
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
                  
                  // Look for brown (wood/bamboo), gray (concrete), green (sustainable materials), or blue (solar panels)
                  let brownPixels = 0, grayPixels = 0, greenPixels = 0, bluePixels = 0;
                  for (let p = 0; p < data.length; p += 4 * 20) {
                    const r = data[p], g = data[p+1], b = data[p+2];
                    const sum = r + g + b + 1;
                    const rn = r / sum, gn = g / sum, bn = b / sum;
                    
                    if (rn > 0.3 && gn > 0.2 && bn < 0.2) brownPixels++;
                    else if (Math.abs(rn - gn) < 0.1 && Math.abs(gn - bn) < 0.1 && rn < 0.7) grayPixels++;
                    else if (gn > 0.4 && gn > rn + 0.1 && gn > bn + 0.1) greenPixels++;
                    else if (bn > 0.4 && bn > rn + 0.1 && bn > gn + 0.1) bluePixels++;
                  }
                  
                  const buildingIndicators = brownPixels + grayPixels + greenPixels + bluePixels;
                  if (buildingIndicators < 25) {
                    toast({ title: 'Wrong Image Uploaded', description: 'Image does not appear to show a shelter design. Please upload a photo of your eco-friendly shelter design with sustainable materials like bamboo, solar panels, or green building elements.', variant: 'destructive' });
                    return;
                  }
                  
                  setShelterUploadPreview(url);
                  setEcoPoints(prev=> prev + 50);
                  toast({ title: 'Photo Verified!', description: 'Eco-shelter design confirmed! +50 Eco Points awarded', variant: 'success' });
                }} />
              <Button size="sm" variant="solution" className="w-full" onClick={()=>shelterUploadRef.current?.click()}>
                Upload Eco-Shelter Design
              </Button>
              {shelterUploadPreview && (
                <img src={shelterUploadPreview} alt="upload" className="mt-3 max-h-40 rounded border" />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};