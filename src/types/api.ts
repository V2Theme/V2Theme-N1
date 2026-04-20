export interface SiteConfig {
  app_name?: string;
  app_description?: string;
  logo?: string;
  email_whitelist_suffix?: string[];
  is_email_verify?: number;
  is_invite_force?: number;
  is_recaptcha?: number;
  tos_url?: string;
}

export interface UserInfo {
  email: string;
  balance: number;
  commission_balance?: number;
  created_at?: number;
  remind_expire?: number;
  remind_traffic?: number;
  plan_id?: number | null;
  transfer_enable?: number;
  device_limit?: number | null;
  u?: number;
  d?: number;
  expired_at?: number | null;
  auto_renewal?: number;
  avatar_url?: string;
  uuid?: string;
}

export interface CommConfig {
  currency_symbol?: string;
  currency?: string;
  telegram_discuss_link?: string | null;
  withdraw_methods?: string[];
  withdraw_close?: number;
  is_telegram?: number;
}

export interface SubscribeInfo {
  subscribe_url?: string;
  token?: string;
  transfer_enable?: number;
  u?: number;
  d?: number;
  expired_at?: number | null;
  reset_day?: number | null;
  allow_new_period?: number;
  uuid?: string;
  email?: string;
  device_limit?: number | null;
  plan?: {
    id: number;
    name: string;
    content?: string;
  };
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: number;
}

export interface UserStat {
  request_num?: number;
  ticket_num?: number;
  order_num?: number;
  day_used_traffic?: number;
  month_used_traffic?: number;
}

export interface Plan {
  id: number;
  name: string;
  content?: string;
  transfer_enable?: number;
  speed_limit?: number | null;
  device_limit?: number | null;
  capacity_limit?: number | null;
  reset_price?: number | null;
  month_price?: number | null;
  quarter_price?: number | null;
  half_year_price?: number | null;
  year_price?: number | null;
  two_year_price?: number | null;
  three_year_price?: number | null;
  onetime_price?: number | null;
}

export interface Ticket {
  id: number;
  subject: string;
  level: number;
  status: number;
  updated_at: number;
  created_at: number;
}

export interface TicketMessage {
  id: number;
  is_admin: number;
  message: string;
  created_at: number;
}

export interface InviteCode {
  id: number;
  user_id?: number;
  code: string;
  status?: number;
  pv?: number;
  created_at?: number;
  updated_at?: number;
}

export interface InviteSummaryStat {
  commission?: number;
  register_count?: number;
  pay_commission?: number;
}

export interface InviteSummary {
  codes?: InviteCode[];
  stat?: InviteSummaryStat[];
}

export interface InviteDetail {
  id: number;
  email: string;
  status: number;
  get_amount: number;
  created_at: number;
}

export interface ServerNode {
  id: number;
  name: string;
  type: string;
  rate: number | string;
  host?: string;
  port?: number;
  tags?: string[] | null;
  protocol?: string | null;
  cipher?: string | null;
  is_online?: number;
  last_check_at?: number | string | null;
}

export interface Order {
  trade_no: string;
  status: number;
  total_amount: number;
  created_at: number;
  period: string;
  plan?: Plan;
  discount_amount?: number;
  balance_amount?: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  payment?: string;
  icon?: string;
  handling_fee_percent?: number | null;
  handling_fee_fixed?: number | null;
}

export interface CheckoutResult {
  type?: number | string;
  data?: string;
}

export type CheckoutPayload = CheckoutResult | string;

export interface ActiveSession {
  ip?: string;
  ua?: string;
  login_at?: number;
  auth_data?: string;
}

export interface TelegramBotInfo {
  username?: string;
  link?: string;
}

export interface KnowledgeArticleSummary {
  id: number;
  category: string;
  title: string;
  updated_at: number;
}

export type KnowledgeCategoryMap = Record<string, KnowledgeArticleSummary[]>;

export interface KnowledgeArticleDetail extends KnowledgeArticleSummary {
  body?: string;
  content?: string;
}
