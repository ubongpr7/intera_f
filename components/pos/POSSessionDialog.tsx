"use client"

import { formatCurrency } from "@/lib/currency-utils"
import type { POSConfiguration, POSTerminal } from "@/redux/features/pos/posTypes"
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

interface POSSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  terminals: POSTerminal[]
  currentConfiguration?: POSConfiguration
  currencyCode: string
  terminalId: string
  openingBalance: string
  onTerminalChange: (value: string) => void
  onOpeningBalanceChange: (value: string) => void
  onOpenSession: () => void
  isOpening: boolean
}

export default function POSSessionDialog({
  open,
  onOpenChange,
  terminals,
  currentConfiguration,
  currencyCode,
  terminalId,
  openingBalance,
  onTerminalChange,
  onOpeningBalanceChange,
  onOpenSession,
  isOpening,
}: POSSessionDialogProps) {
  const resolvedCurrency = currentConfiguration?.currency || currencyCode

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
          <div className="space-y-2">
            <Label>Terminal</Label>
            <Select value={terminalId} onValueChange={onTerminalChange}>
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
              />
            </div>
            <div className="space-y-2">
              <Label>Session currency</Label>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {formatCurrency(resolvedCurrency, 0, { showCode: true })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onOpenSession} disabled={isOpening || !terminalId}>
            Open session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
