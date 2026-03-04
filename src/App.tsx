import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { RoleSelector, GMDashboard, TeamView } from './components';
import { useGameStore } from './store';
import { assetPath } from './assetPath';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

export default function App() {
  const role = useGameStore((s) => s.role);
  const setSocket = useGameStore((s) => s.setSocket);
  const socketConnected = useGameStore((s) => !!s.socket?.connected);

  useEffect(() => {
    if (!SOCKET_URL?.trim()) return;
    const socket = io(SOCKET_URL.trim());
    socket.on('connect', () => setSocket(socket));
    socket.on('state', (data: { sessions?: Record<string, unknown>; teams?: Record<string, unknown> }) => {
      const sessions = data?.sessions && typeof data.sessions === 'object' ? data.sessions : {};
      const teams = data?.teams && typeof data.teams === 'object' ? data.teams : {};
      useGameStore.setState({ sessions, teams });
    });
    socket.on('disconnect', () => {
      setSocket(null);
      useGameStore.setState({ isJoining: false });
    });
    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [setSocket]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <header className="flex min-h-[100px] items-center justify-center border-b border-slate-800 bg-slate-950/90 py-3 md:min-h-[140px] md:py-4">
        <div className="flex w-full max-w-6xl items-center justify-center px-4">
          <div className="flex items-center">
            <img
              src={assetPath('/coLoc_logo.png')}
              alt="coLoc Game"
              className="h-[72px] w-auto object-contain md:h-[100px] lg:h-[120px]"
            />
            <div className="ml-4 flex flex-col justify-center md:ml-6">
              <h1 className="font-display text-base font-semibold tracking-tight text-slate-100 md:text-xl">
                coLoc Game
              </h1>
              <p className="text-[10px] text-slate-400 md:text-xs">
                Collaborative co-localization experiment planning
              </p>
              {SOCKET_URL && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] ${
                    socketConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                  title={socketConnected ? 'Connected to game server – remote play' : 'Connecting to game server…'}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  {socketConnected ? 'Online' : 'Connecting…'}
                </span>
              )}
            </div>
            <nav className="ml-6 flex flex-col gap-1 md:ml-8">
              <a
                href="https://biop.github.io/coLoc/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-sky-200 hover:text-sky-100 md:text-[15px]"
              >
                <span aria-hidden className="text-[1.5em] leading-none">🃏</span>
                coLoc main page
              </a>
              <a
                href="https://github.com/BIOP/coLoc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-sky-200 hover:text-sky-100 md:text-[15px]"
              >
                <svg aria-hidden className="h-5 w-5 md:h-6 md:w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                coLoc repo
              </a>
              <a
                href="https://github.com/emiglietta/coloc-game"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-sky-200 hover:text-sky-100 md:text-[15px]"
              >
                <span aria-hidden className="text-[1.5em] leading-none">🎮</span>
                coLoc (web version) repo
              </a>
              <a
                href="https://focalplane.biologists.com/2024/10/20/teaching-co-localisation-analysis-from-lecture-to-leisure/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-sky-200 hover:text-sky-100 md:text-[15px]"
              >
                <span aria-hidden className="text-[1.5em] leading-none">📰</span>
                FocalPlane article
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4">
        <RoleSelector />
        {!role && (
          <p className="text-xs text-slate-300">
            Choose whether you are the <span className="font-semibold">Game Master</span> or part of a{' '}
            <span className="font-semibold">Team</span> to get started.
          </p>
        )}
        {role === 'gm' && <GMDashboard />}
        {role === 'team' && <TeamView />}
      </main>
    </div>
  );
}

