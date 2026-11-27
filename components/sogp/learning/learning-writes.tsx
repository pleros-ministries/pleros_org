"use client";
import { createContext, useContext, type ReactNode } from "react";

import { chooseSogpPathAction, editSogpPlanAction } from "@/app/_actions/sogp-learning-actions";

/**
 * Where the path chooser and plan builder save, and where they go next. The
 * dashboard uses the real server actions; /demo swaps in an in-memory copy so
 * the same screens can be walked without signing in or saving anything.
 */
export type LearningWrites = {
  choosePath: typeof chooseSogpPathAction;
  editPlan: typeof editSogpPlanAction;
  /** Maps a dashboard href to where it lives here. */
  href: (path: string) => string;
};

const LearningWritesContext = createContext<LearningWrites>({ choosePath: chooseSogpPathAction, editPlan: editSogpPlanAction, href: path => path });

export function LearningWritesProvider({ value, children }: { value: LearningWrites; children: ReactNode }) {
  return <LearningWritesContext.Provider value={value}>{children}</LearningWritesContext.Provider>;
}

export const useLearningWrites = () => useContext(LearningWritesContext);
