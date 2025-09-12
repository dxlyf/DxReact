import { createSlice,createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// First, create the thunk
const fetchUserById = createAsyncThunk(
  'users/fetchByIdStatus',
  async (userId: number, thunkAPI) => {
    //const response = await userAPI.fetchById(userId)
   // return response.data
  },
)
export interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const GlobalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
  extraReducers(builder){
    builder.addCase(fetchUserById.fulfilled,(state,action)=>{
        
    })
  }
})

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount } = GlobalSlice.actions

export default GlobalSlice.reducer