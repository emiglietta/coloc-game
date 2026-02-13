/**
 * Shared game state logic for the server. Mirrors the client store actions.
 * Each handler takes (state, payload) and returns { state, ack? }.
 */

const genId = () => crypto.randomUUID();

function calcTimeCost(team) {
  const plan = [
    ...team.selectedCards.acquisition,
    ...team.selectedCards.analysis,
    ...team.selectedCards.details
  ].reduce((sum, c) => sum + c.timeCost, 0);
  const concerns = (team.reviewOutcome?.assignedConcerns || []).reduce((sum, c) => sum + c.timeCost, 0);
  const details = (team.reviewOutcome?.assignedDetails || []).reduce((sum, c) => sum + c.timeCost, 0);
  return plan + concerns + details;
}

const nextPhase = {
  setup: 'team-formation',
  'team-formation': 'acquisition',
  acquisition: 'analysis',
  analysis: 'review',
  review: 'complete',
  complete: 'complete'
};

const prevPhase = {
  setup: 'setup',
  'team-formation': 'setup',
  acquisition: 'team-formation',
  analysis: 'acquisition',
  review: 'analysis',
  complete: 'review'
};

export function createSession(state, { settings }) {
  const id = genId();
  const now = Date.now();
  const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const gmCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const teamFormationMinutes = settings.teamFormationTime ?? 4;
  const session = {
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
  return {
    state: {
      sessions: { ...state.sessions, [id]: session },
      teams: state.teams
    },
    ack: { sessionId: id, session }
  };
}

export function joinSessionAsTeam(state, { sessionCode, name, members }) {
  const session = Object.values(state.sessions).find((s) => s.sessionCode === sessionCode);
  if (!session) return { state, ack: { error: 'Session not found' } };
  const id = genId();
  const team = {
    id,
    sessionId: session.id,
    name,
    members,
    experiment: { number: 0, isLive: false },
    selectedCards: { acquisition: [], analysis: [], details: [] },
    totalTimeCost: 0,
    status: 'planning',
    reviewOutcome: {
      concerns: [],
      defenses: [],
      finalScore: 0,
      assignedConcerns: [],
      assignedDetails: []
    },
    gmAddedCardIds: []
  };
  return {
    state: {
      sessions: state.sessions,
      teams: { ...state.teams, [id]: team }
    },
    ack: { teamId: id, sessionId: session.id, team, session }
  };
}

export function setTeamExperiment(state, { teamId, experimentNumber, isLive, lastRoll }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const updated = {
    ...team,
    experiment: { number: experimentNumber, isLive, lastRoll }
  };
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updated } }
  };
}

export function advancePhase(state, { sessionId }) {
  const session = state.sessions[sessionId];
  if (!session) return { state };
  const newPhase = nextPhase[session.currentPhase];
  let phaseEndTime = null;
  if (newPhase === 'acquisition') {
    phaseEndTime = Date.now() + session.settings.acquisitionTime * 60 * 1000;
  } else if (newPhase === 'analysis') {
    phaseEndTime = Date.now() + session.settings.analysisTime * 60 * 1000;
  }
  const updated = {
    ...session,
    currentPhase: newPhase,
    status: newPhase,
    phaseEndTime: phaseEndTime ?? session.phaseEndTime
  };
  return {
    state: { sessions: { ...state.sessions, [sessionId]: updated }, teams: state.teams }
  };
}

export function previousPhase(state, { sessionId }) {
  const session = state.sessions[sessionId];
  if (!session) return { state };
  const phase = prevPhase[session.currentPhase];
  if (phase === session.currentPhase) return { state };
  const teamFormationMinutes = session.settings.teamFormationTime ?? 4;
  const phaseEndTime = phase === 'team-formation' ? Date.now() + teamFormationMinutes * 60 * 1000 : null;
  const updated = {
    ...session,
    currentPhase: phase,
    status: phase,
    phaseEndTime
  };
  return {
    state: { sessions: { ...state.sessions, [sessionId]: updated }, teams: state.teams }
  };
}

export function adjustPhaseTimer(state, { sessionId, deltaMinutes }) {
  const session = state.sessions[sessionId];
  if (!session || session.phaseEndTime == null) return { state };
  const deltaMs = deltaMinutes * 60 * 1000;
  const updated = {
    ...session,
    phaseEndTime: Math.max(Date.now() + 60 * 1000, session.phaseEndTime + deltaMs)
  };
  return {
    state: { sessions: { ...state.sessions, [sessionId]: updated }, teams: state.teams }
  };
}

export function setShowTimerToParticipants(state, { sessionId, show }) {
  const session = state.sessions[sessionId];
  if (!session) return { state };
  const updated = { ...session, showTimerToParticipants: show };
  return {
    state: { sessions: { ...state.sessions, [sessionId]: updated }, teams: state.teams }
  };
}

