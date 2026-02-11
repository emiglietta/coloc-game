import { create } from 'zustand';
import { Session, Team, Card, SessionStatus } from './models';
import { cards as allCards, experiments, reviewIssueCards, reviewDetailsCards } from './data';

export interface GameState {
  sessions: Record<string, Session>;
  teams: Record<string, Team>;
  currentSessionId: string | null;
  role: 'gm' | 'team' | null;
  currentTeamId: string | null;

  createSession(settings: Session['settings']): Session;
  joinSessionAsTeam(sessionCode: string, name: string, members: Team['members']): Team | null;
  setTeamExperiment(teamId: string, experimentNumber: 1 | 2 | 3 | 4 | 5 | 6, isLive: boolean): void;
  setRole(role: 'gm' | 'team'): void;
  setCurrentSession(sessionId: string | null): void;
  setCurrentTeam(teamId: string | null): void;
  advancePhase(sessionId: string): void;
  previousPhase(sessionId: string): void;
  selectCard(teamId: string, phase: 'acquisition' | 'analysis' | 'details', card: Card): void;
  deselectCard(teamId: string, phase: 'acquisition' | 'analysis' | 'details', cardId: string): void;
  assignReviewerConcern(teamId: string, card: Card): void;
  unassignReviewerConcern(teamId: string, cardId: string): void;
  assignReviewerDetail(teamId: string, card: Card): void;
  unassignReviewerDetail(teamId: string, cardId: string): void;
}

const genId = () => crypto.randomUUID();

const calcTimeCost = (team: Team): number => {
  const plan =
    [...team.selectedCards.acquisition, ...team.selectedCards.analysis, ...team.selectedCards.details].reduce(
      (sum, c) => sum + c.timeCost,
      0
    );
  const concerns = (team.reviewOutcome.assignedConcerns || []).reduce((sum, c) => sum + c.timeCost, 0);
  const details = (team.reviewOutcome.assignedDetails || []).reduce((sum, c) => sum + c.timeCost, 0);
  return plan + concerns + details;
};

const nextPhase: Record<SessionStatus, SessionStatus> = {
  setup: 'team-formation',
  'team-formation': 'acquisition',
  acquisition: 'analysis',
  analysis: 'review',
  review: 'complete',
  complete: 'complete'
};

const prevPhase: Record<SessionStatus, SessionStatus> = {
  setup: 'setup',
  'team-formation': 'setup',
  acquisition: 'team-formation',
  analysis: 'acquisition',
  review: 'analysis',
  complete: 'review'
};

