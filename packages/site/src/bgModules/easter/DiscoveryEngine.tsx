/**
 * Phase 4 Advanced Features - Easter Egg Discovery Engine
 * AI-powered pattern recognition and progressive discovery system
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  EasterEggConfig, 
  EasterEggEvent, 
  EasterEggTrigger,
  EasterEggReward,
  UserPreferences 
} from '@/types/background';

// Pattern recognition algorithms
interface PatternMatch {
  confidence: number;
  trigger: EasterEggTrigger;
  easterEggId: string;
  matchedData: unknown;
}

interface DiscoveryState {
  activePatterns: Map<string, PatternTracker>;
  discoveryProgress: Map<string, number>;
  recentEvents: EasterEggEvent[];
  discoveryHistory: string[];
}

interface PatternTracker {
  easterEggId: string;
  trigger: EasterEggTrigger;
  matchProgress: number;
  lastActivity: number;
  attempts: number;
  confidence: number;
}

// Advanced pattern recognition algorithms
class PatternRecognitionEngine {
  private sequenceBuffer: string[] = [];
  private timingBuffer: number[] = [];
  private interactionCounts = new Map<string, number>();
  private mouseTrail: { x: number; y: number; timestamp: number }[] = [];

  // Konami Code and custom sequence detection
  detectSequencePattern(events: EasterEggEvent[], sequence: string[]): number {
    const keyEvents = events.filter(e => e.type === 'keyboard');
    if (keyEvents.length < sequence.length) return 0;

    const recentKeys = keyEvents.slice(-sequence.length).map(e => (e.data as any).key);
    let matches = 0;
    
    for (let i = 0; i < sequence.length; i++) {
      if (recentKeys[i] === sequence[i]) {
        matches++;
      }
    }
    
    return matches / sequence.length;
  }

  // Mouse pattern detection (circles, spirals, shapes)
  detectMousePattern(events: EasterEggEvent[], pattern: string): number {
    const mouseEvents = events.filter(e => e.type === 'mouse');
    if (mouseEvents.length < 10) return 0;

    const points = mouseEvents.map(e => ({
      x: (e.data as any).x,
      y: (e.data as any).y,
      timestamp: e.timestamp
    }));

    switch (pattern) {
      case 'circle':
        return this.detectCirclePattern(points);
      case 'spiral':
        return this.detectSpiralPattern(points);
      case 'figure8':
        return this.detectFigure8Pattern(points);
      default:
        return 0;
    }
  }

  private detectCirclePattern(points: Array<{ x: number; y: number }>): number {
    if (points.length < 20) return 0;

    // Calculate center point
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    // Calculate average distance from center
    const distances = points.map(p => 
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    );
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    // Check how consistent the distances are (circular shape)
    const variance = distances.reduce((sum, d) => sum + (d - avgDistance) ** 2, 0) / distances.length;
    const consistency = Math.max(0, 1 - (variance / (avgDistance ** 2)));

    // Check for angular coverage (full circle)
    const angles = points.map(p => Math.atan2(p.y - centerY, p.x - centerX));
    const sortedAngles = [...angles].sort();
    let coverage = 0;
    
    for (let i = 1; i < sortedAngles.length; i++) {
      coverage += Math.abs(sortedAngles[i] - sortedAngles[i - 1]);
    }
    coverage += Math.abs(sortedAngles[0] + 2 * Math.PI - sortedAngles[sortedAngles.length - 1]);
    
    const circularCoverage = Math.min(1, coverage / (2 * Math.PI));

    return (consistency * 0.6 + circularCoverage * 0.4);
  }

  private detectSpiralPattern(points: Array<{ x: number; y: number }>): number {
    // Simplified spiral detection
    if (points.length < 30) return 0;

    let spiralScore = 0;
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    // Check if distance from center increases/decreases consistently
    const distances = points.map(p => 
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    );

    let increasing = 0;
    let decreasing = 0;
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] > distances[i - 1]) increasing++;
      else if (distances[i] < distances[i - 1]) decreasing++;
    }

    // Spiral should have consistent direction (inward or outward)
    const directionality = Math.max(increasing, decreasing) / (distances.length - 1);
    
    return directionality;
  }

  private detectFigure8Pattern(points: Array<{ x: number; y: number }>): number {
    // Simplified figure-8 detection
    if (points.length < 40) return 0;
    
    // Figure-8 should cross itself near the center
    const crossings = this.detectPathCrossings(points);
    return Math.min(1, crossings / 3); // Expect at least 3 crossings for figure-8
  }

  private detectPathCrossings(points: Array<{ x: number; y: number }>): number {
    let crossings = 0;
    
    for (let i = 0; i < points.length - 3; i++) {
      for (let j = i + 2; j < points.length - 1; j++) {
        if (this.lineSegmentsIntersect(
          points[i], points[i + 1],
          points[j], points[j + 1]
        )) {
          crossings++;
        }
      }
    }
    
    return crossings;
  }

  private lineSegmentsIntersect(
    p1: { x: number; y: number }, 
    p2: { x: number; y: number },
    p3: { x: number; y: number }, 
    p4: { x: number; y: number }
  ): boolean {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (det === 0) return false;

    const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }

  // Timing-based pattern detection
  detectTimingPattern(events: EasterEggEvent[], pattern: { rhythm: number[]; tolerance: number }): number {
    if (events.length < pattern.rhythm.length + 1) return 0;

    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].timestamp - events[i - 1].timestamp);
    }

    const recentIntervals = intervals.slice(-pattern.rhythm.length);
    let matches = 0;

    for (let i = 0; i < pattern.rhythm.length; i++) {
      const expected = pattern.rhythm[i];
      const actual = recentIntervals[i];
      const tolerance = expected * pattern.tolerance;
      
      if (Math.abs(actual - expected) <= tolerance) {
        matches++;
      }
    }

    return matches / pattern.rhythm.length;
  }

  // Complex combination pattern detection
  detectCombinationPattern(
    events: EasterEggEvent[], 
    requirements: { 
      types: string[]; 
      timeWindow: number; 
      sequence?: boolean;
      minCount?: Record<string, number>;
    }
  ): number {
    const cutoff = Date.now() - requirements.timeWindow;
    const recentEvents = events.filter(e => e.timestamp > cutoff);
    
    if (requirements.sequence) {
      // Check if events occurred in the specified sequence
      const typeSequence = recentEvents.map(e => e.type);
      let sequenceIndex = 0;
      
      for (const eventType of typeSequence) {
        if (eventType === requirements.types[sequenceIndex]) {
          sequenceIndex++;
          if (sequenceIndex === requirements.types.length) {
            return 1; // Perfect match
          }
        }
      }
      
      return sequenceIndex / requirements.types.length;
    } else {
      // Check if all required types are present with minimum counts
      const typeCounts = new Map<string, number>();
      recentEvents.forEach(e => {
        typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
      });

      let score = 0;
      let totalRequirements = 0;

      for (const type of requirements.types) {
        totalRequirements++;
        const minRequired = requirements.minCount?.[type] || 1;
        const actual = typeCounts.get(type) || 0;
        
        if (actual >= minRequired) {
          score++;
        } else {
          score += actual / minRequired;
        }
      }

      return score / totalRequirements;
    }
  }
}

// Easter egg configurations with progressive difficulty
const EASTER_EGG_CONFIGS: EasterEggConfig[] = [
  // Level 1: Simple sequence
  {
    id: 'konami-code',
    difficulty: 1,
    triggers: [{
      type: 'sequence',
      data: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
    }],
    reward: {
      type: 'visual',
      content: 'rainbow-background',
      duration: 5000
    },
    discoveryHint: 'Try the classic gaming sequence...'
  },
  
  // Level 2: Mouse pattern
  {
    id: 'circle-of-trust',
    difficulty: 2,
    triggers: [{
      type: 'pattern',
      data: { pattern: 'circle', minRadius: 50 },
      tolerance: 0.8
    }],
    reward: {
      type: 'visual',
      content: 'particle-explosion',
      duration: 3000
    },
    discoveryHint: 'Draw something round...'
  },
  
  // Level 3: Timing-based
  {
    id: 'morse-code',
    difficulty: 3,
    triggers: [{
      type: 'pattern',
      data: { 
        rhythm: [200, 200, 200, 600, 600, 600, 200, 200, 200], // SOS in morse
        tolerance: 0.3
      }
    }],
    reward: {
      type: 'message',
      content: 'SOS received! Help is on the way!',
      duration: 4000
    },
    discoveryHint: 'Send a distress signal in the universal code...'
  },
  
  // Level 4: Complex combination
  {
    id: 'digital-symphony',
    difficulty: 4,
    triggers: [{
      type: 'combination',
      data: {
        types: ['keyboard', 'mouse', 'scroll'],
        timeWindow: 10000,
        minCount: { keyboard: 3, mouse: 5, scroll: 2 }
      }
    }],
    reward: {
      type: 'module',
      content: 'music-visualizer',
      duration: 0 // Permanent
    },
    discoveryHint: 'Orchestrate multiple interactions in harmony...'
  },
  
  // Level 5: Ultimate challenge
  {
    id: 'matrix-code',
    difficulty: 5,
    triggers: [{
      type: 'combination',
      data: {
        types: ['sequence', 'pattern', 'time'],
        requirements: {
          sequence: ['KeyM', 'KeyA', 'KeyT', 'KeyR', 'KeyI', 'KeyX'],
          pattern: 'spiral',
          timeActive: 60000
        }
      }
    }],
    reward: {
      type: 'achievement',
      content: 'matrix-master',
      duration: 0
    },
    discoveryHint: 'Follow the white rabbit down the digital spiral...',
    requirements: {
      moduleActive: ['knowledge-graph'],
      timeActive: 60000,
      interactions: 50
    }
  }
];

// Discovery Engine Component
interface DiscoveryEngineProps {
  onEasterEggDiscovered: (easterEggId: string, reward: EasterEggReward) => void;
  userPreferences: UserPreferences;
  activeModule: string | null;
}

export function DiscoveryEngine({ 
  onEasterEggDiscovered, 
  userPreferences, 
  activeModule 
}: DiscoveryEngineProps) {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>(() => ({
    activePatterns: new Map(),
    discoveryProgress: new Map(),
    recentEvents: [],
    discoveryHistory: userPreferences.discoveredEasterEggs || []
  }));

  const patternEngine = useRef(new PatternRecognitionEngine());
  const eventBuffer = useRef<EasterEggEvent[]>([]);

  // Process events and check for pattern matches
  const processEvent = useCallback((event: EasterEggEvent) => {
    // Add to event buffer
    eventBuffer.current.push(event);
    
    // Keep only recent events (last 2 minutes)
    const cutoff = Date.now() - 120000;
    eventBuffer.current = eventBuffer.current.filter(e => e.timestamp > cutoff);

    // Update discovery state
    setDiscoveryState(prev => ({
      ...prev,
      recentEvents: eventBuffer.current.slice(-50) // Keep last 50 events for efficiency
    }));

    // Check all easter eggs for matches
    EASTER_EGG_CONFIGS.forEach(config => {
      // Skip if already discovered
      if (discoveryState.discoveryHistory.includes(config.id)) {
        return;
      }

      // Check requirements
      if (config.requirements) {
        if (config.requirements.moduleActive && 
            !config.requirements.moduleActive.includes(activeModule || '')) {
          return;
        }
        
        if (config.requirements.timeActive) {
          const moduleActiveTime = eventBuffer.current
            .filter(e => e.type === 'module-active' && e.moduleId === activeModule)
            .reduce((acc, e) => acc + (Date.now() - e.timestamp), 0);
          
          if (moduleActiveTime < config.requirements.timeActive) {
            return;
          }
        }
        
        if (config.requirements.interactions) {
          const interactions = eventBuffer.current
            .filter(e => e.type === 'interaction')
            .length;
          
          if (interactions < config.requirements.interactions) {
            return;
          }
        }
      }

      // Check each trigger for matches
      let maxConfidence = 0;
      
      config.triggers.forEach(trigger => {
        let confidence = 0;
        
        switch (trigger.type) {
          case 'sequence':
            confidence = patternEngine.current.detectSequencePattern(
              eventBuffer.current, 
              trigger.data as string[]
            );
            break;
            
          case 'pattern':
            const patternData = trigger.data as any;
            if (patternData.pattern) {
              confidence = patternEngine.current.detectMousePattern(
                eventBuffer.current, 
                patternData.pattern
              );
            } else if (patternData.rhythm) {
              confidence = patternEngine.current.detectTimingPattern(
                eventBuffer.current, 
                patternData
              );
            }
            break;
            
          case 'combination':
            confidence = patternEngine.current.detectCombinationPattern(
              eventBuffer.current, 
              trigger.data as any
            );
            break;
        }
        
        maxConfidence = Math.max(maxConfidence, confidence);
      });

      // Update pattern tracker
      const trackerId = config.id;
      const tracker = discoveryState.activePatterns.get(trackerId) || {
        easterEggId: config.id,
        trigger: config.triggers[0],
        matchProgress: 0,
        lastActivity: Date.now(),
        attempts: 0,
        confidence: 0
      };

      tracker.confidence = maxConfidence;
      tracker.lastActivity = Date.now();

      if (maxConfidence > 0.1) {
        tracker.attempts++;
      }

      // Discovery threshold based on difficulty
      const thresholds = [0, 0.9, 0.85, 0.8, 0.75, 0.7];
      const threshold = thresholds[config.difficulty] || 0.9;

      if (maxConfidence >= threshold) {
        // Easter egg discovered!
        console.log(`🎉 Easter egg discovered: ${config.id} (confidence: ${maxConfidence.toFixed(2)})`);
        
        setDiscoveryState(prev => ({
          ...prev,
          discoveryHistory: [...prev.discoveryHistory, config.id]
        }));

        onEasterEggDiscovered(config.id, config.reward);

        // Remove from active patterns
        discoveryState.activePatterns.delete(trackerId);
      } else {
        // Update progress
        discoveryState.activePatterns.set(trackerId, tracker);
        discoveryState.discoveryProgress.set(config.id, maxConfidence);
      }
    });
  }, [discoveryState, activeModule, onEasterEggDiscovered]);

  // Event listeners
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      processEvent({
        type: 'keyboard',
        data: { key: event.key, code: event.code },
        timestamp: Date.now(),
        moduleId: activeModule || 'global'
      });
    };

    const handleMouse = (event: MouseEvent) => {
      processEvent({
        type: 'mouse',
        data: { x: event.clientX, y: event.clientY },
        timestamp: Date.now(),
        moduleId: activeModule || 'global'
      });
    };

    const handleScroll = (event: WheelEvent) => {
      processEvent({
        type: 'scroll',
        data: { deltaY: event.deltaY, deltaX: event.deltaX },
        timestamp: Date.now(),
        moduleId: activeModule || 'global'
      });
    };

    window.addEventListener('keydown', handleKeyboard);
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('wheel', handleScroll);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [processEvent, activeModule]);

  // Cleanup inactive patterns
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setDiscoveryState(prev => {
        const newActivePatterns = new Map(prev.activePatterns);
        
        for (const [id, tracker] of newActivePatterns) {
          if (now - tracker.lastActivity > 30000) { // 30 seconds inactive
            newActivePatterns.delete(id);
          }
        }
        
        return { ...prev, activePatterns: newActivePatterns };
      });
    }, 10000);

    return () => clearInterval(cleanup);
  }, []);

  return null; // This is a background service component
}

export { EASTER_EGG_CONFIGS, PatternRecognitionEngine };