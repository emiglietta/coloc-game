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
    teamFormationTime: number;
    acquisitionTime: number;
    analysisTime: number;
    gameMode: GameMode;
    /** When true (default), participants cannot switch to GM view. */
    blockParticipantsFromGM?: boolean;
    /** When true (default), play countdown sounds (tick in last 10s, end sound at 0). */
    countdownSoundEnabled?: boolean;
    /** End sound type: 'alarm' (beep beep) or 'bomb' (explosion). Default 'alarm'. */
    countdownSoundType?: 'alarm' | 'bomb';
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
  /** When set, at least one of these card IDs must be selected. */
  requiresAnyOf?: string[];
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
    /** 0 = not yet assigned (GM or dice); 1–6 = experiment id */
    number: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isLive: boolean;
    /** Last dice roll that assigned this experiment (d1 = experiment 1–6, d2 = odd LIVE / even FIXED). */
    lastRoll?: { d1: number; d2: number };
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
  /** Dice roll result (1–6) per assigned details card. 1–3 = failed (can't use, add timeCost). 4–6 = success. */
  detailsRollResults?: Record<string, number>;
  /** Card IDs in selectedCards that were added by the GM during review (show magenta outline). */
  gmAddedCardIds?: string[];
}

export interface ExperimentDefinition {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  stainings: string[];
  question: string;
  iconPath?: string;
}

