import React from 'react';
import { useGameStore, availableCards } from './store';
import { Card, SessionStatus } from './models';
import { experiments, reviewIssueCards, reviewDetailsCards } from './data';
import { assetPath } from './assetPath';

const phaseLabel: Record<SessionStatus, string> = {
  setup: 'Setup',
  'team-formation': 'Team Formation',
  acquisition: 'Acquisition Planning',
  analysis: 'Analysis Planning',
  review: 'Review & Defense',
  complete: 'Complete'
};

/** Countdown from phaseEndTime; red when <= 2 minutes. Updates every second. */
function PhaseTimer({ session }: { session: { phaseEndTime: number | null; currentPhase: SessionStatus } }) {
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (session.phaseEndTime == null) {
      setRemainingSeconds(null);
      return;
    }
    const tick = () => {
      const sec = Math.max(0, Math.floor((session.phaseEndTime! - Date.now()) / 1000));
      setRemainingSeconds(sec);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.phaseEndTime]);

  if (remainingSeconds == null || session.phaseEndTime == null) return null;

  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  const isLow = remainingSeconds <= 120; // 2 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xl tabular-nums ${
        isLow ? 'border-red-500/80 bg-red-950/40 text-red-200' : 'border-slate-600 bg-slate-800/60 text-slate-100'
      }`}
      title="Phase time remaining"
    >
      <span aria-hidden>⏱</span>
      <span>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </div>
  );
}

const categoryColor: Record<Card['category'], string> = {
  microscopy: 'from-pink-500/80 to-sky-500/80',
  analysis: 'from-emerald-500/80 to-lime-500/80',
  details: 'from-amber-400/80 to-yellow-500/80',
  review: 'from-orange-500/80 to-red-500/80'
};

function ClockIcons({ count }: { count: number }) {
  return (
    <span className="text-xs">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i}>⏰</span>
      ))}
    </span>
  );
}

function CardPill({ card, onClick, selected }: { card: Card; onClick?: () => void; selected?: boolean }) {
  const hoverText = `${card.name}${card.description ? ` — ${card.description}` : ''} (Time cost: ${card.timeCost} ⏰${card.tags.length ? `; Tags: ${card.tags.join(', ')}` : ''})`;
  return (
    <button
      type="button"
      onClick={onClick}
      title={hoverText}
      className={`flex items-center justify-center rounded-lg border border-slate-600/40 bg-slate-900/50 p-1 transition hover:border-slate-500/60 ${
        selected ? 'ring-2 ring-sky-400' : ''
      }`}
    >
      <div className="flex flex-col items-center">
        {card.iconPath && (
          <img
            src={assetPath(card.iconPath)}
            alt={card.name}
            className="h-40 w-40 md:h-48 md:w-48 flex-none rounded-md object-contain"
          />
        )}
      </div>
    </button>
  );
}

export function RoleSelector() {
  const { role, setRole, currentTeamId } = useGameStore();
  const isParticipant = role === 'team' && currentTeamId != null;
  return (
    <div className="mb-6 flex gap-3">
      <button
        type="button"
        className={`card flex-1 text-center ${role === 'gm' ? 'ring-2 ring-sky-300' : ''} ${isParticipant ? 'pointer-events-none opacity-50' : ''}`}
        onClick={() => !isParticipant && setRole('gm')}
        disabled={isParticipant}
        title={isParticipant ? 'Joined as participant—GM access blocked' : ''}
      >
        <h2 className="text-lg font-semibold">Game Master</h2>
        <p className="mt-1 text-sm text-slate-100/80">Create and control sessions.</p>
      </button>
      <button
        type="button"
        className={`card flex-1 text-center ${role === 'team' ? 'ring-2 ring-emerald-300' : ''}`}
        onClick={() => setRole('team')}
      >
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="mt-1 text-sm text-slate-100/80">Join a session and plan experiments.</p>
      </button>
    </div>
  );
}

const acquisitionCardPool = availableCards.filter((c) => c.category === 'microscopy');
const analysisCardPool = availableCards.filter((c) => c.category === 'analysis');

export function GMDashboard() {
  const {
    sessions,
    currentSessionId,
    createSession,
    joinSessionAsGM,
    teams,
    advancePhase,
    previousPhase,
    setTeamExperiment,
    assignReviewerConcern,
    unassignReviewerConcern,
    assignReviewerDetail,
    unassignReviewerDetail,
    gmAddCardToTeam,
    gmRemoveCardFromTeam,
    adjustPhaseTimer,
    setShowTimerToParticipants
  } = useGameStore();
  const [expandedTeamCards, setExpandedTeamCards] = React.useState<Record<string, boolean>>({});
  const session = currentSessionId ? sessions[currentSessionId] : null;

  const [numTeams, setNumTeams] = React.useState(4);
  const [teamFormationTime, setTeamFormationTime] = React.useState(4);
  const [acqTime, setAcqTime] = React.useState(10);
  const [analysisTime, setAnalysisTime] = React.useState(10);
  const [mode, setMode] = React.useState<'time-attack' | 'budget'>('time-attack');
  const [gmCodeInput, setGmCodeInput] = React.useState('');
  const [gmJoinError, setGmJoinError] = React.useState<string | null>(null);

  const handleJoinAsGM = () => {
    setGmJoinError(null);
    if (joinSessionAsGM(gmCodeInput.trim().toUpperCase())) return;
    setGmJoinError('No session found with that GM code.');
  };

  const sessionTeams = session
    ? Object.values(teams).filter((t) => t.sessionId === session.id)
    : [];

  const handleCreate = () => {
    createSession({
      numTeams,
      teamFormationTime,
      acquisitionTime: acqTime,
      analysisTime: analysisTime,
      gameMode: mode
    });
  };

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Join as additional GM</h3>
          <p className="mb-2 text-xs text-slate-400">Have a GM code from another Game Master? Enter it to co-manage the session.</p>
          <div className="flex gap-2">
            <input
              value={gmCodeInput}
              onChange={(e) => setGmCodeInput(e.target.value)}
              placeholder="GM code (e.g. XY7Z2A)"
              className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm uppercase"
            />
            <button
              type="button"
              onClick={handleJoinAsGM}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Join session
            </button>
          </div>
          {gmJoinError && <p className="mt-2 text-xs text-red-400">{gmJoinError}</p>}
        </div>
        <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create new session</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Number of teams
            <input
              type="number"
              min={2}
              max={8}
              value={numTeams}
              onChange={(e) => setNumTeams(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Team formation time (min)
            <input
              type="number"
              min={1}
              value={teamFormationTime}
              onChange={(e) => setTeamFormationTime(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Acquisition time (min)
            <input
              type="number"
              min={1}
              value={acqTime}
              onChange={(e) => setAcqTime(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Analysis time (min)
            <input
              type="number"
              min={1}
              value={analysisTime}
              onChange={(e) => setAnalysisTime(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Game mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            >
              <option value="time-attack">Time Attack</option>
              <option value="budget">Budget Mode</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          Create Session
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Session {session.sessionCode}</h2>
          <p className="text-xs text-slate-100/80">
            GM code: <span className="font-mono">{session.gmCode}</span> • Mode:{' '}
            <span className="capitalize">{session.settings.gameMode}</span>
          </p>
          <p className="mt-1 text-xs text-sky-100">
            Current phase: <span className="font-semibold">{phaseLabel[session.currentPhase]}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <PhaseTimer session={session} />
            {session.phaseEndTime != null && (
              <div className="flex items-center gap-1 rounded border border-slate-600 bg-slate-800/50 px-2 py-1">
                <span className="text-[10px] text-slate-400">Timer:</span>
                <button
                  type="button"
                  onClick={() => adjustPhaseTimer(session.id, -1)}
                  className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-200 hover:bg-slate-600"
                  title="Subtract 1 minute"
                >
                  −1 min
                </button>
                <button
                  type="button"
                  onClick={() => adjustPhaseTimer(session.id, 1)}
                  className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-200 hover:bg-slate-600"
                  title="Add 1 minute"
                >
                  +1 min
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={session.showTimerToParticipants !== false}
                onChange={(e) => setShowTimerToParticipants(session.id, e.target.checked)}
                className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              />
              Show timer to participants
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => previousPhase(session.id)}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-500"
            >
              Previous phase
            </button>
            <button
              type="button"
              onClick={() => advancePhase(session.id)}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Advance phase
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold">Teams</h3>
        {sessionTeams.length === 0 && (
          <p className="text-xs text-slate-300">Waiting for teams to join using the session code.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {sessionTeams.map((team) => {
            const experiment = experiments.find((e) => e.id === team.experiment.number);
            const showCards = expandedTeamCards[team.id] ?? false;
            return (
              <div key={team.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{team.name}</h4>
                      {session.currentPhase === 'review' && (
                        <button
                          type="button"
                          onClick={() => setExpandedTeamCards((p) => ({ ...p, [team.id]: !p[team.id] }))}
                          className="text-[11px] text-sky-400 hover:text-sky-300"
                        >
                          {showCards ? 'Hide cards' : 'Show cards'}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {team.experiment.number === 0
                        ? 'No experiment assigned'
                        : `Experiment ${team.experiment.number} • ${team.experiment.isLive ? 'LIVE' : 'FIXED'}`}
                    </p>
                  </div>
                  <span className="pill bg-slate-800 text-xs">
                    Time: {team.totalTimeCost} <span className="ml-1">⏰</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-200">Experiment</span>
                    <select
                      value={team.experiment.number}
                      onChange={(e) =>
                        setTeamExperiment(team.id, Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6, team.experiment.isLive)
                      }
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                    >
                      <option value={0}>Choose experiment</option>
                      {experiments.map((exp) => (
                        <option key={exp.id} value={exp.id}>
                          {exp.id} – {exp.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ml-3 inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={team.experiment.isLive}
                      onChange={(e) =>
                        setTeamExperiment(team.id, team.experiment.number, e.target.checked)
                      }
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    />
                    <span className="text-slate-200">LIVE experiment</span>
                    {team.experiment.isLive && (
                      <img
                        src={assetPath('/cards/live-experiment.png')}
                        alt="Live experiment card"
                        className="ml-1 h-8 w-8 rounded border border-slate-700 bg-slate-950/60 object-contain"
                      />
                    )}
                  </label>
                </div>
              {showCards && (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] font-semibold text-slate-200">Selected cards</p>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                    {[...team.selectedCards.acquisition, ...team.selectedCards.analysis].map((c) => {
                      const isGmAdded = (team.gmAddedCardIds || []).includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className={`relative flex flex-col items-center flex-shrink-0 rounded border p-1 ${isGmAdded ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-slate-600 bg-slate-800/50'}`}
                          title={c.name}
                        >
                          {isGmAdded && (
                            <button
                              type="button"
                              onClick={() => gmRemoveCardFromTeam(team.id, team.selectedCards.acquisition.some(x => x.id === c.id) ? 'acquisition' : 'analysis', c.id)}
                              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-fuchsia-500 text-white text-[10px] leading-none hover:bg-fuchsia-400"
                              title="Remove (GM added)"
                            >
                              ×
                            </button>
                          )}
                          <img src={assetPath(c.iconPath)} alt={c.name} className="h-14 w-14 md:h-16 md:w-16 object-contain" />
                          <span className="mt-0.5 flex gap-0.5 text-[10px]">
                            {Array.from({ length: c.timeCost }).map((_, i) => (
                              <span key={i}>⏰</span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                    {(team.selectedCards.acquisition.length === 0 && team.selectedCards.analysis.length === 0) && (
                      <span className="text-xs text-slate-500 py-2">No cards</span>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2 grid gap-2 text-[11px] md:grid-cols-2">
                <div>
                  <p className="mb-1 font-semibold text-slate-200">Acquisition</p>
                  <ul className="space-y-1">
                    {team.selectedCards.acquisition.map((c) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <span className={(team.gmAddedCardIds || []).includes(c.id) ? 'text-fuchsia-300' : ''}>{c.name}</span>
                        <ClockIcons count={c.timeCost} />
                      </li>
                    ))}
                    {team.selectedCards.acquisition.length === 0 && (
                      <li className="text-slate-500">No cards yet</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-slate-200">Analysis</p>
                  <ul className="space-y-1">
                    {team.selectedCards.analysis.map((c) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <span className={(team.gmAddedCardIds || []).includes(c.id) ? 'text-fuchsia-300' : ''}>{c.name}</span>
                        <ClockIcons count={c.timeCost} />
                      </li>
                    ))}
                    {team.selectedCards.analysis.length === 0 && (
                      <li className="text-slate-500">No cards yet</li>
                    )}
                  </ul>
                </div>
              </div>
              {session.currentPhase === 'review' && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-slate-300">Add acquisition card</p>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {acquisitionCardPool
                        .filter((c) => !team.selectedCards.acquisition.some((x) => x.id === c.id))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => gmAddCardToTeam(team.id, 'acquisition', c)}
                            title={`${c.name} (+${c.timeCost}⏰)`}
                            className="flex flex-col items-center rounded border border-slate-600 bg-slate-800/50 p-1 hover:border-sky-500 min-w-0 w-16"
                          >
                            <img src={assetPath(c.iconPath)} alt={c.name} className="h-14 w-14 object-contain flex-shrink-0" />
                            <span className="mt-0.5 text-[9px] text-center break-words line-clamp-2 w-full">{c.name}</span>
                          </button>
                        ))}
                      {acquisitionCardPool.filter((c) => !team.selectedCards.acquisition.some((x) => x.id === c.id)).length === 0 && (
                        <span className="text-[10px] text-slate-500">All selected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-slate-300">Add analysis card</p>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {analysisCardPool
                        .filter((c) => !team.selectedCards.analysis.some((x) => x.id === c.id))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => gmAddCardToTeam(team.id, 'analysis', c)}
                            title={`${c.name} (+${c.timeCost}⏰)`}
                            className="flex flex-col items-center rounded border border-slate-600 bg-slate-800/50 p-1 hover:border-sky-500 min-w-0 w-16"
                          >
                            <img src={assetPath(c.iconPath)} alt={c.name} className="h-14 w-14 object-contain flex-shrink-0" />
                            <span className="mt-0.5 text-[9px] text-center break-words line-clamp-2 w-full">{c.name}</span>
                          </button>
                        ))}
                      {analysisCardPool.filter((c) => !team.selectedCards.analysis.some((x) => x.id === c.id)).length === 0 && (
                        <span className="text-[10px] text-slate-500">All selected</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {session.currentPhase === 'review' && (
                <div className="mt-3 space-y-3 border-t border-slate-700 pt-3">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-200">Reviewer&apos;s concerns (issue cards)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {reviewIssueCards.map((card) => {
                        const assigned = (team.reviewOutcome.assignedConcerns || []).some((c) => c.id === card.id);
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => (assigned ? unassignReviewerConcern(team.id, card.id) : assignReviewerConcern(team.id, card))}
                            title={card.name}
                            className={`flex flex-col items-center rounded border p-1 min-w-0 ${assigned ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800/50'}`}
                          >
                            <img src={assetPath(card.iconPath)} alt={card.name} className="h-24 w-24 md:h-28 md:w-28 object-contain flex-shrink-0" />
                            <span className="mt-0.5 text-[10px] text-center break-words line-clamp-2 w-full px-0.5" title={`${card.name} (+${card.timeCost} clock(s))`}>
                              {card.name}
                            </span>
                            <span className="mt-0.5 text-[10px]">
                              {Array.from({ length: card.timeCost }).map((_, i) => (
                                <span key={i}>⏰</span>
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-200">Experimental details (details cards)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {reviewDetailsCards.map((card) => {
                        const assigned = (team.reviewOutcome.assignedDetails || []).some((c) => c.id === card.id);
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => (assigned ? unassignReviewerDetail(team.id, card.id) : assignReviewerDetail(team.id, card))}
                            title={card.name}
                            className={`flex flex-col items-center rounded border p-1 min-w-0 ${assigned ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800/50'}`}
                          >
                            <img src={assetPath(card.iconPath)} alt={card.name} className="h-24 w-24 md:h-28 md:w-28 object-contain flex-shrink-0" />
                            <span className="mt-0.5 text-[10px] text-center break-words line-clamp-2 w-full px-0.5" title={`${card.name} (+${card.timeCost} clock(s))`}>
                              {card.name}
                            </span>
                            <span className="mt-0.5 text-[10px]">
                              {Array.from({ length: card.timeCost }).map((_, i) => (
                                <span key={i}>⏰</span>
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TeamView() {
  const { currentSessionId, sessions, currentTeamId, joinSessionAsTeam, joinExistingTeam, teams, selectCard, deselectCard, setTeamExperiment, joinError, isJoining, socket } =
    useGameStore();
  const [sessionCodeInput, setSessionCodeInput] = React.useState('');
  const [teamName, setTeamName] = React.useState('');
  const [pi, setPi] = React.useState('');
  const [tech, setTech] = React.useState('');
  const [postdoc, setPostdoc] = React.useState('');
  const [grad, setGrad] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  const session = currentSessionId ? sessions[currentSessionId] : null;
  const team = currentTeamId ? teams[currentTeamId] : null;

  const handleJoin = () => {
    setLocalError(null);
    const joined = joinSessionAsTeam(sessionCodeInput.trim().toUpperCase(), teamName, {
      pi,
      microscopeTech: tech,
      postdoc,
      gradStudent: grad
    });
    if (!joined && !socket?.connected) {
      setLocalError('Session not found. Check the code with your GM.');
    }
  };

  const error = joinError ?? localError;

  const isPlanningPhase = session?.currentPhase === 'acquisition' || session?.currentPhase === 'analysis';

  const handleExperimentAssign = React.useCallback(
    (expNum: 1 | 2 | 3 | 4 | 5 | 6, isLive: boolean, d1: number, d2: number) => {
      if (team) setTeamExperiment(team.id, expNum, isLive, { d1, d2 });
    },
    [team?.id, setTeamExperiment]
  );

  const sessionByCode = sessionCodeInput.trim()
    ? Object.values(sessions).find((s) => s.sessionCode === sessionCodeInput.trim().toUpperCase())
    : null;
  const existingTeamsForSession = sessionByCode
    ? Object.values(teams).filter((t) => t.sessionId === sessionByCode.id)
    : [];

  if (!team || !session) {
    return (
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Join a Session</h2>
        <div>
          <label className="text-sm">
            Session code
            <input
              value={sessionCodeInput}
              onChange={(e) => setSessionCodeInput(e.target.value)}
              placeholder="e.g. ABC123"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm uppercase"
            />
          </label>
        </div>

        {sessionByCode && existingTeamsForSession.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">Join existing team</h3>
            <div className="flex flex-wrap gap-2">
              {existingTeamsForSession.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    if (joinExistingTeam(sessionCodeInput.trim().toUpperCase(), t.id)) return;
                    setLocalError('Could not join team.');
                  }}
                  className="rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm hover:border-emerald-500/60 hover:bg-slate-700/60"
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">— or create a new team below —</p>
          </div>
        )}

        <div className="space-y-2 border-t border-slate-700 pt-3">
          <h3 className="text-sm font-medium text-slate-200">Create new team</h3>
          <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Team name
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            PI
            <input
              value={pi}
              onChange={(e) => setPi(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Microscope Tech
            <input
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Postdoc
            <input
              value={postdoc}
              onChange={(e) => setPostdoc(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Grad Student
            <input
              value={grad}
              onChange={(e) => setGrad(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            />
          </label>
          </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
        {isJoining && <p className="text-xs text-sky-300">Joining session…</p>}
        <button
          type="button"
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining…' : 'Create team'}
        </button>
        </div>
      </div>
    );
  }

  const handleToggleCard = (phase: 'acquisition' | 'analysis', card: Card) => {
    if (!isPlanningPhase) return;
    const selected = team.selectedCards[phase].some((c) => c.id === card.id);
    if (selected) {
      deselectCard(team.id, phase, card.id);
    } else {
      selectCard(team.id, phase, card);
    }
  };

  const acquisitionCards = availableCards.filter((c) => c.category === 'microscopy');
  const analysisCards = availableCards.filter((c) => c.category === 'analysis');
  const showAcquisitionCards = session?.currentPhase === 'acquisition' || session?.currentPhase === 'analysis';
  const showAnalysisCards = session?.currentPhase === 'analysis';
  const isReviewPhase = session?.currentPhase === 'review';
  const hasAssignedExperiment = team.experiment.number >= 1;
  const experiment = hasAssignedExperiment ? experiments.find((e) => e.id === team.experiment.number) : null;

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <p className="text-xs text-slate-200">
            Session {session.sessionCode} • Phase: {phaseLabel[session.currentPhase] ?? session.currentPhase}
          </p>
          <p className="mt-1 text-xs text-sky-100">
            Total time:{' '}
            <span className="font-semibold">
              {team.totalTimeCost} <span className="ml-1">⏰</span>
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-300 md:flex-row md:items-center">
          {session.showTimerToParticipants !== false && <PhaseTimer session={session} />}
          <div className="text-right">
            <p>PI: {team.members.pi || '—'}</p>
            <p>Microscope Tech: {team.members.microscopeTech || '—'}</p>
            <p>Postdoc: {team.members.postdoc || '—'}</p>
            <p>Grad Student: {team.members.gradStudent || '—'}</p>
          </div>
        </div>
      </div>

      {session.currentPhase === 'team-formation' && (
        <div className="card">
          <ExperimentDiceRoller
            alreadyAssigned={hasAssignedExperiment}
            onAssign={handleExperimentAssign}
          />
        </div>
      )}

      {hasAssignedExperiment && experiment && (
        <div className="card">
          {team.experiment.lastRoll && (
            <div className="mb-3 rounded-md border border-slate-600 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
              <span className="font-semibold text-slate-300">Dice result: </span>
              <span>{team.experiment.lastRoll.d1} → Experiment {team.experiment.number}</span>
              <span className="mx-2 text-slate-500">|</span>
              <span>
                {team.experiment.lastRoll.d2} → {team.experiment.lastRoll.d2 % 2 === 1 ? 'LIVE (odd)' : 'FIXED (even)'}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {experiment.iconPath && (
              <img
                src={assetPath(experiment.iconPath)}
                alt={experiment.title}
                className="w-full max-w-xl flex-none rounded-md border border-slate-800 bg-slate-950/60 object-contain md:w-1/2"
              />
            )}
            <div className="flex-1">
              <h3 className="text-base font-semibold">Assigned Experiment {experiment.id}</h3>
              <p className="mt-1 text-base text-slate-100">{experiment.title}</p>
              <p className="mt-1 text-sm text-slate-200">
                Question: <span className="font-medium">{experiment.question}</span>
              </p>
              <p className="mt-1 text-sm text-slate-200">
                Stainings:{' '}
                <span className="font-mono text-xs">
                  {experiment.stainings.join(' • ')}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 md:min-w-[10rem]">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  team.experiment.isLive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-sky-500/20 text-sky-200'
                }`}
              >
                {team.experiment.isLive ? 'LIVE' : 'FIXED'}
              </span>
              {team.experiment.isLive && (
                <img
                  src={assetPath('/cards/live-experiment.png')}
                  alt="Live experiment"
                  className="h-40 w-40 md:h-48 md:w-48 rounded-md border border-slate-700 bg-slate-950/60 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showAcquisitionCards && (
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Acquisition Planning</h3>
            <span className="pill text-[11px]">
              {team.selectedCards.acquisition.length} selected
            </span>
          </div>
          {!isPlanningPhase && (
            <p className="mb-2 text-[11px] text-slate-400">
              Waiting for GM phase change; selections are read-only.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {acquisitionCards.map((card) => (
              <CardPill
                key={card.id}
                card={card}
                selected={team.selectedCards.acquisition.some((c) => c.id === card.id)}
                onClick={() => handleToggleCard('acquisition', card)}
              />
            ))}
          </div>
        </section>

        {showAnalysisCards && (
          <section className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Analysis Planning</h3>
              <span className="pill text-[11px]">
                {team.selectedCards.analysis.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analysisCards.map((card) => (
                <CardPill
                  key={card.id}
                  card={card}
                  selected={team.selectedCards.analysis.some((c) => c.id === card.id)}
                  onClick={() => handleToggleCard('analysis', card)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      )}

      {isReviewPhase && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold">Review &amp; Defense</h3>
            <div>
              <h4 className="mb-2 text-xs font-semibold text-slate-200">Your selected cards</h4>
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                {[...team.selectedCards.acquisition, ...team.selectedCards.analysis].map((c) => {
                  const isGmAdded = (team.gmAddedCardIds || []).includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col items-center flex-shrink-0 rounded border p-1 ${isGmAdded ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-slate-600 bg-slate-800/50'}`}
                      title={`${c.name}${isGmAdded ? ' (added by GM)' : ''} (+${c.timeCost} ⏰)`}
                    >
                      <img src={assetPath(c.iconPath)} alt={c.name} className="h-16 w-16 md:h-20 md:w-20 object-contain" />
                      <span className="mt-0.5 flex gap-0.5 text-[10px]">
                        {Array.from({ length: c.timeCost }).map((_, i) => (
                          <span key={i}>⏰</span>
                        ))}
                      </span>
                    </div>
                  );
                })}
                {team.selectedCards.acquisition.length === 0 && team.selectedCards.analysis.length === 0 && (
                  <p className="text-xs text-slate-500 py-4">No cards selected</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold text-slate-200">Reviewer&apos;s concerns</h4>
                {(team.reviewOutcome?.assignedConcerns || []).length === 0 ? (
                  <p className="text-xs text-slate-500">No concerns assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(team.reviewOutcome?.assignedConcerns || []).map((c) => (
                      <div key={c.id} className="rounded border border-slate-600 bg-slate-800/50 p-1" title={`${c.name} (+${c.timeCost} clock${c.timeCost !== 1 ? 's' : ''})`}>
                        <img src={assetPath(c.iconPath)} alt={c.name} className="h-60 w-60 md:h-72 md:w-72 object-contain" />
                        <span className="mt-1 flex justify-center gap-0.5 text-[10px]">
                          {Array.from({ length: c.timeCost }).map((_, i) => (
                            <span key={i}>⏰</span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-slate-200">Experimental details</h4>
                <div className="flex flex-wrap items-start gap-2">
                  {(team.reviewOutcome?.assignedDetails || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No details assigned yet.</p>
                  ) : (
                    (team.reviewOutcome?.assignedDetails || []).map((c) => (
                      <div key={c.id} className="rounded border border-slate-600 bg-slate-800/50 p-1" title={`${c.name} (+${c.timeCost} clock${c.timeCost !== 1 ? 's' : ''})`}>
                        <img src={assetPath(c.iconPath)} alt={c.name} className="h-60 w-60 md:h-72 md:w-72 object-contain" />
                        <span className="mt-1 flex justify-center gap-0.5 text-[10px]">
                          {Array.from({ length: c.timeCost }).map((_, i) => (
                            <span key={i}>⏰</span>
                          ))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {(team.reviewOutcome?.assignedDetails || []).length > 0 && <DiceRoller />}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

const DICE_ANIMATION_MS = 1800;
const DICE_TICK_MS = 80;

/** Single d6: display shows "-" until rolled, then animates and settles. Optional separate Roll button. */
function AnimatedDice({
  onComplete,
  onRollStart,
  label,
  disabled,
  triggerRoll
}: {
  onComplete?: (value: number) => void;
  onRollStart?: () => void;
  label?: string;
  disabled?: boolean;
  /** When this value changes, start a roll (used for "Roll both" from parent). */
  triggerRoll?: number;
}) {
  const [rolling, setRolling] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState<number | null>(null);
  const finalRef = React.useRef<number>(1);
  const prevTriggerRef = React.useRef(triggerRoll ?? 0);

  const startRoll = React.useCallback((final: number) => {
    finalRef.current = final;
    onRollStart?.();
    setRolling(true);
  }, [onRollStart]);

  React.useEffect(() => {
    if (!rolling) return;
    const final = finalRef.current;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= DICE_ANIMATION_MS) {
        setDisplayValue(final);
        setRolling(false);
        onComplete?.(final);
        clearInterval(id);
        return;
      }
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, DICE_TICK_MS);
    return () => clearInterval(id);
  }, [rolling, onComplete]);

  React.useEffect(() => {
    if (triggerRoll !== undefined && triggerRoll !== prevTriggerRef.current) {
      prevTriggerRef.current = triggerRoll;
      startRoll(Math.floor(Math.random() * 6) + 1);
    }
  }, [triggerRoll, startRoll]);

  const roll = () => {
    if (disabled || rolling) return;
    startRoll(Math.floor(Math.random() * 6) + 1);
  };

  const showRollButton = triggerRoll === undefined;

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[10px] text-slate-400">{label}</span>}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 border-slate-600 bg-slate-800 font-mono text-xl font-bold tabular-nums transition ${
          rolling ? 'animate-pulse border-amber-500' : ''
        }`}
      >
        {displayValue === null ? '–' : displayValue}
      </div>
      {showRollButton && (
        <button
          type="button"
          onClick={roll}
          disabled={disabled || rolling}
          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
        >
          Roll
        </button>
      )}
    </div>
  );
}

/** Two d6: first = experiment 1–6, second = odd live / even fixed. One button rolls both; animates then assigns. */
function ExperimentDiceRoller({
  onAssign,
  alreadyAssigned
}: {
  onAssign: (experimentNumber: 1 | 2 | 3 | 4 | 5 | 6, isLive: boolean, d1: number, d2: number) => void;
  alreadyAssigned?: boolean;
}) {
  const [trigger, setTrigger] = React.useState(0);
  const [d1, setD1] = React.useState<number | null>(null);
  const [d2, setD2] = React.useState<number | null>(null);
  const onAssignRef = React.useRef(onAssign);
  onAssignRef.current = onAssign;

  React.useEffect(() => {
    if (d1 !== null && d2 !== null) {
      const n1 = d1;
      const n2 = d2;
      setD1(null);
      setD2(null);
      onAssignRef.current(n1 as 1 | 2 | 3 | 4 | 5 | 6, n2 % 2 === 1, n1, n2);
    }
  }, [d1, d2]);

  const rollBoth = () => {
    setD1(null);
    setD2(null);
    setTrigger((t) => t + 1);
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-200">
        {alreadyAssigned ? 'Roll again to change your experiment' : 'Roll for your experiment'}
      </p>
      <p className="mb-3 text-[11px] text-slate-400">
        First die: experiment number (1–6). Second die: odd = LIVE, even = FIXED.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <AnimatedDice label="Experiment (1–6)" triggerRoll={trigger} onComplete={(v) => setD1(v)} />
        <AnimatedDice label="LIVE (odd) / FIXED (even)" triggerRoll={trigger} onComplete={(v) => setD2(v)} />
        <button
          type="button"
          onClick={rollBoth}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
        >
          {alreadyAssigned ? 'Roll both dice again' : 'Roll both dice'}
        </button>
      </div>
    </div>
  );
}

/** Single d6 for Experimental details: 4–6 = can use. */
function DiceRoller() {
  const [roll, setRoll] = React.useState<number | null>(null);
  const success = roll !== null && roll >= 4;
  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <p className="text-xs font-semibold text-slate-200">Dice roll for Experimental details</p>
      <p className="mt-1 text-[11px] text-slate-400">Roll 4–6 to use a details card.</p>
      <div className="mt-2 flex items-center gap-2">
        <AnimatedDice
          onRollStart={() => setRoll(null)}
          onComplete={(value) => setRoll(value)}
        />
        {roll !== null && (
          <span className={`text-lg font-bold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
            {roll} {success ? '✓ Can use' : '✗ Cannot use'}
          </span>
        )}
      </div>
    </div>
  );
}

