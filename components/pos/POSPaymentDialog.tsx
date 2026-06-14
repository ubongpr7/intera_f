"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Mail,
  Plus,
  ReceiptText,
  Smartphone,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";
import type {
  POSOrder,
  POSPaymentInput,
  POSPaymentMethod,
} from "@/redux/features/pos/posTypes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

type PaymentSubmission = {
  payments: POSPaymentInput[];
  emailAddress?: string;
  printReceipt: boolean;
};

interface POSPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: POSOrder;
  currencyCode: string;
  defaultPrintReceipt: boolean;
  allowSplitPayment: boolean;
  isProcessing: boolean;
  onSubmit: (data: PaymentSubmission) => Promise<void>;
}

const paymentMethods: Array<{
  value: POSPaymentMethod;
  label: string;
  icon: typeof Banknote;
}> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mobile", label: "Mobile transfer", icon: Smartphone },
  { value: "qr", label: "QR", icon: ReceiptText },
  { value: "loyalty", label: "Loyalty", icon: ReceiptText },
  { value: "gift_card", label: "Gift card", icon: ReceiptText },
];

const asNumber = (value: string | number | undefined | null) =>
  Number(value ?? 0);

const createPaymentLine = (
  amount: string,
  paymentMethod: POSPaymentMethod = "cash",
) => ({
  id: crypto.randomUUID(),
  paymentMethod,
  amount,
  cashReceived: "",
  referenceNumber: "",
});

