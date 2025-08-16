import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import matchReducer from '../features/match/matchSlice'
import chatReducer from '../features/chat/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    match: matchReducer,
    chat: chatReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
