import type {
  ActiveSession,
  CheckoutPayload,
  CheckoutResult,
  CommConfig,
  InviteDetail,
  InviteSummary,
  InviteSummaryStat,
  KnowledgeArticleDetail,
  KnowledgeCategoryMap,
  Notice,
  Order,
  PaymentMethod,
  Plan,
  ServerNode,
  SiteConfig,
  SubscribeInfo,
  TelegramBotInfo,
  Ticket,
  TicketMessage,
  UserInfo,
  UserStat,
} from "@/types/api";
import { http } from "@/services/http";

function normalizeStatPayload(payload: UserStat | number[] | null | undefined): UserStat {
  if (Array.isArray(payload)) {
    return {
      day_used_traffic: Number(payload[0] ?? 0),
      month_used_traffic: Number(payload[1] ?? 0),
      request_num: Number(payload[2] ?? 0),
    };
  }
  return payload ?? {};
}

function normalizeSessions(payload: ActiveSession[] | Record<string, ActiveSession> | null | undefined) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  return Object.values(payload).sort((a, b) => Number(b.login_at ?? 0) - Number(a.login_at ?? 0));
}

function normalizeCheckout(payload: CheckoutPayload): CheckoutResult {
  if (typeof payload === "string") {
    return {
      type: 1,
      data: payload,
    };
  }

  return payload ?? {};
}

function normalizeInviteSummary(payload: InviteSummary | { codes?: unknown[]; stat?: unknown } | null | undefined): InviteSummary {
  if (!payload || typeof payload !== "object") return {};

  const rawCodes = Array.isArray(payload.codes) ? payload.codes : [];
  const codes = rawCodes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        id: Number(record.id ?? 0),
        user_id: Number(record.user_id ?? 0),
        code: String(record.code ?? ""),
        status: Number(record.status ?? 0),
        pv: Number(record.pv ?? 0),
        created_at: Number(record.created_at ?? 0),
        updated_at: Number(record.updated_at ?? 0),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.code));

  let stat: InviteSummaryStat[] = [];
  if (Array.isArray(payload.stat)) {
    if (payload.stat.length && typeof payload.stat[0] === "number") {
      stat = [
        {
          commission: Number(payload.stat[0] ?? 0),
          register_count: Number(payload.stat[3] ?? 0),
          pay_commission: Number(payload.stat[1] ?? 0),
        },
      ];
    } else {
      stat = payload.stat as InviteSummaryStat[];
    }
  }

  return { codes, stat };
}

function normalizeTicketDetail(payload: unknown): { messages?: TicketMessage[]; ticket?: Ticket } {
  if (Array.isArray(payload)) {
    return { messages: payload as TicketMessage[] };
  }

  if (!payload || typeof payload !== "object") return {};

  const record = payload as Record<string, unknown>;
  const possibleMessages = [
    record.messages,
    record.message,
    record.replies,
    record.reply,
    record.items,
    record.records,
  ].find((item) => Array.isArray(item));

  const ticket =
    record.ticket && typeof record.ticket === "object"
      ? (record.ticket as Ticket)
      : "id" in record && "subject" in record
        ? (record as unknown as Ticket)
        : undefined;

  return {
    ticket,
    messages: Array.isArray(possibleMessages) ? (possibleMessages as TicketMessage[]) : [],
  };
}

