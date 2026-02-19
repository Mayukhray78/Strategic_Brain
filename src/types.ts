export interface GoalConstraints {
  budget: string;
  timeline: string;
  skills: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface SubGoal {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  estimatedCost: number;
  dependencies: string[];
}

export interface Scenario {
  id?: number;
  name: string;
  description: string;
  roadmap: SubGoal[];
  tradeOffs: string[];
  score: number;
  risk: number;
  probabilityOfSuccess: number;
  decisionTree: {
    root: string;
    options: {
      choice: string;
      outcome: string;
      probability: number;
    }[];
  };
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  constraints: string; // JSON string
  created_at: string;
}

export interface Feedback {
  id: number;
  strategy_id: number;
  rating: number;
  comments: string;
  outcome_met: boolean;
  created_at: string;
}
