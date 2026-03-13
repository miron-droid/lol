/**
 * @lol/shared — shared types, constants, and utilities for LOL vNext.
 *
 * Domain-specific types will be added here as bounded contexts are implemented.
 */

/** Week identifier, e.g. "LS2026-11" */
export type WeekId = string;

/** Health-check response shape reused by API and consumers. */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
}

/** Application-wide constants */
export const APP_NAME = 'LOL vNext';
export const API_PREFIX = '/api';

/** Identity / Auth */
export { Role } from './identity/role.enum';
export { Action, can, canAny, allowedActions } from './identity/permissions';
export type { UserProfile, LoginRequest, LoginResponse } from './identity/user.types';

/** Week */
export { weekLabel, parseWeekLabel, weekDateRange, isoWeekOfDate } from './week/week.utils';
export type { WeekDto } from './week/week.types';

/** Load Registry */
export { LoadStatus } from './load/load-status.enum';
export { calcProfit, calcProfitPercent, calcOtr, calcNetProfitV1, calcFinanceBreakdown, OTR_RATE } from './load/load.utils';
export type { FinanceBreakdown } from './load/load.utils';
export type { LoadDto, CreateLoadRequest, UpdateLoadRequest } from './load/load.types';

/** Dashboard */
export type { DashboardDto, WeeklyAggregation, StatusBreakdown, DashboardAverages, TopCorridor, FlagSummary } from './dashboard/dashboard.types';

/** Statements */
export type {
  StatementType,
  StatementLoadLine,
  StatementTotals,
  StatementSnapshot,
  StatementDto,
  StatementArchiveItem,
  GenerateStatementRequest,
} from './statement/statement.types';

/** Salary Rules */
export type {
  SalaryRuleTier,
  SalaryApplicationMode,
  SalaryBase,
  SalaryRuleDto,
  CreateSalaryRuleRequest,
  UpdateSalaryRuleRequest,
  SalaryRuleListItem,
} from './salary-rule/salary-rule.types';

/** Salary v1 */
export type {
  SalaryWeekStatus,
  SalaryWeekStateDto,
  SalaryAuditAction,
  SalaryAuditLogDto,
  SalaryAdjustment,
  SalarySnapshotLoadLine,
  SalarySnapshot,
  SalaryRowDto,
  SalaryRecordDto,
  SalaryPreviewRequest,
  GenerateSalaryRequest,
  UpdateAdjustmentsRequest,
} from './salary/salary.types';

/** Master Data */
export type { PickerItem, DriverDto, UnitDto, BrokerageDto } from './master-data/master-data.types';

/** Integration Events */
export { IntegrationEventStatus, IntegrationEventResult } from './integration/integration-event.enums';
export type { IntegrationEventDto, CargoWebhookPayload } from './integration/integration-event.types';
