import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface CartItem {
  id: string
  product_variant_id: string
  product_name: string
  variant_name?: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  customizations?: Record<string, any>
  special_instructions?: string
  line_total: number
}

interface POSState {
  currentSession: any | null
  currentOrder: any | null
  cart: CartItem[]
  selectedCustomer: any | null
  selectedTable: any | null
  isLoading: boolean
  error: string | null
}

const initialState: POSState = {
  currentSession: null,
  currentOrder: null,
  cart: [],
  selectedCustomer: null,
  selectedTable: null,
  isLoading: false,
  error: null,
}

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<any>) => {
      state.currentSession = action.payload
    },
    setCurrentOrder: (state, action: PayloadAction<any>) => {
      state.currentOrder = action.payload
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItemIndex = state.cart.findIndex(
        (item) =>
          item.product_variant_id === action.payload.product_variant_id &&
          JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations),
      )

      if (existingItemIndex !== -1) {
        state.cart[existingItemIndex].quantity += action.payload.quantity
      } else {
        state.cart.push(action.payload)
      }
    },
    updateCartItem: (state, action: PayloadAction<{ index: number; updates: Partial<CartItem> }>) => {
      const { index, updates } = action.payload
      if (state.cart[index]) {
        state.cart[index] = { ...state.cart[index], ...updates }
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cart.splice(action.payload, 1)
    },
    clearCart: (state) => {
      state.cart = []
    },
    setSelectedCustomer: (state, action: PayloadAction<any>) => {
      state.selectedCustomer = action.payload
    },
    setSelectedTable: (state, action: PayloadAction<any>) => {
      state.selectedTable = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const {
  setCurrentSession,
  setCurrentOrder,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  setSelectedCustomer,
  setSelectedTable,
  setLoading,
  setError,
} = posSlice.actions

export default posSlice.reducer
