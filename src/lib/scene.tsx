'use client';

// Scene context — the bridge between "what page am I on" and "what should the
// living backdrop show". Pages that know their real-world context (the Listen
// page knows the chosen accent = country and the situation pack = topic) push it
// here; <Atmosphere> reads it and resolves country/topic-matched footage. When a
// page sets nothing, Atmosphere falls back to its route-based themed pool.
import { createContext, useContext, useState, ReactNode } from 'react';

export type Country = 'uk' | 'us' | 'in' | null;
export type Topic = 'airport' | 'cafe' | 'hotel' | 'directions' | 'emergencies' | null;

type Scene = { country: Country; topic: Topic };
type Ctx = Scene & { setScene: (s: Partial<Scene>) => void };

const SceneContext = createContext<Ctx>({ country: null, topic: null, setScene: () => {} });

export function SceneProvider({ children }: { children: ReactNode }) {
  const [scene, setSceneState] = useState<Scene>({ country: null, topic: null });
  const setScene = (s: Partial<Scene>) => setSceneState(prev => ({ ...prev, ...s }));
  return (
    <SceneContext.Provider value={{ ...scene, setScene }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  return useContext(SceneContext);
}
