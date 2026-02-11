export type SessionStatus =
  | 'setup'
  | 'team-formation'
  | 'acquisition'
  | 'analysis'
  | 'review'
  | 'complete';

export type GameMode = 'time-attack' | 'budget';

export interface Session {
  id: string;
  gmCode: string;
  sessionCode: string;
  status: SessionStatus;
  settings: {
    numTeams: number;
    acquisitionTime: number;
    analysisTime: number;
    gameMode: GameMode;
  };
  currentPhase: SessionStatus;
  phaseEndTime: number | null;
  /** When true, participants see the phase countdown timer. */
  showTimerToParticipants: boolean;
  createdAt: number;
}

export interface TeamMembers {
  pi: string;
  microscopeTech: string;
  postdoc: string;
  gradStudent: string;
}

export type CardCategory = 'microscopy' | 'analysis' | 'details' | 'review';

export interface Card {
  id: string;
  name: string;
  description: string;
  category: CardCategory;
  timeCost: number;
  incompatibleWith: string[];
  requires: string[];
  tags: string[];
  iconPath?: string;
}

export interface DefenseAttempt {
  cardId: string;
  roll: number;
  success: boolean;
}

export interface ReviewCard {
  id: string;
  name: string;
  description: string;
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  members: TeamMembers;
  experiment: {
    number: 1 | 2 | 3 | 4 | 5 | 6;
    isLive: boolean;
  };
  selectedCards: {
    acquisition: Card[];
    analysis: Card[];
    details: Card[];
  };
  totalTimeCost: number;
  status: 'planning' | 'submitted' | 'reviewed';
  reviewOutcome: {
    concerns: ReviewCard[];
    defenses: DefenseAttempt[];
    finalScore: number;
    /** Issue cards assigned by GM (Reviewer's concerns); add timeCost to team total. */
    assignedConcerns: Card[];
    /** Details cards assigned by GM (Experimental details); add timeCost to team total. */
    assignedDetails: Card[];
  };
}

export interface ExperimentDefinition {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  stainings: string[];
  question: string;
  iconPath?: string;
}

