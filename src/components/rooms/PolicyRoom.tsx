import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameOverlay } from '@/components/ui/overlay';
import { 
  Scale, 
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Zap,
  TreePine,
  Car,
  Briefcase,
  X,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PolicyRoomProps {
  onComplete: (points: number, timeBonus: number) => void;
  onExit: () => void;
  difficulty: string;
  onExitGame?: () => void;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  impact: {
    temperature: number; // reduction in degrees
    economy: number; // -100 to +100
    public_support: number; // -100 to +100
  };
  selected: boolean;
}

interface SimulationResult {
  temperature_rise: number;
  economic_impact: number;
  public_approval: number;
  planet_status: 'saved' | 'critical' | 'catastrophic';
  outcome_description: string;
}

export const PolicyRoom = ({ onComplete, onExit, difficulty, onExitGame }: PolicyRoomProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [overlay, setOverlay] = useState<{ type: 'success' | 'fail'; title: string; description?: string; emoji?: string } | null>(null);
  const policyUploadRef = useRef<HTMLInputElement | null>(null);
  const [policyUploadPreview, setPolicyUploadPreview] = useState<string | null>(null);

  const availablePolicies: Policy[] = [
    {
      id: 'carbon-tax',
      name: 'Carbon Tax',
      description: 'Tax carbon emissions to incentivize clean energy',
      icon: Scale,
      impact: { temperature: 0.8, economy: -20, public_support: -30 },
      selected: false
    },
    {
      id: 'plastic-ban',
      name: 'Ban Single-Use Plastics',
      description: 'Eliminate plastic pollution and microplastics',
      icon: X,
      impact: { temperature: 0.3, economy: -10, public_support: 40 },
      selected: false
    },
    {
      id: 'ev-subsidies',
      name: 'Electric Vehicle Subsidies',
      description: 'Accelerate transition to clean transportation',
      icon: Car,
      impact: { temperature: 0.6, economy: 10, public_support: 60 },
      selected: false
    },
    {
      id: 'afforestation',
      name: 'Large-Scale Afforestation',
      description: 'Plant billions of trees to absorb CO₂',
      icon: TreePine,
      impact: { temperature: 1.2, economy: 20, public_support: 80 },
      selected: false
    },
    {
      id: 'green-jobs',
      name: 'Green Jobs Program',
      description: 'Create millions of renewable energy jobs',
      icon: Briefcase,
      impact: { temperature: 0.4, economy: 50, public_support: 70 },
      selected: false
    },
    {
      id: 'fossil-fuels',
      name: 'Continue Fossil Fuels',
      description: 'Maintain current energy systems (TRAP OPTION)',
      icon: Zap,
      impact: { temperature: -2.0, economy: 30, public_support: -50 }, // Negative temperature reduction = increase
      selected: false
    }
  ];

  useEffect(() => {
    setPolicies(availablePolicies);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOverlay({ type: 'fail', title: "Time's Up!", description: 'World leaders failed to act. Climate catastrophe is inevitable.', emoji: '⏰' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const togglePolicy = (policyId: string) => {
    if (selectedPolicies.includes(policyId)) {
      setSelectedPolicies(prev => prev.filter(id => id !== policyId));
    } else if (selectedPolicies.length < 3) {
      setSelectedPolicies(prev => [...prev, policyId]);
    } else {
      toast({
        title: "Policy Limit Reached",
        description: "You can only select 3 policies. Deselect one first.",
        variant: "destructive"
      });
    }
  };

  const runSimulation = () => {
    if (selectedPolicies.length !== 3) {
      setOverlay({ type: 'fail', title: 'Select 3 Policies', description: 'You must choose exactly 3 policies to run the simulation.', emoji: '⚠️' });
      return;
    }

    // Calculate combined impact
    let totalTempReduction = 0;
    let totalEconomicImpact = 0;
    let totalPublicSupport = 0;

    selectedPolicies.forEach(policyId => {
      const policy = policies.find(p => p.id === policyId);
      if (policy) {
        totalTempReduction += policy.impact.temperature;
        totalEconomicImpact += policy.impact.economy;
        totalPublicSupport += policy.impact.public_support;
      }
    });

    // Base temperature rise without action: +3.5°C
    const baseTemperatureRise = 3.5;
    const finalTemperatureRise = Math.max(0.5, baseTemperatureRise - totalTempReduction);

    let planetStatus: 'saved' | 'critical' | 'catastrophic';
    let outcomeDescription: string;
    let points = 0;

    if (finalTemperatureRise <= 2.0) {
      planetStatus = 'saved';
      outcomeDescription = 'Planet saved! Temperature rise limited to safe levels. Ecosystems thrive, cities are protected from flooding, and humanity prospers in a sustainable future.';
      points = 50;
    } else if (finalTemperatureRise <= 2.5) {
      planetStatus = 'critical';
      outcomeDescription = 'Critical situation. Some progress made but temperature rise causes significant damage. Coastal cities flood, but catastrophic collapse is avoided.';
      points = 25;
    } else {
      planetStatus = 'catastrophic';
      outcomeDescription = 'Climate catastrophe. Poor policy choices lead to runaway global warming. Mass extinction, civilization collapse, and human suffering on unprecedented scale.';
      points = 0;
    }

    // Penalty for fossil fuel trap
    if (selectedPolicies.includes('fossil-fuels')) {
      points = 0;
      planetStatus = 'catastrophic';
      outcomeDescription = 'Fossil fuel lobby wins. Temperature soars past +4°C. The planet becomes uninhabitable. Game over.';
      
      setOverlay({ type: 'fail', title: 'Fossil Fuel Trap!', description: 'You fell for the trap option. Fossil fuels doom the planet.', emoji: '💀' });
    }

    // Bonus for optimal combination (Carbon Tax + Afforestation + Green Jobs)
    const optimalCombination = ['carbon-tax', 'afforestation', 'green-jobs'];
    const isOptimal = optimalCombination.every(id => selectedPolicies.includes(id));
    if (isOptimal) {
      points += 25; // Bonus points
    }

    const result: SimulationResult = {
      temperature_rise: finalTemperatureRise,
      economic_impact: totalEconomicImpact,
      public_approval: totalPublicSupport,
      planet_status: planetStatus,
      outcome_description: outcomeDescription
    };

    setSimulation(result);
    setEcoPoints(points);
    setShowSimulation(true);

    // Check win condition
    if (finalTemperatureRise <= 2.0) {
      setPuzzleCompleted(true);
      const timeBonus = Math.floor(timeLeft / 10);
      
      setTimeout(() => {
        onComplete(points + timeBonus, isOptimal ? 50 : 0);
      }, 5000); // Give time to read results
      setOverlay({ type: 'success', title: 'Planet Saved!', description: 'Temperature rise limited to safe levels.', emoji: '🌍' });
    } else {
      setOverlay({ type: 'fail', title: 'Simulation Result', description: outcomeDescription, emoji: '🌡️' });
    }
  };

  const resetSimulation = () => {
    setSimulation(null);
    setShowSimulation(false);
    setSelectedPolicies([]);
    setEcoPoints(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 2.0) return 'text-primary';
    if (temp <= 2.5) return 'text-energy';
    return 'text-danger';
  };

  const getPlanetEmoji = (status: string) => {
    switch (status) {
      case 'saved': return '🌍';
      case 'critical': return '🌡️';
      case 'catastrophic': return '💀';
      default: return '🌍';
    }
  };

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
              <h1 className="font-gaming text-xl font-bold text-primary retro-shadow">🌍 CLIMATE POLICY CHAMBER</h1>
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
                Final Room
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
        {[...Array(28)].map((_, i) => (
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
            <Globe className="w-8 h-8 text-primary mt-1" />
            <div>
              <h2 className="font-gaming text-xl font-bold mb-2 retro-shadow">MISSION: SAVE THE PLANET</h2>
              <p className="text-muted-foreground mb-4">
                You've reached the chamber of world leaders. The planet's fate is in your hands. 
                Choose 3 policies wisely - the wrong combination will doom humanity to climate catastrophe.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Goal: Keep warming under 2°C</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-crisis" />
                  <span>Beware of trap options!</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {!showSimulation ? (
          <div className="space-y-8">
            {/* Policy Selection */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-gaming text-lg font-bold">Global Policy Options</h3>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {selectedPolicies.length}/3 policies selected
                  </Badge>
                  <Button 
                    onClick={runSimulation}
                    disabled={selectedPolicies.length !== 3}
                    variant="solution"
                  >
                    Run Climate Simulation
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {policies.map(policy => {
                  const Icon = policy.icon;
                  const isSelected = selectedPolicies.includes(policy.id);
                  const isTrap = policy.id === 'fossil-fuels';
                  
                  return (
                    <Card
                      key={policy.id}
                      onClick={() => togglePolicy(policy.id)}
                      className={`p-4 cursor-pointer transition-all puzzle-piece ${
                        isSelected ? 'ring-2 ring-primary bg-primary/10' : 
                        isTrap ? 'border-crisis/50 hover:border-crisis' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3 mb-4">
                        <Icon className={`w-6 h-6 mt-1 ${isTrap ? 'text-crisis' : 'text-primary'}`} />
                        <div className="flex-1">
                          <h4 className="font-gaming font-semibold mb-2">{policy.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {policy.description}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground mb-1">Climate</div>
                          <div className={`font-bold ${policy.impact.temperature > 0 ? 'text-primary' : 'text-crisis'}`}>
                            {policy.impact.temperature > 0 ? '+' : ''}{policy.impact.temperature}°C
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground mb-1">Economy</div>
                          <div className={`font-bold ${policy.impact.economy >= 0 ? 'text-primary' : 'text-crisis'}`}>
                            {policy.impact.economy > 0 ? '+' : ''}{policy.impact.economy}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground mb-1">Support</div>
                          <div className={`font-bold ${policy.impact.public_support >= 0 ? 'text-primary' : 'text-crisis'}`}>
                            {policy.impact.public_support > 0 ? '+' : ''}{policy.impact.public_support}%
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Policy Analysis */}
            {selectedPolicies.length > 0 && (
              <Card className="p-6">
                <h4 className="font-gaming text-lg font-bold mb-4">Policy Preview</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {selectedPolicies.reduce((acc, id) => {
                        const policy = policies.find(p => p.id === id);
                        return acc + (policy?.impact.temperature || 0);
                      }, 0).toFixed(1)}°C
                    </div>
                    <div className="text-sm text-muted-foreground">Temperature Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-energy mb-2">
                      {selectedPolicies.reduce((acc, id) => {
                        const policy = policies.find(p => p.id === id);
                        return acc + (policy?.impact.economy || 0);
                      }, 0) > 0 ? '+' : ''}{selectedPolicies.reduce((acc, id) => {
                        const policy = policies.find(p => p.id === id);
                        return acc + (policy?.impact.economy || 0);
                      }, 0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Economic Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-water mb-2">
                      {selectedPolicies.reduce((acc, id) => {
                        const policy = policies.find(p => p.id === id);
                        return acc + (policy?.impact.public_support || 0);
                      }, 0) > 0 ? '+' : ''}{selectedPolicies.reduce((acc, id) => {
                        const policy = policies.find(p => p.id === id);
                        return acc + (policy?.impact.public_support || 0);
                      }, 0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Public Support</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Simulation Results */
          <div className="space-y-8">
            <Card className={`p-8 ${simulation?.planet_status === 'saved' ? 'solution-card' : simulation?.planet_status === 'critical' ? 'bg-energy/10 border-energy' : 'crisis-card'}`}>
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">
                  {getPlanetEmoji(simulation?.planet_status || '')}
                </div>
                
                <h3 className={`font-gaming text-2xl font-bold ${simulation?.planet_status === 'saved' ? 'text-white' : simulation?.planet_status === 'critical' ? 'text-energy' : 'text-white'}`}>
                  {simulation?.planet_status === 'saved' ? 'Planet Saved!' : 
                   simulation?.planet_status === 'critical' ? 'Critical Situation' : 
                   'Climate Catastrophe'}
                </h3>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className={`text-3xl font-bold ${getTemperatureColor(simulation?.temperature_rise || 0)} ${simulation?.planet_status !== 'saved' ? 'text-white' : ''}`}>
                      +{simulation?.temperature_rise.toFixed(1)}°C
                    </div>
                    <div className={`text-sm ${simulation?.planet_status === 'saved' ? 'text-white/80' : simulation?.planet_status === 'critical' ? 'text-muted-foreground' : 'text-white/80'}`}>
                      Global Warming
                    </div>
                  </div>
                  <div>
                    <div className={`text-3xl font-bold ${simulation?.planet_status === 'saved' ? 'text-white' : simulation?.planet_status === 'critical' ? 'text-energy' : 'text-white'}`}>
                      {simulation?.economic_impact || 0 > 0 ? '+' : ''}{simulation?.economic_impact}%
                    </div>
                    <div className={`text-sm ${simulation?.planet_status === 'saved' ? 'text-white/80' : simulation?.planet_status === 'critical' ? 'text-muted-foreground' : 'text-white/80'}`}>
                      Economic Impact
                    </div>
                  </div>
                  <div>
                    <div className={`text-3xl font-bold ${simulation?.planet_status === 'saved' ? 'text-white' : simulation?.planet_status === 'critical' ? 'text-energy' : 'text-white'}`}>
                      {simulation?.public_approval || 0 > 0 ? '+' : ''}{simulation?.public_approval}%
                    </div>
                    <div className={`text-sm ${simulation?.planet_status === 'saved' ? 'text-white/80' : simulation?.planet_status === 'critical' ? 'text-muted-foreground' : 'text-white/80'}`}>
                      Public Approval
                    </div>
                  </div>
                </div>

                <p className={`text-lg max-w-2xl mx-auto ${simulation?.planet_status === 'saved' ? 'text-white/90' : simulation?.planet_status === 'critical' ? 'text-muted-foreground' : 'text-white/90'}`}>
                  {simulation?.outcome_description}
                </p>

                <div className="space-x-4">
                  <Button onClick={resetSimulation} variant="outline">
                    Try Different Policies
                  </Button>
                  {simulation?.planet_status === 'saved' && (
                    <Badge className="bg-white/20 text-white px-4 py-2">
                      Mission Accomplished! +{ecoPoints} Eco Points
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Policy Analysis */}
            <Card className="p-6">
              <h4 className="font-gaming text-lg font-bold mb-4">Your Policy Choices</h4>
              <div className="grid gap-4">
                {selectedPolicies.map(policyId => {
                  const policy = policies.find(p => p.id === policyId);
                  if (!policy) return null;
                  
                  const Icon = policy.icon;
                  return (
                    <div key={policyId} className="flex items-center space-x-4 p-3 bg-card/50 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <h5 className="font-semibold">{policy.name}</h5>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                      </div>
                      <div className="text-right text-sm">
                        <div>{policy.impact.temperature > 0 ? '+' : ''}{policy.impact.temperature}°C</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Real World Connection */}
        <Card className="climate-card mt-8 p-6">
          <h3 className="font-gaming text-lg font-bold mb-3">Real World Impact</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Climate policy decisions made today determine humanity's future. The policies in this simulation 
                are based on real climate science and economic models.
              </p>
              <h4 className="font-semibold mb-2">Policy Facts:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Carbon pricing has reduced EU emissions by 35%</li>
                <li>• Plastic bans prevent 8 million tons of ocean pollution annually</li>
                <li>• EV subsidies cut transport emissions by 60%</li>
                <li>• Afforestation can absorb 25% of annual CO₂ emissions</li>
              </ul>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-gaming font-semibold mb-2 text-primary">Campus Policy Challenge</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Submit a real sustainability proposal for your campus: bike-sharing, solar panels, 
                waste management, or green transportation. Best ideas get featured!
              </p>
              <input ref={policyUploadRef} type="file" accept="image/*" className="hidden"
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
                  
                  // Check for document/proposal content (basic color analysis)
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
                  
                  // Look for white (paper), black (text), green (sustainability themes), or blue (policy documents)
                  let whitePixels = 0, blackPixels = 0, greenPixels = 0, bluePixels = 0;
                  for (let p = 0; p < data.length; p += 4 * 20) {
                    const r = data[p], g = data[p+1], b = data[p+2];
                    const sum = r + g + b + 1;
                    const rn = r / sum, gn = g / sum, bn = b / sum;
                    
                    if (rn > 0.8 && gn > 0.8 && bn > 0.8) whitePixels++;
                    else if (rn < 0.3 && gn < 0.3 && bn < 0.3) blackPixels++;
                    else if (gn > 0.4 && gn > rn + 0.1 && gn > bn + 0.1) greenPixels++;
                    else if (bn > 0.4 && bn > rn + 0.1 && bn > gn + 0.1) bluePixels++;
                  }
                  
                  const documentIndicators = whitePixels + blackPixels + greenPixels + bluePixels;
                  if (documentIndicators < 40) {
                    toast({ title: 'Wrong Image Uploaded', description: 'Image does not appear to show a policy proposal. Please upload a photo of your sustainability proposal document, sketch, or presentation with clear text or diagrams.', variant: 'destructive' });
                    return;
                  }
                  
                  setPolicyUploadPreview(url);
                  setEcoPoints(prev=> prev + 50);
                  toast({ title: 'Proposal Uploaded!', description: 'Policy proposal confirmed! +50 Eco Points awarded', variant: 'success' });
                }} />
              <Button size="sm" variant="solution" className="w-full" onClick={()=>policyUploadRef.current?.click()}>
                Submit Policy Proposal
              </Button>
              {policyUploadPreview && (
                <img src={policyUploadPreview} alt="upload" className="mt-3 max-h-40 rounded border" />
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