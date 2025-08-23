"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import Select from "react-select"
import {
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { toast } from "react-toastify"

const formSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  billing_cycle: z.enum(["monthly", "yearly", "weekly", "daily"]),
  trial_days: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
})

const billingCycleOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

interface SubscriptionPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: any
  onSuccess: () => void
}

export function SubscriptionPlanDialog({ open, onOpenChange, plan, onSuccess }: SubscriptionPlanDialogProps) {
  const [createPlan, { isLoading: isCreating }] = useCreateSubscriptionPlanMutation()
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSubscriptionPlanMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      billing_cycle: "monthly",
      trial_days: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        price: Number.parseFloat(plan.price),
        billing_cycle: plan.billing_cycle,
        trial_days: plan.trial_days || 0,
        is_active: plan.is_active,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        billing_cycle: "monthly",
        trial_days: 0,
        is_active: true,
      })
    }
  }, [plan, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (plan) {
        await updatePlan({ id: plan.id, ...values }).unwrap()
        toast.success("Subscription plan updated successfully")
      } else {
        await createPlan(values).unwrap()
        toast.success("Subscription plan created successfully")
      }
      onSuccess()
    } catch (error) {
      toast.error("Failed to create subscription plan")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Subscription Plan" : "Add Subscription Plan"}</DialogTitle>
          <DialogDescription>Configure a subscription plan with pricing and features.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Cycle</label>
                <Select
                  options={billingCycleOptions}
                  value={billingCycleOptions.find((option) => option.value === form.watch("billing_cycle"))}
                  onChange={(selectedOption) => form.setValue("billing_cycle", selectedOption?.value as any)}
                  placeholder="Select billing cycle..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <FormField
                control={form.control}
                name="trial_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trial Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Plan description and features" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>Make this plan available for subscription</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : plan ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
