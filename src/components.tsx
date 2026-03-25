import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useGameStore, availableCards } from './store';
import { Card, SessionStatus } from './models';
import { experiments, reviewIssueCards, reviewDetailsCards, acquisitionCardGroups, analysisCardGroups, acquisitionSectionConfig } from './data';
import { assetPath } from './assetPath';
import { startTickLoop, stopTickLoop, playAlarmEnd, playBombEnd } from './countdownSounds';
import { MetricsCheatsheetPanel } from './MetricsCheatsheetPanel';
import { GMRightSidePanels } from './GMRightSidePanels';

const phaseLabel: Record<SessionStatus, string> = {
  setup: 'Setup',
  'team-formation': 'Research Team Formation',
  acquisition: 'Acquisition Planning',
  analysis: 'Analysis Planning',
  review: 'Review & Defense',
  complete: 'Complete'
};

function gameModeLabel(gameMode: string) {
  if (gameMode === 'budget') return 'Time Budget Game';
  if (gameMode === 'time-attack') return 'Time Attack';
  return gameMode;
}

/** Countdown from phaseEndTime; red when <= 2 minutes. Updates every second. */
function PhaseTimer({
  session
}: {
  session: {
    phaseEndTime: number | null;
    currentPhase: SessionStatus;
    settings?: { countdownSoundEnabled?: boolean; countdownSoundType?: 'alarm' | 'bomb' };
  };
}) {
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const endSoundPlayedRef = React.useRef(false);
  const soundEnabled = (session.settings?.countdownSoundEnabled ?? true);
  const soundType = session.settings?.countdownSoundType ?? 'alarm';

  React.useEffect(() => {
    if (session.phaseEndTime == null) {
      setRemainingSeconds(null);
      endSoundPlayedRef.current = false;
      stopTickLoop();
      return () => {};
    }
    const tick = () => {
      const sec = Math.max(0, Math.floor((session.phaseEndTime! - Date.now()) / 1000));
      setRemainingSeconds(sec);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      stopTickLoop();
    };
  }, [session.phaseEndTime]);

  React.useEffect(() => {
    if (remainingSeconds == null || !soundEnabled) return;
    if (remainingSeconds === 0) {
      stopTickLoop();
      if (!endSoundPlayedRef.current) {
        endSoundPlayedRef.current = true;
        soundType === 'bomb' ? playBombEnd() : playAlarmEnd();
      }
    } else {
      endSoundPlayedRef.current = false;
      if (remainingSeconds >= 1 && remainingSeconds <= 10) {
        startTickLoop();
      } else {
        stopTickLoop();
      }
    }
  }, [remainingSeconds, soundEnabled, soundType]);

  if (remainingSeconds == null || session.phaseEndTime == null) return null;

  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  const isLow = remainingSeconds <= 60; // 1 minute
  const isCritical = remainingSeconds <= 10; // last 10 seconds – flash red

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xl tabular-nums ${
        isCritical
          ? 'animate-flash-red border-red-500 bg-red-600/50 text-red-100'
          : isLow
            ? 'border-red-500/80 bg-red-950/40 text-red-200'
            : 'border-slate-600 bg-slate-800/60 text-slate-100'
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

function CardHoverTooltipContent({ card }: { card: Card }) {
  return (
    <>
      <div className="text-[12px] font-semibold">{card.name}</div>
      <div className="text-slate-200">{card.description || '—'}</div>
      <div className="text-slate-300">
        <span className="italic">{`Time cost: ${card.timeCost} `}</span>
        <span aria-hidden>⏰</span>
      </div>
    </>
  );
}

function HoverTooltip({
  content,
  dim,
  children
}: {
  content: React.ReactNode;
  dim?: boolean;
  children: React.ReactNode;
}) {
  const [show, setShow] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const assumedW = 340;
    const assumedH = 140;
    const pad = 12;
    const x = Math.min(e.clientX + pad, window.innerWidth - assumedW - pad);
    const y = Math.min(e.clientY + pad, window.innerHeight - assumedH - pad);
    setPos({ x: Math.max(pad, x), y: Math.max(pad, y) });
  };

  return (
    <span
      className="inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMouseMove}
    >
      {show && (
        <span
          className={`pointer-events-none fixed z-[9999] w-max max-w-[min(320px,90vw)] whitespace-normal rounded-md border border-slate-700 bg-slate-950/95 px-2 py-1 text-left text-[11px] leading-snug text-slate-100 shadow-lg shadow-slate-950/50 ${
            dim ? 'opacity-60' : ''
          }`}
          style={{ left: pos.x, top: pos.y }}
        >
          {content}
        </span>
      )}
      {children}
    </span>
  );
}

function CardPill({ card, onClick, selected, compact, disabled }: { card: Card; onClick?: () => void; selected?: boolean; compact?: boolean; disabled?: boolean }) {
  const imgClass = compact ? 'h-[8.94rem] w-[8.94rem] md:h-[9.28rem] md:w-[9.28rem]' : 'h-[19.8rem] w-[19.8rem] md:h-[23.76rem] md:w-[23.76rem]';
  const btnClass = compact
    ? 'inline-flex shrink-0 items-center justify-center overflow-visible rounded-md border border-slate-600/40 bg-slate-900/50 p-0 transition hover:border-slate-500/60'
    : 'inline-flex shrink-0 items-center justify-center overflow-visible rounded-lg border border-slate-600/40 bg-slate-900/50 p-0 transition hover:border-slate-500/60';
  return (
    <HoverTooltip content={<CardHoverTooltipContent card={card} />} dim={!!disabled}>
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        aria-label={`${card.name}${card.description ? ` — ${card.description}` : ''} (Time cost: ${card.timeCost} ⏰)`}
        aria-disabled={disabled || undefined}
        className={`${btnClass} ${selected ? (compact ? 'ring-1 ring-sky-400' : 'ring-2 ring-sky-400') : ''} ${disabled ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
      >
        {card.iconPath && (
          <img
            src={assetPath(card.iconPath)}
            alt={card.name}
            className={`${imgClass} block rounded-md object-contain`}
          />
        )}
      </button>
    </HoverTooltip>
  );
}

export function RoleSelector() {
  const { role, setRole, currentTeamId, currentSessionId, sessions } = useGameStore();
  const session = currentSessionId ? sessions[currentSessionId] : null;
  const blockParticipantsFromGM = (session as { settings?: { blockParticipantsFromGM?: boolean } })?.settings?.blockParticipantsFromGM ?? true;
  const isParticipant = role === 'team' && currentTeamId != null;
  const isBlocked = isParticipant && blockParticipantsFromGM;
  return (
    <div className="mb-6 flex gap-3">
      <button
        type="button"
        className={`card flex-1 text-center overflow-hidden relative min-h-[100px] ${role === 'gm' ? 'ring-2 ring-sky-300' : ''} ${isBlocked ? 'pointer-events-none opacity-50' : ''}`}
        onClick={() => !isBlocked && setRole('gm')}
        disabled={isBlocked}
        title={isBlocked ? 'Joined as researcher—Reviewer 3 access blocked by session setting' : ''}
        style={{
          backgroundImage: `url(${assetPath('/Reviewer3.png')})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '22% center',
          backgroundSize: 'auto 100%'
        }}
      >
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent 0%, transparent 35%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.95) 65%, rgba(15,23,42,0.95) 100%)'
          }}
        />
        <div className="relative z-10 pl-[48%] pr-4 py-2 text-left">
          <h2 className="text-xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Reviewer 3</h2>
          <p className="mt-1 text-base text-slate-100/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Create and control sessions.</p>
        </div>
      </button>
      <button
        type="button"
        className={`card flex-1 text-center overflow-hidden relative min-h-[100px] ${role === 'team' ? 'ring-2 ring-emerald-300' : ''}`}
        onClick={() => setRole('team')}
        style={{
          backgroundImage: `url(${assetPath('/ResearchTeam.png')})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '78% center',
          backgroundSize: 'auto 100%'
        }}
      >
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background: 'linear-gradient(to left, transparent 0%, transparent 35%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.95) 65%, rgba(15,23,42,0.95) 100%)'
          }}
        />
        <div className="relative z-10 pr-[48%] pl-4 py-2 text-left">
          <h2 className="text-xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Research Team</h2>
          <p className="mt-1 text-base text-slate-100/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Join a session and plan experiments.</p>
        </div>
      </button>
    </div>
  );
}

const acquisitionCardPool = availableCards.filter((c) => c.category === 'microscopy');
const analysisCardPool = availableCards.filter((c) => c.category === 'analysis');

const cardById = Object.fromEntries(availableCards.map((c) => [c.id, c]));

function isCardDisabled(
  card: Card,
  phase: 'acquisition' | 'analysis',
  selectedAcquisition: Card[],
  selectedAnalysis: Card[],
  groupCardIds?: string[],
  budgetRemainingClocks?: number
): boolean {
  const acqIds = selectedAcquisition.map((c) => c.id);
  const anaIds = selectedAnalysis.map((c) => c.id);
  const allSelectedIds = [...acqIds, ...anaIds];
  const selectedInPhase = phase === 'acquisition' ? selectedAcquisition : selectedAnalysis;

  if (selectedInPhase.some((s) => s.id === card.id)) return false;

  if (budgetRemainingClocks != null && card.timeCost > budgetRemainingClocks) return true;

  if (phase === 'acquisition' && groupCardIds?.length) {
    const otherSelectedInGroup = groupCardIds.some((id) => id !== card.id && acqIds.includes(id));
    if (otherSelectedInGroup) return true;
  }

  if (phase === 'acquisition') {
    if (acqIds.some((id) => card.incompatibleWith.includes(id))) return true;
  } else {
    if (allSelectedIds.some((id) => card.incompatibleWith.includes(id))) return true;
  }

  for (const reqId of card.requires) {
    if (!allSelectedIds.includes(reqId)) return true;
  }

  if (card.requiresAnyOf?.length && !card.requiresAnyOf.some((id) => allSelectedIds.includes(id))) return true;

  return false;
}

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
    setShowTimerToParticipants,
    setBlockParticipantsFromGM,
    setCountdownSoundEnabled,
    setCountdownSoundType
  } = useGameStore();
  const [expandedTeamCards, setExpandedTeamCards] = React.useState<Record<string, boolean>>({});
  const [rightPanelOpen, setRightPanelOpen] = React.useState<'guide' | 'cheatsheet' | null>(null);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const gmReportRef = React.useRef<HTMLDivElement>(null);

  const SHARE_MESSAGE = (
    <>
      Share the results from your game{' '}
      <a
        href="https://github.com/BIOP/coLoc/issues/1"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 underline hover:text-sky-300"
      >
        HERE
      </a>{' '}
      to add them to the Global Leaderboard.
      <br />
      You can also share the game report by email to:
      <br />
      <span className="underline">romain.guiet@epfl.ch</span>
      <br />
      Subject: coLoc game results
    </>
  );
  const session = currentSessionId ? sessions[currentSessionId] : null;

  const [numTeams, setNumTeams] = React.useState(4);
  const [teamFormationTime, setTeamFormationTime] = React.useState(4);
  const [acqTime, setAcqTime] = React.useState(10);
  const [analysisTime, setAnalysisTime] = React.useState(10);
  const [reviewTime, setReviewTime] = React.useState(8);
  const [timeBudget, setTimeBudget] = React.useState(30);
  const [mode, setMode] = React.useState<'time-attack' | 'budget'>('time-attack');
  const [gmCodeInput, setGmCodeInput] = React.useState('');
  const [gmJoinError, setGmJoinError] = React.useState<string | null>(null);

  const handleJoinAsGM = () => {
    setGmJoinError(null);
    if (joinSessionAsGM(gmCodeInput.trim().toUpperCase())) return;
    setGmJoinError('No session found with that Reviewer 3 code.');
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
      reviewTime: reviewTime,
      gameMode: mode,
      ...(mode === 'budget' ? { timeBudget } : {})
    });
  };

  const handleCreateGameReport = async () => {
    const el = gmReportRef.current;
    if (!el) return;
    const sess = currentSessionId ? sessions[currentSessionId] : null;
    const reportDate = new Date();
    const pageEls = el.querySelectorAll('[data-report-page]');
    if (pageEls.length === 0) return;
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const shareMsgTop = 15;
      const shareMsgUrl = 'https://github.com/BIOP/coLoc/issues/1';

      for (let i = 0; i < pageEls.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = await html2canvas(pageEls[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0f172a'
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = canvas.width;
        const imgH = canvas.height;

        let imgY = 0;
        let imgHmm = pdfH;
        if (i === 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(80, 150, 220);
          let y = shareMsgTop;
          pdf.text('Share the results from your game ', 14, y);
          const xAfter = 14 + pdf.getTextWidth('Share the results from your game ');
          const hereWidth = pdf.getTextWidth('HERE');
          pdf.textWithLink('HERE', xAfter, y, { url: shareMsgUrl });
          pdf.setDrawColor(80, 150, 220);
          pdf.setLineWidth(0.3);
          pdf.line(xAfter, y + 1.5, xAfter + hereWidth, y + 1.5);
          const xAfterHere = xAfter + hereWidth;
          pdf.text(' to add them to the Global Leaderboard.', xAfterHere, y);
          y += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
          pdf.setTextColor(180, 180, 180);
          pdf.text('You can also share the game report by email to: ', 14, y);
          y += 6;
          const email = 'romain.guiet@epfl.ch';
          const emailX = 14;
          const emailWidth = pdf.getTextWidth(email);
          pdf.text(email, emailX, y);
          pdf.setDrawColor(180, 180, 180);
          pdf.line(emailX, y + 1.5, emailX + emailWidth, y + 1.5);
          y += 6;
          pdf.text('Subject: coLoc game results', 14, y);
          imgY = y + 14;
          imgHmm = pdfH - imgY - 12;
        }

        const ratio = Math.min(pdfW / imgW, imgHmm / imgH) * 0.95;
        const w = imgW * ratio;
        const h = imgH * ratio;
        const imgX = (pdfW - w) / 2;
        const imgYActual = i === 0 ? imgY : (pdfH - h) / 2;
        pdf.addImage(imgData, 'PNG', imgX, imgYActual, w, h);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Report generated: ${reportDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
          14,
          pdfH - 8
        );
      }

      const filename = `coLoc-game-report-${sess?.sessionCode ?? 'session'}-${reportDate.toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      setShareModalOpen(true);
    } catch (err) {
      console.error('Failed to create game report:', err);
    }
  };

  if (!session) {
    return (
      <div className="space-y-4 relative">
        <GMRightSidePanels openPanel={rightPanelOpen} onSetOpenPanel={setRightPanelOpen} />
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Join as additional Reviewer 3</h3>
          <p className="mb-2 text-xs text-slate-400">Have a Reviewer 3 code from another Reviewer 3? Enter it to co-manage the session.</p>
          <div className="flex gap-2">
            <input
              value={gmCodeInput}
              onChange={(e) => setGmCodeInput(e.target.value)}
              placeholder="Reviewer 3 code (e.g. XY7Z2A)"
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
            Number of research teams
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
            Research team formation time (min)
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
            Review &amp; Defense time (min)
            <input
              type="number"
              min={1}
              value={reviewTime}
              onChange={(e) => setReviewTime(Number(e.target.value))}
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
              <option value="budget">Time Budget Game</option>
            </select>
          </label>
          {mode === 'budget' && (
            <label className="text-sm">
              Time budget (clock units)
              <input
                type="number"
                min={0}
                value={timeBudget}
                onChange={(e) => setTimeBudget(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              />
            </label>
          )}
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
    <div className="space-y-4 relative">
      {shareModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShareModalOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-lg border border-slate-600 bg-slate-900 p-6 shadow-xl"
            role="dialog"
            aria-labelledby="share-modal-title"
            aria-modal
          >
            <h2 id="share-modal-title" className="text-lg font-semibold text-slate-100 mb-3">Share your game results</h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-4">
              {SHARE_MESSAGE}
            </p>
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-500"
            >
              Close
            </button>
          </div>
        </>
      )}
      <GMRightSidePanels openPanel={rightPanelOpen} onSetOpenPanel={setRightPanelOpen} />
      {session.currentPhase === 'review' && (
        <div
          ref={gmReportRef}
          className="absolute left-0 top-0 w-[800px] bg-slate-950 p-4"
          style={{ left: '-9999px' }}
          aria-hidden
        >
          {sessionTeams.map((team, idx) => (
            <div key={team.id} className="report-page bg-slate-950 p-4" data-report-page>
              {idx === 0 && (
                <div className="card mb-4 p-4">
                  <h2 className="text-xl font-semibold">Session {session.sessionCode}</h2>
                  <p className="text-xs text-slate-200">
                    Reviewer 3 code: <span className="font-mono">{session.gmCode}</span> • Mode:{' '}
                    <span>{gameModeLabel(session.settings.gameMode)}</span> • Phase: Review &amp; Defense
                  </p>
                </div>
              )}
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold">{team.name} – Final selections</h3>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {team.experiment.number >= 1 && (() => {
                        const exp = experiments.find((e) => e.id === team.experiment.number);
                        return exp?.iconPath ? (
                          <img
                            src={assetPath(exp.iconPath)}
                            alt={`Experiment ${team.experiment.number}`}
                            className="h-[100px] w-auto object-contain rounded border border-slate-600"
                          />
                        ) : null;
                      })()}
                      {team.experiment.isLive && (
                        <img
                          src={assetPath('/cards/live-experiment.png')}
                          alt="LIVE experiment"
                          className="h-[100px] w-auto object-contain rounded border border-slate-600"
                        />
                      )}
                      <p className="text-[11px] text-slate-300">
                        {team.experiment.number === 0
                          ? 'No experiment assigned'
                          : `Experiment ${team.experiment.number} • ${team.experiment.isLive ? 'LIVE' : 'FIXED'}`}
                      </p>
                    </div>
                    <span className="pill bg-slate-800 text-xs shrink-0">
                      Time: {team.totalTimeCost} <span className="ml-1">⏰</span>
                    </span>
                  </div>
                  <div className="grid gap-3 text-[11px] md:grid-cols-2">
                    <div>
                      <p className="mb-1 font-semibold text-slate-200">Acquisition</p>
                      {team.selectedCards.acquisition.length === 0 ? (
                        <p className="text-slate-500">None</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {team.selectedCards.acquisition.map((c) => (
                            <div
                              key={c.id}
                              className={`flex flex-col items-center rounded border p-1 min-w-[70px] max-w-[85px] ${(team.gmAddedCardIds || []).includes(c.id) ? 'border-fuchsia-500' : 'border-slate-600 bg-slate-800/50'}`}
                            >
                              <img src={assetPath(c.iconPath)} alt={c.name} className="w-[53px] aspect-[2/3] object-contain" />
                              <span className={`mt-0.5 text-[10px] text-center break-words w-full min-w-0 px-0.5 leading-tight ${(team.gmAddedCardIds || []).includes(c.id) ? 'text-fuchsia-300' : ''}`} title={c.name}>{c.name}</span>
                              <span className="text-[8px]">{Array.from({ length: c.timeCost }).map((_, i) => '⏰').join('')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-200">Analysis</p>
                      {team.selectedCards.analysis.length === 0 ? (
                        <p className="text-slate-500">None</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {team.selectedCards.analysis.map((c) => (
                            <div
                              key={c.id}
                              className={`flex flex-col items-center rounded border p-1 min-w-[70px] max-w-[85px] ${(team.gmAddedCardIds || []).includes(c.id) ? 'border-fuchsia-500' : 'border-slate-600 bg-slate-800/50'}`}
                            >
                              <img src={assetPath(c.iconPath)} alt={c.name} className="w-[53px] aspect-[2/3] object-contain" />
                              <span className={`mt-0.5 text-[10px] text-center break-words w-full min-w-0 px-0.5 leading-tight ${(team.gmAddedCardIds || []).includes(c.id) ? 'text-fuchsia-300' : ''}`} title={c.name}>{c.name}</span>
                              <span className="text-[8px]">{Array.from({ length: c.timeCost }).map((_, i) => '⏰').join('')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {((team.reviewOutcome?.assignedConcerns?.length ?? 0) > 0 || (team.reviewOutcome?.assignedDetails?.length ?? 0) > 0) && (
                    <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-slate-200">Reviewer&apos;s concerns</p>
                        {(team.reviewOutcome?.assignedConcerns?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(team.reviewOutcome.assignedConcerns || []).map((c) => (
                              <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                                <div className="flex flex-col items-center rounded border border-amber-400/50 bg-amber-500/10 p-1 min-w-[70px] max-w-[85px]">
                                  <img src={assetPath(c.iconPath)} alt={c.name} className="w-[53px] aspect-[2/3] object-contain" />
                                  <span className="mt-0.5 text-[10px] text-center break-words w-full min-w-0 px-0.5 leading-tight">{c.name}</span>
                                </div>
                              </HoverTooltip>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-[11px]">None</p>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-slate-200">Experimental details</p>
                        {(team.reviewOutcome?.assignedDetails?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(team.reviewOutcome.assignedDetails || []).map((c) => (
                              <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                                <div className="flex flex-col items-center rounded border border-amber-400/50 bg-amber-500/10 p-1 min-w-[70px] max-w-[85px]">
                                  <img src={assetPath(c.iconPath)} alt={c.name} className="w-[53px] aspect-[2/3] object-contain" />
                                  <span className="mt-0.5 text-[10px] text-center break-words w-full min-w-0 px-0.5 leading-tight">{c.name}</span>
                                </div>
                              </HoverTooltip>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-[11px]">None</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-4">
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Session {session.sessionCode}</h2>
          <p className="text-xs text-slate-100/80">
            Reviewer 3 code: <span className="font-mono">{session.gmCode}</span> • Mode:{' '}
            <span>{gameModeLabel(session.settings.gameMode)}</span>
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
              Show timer to researchers
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-200" title="When on, researchers cannot switch to Reviewer 3 view">
              <input
                type="checkbox"
                checked={(session.settings as { blockParticipantsFromGM?: boolean })?.blockParticipantsFromGM !== false}
                onChange={(e) => setBlockParticipantsFromGM(session.id, e.target.checked)}
                className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              />
              Block researchers from Reviewer 3 access
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-200" title="Tick in last 10s, end sound at 0:00">
              <input
                type="checkbox"
                checked={(session.settings as { countdownSoundEnabled?: boolean })?.countdownSoundEnabled !== false}
                onChange={(e) => setCountdownSoundEnabled(session.id, e.target.checked)}
                className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              />
              Countdown sounds
            </label>
            {(session.settings as { countdownSoundEnabled?: boolean })?.countdownSoundEnabled !== false && (
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <span>End sound:</span>
                <select
                  value={(session.settings as { countdownSoundType?: string })?.countdownSoundType ?? 'alarm'}
                  onChange={(e) => setCountdownSoundType(session.id, e.target.value as 'alarm' | 'bomb')}
                  className="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[11px]"
                >
                  <option value="alarm">Alarm (beep beep)</option>
                  <option value="bomb">Bomb (explosion)</option>
                </select>
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => previousPhase(session.id)}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-500"
            >
              Previous phase
            </button>
            {session.currentPhase === 'review' ? (
              <button
                type="button"
                onClick={handleCreateGameReport}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Create Game Report
              </button>
            ) : (
              <button
                type="button"
                onClick={() => advancePhase(session.id)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Advance phase
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold">Research Teams</h3>
        {sessionTeams.length === 0 && (
          <p className="text-xs text-slate-300">Waiting for research teams to join using the session code.</p>
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
                        <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                          <div
                            className={`relative flex flex-col items-center flex-shrink-0 rounded border p-1 ${isGmAdded ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-slate-600 bg-slate-800/50'}`}
                          >
                          {isGmAdded && (
                            <button
                              type="button"
                              onClick={() => gmRemoveCardFromTeam(team.id, team.selectedCards.acquisition.some(x => x.id === c.id) ? 'acquisition' : 'analysis', c.id)}
                              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-fuchsia-500 text-white text-[10px] leading-none hover:bg-fuchsia-400"
                              title="Remove (added by Reviewer 3)"
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
                        </HoverTooltip>
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
                <div className="mt-2 flex flex-wrap gap-4">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-slate-300">Acquisition cards (click to add/remove)</p>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {acquisitionCardPool.map((c) => {
                        const selected = team.selectedCards.acquisition.some((x) => x.id === c.id);
                        const isGmAdded = (team.gmAddedCardIds || []).includes(c.id);
                        return (
                          <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                            <button
                              type="button"
                              onClick={() =>
                                selected
                                  ? gmRemoveCardFromTeam(team.id, 'acquisition', c.id)
                                  : gmAddCardToTeam(team.id, 'acquisition', c)
                              }
                              className={`relative flex flex-col items-center rounded border p-1 min-w-0 w-16 ${selected ? 'border-sky-400 bg-sky-500/20 ring-2 ring-sky-400/50' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 opacity-70'}`}
                            >
                              {isGmAdded && <span className="absolute -top-0.5 right-0.5 text-[8px] text-fuchsia-400 font-semibold">R3</span>}
                              <img src={assetPath(c.iconPath)} alt={c.name} className="h-14 w-14 object-contain flex-shrink-0" />
                              <span className="mt-0.5 text-[9px] text-center break-words line-clamp-2 w-full">{c.name}</span>
                              {selected && <span className="mt-0.5 text-[8px] text-sky-300">✓</span>}
                            </button>
                          </HoverTooltip>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-slate-300">Analysis cards (click to add/remove)</p>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {analysisCardPool.map((c) => {
                        const selected = team.selectedCards.analysis.some((x) => x.id === c.id);
                        const isGmAdded = (team.gmAddedCardIds || []).includes(c.id);
                        return (
                          <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                            <button
                              type="button"
                              onClick={() =>
                                selected
                                  ? gmRemoveCardFromTeam(team.id, 'analysis', c.id)
                                  : gmAddCardToTeam(team.id, 'analysis', c)
                              }
                              className={`relative flex flex-col items-center rounded border p-1 min-w-0 w-16 ${selected ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/50' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 opacity-70'}`}
                            >
                              {isGmAdded && <span className="absolute -top-0.5 right-0.5 text-[8px] text-fuchsia-400 font-semibold">R3</span>}
                              <img src={assetPath(c.iconPath)} alt={c.name} className="h-14 w-14 object-contain flex-shrink-0" />
                              <span className="mt-0.5 text-[9px] text-center break-words line-clamp-2 w-full">{c.name}</span>
                              {selected && <span className="mt-0.5 text-[8px] text-emerald-300">✓</span>}
                            </button>
                          </HoverTooltip>
                        );
                      })}
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
                        const disableByBudget =
                          session?.settings.gameMode === 'budget' &&
                          !assigned &&
                          card.timeCost > Math.max(0, (session.settings.timeBudget ?? 0) - team.totalTimeCost);
                        return (
                          <HoverTooltip key={card.id} content={<CardHoverTooltipContent card={card} />} dim={disableByBudget}>
                            <button
                              type="button"
                              onClick={() => (assigned ? unassignReviewerConcern(team.id, card.id) : assignReviewerConcern(team.id, card))}
                              disabled={disableByBudget}
                              className={`flex flex-col items-center rounded border p-1 min-w-0 ${
                                assigned ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800/50'
                              } ${disableByBudget ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                              <img src={assetPath(card.iconPath)} alt={card.name} className="h-24 w-24 md:h-28 md:w-28 object-contain flex-shrink-0" />
                              <span className="mt-0.5 text-[10px] text-center break-words line-clamp-2 w-full px-0.5">
                                {card.name}
                              </span>
                              <span className="mt-0.5 text-[10px]">
                                {Array.from({ length: card.timeCost }).map((_, i) => (
                                  <span key={i}>⏰</span>
                                ))}
                              </span>
                            </button>
                          </HoverTooltip>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-200">Experimental details (details cards)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {reviewDetailsCards.map((card) => {
                        const assigned = (team.reviewOutcome.assignedDetails || []).some((c) => c.id === card.id);
                        const disableByBudget =
                          session?.settings.gameMode === 'budget' &&
                          !assigned &&
                          card.timeCost > Math.max(0, (session.settings.timeBudget ?? 0) - team.totalTimeCost);
                        return (
                          <HoverTooltip key={card.id} content={<CardHoverTooltipContent card={card} />} dim={disableByBudget}>
                            <button
                              type="button"
                              onClick={() => (assigned ? unassignReviewerDetail(team.id, card.id) : assignReviewerDetail(team.id, card))}
                              disabled={disableByBudget}
                              className={`flex flex-col items-center rounded border p-1 min-w-0 ${
                                assigned ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800/50'
                              } ${disableByBudget ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                              <img src={assetPath(card.iconPath)} alt={card.name} className="h-24 w-24 md:h-28 md:w-28 object-contain flex-shrink-0" />
                              <span className="mt-0.5 text-[10px] text-center break-words line-clamp-2 w-full px-0.5">
                                {card.name}
                              </span>
                              <span className="mt-0.5 text-[10px]">
                                {Array.from({ length: card.timeCost }).map((_, i) => (
                                  <span key={i}>⏰</span>
                                ))}
                              </span>
                            </button>
                          </HoverTooltip>
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
    </div>
  );
}

export function TeamView() {
  const { currentSessionId, sessions, currentTeamId, joinSessionAsTeam, joinExistingTeam, teams, selectCard, deselectCard, setTeamExperiment, setDetailsCardRoll, joinError, isJoining, socket } =
    useGameStore();
  const [sessionCodeInput, setSessionCodeInput] = React.useState('');
  const [teamName, setTeamName] = React.useState('');
  const [pi, setPi] = React.useState('');
  const [tech, setTech] = React.useState('');
  const [postdoc, setPostdoc] = React.useState('');
  const [grad, setGrad] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [cheatsheetOpen, setCheatsheetOpen] = React.useState(false);

  const session = currentSessionId ? sessions[currentSessionId] : null;
  const team = currentTeamId ? teams[currentTeamId] : null;

  const isBudgetMode = session?.settings.gameMode === 'budget';
  const timeBudgetClocks = session?.settings.timeBudget ?? 0;
  const budgetRemainingClocks =
    isBudgetMode && team ? Math.max(0, timeBudgetClocks - team.totalTimeCost) : undefined;
  const showBudgetCountdown =
    isBudgetMode &&
    session &&
    (session.currentPhase === 'acquisition' || session.currentPhase === 'analysis' || session.currentPhase === 'review');

  const handleJoin = () => {
    setLocalError(null);
    const joined = joinSessionAsTeam(sessionCodeInput.trim().toUpperCase(), teamName, {
      pi,
      microscopeTech: tech,
      postdoc,
      gradStudent: grad
    });
    if (!joined && !socket?.connected) {
      setLocalError('Session not found. Check the code with your Reviewer 3.');
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
            <h3 className="text-sm font-medium text-slate-200">Join existing research team</h3>
            <div className="flex flex-wrap gap-2">
              {existingTeamsForSession.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    if (joinExistingTeam(sessionCodeInput.trim().toUpperCase(), t.id)) return;
                    setLocalError('Could not join research team.');
                  }}
                  className="rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm hover:border-emerald-500/60 hover:bg-slate-700/60"
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">— or create a new research team below —</p>
          </div>
        )}

        <div className="space-y-2 border-t border-slate-700 pt-3">
          <h3 className="text-sm font-medium text-slate-200">Create new research team</h3>
          <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Research team name
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
          {isJoining ? 'Joining…' : 'Create research team'}
        </button>
        </div>
      </div>
    );
  }

  const handleToggleCard = (phase: 'acquisition' | 'analysis', card: Card, groupCardIds?: string[]) => {
    if (!isPlanningPhase) return;
    if (
      isCardDisabled(
        card,
        phase,
        team.selectedCards.acquisition,
        team.selectedCards.analysis,
        groupCardIds,
        budgetRemainingClocks
      )
    )
      return;
    const selected = team.selectedCards[phase].some((c) => c.id === card.id);
    if (selected) {
      deselectCard(team.id, phase, card.id);
    } else {
      if (groupCardIds && phase === 'acquisition') {
        groupCardIds.forEach((id) => {
          if (id !== card.id && team.selectedCards.acquisition.some((c) => c.id === id)) {
            deselectCard(team.id, phase, id);
          }
        });
      }
      selectCard(team.id, phase, card);
    }
  };

  const acquisitionCards = availableCards.filter((c) => c.category === 'microscopy');
  const analysisCards = availableCards.filter((c) => c.category === 'analysis');

  const acquisitionRowsToShow = acquisitionCardGroups.filter((group) => {
    if (group.showOnlyWhenSelected) {
      const hasRequired = group.showOnlyWhenSelected.some((id) =>
        team.selectedCards.acquisition.some((c) => c.id === id)
      );
      if (!hasRequired) return false;
    }
    return true;
  });
  const showAcquisitionCards = session?.currentPhase === 'acquisition' || session?.currentPhase === 'analysis';
  const showAnalysisCards = session?.currentPhase === 'analysis';
  const isReviewPhase = session?.currentPhase === 'review';
  const hasAssignedExperiment = team.experiment.number >= 1;
  const experiment = hasAssignedExperiment ? experiments.find((e) => e.id === team.experiment.number) : null;

  return (
    <div className="space-y-4">
      {session.currentPhase === 'analysis' && (
        <MetricsCheatsheetPanel isOpen={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} onToggle={() => setCheatsheetOpen((o) => !o)} />
      )}
      <div className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <p className="text-xs text-slate-200">
            Session {session.sessionCode} • Phase: {phaseLabel[session.currentPhase] ?? session.currentPhase}
          </p>
          <p className="mt-1 text-xs text-sky-100">
            {showBudgetCountdown ? (
              <>
                Budget remaining:{' '}
                <span className="font-semibold">
                  {budgetRemainingClocks ?? 0} <span className="ml-1">⏰</span>
                </span>
                <span className="ml-2 text-slate-300">/ {timeBudgetClocks} ⏰</span>
              </>
            ) : (
              <>
                Total time:{' '}
                <span className="font-semibold">
                  {team.totalTimeCost} <span className="ml-1">⏰</span>
                </span>
              </>
            )}
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

      {(showAcquisitionCards || showAnalysisCards) && (
      <div className="grid gap-4 md:grid-cols-2">
      {showAcquisitionCards && (
      <section className="card space-y-3 overflow-y-auto max-h-[70vh]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Acquisition Planning</h3>
          <span className="pill text-[11px]">
            {team.selectedCards.acquisition.length} selected
          </span>
        </div>
        {!isPlanningPhase && (
          <p className="text-[11px] text-slate-400">
            Waiting for Reviewer 3 phase change; selections are read-only.
          </p>
        )}
        <div className="space-y-4">
          {(['microscope', 'image'] as const).map((sectionKey) => {
            const sectionGroups = acquisitionRowsToShow.filter((g) => g.section === sectionKey);
            if (sectionGroups.length === 0) return null;
            const config = acquisitionSectionConfig[sectionKey];
            return (
              <div key={sectionKey} className={`rounded-lg border-2 ${config.borderColor} bg-slate-900/30 p-3`}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  {config.title}
                </h4>
                {sectionKey === 'microscope' && (
                  <p className="mb-3 text-sm font-medium text-sky-200">Choose 1 card per row</p>
                )}
                {sectionKey === 'image' && (
                  <p className="mb-3 text-sm font-medium text-pink-200">Choose 1 card per row</p>
                )}
                <div className="space-y-2">
                  {sectionGroups.map((group) => {
                    const cardsInGroup = group.cardIds.map((id) => cardById[id]).filter(Boolean);
                    return (
                      <div key={group.label} className="space-y-1">
                        <p className="text-xs font-medium text-slate-300">
                          {group.label}
                          {group.optional && <span className="ml-1.5 text-slate-500">(OPTIONAL)</span>}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {cardsInGroup.map((card) => (
                            <CardPill
                              key={card.id}
                              card={card}
                              compact
                              selected={team.selectedCards.acquisition.some((c) => c.id === card.id)}
                              disabled={isCardDisabled(card, 'acquisition', team.selectedCards.acquisition, team.selectedCards.analysis, group.cardIds, budgetRemainingClocks)}
                              onClick={() => handleToggleCard('acquisition', card, group.cardIds)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}
      {showAnalysisCards && (
        <section className="card space-y-3 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Analysis Planning</h3>
            <span className="pill text-[11px]">
              {team.selectedCards.analysis.length} selected
            </span>
          </div>
          <p className="text-sm font-medium text-emerald-200">Pick what you need!</p>
          <div className="rounded-lg border-2 border-emerald-500/50 bg-slate-900/30 p-3">
          <div className="space-y-3">
            {analysisCardGroups.map((group) => {
              if (group.pairedRow) {
                return (
                  <div key={group.pairedRow.map((p) => p.label).join('-')} className="grid grid-cols-2 gap-x-12 gap-y-1">
                    {group.pairedRow.map((sub) => {
                      const cardsInSub = sub.cardIds.map((id) => cardById[id]).filter(Boolean);
                      return (
                        <div key={sub.label} className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300">{sub.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {cardsInSub.map((card) => (
                              <CardPill
                                key={card.id}
                                card={card}
                                compact
                                selected={team.selectedCards.analysis.some((c) => c.id === card.id)}
                                disabled={isCardDisabled(card, 'analysis', team.selectedCards.acquisition, team.selectedCards.analysis, undefined, budgetRemainingClocks)}
                                onClick={() => handleToggleCard('analysis', card, sub.cardIds)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              const cardsInGroup = group.cardIds.map((id) => cardById[id]).filter(Boolean);
              const rows = group.splitIntoRows
                ? Array.from({ length: group.splitIntoRows }, (_, i) => {
                    const perRow = Math.ceil(cardsInGroup.length / group.splitIntoRows!);
                    return cardsInGroup.slice(i * perRow, (i + 1) * perRow);
                  })
                : [cardsInGroup];
              return (
                <div key={group.label} className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">{group.label}</p>
                  {rows.map((rowCards, rowIdx) => (
                    <div key={rowIdx} className="flex flex-wrap gap-1">
                    {rowCards.map((card) => (
                      <CardPill
                        key={card.id}
                        card={card}
                        compact
                        selected={team.selectedCards.analysis.some((c) => c.id === card.id)}
                        disabled={isCardDisabled(card, 'analysis', team.selectedCards.acquisition, team.selectedCards.analysis, group.cardIds, budgetRemainingClocks)}
                        onClick={() => handleToggleCard('analysis', card, group.cardIds)}
                      />
                    ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          </div>
        </section>
      )}
      </div>
      )}

      {isReviewPhase && (
          <div className="card space-y-4">
            <h3 className="text-[21px] font-semibold">Review &amp; Defense</h3>
            <div>
              <h4 className="mb-2 text-[18px] font-semibold text-slate-200">Your selected cards</h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Microscope settings', cards: team.selectedCards.acquisition.filter((c) => c.id.startsWith('mic-')), borderColor: 'border-sky-500/50' },
                  { label: 'Image acquisition settings', cards: team.selectedCards.acquisition.filter((c) => c.id.startsWith('img-')), borderColor: 'border-pink-500/50' },
                  { label: 'Analysis', cards: team.selectedCards.analysis, borderColor: 'border-emerald-500/50' }
                ].map(({ label, cards, borderColor }) => (
                  <div key={label}>
                    <p className="mb-1 text-[15px] font-medium text-slate-400">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {cards.length === 0 ? (
                        <p className="text-[18px] text-slate-500 py-2">None selected</p>
                      ) : (
                        cards.map((c) => {
                          const isGmAdded = (team.gmAddedCardIds || []).includes(c.id);
                          return (
                            <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                              <div
                                className={`flex flex-col items-center flex-shrink-0 rounded border p-1 ${isGmAdded ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : `${borderColor} bg-slate-800/50`}`}
                              >
                                <img src={assetPath(c.iconPath)} alt={c.name} className="h-32 w-32 md:h-40 md:w-40 object-contain" />
                                <span className="mt-0.5 flex gap-0.5 text-[10px]">
                                  {Array.from({ length: c.timeCost }).map((_, i) => (
                                    <span key={i}>⏰</span>
                                  ))}
                                </span>
                              </div>
                            </HoverTooltip>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[18px] font-semibold text-slate-200">Reviewer&apos;s concerns</h4>
                {(team.reviewOutcome?.assignedConcerns || []).length === 0 ? (
                  <p className="text-[18px] text-slate-500">No concerns assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(team.reviewOutcome?.assignedConcerns || []).map((c) => (
                      <HoverTooltip key={c.id} content={<CardHoverTooltipContent card={c} />}>
                        <div className="rounded border border-slate-600 bg-slate-800/50 p-1">
                          <img src={assetPath(c.iconPath)} alt={c.name} className="h-32 w-32 md:h-40 md:w-40 object-contain" />
                          <span className="mt-1 flex justify-center gap-0.5 text-[10px]">
                            {Array.from({ length: c.timeCost }).map((_, i) => (
                              <span key={i}>⏰</span>
                            ))}
                          </span>
                        </div>
                      </HoverTooltip>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-[18px] font-semibold text-slate-200">Experimental details</h4>
                <div className="flex flex-col gap-3">
                  {(team.reviewOutcome?.assignedDetails || []).length === 0 ? (
                    <p className="text-[18px] text-slate-500">No details assigned yet.</p>
                  ) : (
                    (team.reviewOutcome?.assignedDetails || []).map((c) => {
                      const roll = team.detailsRollResults?.[c.id];
                      const failed = roll !== undefined && roll >= 1 && roll <= 3;
                      return (
                        <div key={c.id} className="flex flex-wrap items-center gap-3">
                          <HoverTooltip content={<CardHoverTooltipContent card={c} />} dim={failed}>
                            <div
                              className={`rounded border p-1 transition-opacity ${failed ? 'border-slate-600 bg-slate-800/50 opacity-50 grayscale' : 'border-slate-600 bg-slate-800/50'}`}
                            >
                              <img src={assetPath(c.iconPath)} alt={c.name} className="h-32 w-32 md:h-40 md:w-40 object-contain" />
                              <span className="mt-1 flex justify-center gap-0.5 text-[10px]">
                                {Array.from({ length: c.timeCost }).map((_, i) => (
                                  <span key={i}>⏰</span>
                                ))}
                              </span>
                            </div>
                          </HoverTooltip>
                          <DetailsCardDiceRoller
                            roll={roll}
                            onRollComplete={(value) => setDetailsCardRoll(team.id, c.id, value)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
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

/** Single d6 for one Experimental details card: 4–6 = can use, 1–3 = cannot use (gray out card). */
function DetailsCardDiceRoller({ roll, onRollComplete }: { roll: number | undefined; onRollComplete: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <AnimatedDice onComplete={onRollComplete} />
      {roll !== undefined && (
        <span className={`text-sm font-bold ${roll >= 4 ? 'text-emerald-400' : 'text-red-400'}`}>
          {roll} {roll >= 4 ? '✓ Can use' : '✗ Cannot use'}
        </span>
      )}
    </div>
  );
}

