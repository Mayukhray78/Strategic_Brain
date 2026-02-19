import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  History,
  Plus,
  ArrowRight,
  Loader2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { generateStrategies } from '@/src/services/ai';
import { runMonteCarlo, SimulationResult } from '@/src/lib/simulation';
import { Goal, Scenario, GoalConstraints } from '@/src/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- Components ---

const Header = ({ onNavigate, currentView }: { onNavigate: (view: 'input' | 'results' | 'history') => void, currentView: string }) => (
  <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('input')}>
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-zinc-950" />
        </div>
        <h1 className="font-sans font-bold text-xl tracking-tight text-zinc-100">Strategic Brain</h1>
      </div>
      <nav className="flex items-center gap-6">
        <button 
          onClick={() => onNavigate('input')}
          className={cn(
            "text-sm font-medium transition-colors",
            currentView === 'input' || currentView === 'results' ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100"
          )}
        >
          Dashboard
        </button>
        <button 
          onClick={() => onNavigate('history')}
          className={cn(
            "text-sm font-medium transition-colors",
            currentView === 'history' ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100"
          )}
        >
          History
        </button>
        <button 
          onClick={() => onNavigate('input')}
          className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          New Goal
        </button>
      </nav>
    </div>
  </header>
);

const HistoryView = ({ onSelectGoal }: { onSelectGoal: (goalId: number, goalTitle: string) => void }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals')
      .then(res => res.json())
      .then(data => {
        setGoals(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <History className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-zinc-100">Strategic History</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {goals.map((goal) => (
          <div 
            key={goal.id}
            onClick={() => onSelectGoal(goal.id, goal.title)}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-500 transition-colors">{goal.title}</h3>
                <p className="text-sm text-zinc-500 mt-1">Created on {new Date(goal.created_at).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500">No strategic history found. Start by defining a new goal.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const GoalForm = ({ onSubmit, isLoading }: { onSubmit: (goal: string, constraints: GoalConstraints) => void, isLoading: boolean }) => {
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-zinc-100">Define Your Objective</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">High-Level Goal</label>
          <textarea 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Build a SaaS in 3 months with ₹50k budget"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-32 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Budget (₹)</label>
            <input 
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50,000"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Timeline</label>
            <input 
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="3 months"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Risk Tolerance</label>
          <div className="grid grid-cols-3 gap-3">
            {(['low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={cn(
                  "py-2 rounded-lg border text-sm font-medium transition-all",
                  risk === r 
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onSubmit(goal, { budget, timeline, riskTolerance: risk, skills: [] })}
          disabled={isLoading || !goal}
          className="w-full py-4 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {isLoading ? "Analyzing Scenarios..." : "Generate Optimized Roadmap"}
        </button>
      </div>
    </motion.div>
  );
};

const ScenarioCard = ({ scenario, onSelect, isSelected }: { scenario: Scenario, onSelect: () => void, isSelected: boolean }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={cn(
        "cursor-pointer p-6 rounded-2xl border transition-all",
        isSelected 
          ? "bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10" 
          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-zinc-100">{scenario.name}</h3>
        <div className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          scenario.score > 80 ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
        )}>
          Score: {scenario.score}
        </div>
      </div>
      <p className="text-sm text-zinc-400 mb-6 line-clamp-2">{scenario.description}</p>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Success Probability</span>
          <span className="text-zinc-100 font-mono">{(scenario.probabilityOfSuccess * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${scenario.probabilityOfSuccess * 100}%` }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>
    </motion.div>
  );
};

const ScenarioComparison = ({ scenarios }: { scenarios: Scenario[] }) => {
  const data = (scenarios || []).map(s => ({
    name: s.name,
    score: s.score,
    risk: s.risk,
    success: (s.probabilityOfSuccess || 0) * 100
  }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-500" />
        Scenario Comparison
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: '#18181b' }}
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
            />
            <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} name="Strategic Score" />
            <Bar dataKey="risk" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Risk Factor" />
            <Bar dataKey="success" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Success %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const FeedbackForm = ({ strategyId, onComplete }: { strategyId: number, onComplete: () => void }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id: strategyId, rating, comments, outcome_met: rating >= 4 })
      });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <MessageSquare className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">Help the Strategic Brain Learn</h3>
        <p className="text-zinc-400">Your feedback on these recommendations improves future strategic analysis.</p>
      </div>
      
      <div className="space-y-6">
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={cn(
                "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                rating >= star ? "bg-emerald-500 border-emerald-500 text-zinc-950" : "bg-zinc-950 border-zinc-800 text-zinc-500"
              )}
            >
              {star}
            </button>
          ))}
        </div>
        
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="What could be improved? Did the simulation match reality?"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 outline-none h-32 resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full py-4 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
};

const StrategyDashboard = ({ scenario }: { scenario: Scenario }) => {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const totalCost = (scenario.roadmap || []).reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
    const totalTime = 90;
    setSimulation(runMonteCarlo(totalCost, totalTime, scenario.risk || 0));
  }, [scenario]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Strategic Score', value: scenario.score || 0, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Risk Factor', value: `${scenario.risk || 0}%`, icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Success Prob.', value: `${((scenario.probabilityOfSuccess || 0) * 100).toFixed(1)}%`, icon: CheckCircle2, color: 'text-blue-500' },
          { label: 'Est. Budget', value: `₹${(scenario.roadmap || []).reduce((a, b) => a + (b.estimatedCost || 0), 0).toLocaleString()}`, icon: BarChart3, color: 'text-zinc-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-zinc-100 font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Execution Roadmap
            </h3>
            <div className="space-y-4">
              {(scenario.roadmap || []).map((step, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors">
                      {i + 1}
                    </div>
                    {i !== (scenario.roadmap || []).length - 1 && <div className="w-px h-full bg-zinc-800 my-1" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-zinc-100">{step.title}</h4>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {step.estimatedTime} • ₹{(step.estimatedCost || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-500" />
              Decision Tree Analysis
            </h3>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-sm font-bold text-emerald-500 mb-4 uppercase tracking-widest">Root: {scenario.decisionTree?.root}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(scenario.decisionTree?.options || []).map((opt: any, i: number) => (
                  <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-xs font-bold text-zinc-500 mb-1">IF {opt.choice}</div>
                    <div className="text-sm text-zinc-100 mb-2">THEN {opt.outcome}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full">
                        <div className="h-full bg-emerald-500" style={{ width: `${(opt.probability || 0) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{((opt.probability || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Monte Carlo Simulation
            </h3>
            {simulation && (
              <div className="space-y-6">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulation.costDistribution || []}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="bin" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Expected Cost Variance</div>
                  <div className="text-xl font-bold text-zinc-100 font-mono">₹{Math.round(simulation.expectedCost || 0).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400 leading-relaxed italic">
                    "Based on 5,000 simulations, this strategy has a {((simulation.probabilityOfSuccess || 0) * 100).toFixed(1)}% probability of staying within 20% of the initial budget."
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Trade-off Evaluation</h3>
            <ul className="space-y-3">
              {(scenario.tradeOffs || []).map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'input' | 'results' | 'history'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentGoal, setCurrentGoal] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelectGoal = async (goalId: number, goalTitle: string) => {
    setIsLoading(true);
    setCurrentGoal(goalTitle);
    try {
      const res = await fetch(`/api/goals/${goalId}/strategies`);
      const data = await res.json();
      const loadedScenarios = data.map((s: any) => ({
        ...s.data,
        id: s.id
      }));
      setScenarios(loadedScenarios);
      setSelectedScenario(loadedScenarios[0]);
      setView('results');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (goal: string, constraints: GoalConstraints) => {
    setIsLoading(true);
    setCurrentGoal(goal);
    try {
      const contextRes = await fetch('/api/learning-context');
      const historicalContext = await contextRes.json();

      const results = await generateStrategies(goal, constraints, historicalContext);
      setScenarios(results);
      setSelectedScenario(results[0]);
      setView('results');

      const goalRes = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goal, description: '', constraints })
      });
      const { id: goalId } = await goalRes.json();

      for (const s of results) {
        const stratRes = await fetch('/api/strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_id: goalId,
            name: s.name,
            data: s,
            score: s.score,
            risk: s.risk,
            probability: s.probabilityOfSuccess
          })
        });
        const { id: stratId } = await stratRes.json();
        s.id = stratId;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Header onNavigate={setView} currentView={view} />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'input' ? (
            <GoalForm key="form" onSubmit={handleGenerate} isLoading={isLoading} />
          ) : view === 'history' ? (
            <HistoryView key="history" onSelectGoal={handleSelectGoal} />
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold uppercase tracking-widest">
                    <Target className="w-4 h-4" />
                    Active Objective
                  </div>
                  <h2 className="text-3xl font-bold text-zinc-100 max-w-2xl">"{currentGoal}"</h2>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Export Report
                  </button>
                  <button 
                    onClick={() => setView('input')}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Strategy
                  </button>
                </div>
              </div>

              <ScenarioComparison scenarios={scenarios} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {scenarios.map((s, i) => (
                  <ScenarioCard 
                    key={i} 
                    scenario={s} 
                    onSelect={() => setSelectedScenario(s)}
                    isSelected={selectedScenario?.name === s.name}
                  />
                ))}
              </div>

              {selectedScenario && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <StrategyDashboard scenario={selectedScenario} />
                </motion.div>
              )}

              <div className="border-t border-zinc-800 pt-12 mt-12">
                {showFeedback ? (
                  <FeedbackForm 
                    strategyId={selectedScenario?.id || 0} 
                    onComplete={() => setShowFeedback(false)} 
                  />
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
                    <MessageSquare className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-zinc-100 mb-2">Help the Strategic Brain Learn</h3>
                    <p className="text-zinc-400 mb-6">Your feedback on these recommendations improves future strategic analysis.</p>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setShowFeedback(true)}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-full text-sm font-medium transition-colors"
                      >
                        Rate Strategy
                      </button>
                      <button 
                        onClick={async () => {
                          if (!selectedScenario?.id) return;
                          try {
                            await fetch('/api/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                strategy_id: selectedScenario.id, 
                                rating: 5, 
                                comments: 'Marked as implemented by user.', 
                                outcome_met: true 
                              })
                            });
                            alert('Strategy marked as successfully implemented! This will help the AI learn.');
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full text-sm font-bold transition-colors"
                      >
                        Mark as Implemented
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Brain className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Strategic Brain Engine v1.0</span>
          </div>
          <div className="flex gap-8 text-xs font-medium text-zinc-500">
            <a href="#" className="hover:text-zinc-100 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">API Reference</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
