/** Aggregated totals for a single week. */
export interface WeeklyAggregation {
  weekId: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  loadCount: number;
  grossAmount: number;
  driverCostAmount: number;
  profitAmount: number;
  otrAmount: number;
  netProfitAmount: number;
}

/** Status counts for the donut chart. */
export interface StatusBreakdown {
  status: string;
  count: number;
}

/** Averages per load. */
export interface DashboardAverages {
  avgGross: number;
  avgProfit: number;
  avgMiles: number;
  /** Average profit margin as percentage (0–100). */
  avgProfitMargin: number;
}

/** Top corridor (from_state → to_state) with load count and total gross. */
export interface TopCorridor {
  fromState: string;
  toState: string;
  loadCount: number;
  grossAmount: number;
  profitAmount: number;
}

/** Flag usage summary. */
export interface FlagSummary {
  quickPay: number;
  directPayment: number;
  factoring: number;
  driverPaid: number;
}

/** Dashboard v2 API response. */
export interface DashboardDto {
  /** Totals across all weeks in the range. */
  totals: {
    loadCount: number;
    grossAmount: number;
    driverCostAmount: number;
    profitAmount: number;
    otrAmount: number;
    netProfitAmount: number;
  };
  /** Per-week breakdown, ordered oldest to newest (for charts). */
  weeks: WeeklyAggregation[];

  /** Load status distribution. */
  statusBreakdown: StatusBreakdown[];
  /** Per-load averages. */
  averages: DashboardAverages;
  /** Top 5 corridors by load count. */
  topCorridors: TopCorridor[];
  /** Flag usage counts. */
  flags: FlagSummary;
}
