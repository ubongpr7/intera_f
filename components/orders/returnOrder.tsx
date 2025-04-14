import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'

export interface PurchaseOrderLineItem {
  id: number
  stock_item_name: string
  quantity: number
  quantity_w_unit: string
}

interface ReturnOrderModalProps {
  orderId: string
  lineItems: PurchaseOrderLineItem[]
  isLoading: boolean
  error?: Error
  onReturn: (returnItems: Array<{ lineItemId: number; quantity: number }>) => Promise<void>
}

export const ReturnOrderModal = ({ 
  orderId, 
  lineItems, 
  isLoading, 
  error,
  onReturn 
}: ReturnOrderModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const handleChange = (lineItemId: number, value: string) => {
    const item = lineItems.find(li => li.id === lineItemId)
    if (!item) return

    const numericValue = Math.max(0, Math.min(
      Number(value),
      item.quantity
    ))
    
    setReturnQuantities(prev => ({
      ...prev,
      [lineItemId]: numericValue
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const returnItems = Object.entries(returnQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([lineItemId, quantity]) => ({
          lineItemId: Number(lineItemId),
          quantity
        }))

      if (returnItems.length === 0) {
        throw new Error('Please select at least one item to return')
      }

      await onReturn(returnItems)
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
      >
        Return Order
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Return Items for Order #{orderId}
                  </Dialog.Title>

                  <div className="mt-4">
                    {isLoading && <div>Loading line items...</div>}
                    {error && <div className="text-red-500">Error loading items: {error.message}</div>}

                    {!isLoading && !error && (
                      <>
                        <div className="grid grid-cols-3 gap-4 font-medium mb-2">
                          <div>Item</div>
                          <div>Quantity</div>
                          <div>Return Qty</div>
                        </div>

                        {lineItems.map(lineItem => (
                          <div
                            key={lineItem.id}
                            className="grid grid-cols-3 gap-4 mb-4 items-center"
                          >
                            <div className="text-gray-700">{lineItem.stock_item_name}</div>
                            <div className="text-gray-500">
                              {lineItem.quantity} {lineItem.quantity_w_unit}
                            </div>
                            <div>
                              <input
                                type="number"
                                min={0}
                                max={lineItem.quantity}
                                value={returnQuantities[lineItem.id] || 0}
                                onChange={(e) => handleChange(lineItem.id, e.target.value)}
                                className="w-20 px-2 py-1 border rounded-md text-sm"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={closeModal}
                      disabled={isSubmitting || isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isLoading || !!error}
                    >
                      {isSubmitting ? 'Processing...' : 'Submit Return'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}