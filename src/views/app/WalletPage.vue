<script setup lang="ts">
import { CreditCard, Gift, Landmark, Wallet } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, parseYuanToFen } from "@/lib/utils";
import { api } from "@/services/api";
import type { CommConfig, UserInfo } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const pending = ref(false);
const user = ref<UserInfo | null>(null);
const config = ref<CommConfig | null>(null);

const depositAmount = ref("");
const depositError = ref("");
const withdrawAmount = ref("");
const withdrawAccount = ref("");
const withdrawMethod = ref("");
const giftCard = ref("");
const giftCardError = ref("");

const withdrawMethods = computed(() => config.value?.withdraw_methods ?? []);

function getGiftCardErrorMessage(message: string) {
  const normalized = message.trim();
  if (!normalized) return "兑换失败，请稍后重试。";
  if (/gift\s*card.*does\s*not\s*exist|not\s*found|invalid|不存在/i.test(normalized)) return "兑换码不存在，请确认后再试。";
  if (/expired|过期/i.test(normalized)) return "兑换码已过期，请更换后再试。";
  if (/used|redeemed|已使用/i.test(normalized)) return "兑换码已使用，无法重复兑换。";
  if (/disabled|unavailable|禁用|不可用/i.test(normalized)) return "该兑换码当前不可用，请联系站点管理员。";
  return /[A-Za-z]/.test(normalized) ? "兑换失败，请稍后重试。" : normalized;
}

function getDepositErrorMessage(message: string) {
  const normalized = message.trim();
  if (!normalized) return "暂时无法创建充值订单，请稍后再试。";
  if (/unpaid|pending order|未支付|待支付|pending/i.test(normalized)) {
    return "您当前还有未支付订单，请先前往订单页完成支付或取消后，再进行余额充值。";
  }
  return /[A-Za-z]/.test(normalized) ? "暂时无法创建充值订单，请稍后再试。" : normalized;
}

onMounted(async () => {
  const [userInfo, comm] = await Promise.all([
    api.getUserInfo().catch(() => null),
    api.getCommConfig().catch(() => null),
  ]);

  user.value = userInfo;
  config.value = comm;
  withdrawMethod.value = withdrawMethods.value[0] ?? "";
  loading.value = false;
});

async function createDepositOrder() {
  if (!depositAmount.value) return;
  const amount = parseYuanToFen(depositAmount.value);
  if (!amount) {
    depositError.value = "请输入正确的充值金额。";
    return;
  }

  depositError.value = "";
  pending.value = true;
  try {
    const result = await api.createDepositOrder(amount);
    const tradeNo = typeof result === "string" ? result : result.trade_no;
    toast.success("充值订单已创建，正在前往支付页。");
    depositAmount.value = "";
    await router.push(`/payment/${tradeNo}`);
  } catch (err) {
    const message = getDepositErrorMessage(err instanceof Error ? err.message : "");
    depositError.value = message;
  } finally {
    pending.value = false;
  }
}

async function withdraw() {
  if (!withdrawAmount.value || !withdrawAccount.value || !withdrawMethod.value) return;
  const amount = parseYuanToFen(withdrawAmount.value);
  if (!amount) {
    toast.error("请输入正确的提现金额。");
    return;
  }

  pending.value = true;
  try {
    await api.withdrawCommission({
      amount,
      account: withdrawAccount.value,
      method: withdrawMethod.value,
    });
    toast.success("提现申请已提交。");
    withdrawAmount.value = "";
    withdrawAccount.value = "";
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "暂时无法提交提现申请，请稍后再试。");
  } finally {
    pending.value = false;
  }
}

