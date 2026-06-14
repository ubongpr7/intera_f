"use client"

import { useMemo, useState } from "react"
import { Plus, Search, UserRound } from "lucide-react"
import { extractErrorMessage } from "@/lib/utils"
import { useCreateCustomerMutation } from "@/redux/features/pos/posAPISlice"
import type { POSCustomer } from "@/redux/features/pos/posTypes"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-toastify"

interface POSCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: POSCustomer[]
  isLoading?: boolean
  onAssignCustomer: (customerId: string | null) => Promise<void>
}

const emptyCustomerForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
}

export default function POSCustomerDialog({
  open,
  onOpenChange,
  customers,
  isLoading = false,
  onAssignCustomer,
}: POSCustomerDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState(emptyCustomerForm)
  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation()

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return customers
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.address].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    )
  }, [customers, searchTerm])

  const resetState = () => {
    setSearchTerm("")
    setShowCreateForm(false)
    setFormData(emptyCustomerForm)
  }

  const closeDialog = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  const handleAssign = async (customerId: string | null) => {
    try {
      await onAssignCustomer(customerId)
      closeDialog(false)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["detail", "customer"]) || "Unable to update customer assignment.")
    }
  }

  const handleCreateCustomer = async () => {
    if (!formData.name.trim()) {
      toast.error("Customer name is required.")
      return
    }

    try {
      const created = await createCustomer(formData).unwrap()
      toast.success("Customer created")
      await handleAssign(created.sync_identifier || created.id)
    } catch (error) {
      toast.error(extractErrorMessage(error, ["name", "email", "phone", "detail"]) || "Unable to create customer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-xl border-gray-200 bg-white p-0 text-gray-900">
        <DialogHeader className="border-b border-gray-100 px-6 py-5">
          <DialogTitle>Customer assignment</DialogTitle>
          <DialogDescription>
            Search existing customers, create a new one, or keep the order as a walk-in sale.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {!showCreateForm ? (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                  placeholder="Search customer name, email, phone, or address"
                />
              </div>

              <ScrollArea className="h-[320px] rounded-xl border border-gray-200">
                <div className="space-y-2 p-3">
                  <button
                    type="button"
                    onClick={() => void handleAssign(null)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-white p-2 text-gray-500">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Walk-in customer</p>
                        <p className="text-xs text-gray-500">No saved customer record on this sale.</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-700">Use</span>
                  </button>

                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => void handleAssign(customer.sync_identifier || customer.id)}
                      className="flex w-full items-start justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {[customer.email, customer.phone].filter(Boolean).join(" · ") || "No contact details"}
                        </p>
                        {customer.address ? <p className="mt-1 text-xs text-gray-500">{customer.address}</p> : null}
                      </div>
                      <span className="text-xs font-medium text-blue-700">Assign</span>
                    </button>
                  ))}

                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`customer-skeleton-${index}`}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-4 animate-pulse"
                        >
                          <div className="h-4 w-32 rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-48 rounded bg-gray-100" />
                        </div>
                      ))}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      No customers match this search.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-4">
              <Input
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                placeholder="Customer name"
              />
              <Input
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
                type="email"
              />
              <Input
                value={formData.phone}
                onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
              />
              <Textarea
                value={formData.address}
                onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                className="min-h-[96px]"
                placeholder="Address"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          {!showCreateForm ? (
            <>
              <Button variant="outline" onClick={() => closeDialog(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                New customer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Back
              </Button>
              <Button onClick={() => void handleCreateCustomer()} disabled={creatingCustomer}>
                Create and assign
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
