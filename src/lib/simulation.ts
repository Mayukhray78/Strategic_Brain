/**
 * Monte Carlo Simulation for Project Success
 * Simulates thousands of project runs based on estimated time/cost distributions.
 */

export interface SimulationResult {
  probabilityOfSuccess: number;
  expectedCost: number;
  expectedTime: number;
  costDistribution: { bin: string; count: number }[];
  timeDistribution: { bin: string; count: number }[];
  riskHeatmap: { x: number; y: number; value: number }[];
}

export function runMonteCarlo(
  baseCost: number,
  baseTime: number, // in days
  riskFactor: number, // 0-100
  iterations: number = 5000
): SimulationResult {
  const costs: number[] = [];
  const times: number[] = [];
  let successes = 0;

  // Simple triangular distribution approximation
  // min = base * 0.8, mode = base, max = base * (1 + riskFactor/50)
  const minMultiplier = 0.8;
  const maxMultiplier = 1 + (riskFactor / 50);

  for (let i = 0; i < iterations; i++) {
    const costSample = triangularSample(baseCost * minMultiplier, baseCost, baseCost * maxMultiplier);
    const timeSample = triangularSample(baseTime * minMultiplier, baseTime, baseTime * maxMultiplier);
    
    costs.push(costSample);
    times.push(timeSample);

    // Success criteria: within 20% of original estimates
    if (costSample <= baseCost * 1.2 && timeSample <= baseTime * 1.2) {
      successes++;
    }
  }

  const avgCost = costs.reduce((a, b) => a + b, 0) / iterations;
  const avgTime = times.reduce((a, b) => a + b, 0) / iterations;

  return {
    probabilityOfSuccess: successes / iterations,
    expectedCost: avgCost,
    expectedTime: avgTime,
    costDistribution: createHistogram(costs, 10),
    timeDistribution: createHistogram(times, 10),
    riskHeatmap: [] // Placeholder for more complex analysis
  };
}

function triangularSample(min: number, mode: number, max: number): number {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function createHistogram(data: number[], bins: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binSize = range / bins;
  
  const histogram = Array.from({ length: bins }, (_, i) => ({
    bin: `${Math.round(min + i * binSize)} - ${Math.round(min + (i + 1) * binSize)}`,
    count: 0
  }));

  data.forEach(val => {
    const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
    histogram[binIndex].count++;
  });

  return histogram;
}