export const useGameStore = create<GameState>((set, get) => ({
  sessions: {},
  teams: {},
  currentSessionId: null,
  role: null,
  currentTeamId: null,

  setRole: (role) => set({ role }),
  setCurrentSession: (currentSessionId) => set({ currentSessionId }),
  setCurrentTeam: (currentTeamId) => set({ currentTeamId }),

  createSession: (settings) => {
    const id = genId();
    const now = Date.now();
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gmCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session: Session = {
      id,
      gmCode,
      sessionCode,
      status: 'setup',
      settings,
      currentPhase: 'team-formation',
      phaseEndTime: null,
      createdAt: now
    };
    set((state) => ({
      sessions: { ...state.sessions, [id]: session },
      currentSessionId: id,
      role: 'gm'
    }));
    return session;
  },

  joinSessionAsTeam: (sessionCode, name, members) => {
    const { sessions } = get();
    const session = Object.values(sessions).find((s) => s.sessionCode === sessionCode);
    if (!session) return null;
    const id = genId();
    // Default experiment; GM can adjust manually in dashboard
    const experimentDef = experiments[0];
    const team: Team = {
      id,
      sessionId: session.id,
      name,
      members,
      experiment: {
        number: experimentDef.id,
        isLive: false
      },
      selectedCards: {
        acquisition: [],
        analysis: [],
        details: []
      },
      totalTimeCost: 0,
      status: 'planning',
      reviewOutcome: {
        concerns: [],
        defenses: [],
        finalScore: 0,
        assignedConcerns: [],
        assignedDetails: []
      }
    };
    set((state) => ({
      teams: { ...state.teams, [id]: team },
      currentTeamId: id,
      role: 'team',
      currentSessionId: session.id
    }));
    return team;
  },

  setTeamExperiment: (teamId, experimentNumber, isLive) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const updated: Team = {
        ...team,
        experiment: {
          number: experimentNumber,
          isLive
        }
      };
      return {
        teams: { ...state.teams, [teamId]: updated }
      };
    }),

  advancePhase: (sessionId) =>
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const updated: Session = {
        ...session,
        currentPhase: nextPhase[session.currentPhase],
        status: nextPhase[session.status]
      };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    }),

  previousPhase: (sessionId) =>
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const phase = prevPhase[session.currentPhase];
      if (phase === session.currentPhase) return state;
      const updated: Session = {
        ...session,
        currentPhase: phase,
        status: phase
      };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    }),

  selectCard: (teamId, phase, card) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      // Validation: prevent duplicates
      const alreadySelected = team.selectedCards[phase].some((c) => c.id === card.id);
      if (alreadySelected) return state;

      // Validation: mutual exclusions
      const incompatibleSelected = [
        ...team.selectedCards.acquisition,
        ...team.selectedCards.analysis,
        ...team.selectedCards.details
      ].some((c) => c.incompatibleWith.includes(card.id) || card.incompatibleWith.includes(c.id));
      if (incompatibleSelected) return state;

      // Validation: requirements
      if (card.requires.length > 0) {
        const allSelectedIds = [
          ...team.selectedCards.acquisition,
          ...team.selectedCards.analysis,
          ...team.selectedCards.details
        ].map((c) => c.id);
        const missingRequirement = card.requires.every((req) => !allSelectedIds.includes(req));
        if (missingRequirement) return state;
      }

      const updatedTeam: Team = {
        ...team,
        selectedCards: {
          ...team.selectedCards,
          [phase]: [...team.selectedCards[phase], card]
        }
      };
      updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);

      return {
        teams: { ...state.teams, [teamId]: updatedTeam }
      };
    }),

  deselectCard: (teamId, phase, cardId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const updatedTeam: Team = {
        ...team,
        selectedCards: {
          ...team.selectedCards,
          [phase]: team.selectedCards[phase].filter((c) => c.id !== cardId)
        }
      };
      updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);
      return {
        teams: { ...state.teams, [teamId]: updatedTeam }
      };
    }),

  assignReviewerConcern: (teamId, card) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const concerns = team.reviewOutcome.assignedConcerns || [];
      if (concerns.some((c) => c.id === card.id)) return state;
      const updated: Team = {
        ...team,
        reviewOutcome: {
          ...team.reviewOutcome,
          assignedConcerns: [...concerns, card]
        }
      };
      updated.totalTimeCost = calcTimeCost(updated);
      return { teams: { ...state.teams, [teamId]: updated } };
    }),

  unassignReviewerConcern: (teamId, cardId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const concerns = (team.reviewOutcome.assignedConcerns || []).filter((c) => c.id !== cardId);
      const updated: Team = {
        ...team,
        reviewOutcome: { ...team.reviewOutcome, assignedConcerns: concerns }
      };
      updated.totalTimeCost = calcTimeCost(updated);
      return { teams: { ...state.teams, [teamId]: updated } };
    }),

  assignReviewerDetail: (teamId, card) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const details = team.reviewOutcome.assignedDetails || [];
      if (details.some((c) => c.id === card.id)) return state;
      const updated: Team = {
        ...team,
        reviewOutcome: {
          ...team.reviewOutcome,
          assignedDetails: [...details, card]
        }
      };
      updated.totalTimeCost = calcTimeCost(updated);
      return { teams: { ...state.teams, [teamId]: updated } };
    }),

  unassignReviewerDetail: (teamId, cardId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const details = (team.reviewOutcome.assignedDetails || []).filter((c) => c.id !== cardId);
      const updated: Team = {
        ...team,
        reviewOutcome: { ...team.reviewOutcome, assignedDetails: details }
      };
      updated.totalTimeCost = calcTimeCost(updated);
      return { teams: { ...state.teams, [teamId]: updated } };
    })
}));

export const availableCards = allCards;