export default function POSPaymentDialog({
  open,
  onOpenChange,
  order,
  currencyCode,
  defaultPrintReceipt,
  allowSplitPayment,
  isProcessing,
  onSubmit,
}: POSPaymentDialogProps) {
  const [payments, setPayments] = useState(() => [
    createPaymentLine(
      String(order?.remaining_balance ?? order?.total_amount ?? 0),
    ),
  ]);
  const [emailAddress, setEmailAddress] = useState("");
  const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt);

  const remainingBalanceValue = asNumber(
    order?.remaining_balance ?? order?.total_amount,
  );
  const allocatedTotal = payments.reduce(
    (sum, line) => sum + asNumber(line.amount),
    0,
  );
  const remainingToAllocate = Math.max(
    remainingBalanceValue - allocatedTotal,
    0,
  );
  const changeDue = payments.reduce((sum, line) => {
    if (line.paymentMethod !== "cash") {
      return sum;
    }
    return (
      sum + Math.max(0, asNumber(line.cashReceived) - asNumber(line.amount))
    );
  }, 0);

  const canSubmit = useMemo(() => {
    if (!order) {
      return false;
    }

    if (order.payment_status === "paid" || remainingBalanceValue <= 0) {
      return false;
    }

    if (payments.length > 1 && !allowSplitPayment) {
      return false;
    }

    if (payments.some((line) => asNumber(line.amount) <= 0)) {
      return false;
    }

    const total = payments.reduce(
      (sum, line) => sum + asNumber(line.amount),
      0,
    );
    if (total !== remainingBalanceValue) {
      return false;
    }

    return payments.every((line) => {
      if (line.paymentMethod !== "cash") {
        return true;
      }
      return (
        !line.cashReceived ||
        asNumber(line.cashReceived) >= asNumber(line.amount)
      );
    });
  }, [allowSplitPayment, order, payments, remainingBalanceValue]);

  const updatePaymentLine = (
    id: string,
    patch: Partial<(typeof payments)[number]>,
  ) => {
    setPayments((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const addPaymentLine = () => {
    const nextAmount =
      remainingToAllocate > 0 ? String(remainingToAllocate.toFixed(2)) : "0.00";
    setPayments((current) => [...current, createPaymentLine(nextAmount)]);
  };

  const removePaymentLine = (id: string) => {
    setPayments((current) =>
      current.length > 1 ? current.filter((line) => line.id !== id) : current,
    );
  };

  const handleSubmit = async () => {
    try {
      await onSubmit({
        payments: payments.map((line) => ({
          payment_method: line.paymentMethod,
          amount: line.amount,
          cash_received:
            line.paymentMethod === "cash"
              ? line.cashReceived || undefined
              : undefined,
          reference_number:
            line.paymentMethod === "cash"
              ? undefined
              : line.referenceNumber || undefined,
        })),
        emailAddress: emailAddress || undefined,
        printReceipt,
      });
      onOpenChange(false);
    } catch {
      // The workspace already handles checkout failures and shows the right toast/state.
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-gray-200 bg-white p-0 text-gray-900 duration-500 sm:max-w-3xl"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-gray-100 px-6 py-5">
            <SheetTitle>Process payment</SheetTitle>
            <SheetDescription>
              Settle the current draft order and optionally send a receipt
              email.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-5 pb-8">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Order
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {order?.order_number || "No draft"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Subtotal
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(currencyCode, order?.subtotal ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Total
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(currencyCode, order?.total_amount ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Remaining
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(currencyCode, remainingBalanceValue)}
                    </div>
                  </div>
                </div>
              </div>

              {order?.payment_status === "paid" || remainingBalanceValue <= 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This order has already been paid. Close this panel and continue with inventory completion if required.
                </div>
              ) : null}

              {allowSplitPayment ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      Split payments enabled
                    </div>
                    <div className="text-xs text-blue-700">
                      Add multiple payment methods so they add up to the
                      remaining balance.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPaymentLine}
                  >
                    <Plus className="h-4 w-4" />
                    Add payment
                  </Button>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Payment methods
                  </div>
                  <div className="text-xs text-gray-500">
                    Allocated {formatCurrency(currencyCode, allocatedTotal)} /{" "}
                    {formatCurrency(currencyCode, remainingBalanceValue)}
                  </div>
                </div>

                <div className="space-y-4">
                  {payments.map((line, index) => {
                    const amountNumber = asNumber(line.amount);
                    const cashReceivedNumber = asNumber(line.cashReceived);
                    const lineChangeDue = Math.max(
                      0,
                      cashReceivedNumber - amountNumber,
                    );
                    return (
                      <div
                        key={line.id}
                        className="rounded-2xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-900">
                            Payment {index + 1}
                          </div>
                          {allowSplitPayment && payments.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePaymentLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            const active = line.paymentMethod === method.value;
                            return (
                              <button
                                key={`${line.id}-${method.value}`}
                                type="button"
                                onClick={() =>
                                  updatePaymentLine(line.id, {
                                    paymentMethod: method.value,
                                  })
                                }
                                className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                                  active
                                    ? "border-blue-300 bg-blue-50 text-blue-900"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm font-semibold">
                                    {method.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Amount
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.amount}
                              onChange={(event) =>
                                updatePaymentLine(line.id, {
                                  amount: event.target.value,
                                })
                              }
                            />
                          </div>
                          {line.paymentMethod === "cash" ? (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Cash received
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={line.cashReceived}
                                onChange={(event) =>
                                  updatePaymentLine(line.id, {
                                    cashReceived: event.target.value,
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Reference number
                              </label>
                              <Input
                                value={line.referenceNumber}
                                onChange={(event) =>
                                  updatePaymentLine(line.id, {
                                    referenceNumber: event.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {line.paymentMethod === "cash" ? (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                              Change due
                            </div>
                            <div className="mt-1 text-xl font-semibold text-emerald-900">
                              {formatCurrency(currencyCode, lineChangeDue)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
                  {remainingToAllocate > 0
                    ? `Remaining to allocate: ${formatCurrency(currencyCode, remainingToAllocate)}`
                    : "Payment allocation matches the remaining balance."}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Receipt email
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(event) => setEmailAddress(event.target.value)}
                    placeholder="Optional customer email"
                  />
                </div>
                <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={printReceipt}
                    onChange={(event) => setPrintReceipt(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Print receipt
                </label>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-gray-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || isProcessing}
            >
              Process {formatCurrency(currencyCode, allocatedTotal)}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
