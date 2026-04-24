/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Attachment {
  id: string;
  name: string;
  data: string;
  type: string;
}

export interface UrlReference {
  id: string;
  val: string;
  label: string;
}

export interface Trade {
  id: string;
  date: string;
  timeEntry: string;
  timeClose: string;
  symbol: string;
  session: string;
  direction: "Long" | "Short";
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  pnl: number;
  rr: number;
  lots: number;
  strategy: string;
  entryWindow: string;
  account: string;
  followedRules: string[];
  mentalPre: string;
  mentalDuring: string;
  mentalPost: string;
  notes: string;
  tags: string[];
  images: Attachment[];
  urls: UrlReference[];
  mfe?: number;
  mae?: number;
}

export interface TradeReview {
  id: string;
  tradeId: string;
  date: string;
  grade: string;
  execution: string;
  missed: string;
  emotion: string;
  lesson: string;
  mistakes: string[];
}

export interface Premarket {
  id: string;
  date: string;
  bias: string;
  keyLevels: string;
  newsToday: string;
  avoidToday: string;
  checklist: boolean[];
  notes: string;
  images: Attachment[];
  urls: UrlReference[];
}

export interface SessionReview {
  id: string;
  type: string; // "Daily" | "Weekly" | "Monthly" | "Quarterly"
  date: string;
  marketConditions: string;
  overallMindset: string;
  mindsetOther?: string;
  grade: string;
  energy: string;
  wentWell: string;
  challenges: string;
  lessons: string;
  rulesScore: string;
  tomorrowPlan: string;
  images: Attachment[];
  urls: UrlReference[];
}

export interface Mistake {
  id: string;
  date: string;
  category: string;
  symbol: string;
  session: string;
  description: string;
  impact: number;
  recurrence: number;
}

export interface WeeklyOutlook {
  id: string;
  type: string;
  date: string;
  title: string;
  newsCalendar: string;
  macroDrivers: string;
  keyLevels: string;
  narrative: string;
  lastWeekBottomLine: string;
  watchThisWeek: string;
  notes: string;
  bias: string;
  urls: UrlReference[];
  images: Attachment[];
}

export interface PlaybookSetup {
  id: string;
  name: string;
  symbol: string;
  session: string;
  timeframe: string;
  description: string;
  entryRules: string;
  invalidation: string;
  targetRR: string;
  grade: string;
  images: Attachment[];
  urls: UrlReference[];
}

export interface RiskSettings {
  dailyLimit: number;
  weeklyLimit: number;
  maxTrades: number;
  monthlyTarget?: number;
  weeklyTradeLimit?: number;
  winRateTarget?: number;
  maxConsecLosses?: number;
  calcAccount?: number;
  calcRiskPct?: number;
  calcSymbol?: string;
  calcStop?: number;
  nonNegotiables?: { id: string; text: string }[];
  quickLinks?: { l: string; u: string }[];
}

export interface Profile {
  name: string;
  avatar?: string;
  lastBackup?: string;
}

export interface DeletedItem {
  type: "trade" | "tradeReview" | "premarket" | "sessionReview" | "mistake" | "weeklyOutlook" | "playbookSetup";
  data: any;
  deletedAt: string;
}