export function selectCard(state, { teamId, phase, card }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const alreadySelected = team.selectedCards[phase].some((c) => c.id === card.id);
  if (alreadySelected) return { state };
  const incompatibleSelected = [
    ...team.selectedCards.acquisition,
    ...team.selectedCards.analysis,
    ...team.selectedCards.details
  ].some((c) => (c.incompatibleWith || []).includes(card.id) || (card.incompatibleWith || []).includes(c.id));
  if (incompatibleSelected) return { state };
  if ((card.requires || []).length > 0) {
    const allSelectedIds = [
      ...team.selectedCards.acquisition,
      ...team.selectedCards.analysis,
      ...team.selectedCards.details
    ].map((c) => c.id);
    const missingRequirement = card.requires.every((req) => !allSelectedIds.includes(req));
    if (missingRequirement) return { state };
  }
  const updatedTeam = {
    ...team,
    selectedCards: {
      ...team.selectedCards,
      [phase]: [...team.selectedCards[phase], card]
    }
  };
  updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updatedTeam } }
  };
}

export function deselectCard(state, { teamId, phase, cardId }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const updatedTeam = {
    ...team,
    selectedCards: {
      ...team.selectedCards,
      [phase]: team.selectedCards[phase].filter((c) => c.id !== cardId)
    }
  };
  updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updatedTeam } }
  };
}

export function assignReviewerConcern(state, { teamId, card }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const concerns = team.reviewOutcome?.assignedConcerns || [];
  if (concerns.some((c) => c.id === card.id)) return { state };
  const updated = {
    ...team,
    reviewOutcome: {
      ...team.reviewOutcome,
      assignedConcerns: [...concerns, card]
    }
  };
  updated.totalTimeCost = calcTimeCost(updated);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updated } }
  };
}

export function unassignReviewerConcern(state, { teamId, cardId }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const concerns = (team.reviewOutcome?.assignedConcerns || []).filter((c) => c.id !== cardId);
  const updated = {
    ...team,
    reviewOutcome: { ...team.reviewOutcome, assignedConcerns: concerns }
  };
  updated.totalTimeCost = calcTimeCost(updated);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updated } }
  };
}

export function assignReviewerDetail(state, { teamId, card }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const details = team.reviewOutcome?.assignedDetails || [];
  if (details.some((c) => c.id === card.id)) return { state };
  const updated = {
    ...team,
    reviewOutcome: {
      ...team.reviewOutcome,
      assignedDetails: [...details, card]
    }
  };
  updated.totalTimeCost = calcTimeCost(updated);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updated } }
  };
}

export function unassignReviewerDetail(state, { teamId, cardId }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const details = (team.reviewOutcome?.assignedDetails || []).filter((c) => c.id !== cardId);
  const updated = {
    ...team,
    reviewOutcome: { ...team.reviewOutcome, assignedDetails: details }
  };
  updated.totalTimeCost = calcTimeCost(updated);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updated } }
  };
}

export function gmAddCardToTeam(state, { teamId, phase, card }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const alreadySelected = team.selectedCards[phase].some((c) => c.id === card.id);
  if (alreadySelected) return { state };
  const gmAddedIds = team.gmAddedCardIds || [];
  const updatedTeam = {
    ...team,
    selectedCards: {
      ...team.selectedCards,
      [phase]: [...team.selectedCards[phase], card]
    },
    gmAddedCardIds: [...gmAddedIds, card.id]
  };
  updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updatedTeam } }
  };
}

export function gmRemoveCardFromTeam(state, { teamId, phase, cardId }) {
  const team = state.teams[teamId];
  if (!team) return { state };
  const gmAddedIds = (team.gmAddedCardIds || []).filter((id) => id !== cardId);
  const updatedTeam = {
    ...team,
    selectedCards: {
      ...team.selectedCards,
      [phase]: team.selectedCards[phase].filter((c) => c.id !== cardId)
    },
    gmAddedCardIds: gmAddedIds
  };
  updatedTeam.totalTimeCost = calcTimeCost(updatedTeam);
  return {
    state: { sessions: state.sessions, teams: { ...state.teams, [teamId]: updatedTeam } }
  };
}

const actions = {
  createSession,
  joinSessionAsTeam,
  setTeamExperiment,
  advancePhase,
  previousPhase,
  adjustPhaseTimer,
  setShowTimerToParticipants,
  selectCard,
  deselectCard,
  assignReviewerConcern,
  unassignReviewerConcern,
  assignReviewerDetail,
  unassignReviewerDetail,
  gmAddCardToTeam,
  gmRemoveCardFromTeam
};

export function applyAction(state, type, payload) {
  const fn = actions[type];
  if (!fn) return { state, ack: { error: `Unknown action: ${type}` } };
  return fn(state, payload);
}
