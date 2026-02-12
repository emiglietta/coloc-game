import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { RoleSelector, GMDashboard, TeamView } from './components';
import { useGameStore } from './store';

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
          <img
            src="/coLoc_logo.png"
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

