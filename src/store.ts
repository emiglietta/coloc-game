import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { Session, Team, Card, SessionStatus } from './models';
import { cards as allCards, experiments, reviewIssueCards, reviewDetailsCards } from './data';

export interface GameState {
  sessions: Record<string, Session>;
  teams: Record<string, Team>;
  currentSessionId: string | null;
  role: 'gm' | 'team' | null;
  currentTeamId: string | null;
  socket: Socket | null;

  setSocket(socket: Socket | null): void;
  createSession(settings: Session['settings']): Session;
  joinSessionAsTeam(sessionCode: string, name: string, members: Team['members']): Team | null;
  setTeamExperiment(
    teamId: string,
    experimentNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    isLive: boolean,
    lastRoll?: { d1: number; d2: number }
  ): void;
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
  adjustPhaseTimer(sessionId: string, deltaMinutes: number): void;
  setShowTimerToParticipants(sessionId: string, show: boolean): void;
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
  socket: null,

  setRole: (role) => set({ role }),
  setCurrentSession: (currentSessionId) => set({ currentSessionId }),
  setCurrentTeam: (currentTeamId) => set({ currentTeamId }),
  setSocket: (socket) => set({ socket }),

  createSession: (settings) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'createSession', payload: { settings } }, (ack: { sessionId?: string }) => {
        if (ack?.sessionId) set({ currentSessionId: ack.sessionId, role: 'gm' });
      });
      return null!;
    }
    const id = genId();
    const now = Date.now();
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gmCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const teamFormationMinutes = settings.teamFormationTime ?? 4;
    const session: Session = {
      id,
      gmCode,
      sessionCode,
      status: 'setup',
      settings: { ...settings, teamFormationTime: teamFormationMinutes },
      currentPhase: 'team-formation',
      phaseEndTime: Date.now() + teamFormationMinutes * 60 * 1000,
      showTimerToParticipants: true,
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
    const { socket, sessions } = get();
    if (socket?.connected) {
      socket.emit(
        'action',
        { type: 'joinSessionAsTeam', payload: { sessionCode, name, members } },
        (ack: { teamId?: string; sessionId?: string }) => {
          if (ack?.teamId) set({ currentTeamId: ack.teamId, currentSessionId: ack.sessionId ?? null, role: 'team' });
        }
      );
      return null;
    }
    const session = Object.values(sessions).find((s) => s.sessionCode === sessionCode);
    if (!session) return null;
    const id = genId();
    const team: Team = {
      id,
      sessionId: session.id,
      name,
      members,
      experiment: {
        number: 0,
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

  setTeamExperiment: (teamId, experimentNumber, isLive, lastRoll) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'setTeamExperiment', payload: { teamId, experimentNumber, isLive, lastRoll } });
      return;
    }
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;
      const updated: Team = {
        ...team,
        experiment: {
          number: experimentNumber,
          isLive,
          lastRoll
        }
      };
      return {
        teams: { ...state.teams, [teamId]: updated }
      };
    });
  },

  advancePhase: (sessionId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'advancePhase', payload: { sessionId } });
      return;
    }
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const newPhase = nextPhase[session.currentPhase];
      let phaseEndTime: number | null = null;
      if (newPhase === 'acquisition') {
        phaseEndTime = Date.now() + session.settings.acquisitionTime * 60 * 1000;
      } else if (newPhase === 'analysis') {
        phaseEndTime = Date.now() + session.settings.analysisTime * 60 * 1000;
      }
      const updated: Session = {
        ...session,
        currentPhase: newPhase,
        status: newPhase,
        phaseEndTime: phaseEndTime ?? session.phaseEndTime
      };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    });
  },

  adjustPhaseTimer: (sessionId, deltaMinutes) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'adjustPhaseTimer', payload: { sessionId, deltaMinutes } });
      return;
    }
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session || session.phaseEndTime == null) return state;
      const deltaMs = deltaMinutes * 60 * 1000;
      const updated: Session = {
        ...session,
        phaseEndTime: Math.max(Date.now() + 60 * 1000, session.phaseEndTime + deltaMs)
      };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    });
  },

  setShowTimerToParticipants: (sessionId, show) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'setShowTimerToParticipants', payload: { sessionId, show } });
      return;
    }
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const updated: Session = { ...session, showTimerToParticipants: show };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    });
  },

  previousPhase: (sessionId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'previousPhase', payload: { sessionId } });
      return;
    }
    set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return state;
      const phase = prevPhase[session.currentPhase];
      if (phase === session.currentPhase) return state;
      const teamFormationMinutes = session.settings.teamFormationTime ?? 4;
      const phaseEndTime =
        phase === 'team-formation' ? Date.now() + teamFormationMinutes * 60 * 1000 : null;
      const updated: Session = {
        ...session,
        currentPhase: phase,
        status: phase,
        phaseEndTime
      };
      return {
        sessions: { ...state.sessions, [sessionId]: updated }
      };
    });
  },

  selectCard: (teamId, phase, card) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'selectCard', payload: { teamId, phase, card } });
      return;
    }
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
    });
  },

  deselectCard: (teamId, phase, cardId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'deselectCard', payload: { teamId, phase, cardId } });
      return;
    }
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
    });
  },

  assignReviewerConcern: (teamId, card) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'assignReviewerConcern', payload: { teamId, card } });
      return;
    }
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
    });
  },

  unassignReviewerConcern: (teamId, cardId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'unassignReviewerConcern', payload: { teamId, cardId } });
      return;
    }
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
    });
  },

  assignReviewerDetail: (teamId, card) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'assignReviewerDetail', payload: { teamId, card } });
      return;
    }
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
    });
  },

  unassignReviewerDetail: (teamId, cardId) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('action', { type: 'unassignReviewerDetail', payload: { teamId, cardId } });
      return;
    }
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
    });
  }
}));

export const availableCards = allCards;

