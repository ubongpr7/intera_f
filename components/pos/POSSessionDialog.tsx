"use client"

import { formatCurrency } from "@/lib/currency-utils"
import type { POSConfiguration, POSSessionOpeningDefaults, POSTerminal } from "@/redux/features/pos/posTypes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface POSSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  terminals: POSTerminal[]
  terminalLocked?: boolean
  currentConfiguration?: POSConfiguration
  openingDefaults?: POSSessionOpeningDefaults
  currencyCode: string
  terminalId: string
  openingBalance: string
  openingVarianceReason: string
  requiresVarianceReason: boolean
  blockingNotice?: {
    title: string
    message: string
  }
  accessNotice?: {
    requiredPermission: string
    message: string
  }
  onTerminalChange: (value: string) => void
  onOpeningBalanceChange: (value: string) => void
  onOpeningVarianceReasonChange: (value: string) => void
  onOpenSession: () => void
  isOpening: boolean
}

export default function POSSessionDialog({
  open,
  onOpenChange,
  terminals,
  terminalLocked = false,
  currentConfiguration,
  openingDefaults,
  currencyCode,
  terminalId,
  openingBalance,
  openingVarianceReason,
  requiresVarianceReason,
  blockingNotice,
  accessNotice,
  onTerminalChange,
  onOpeningBalanceChange,
  onOpeningVarianceReasonChange,
  onOpenSession,
  isOpening,
}: POSSessionDialogProps) {
  const resolvedCurrency = currentConfiguration?.currency || currencyCode
  const expectedOpeningBalance =
    openingDefaults?.expected_opening_balance ?? openingDefaults?.recommended_opening_balance ?? 0
  const expectedOpeningSource =
    openingDefaults?.expected_opening_balance_source === "handover_amount"
      ? "previous handover"
      : openingDefaults?.expected_opening_balance_source === "counted_close"
        ? "previous counted close"
        : openingDefaults?.expected_opening_balance_source === "closing_balance"
          ? "previous closing balance"
          : "previous session"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-gray-200 bg-white p-0 text-gray-900">
        <DialogHeader className="border-b border-gray-100 px-6 py-5">
          <DialogTitle>Open POS session</DialogTitle>
          <DialogDescription>
            Choose the terminal and opening cash before the cashier starts the shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {accessNotice ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Permission required</p>
              <p className="mt-2 font-mono text-sm font-semibold text-red-900">{accessNotice.requiredPermission}</p>
              <p className="mt-2 text-sm text-red-800">{accessNotice.message}</p>
            </div>
          ) : null}
          {!accessNotice && blockingNotice ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{blockingNotice.title}</p>
              <p className="mt-2 text-sm text-amber-900">{blockingNotice.message}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Terminal</Label>
            {terminalLocked ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">
                {terminals.find((terminal) => terminal.sync_identifier === terminalId || terminal.id === terminalId)?.name || "Assigned terminal"}
              </div>
            ) : (
              <Select value={terminalId} onValueChange={onTerminalChange} disabled={!!accessNotice || !!blockingNotice || isOpening}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a selling terminal" />
                </SelectTrigger>
                <SelectContent>
                  {terminals.map((terminal) => (
                    <SelectItem key={terminal.id} value={terminal.sync_identifier || terminal.id}>
                      {terminal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!accessNotice && terminals.length === 0 ? (
              <p className="text-xs text-amber-700">No terminals are currently available. Another cashier may already have them open.</p>
            ) : null}
            {terminalLocked ? <p className="text-xs text-gray-500">This browser is permanently assigned to that terminal. Only an administrator can detach it.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Opening balance</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(event) => onOpeningBalanceChange(event.target.value)}
                className="bg-white"
                placeholder="0.00"
                disabled={!!accessNotice || !!blockingNotice || isOpening}
              />
              {openingDefaults?.carry_forward_balance !== undefined && openingDefaults?.carry_forward_balance !== null ? (
                <p className="text-xs text-gray-500">
                  Expected from the {expectedOpeningSource} on this terminal: {formatCurrency(resolvedCurrency, Number(expectedOpeningBalance))}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Session currency</Label>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {formatCurrency(resolvedCurrency, 0, { showCode: true })}
              </div>
            </div>
          </div>

          {requiresVarianceReason ? (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Label>Opening variance reason</Label>
              <p className="text-xs text-amber-900">
                The counted opening cash does not match the previous close or handover. Explain the mismatch so the system can flag it for investigation.
              </p>
              <Textarea
                value={openingVarianceReason}
                onChange={(event) => onOpeningVarianceReasonChange(event.target.value)}
                placeholder="Explain the shortfall, overage, or handover issue"
                className="bg-white"
                disabled={!!accessNotice || !!blockingNotice || isOpening}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isOpening}>
            Cancel
          </Button>
          <Button onClick={onOpenSession} disabled={!!accessNotice || !!blockingNotice || isOpening || !terminalId || terminals.length === 0 || (requiresVarianceReason && !openingVarianceReason.trim())}>
            {isOpening ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening session...
              </>
            ) : (
              "Open session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