export const api = {
  getSiteConfig: () => http<SiteConfig>({ path: "/guest/comm/config", auth: false }),
  login: (body: { email: string; password: string }) =>
    http<{ token: string; auth_data: string; is_admin?: number }>({
      method: "POST",
      path: "/passport/auth/login",
      body,
      auth: false,
    }),
  register: (body: { email: string; password: string; invite_code?: string; email_code?: string }) =>
    http({
      method: "POST",
      path: "/passport/auth/register",
      body,
      auth: false,
    }),
  resetPassword: (body: { email: string; password: string; email_code: string }) =>
    http({
      method: "POST",
      path: "/passport/auth/forget",
      body,
      auth: false,
    }),
  sendEmailCode: (body: { email: string; isForgetPassword?: boolean }) =>
    http({
      method: "POST",
      path: "/passport/comm/sendEmailVerify",
      body,
      auth: false,
    }),
  getUserInfo: () => http<UserInfo>({ path: "/user/info" }),
  getCommConfig: () => http<CommConfig>({ path: "/user/comm/config" }),
  getSubscribe: () => http<SubscribeInfo>({ path: "/user/getSubscribe" }),
  getNotices: () => http<Notice[]>({ path: "/user/notice/fetch" }),
  getStats: async () => normalizeStatPayload(await http<UserStat | number[]>({ path: "/user/getStat" })),
  getPlans: () => http<Plan[]>({ path: "/user/plan/fetch" }),
  getPlan: (id: string | number) => http<Plan>({ path: "/user/plan/fetch", query: { id } }),
  getKnowledgeList: (language = "zh-CN") =>
    http<KnowledgeCategoryMap>({ path: "/user/knowledge/fetch", query: { language } }),
  getKnowledgeDetail: (id: number, language = "zh-CN") =>
    http<KnowledgeArticleDetail>({ path: "/user/knowledge/fetch", query: { id, language } }),
  checkCoupon: (code: string, planId: number) =>
    http<{ type: number; value: number; name?: string }>({
      method: "POST",
      path: "/user/coupon/check",
      body: { code, plan_id: planId },
    }),
  createOrder: (body: { plan_id: number; period: string; coupon_code?: string; deposit_amount?: number }) =>
    http<{ trade_no: string } | string>({
      method: "POST",
      path: "/user/order/save",
      body,
    }),
  createDepositOrder: (amount: number) =>
    http<{ trade_no: string } | string>({
      method: "POST",
      path: "/user/order/save",
      body: {
        period: "deposit",
        deposit_amount: amount,
        plan_id: 0,
      },
    }),
  getOrders: () => http<Order[]>({ path: "/user/order/fetch" }),
  getOrderDetail: (tradeNo: string) => http<Order>({ path: "/user/order/detail", query: { trade_no: tradeNo } }),
  checkOrderStatus: (tradeNo: string) => http<number>({ path: "/user/order/check", query: { trade_no: tradeNo } }),
  getPaymentMethods: () => http<PaymentMethod[]>({ path: "/user/order/getPaymentMethod" }),
  checkoutOrder: async (tradeNo: string, method: number) =>
    normalizeCheckout(await http<CheckoutPayload>({
      method: "POST",
      path: "/user/order/checkout",
      body: { trade_no: tradeNo, method },
    })),
  cancelOrder: (tradeNo: string) =>
    http({
      method: "POST",
      path: "/user/order/cancel",
      body: { trade_no: tradeNo },
    }),
  getTickets: () => http<Ticket[]>({ path: "/user/ticket/fetch" }),
  getTicketDetail: async (id: number) =>
    normalizeTicketDetail(await http<unknown>({ path: "/user/ticket/fetch", query: { id } })),
  createTicket: (body: { subject: string; message: string; level: number }) =>
    http({
      method: "POST",
      path: "/user/ticket/save",
      body,
    }),
  replyTicket: (id: number, message: string) =>
    http({
      method: "POST",
      path: "/user/ticket/reply",
      body: { id, message },
    }),
  closeTicket: (id: number) =>
    http({
      method: "POST",
      path: "/user/ticket/close",
      body: { id },
    }),
  getInviteSummary: async () => normalizeInviteSummary(await http<InviteSummary>({ path: "/user/invite/fetch" })),
  getInviteDetails: (current = 1, pageSize = 10) =>
    http<InviteDetail[]>({ path: "/user/invite/details", query: { current, page_size: pageSize } }),
  saveInviteCode: () => http({ path: "/user/invite/save" }),
  transferCommission: (amount: number) =>
    http({
      method: "POST",
      path: "/user/transfer",
      body: { transfer_amount: amount },
    }),
  withdrawCommission: (body: { amount: number; account: string; method: string }) =>
    http({
      method: "POST",
      path: "/user/ticket/withdraw",
      body: {
        withdraw_amount: body.amount,
        withdraw_account: body.account,
        withdraw_method: body.method,
      },
    }),
  getNodes: () => http<ServerNode[]>({ path: "/user/server/fetch" }),
  updateUser: (body: Record<string, unknown>) => http({ method: "POST", path: "/user/update", body }),
  redeemGiftCard: (giftcard: string) =>
    http({
      method: "POST",
      path: "/user/redeemgiftcard",
      body: { giftcard },
    }),
  getActiveSessions: async () =>
    normalizeSessions(await http<ActiveSession[] | Record<string, ActiveSession>>({ path: "/user/getActiveSession" })),
  getTelegramBotInfo: async () => {
    const payload = await http<TelegramBotInfo | null>({ path: "/user/telegram/getBotInfo" }).catch(() => null);
    return payload ?? null;
  },
  changePassword: (body: { old_password: string; new_password: string }) =>
    http({
      method: "POST",
      path: "/user/changePassword",
      body,
    }),
  resetSecurity: () => http({ path: "/user/resetSecurity" }),
};
