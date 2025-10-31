import { configureStore,createImmutableStateInvariantMiddleware,
  Tuple} from '@reduxjs/toolkit'
import globalReducer from './slices/global'
import { useDispatch,useSelector} from 'react-redux'

export const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  reducer: {
     global:globalReducer
  },
})
export const useAppDispatch = () => useDispatch<typeof store.dispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector<RootState,T>(selector)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