async function redeemGiftCard() {
  const code = giftCard.value.trim();
  if (!code) return;

  giftCardError.value = "";
  pending.value = true;
  try {
    await api.redeemGiftCard(code);
    toast.success("兑换成功，额度已发放到当前账户。");
    giftCard.value = "";
  } catch (err) {
    const message = getGiftCardErrorMessage(err instanceof Error ? err.message : "");
    giftCardError.value = message;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageHeader
    title="钱包"
    description="在这里管理余额充值、礼品卡兑换和佣金提现，资金相关的操作都会集中展示。"
  />

  <StateBlock
    v-if="loading"
    title="正在加载钱包信息"
    description="正在同步余额、提现方式和当前资金信息，请稍候。"
  />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_72%)]" />
          <div class="relative flex items-start justify-between p-5">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">账户余额</div>
              <div class="mt-2 text-2xl font-semibold">{{ formatCurrency(user?.balance ?? 0, config?.currency ?? "CNY") }}</div>
            </div>
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
              <Wallet class="h-5 w-5 text-[var(--primary)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.14),transparent_72%)]" />
          <div class="relative flex items-start justify-between p-5">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">佣金余额</div>
              <div class="mt-2 text-2xl font-semibold">{{ formatCurrency(user?.commission_balance ?? 0, config?.currency ?? "CNY") }}</div>
            </div>
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
              <Landmark class="h-5 w-5 text-[var(--primary)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_72%)]" />
          <div class="relative flex items-start justify-between p-5">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">提现方式</div>
              <div class="mt-2 text-lg font-semibold">{{ withdrawMethods.join(" / ") || "暂未开放" }}</div>
            </div>
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
              <CreditCard class="h-5 w-5 text-[var(--primary)]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <Card class="glass-panel interactive-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.18),transparent_72%)]" />
          <div class="relative space-y-5 p-6">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">余额充值</div>
              <div class="mt-3 text-2xl font-semibold">为账户快速充值</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">输入您想充值的金额，系统会创建订单并带您继续完成支付。</div>
            </div>

            <div class="action-band rounded-[24px] p-4">
              <Input v-model="depositAmount" placeholder="请输入充值金额，单位为元" class="h-11 rounded-2xl bg-[var(--background)]/60 px-4" />
              <div class="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>充值金额</span>
                <span>{{ depositAmount ? `${depositAmount} 元` : "未填写" }}</span>
              </div>
              <p v-if="depositError" class="mt-3 text-sm text-rose-500">{{ depositError }}</p>
              <Button class="mt-4 h-11 w-full rounded-2xl shadow-[var(--shadow-soft)]" :disabled="pending || !depositAmount" @click="createDepositOrder">
                去充值
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
          <div class="relative space-y-5 p-6">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">礼品卡兑换</div>
              <div class="mt-3 text-2xl font-semibold">兑换到当前账户</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">如果您收到了兑换码，可以在这里直接兑换到当前账户。</div>
            </div>

            <div class="action-band rounded-[24px] p-4">
              <div class="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <Gift class="h-4 w-4 text-[var(--primary)]" />
                输入礼品卡兑换码后，系统会自动完成兑换。
              </div>
              <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  v-model="giftCard"
                  placeholder="请输入礼品卡兑换码"
                  class="h-11 rounded-2xl bg-[var(--background)]/60 px-4"
                  @input="giftCardError = ''"
                />
                <Button class="h-11 rounded-2xl px-5 shadow-[var(--shadow-soft)] sm:min-w-32" :disabled="pending || !giftCard.trim()" @click="redeemGiftCard">
                  立即兑换
                </Button>
              </div>
              <p v-if="giftCardError" class="mt-3 text-sm text-rose-500">{{ giftCardError }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="glass-panel interactive-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">佣金提现</div>
            <div class="mt-3 text-2xl font-semibold">提交提现申请</div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">把可提现的佣金转到您常用的收款方式，提交后等待处理即可。</div>
          </div>

          <div class="grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
            <Input v-model="withdrawAmount" placeholder="请输入提现金额，单位为元" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
            <Input v-model="withdrawAccount" placeholder="请输入收款账户" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
            <select
              v-model="withdrawMethod"
              class="h-11 w-full rounded-2xl border border-white/10 bg-[var(--surface-elevated)] px-4 text-sm outline-none"
            >
              <option disabled value="">请选择提现方式</option>
              <option v-for="method in withdrawMethods" :key="method" :value="method">{{ method }}</option>
            </select>
          </div>

          <Separator class="my-5" />

          <div class="action-band flex flex-wrap items-center justify-between gap-3 rounded-[24px] p-4">
            <div class="text-sm text-[var(--muted-foreground)]">当前支持：{{ withdrawMethods.join(" / ") || "暂未开放提现" }}</div>
            <Button
              variant="outline"
              class="h-11 rounded-2xl px-5"
              :disabled="pending || !withdrawAmount || !withdrawAccount || !withdrawMethod"
              @click="withdraw"
            >
              提交提现申请
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
