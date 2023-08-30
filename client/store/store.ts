import {
  combineReducers,
  configureStore,

} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist';

// middleware
import apiMessageMiddleware from './middleware/apiMessageMiddleware';

// all reducers - TODO: move to separate folder
import weatherReducer from './weatherStore';
import dropdownReducer from './dropdownStore';
import authReducer from './authStore';
import trailsReducer from './trailsStore';
import searchReducer from './searchStore';
import parksReducer from './parksStore';
import itemsReducer from './itemsStore';
import packsReducer from './packsStore';
import favoritesReducer from './favoritesStore';
import feedReducer from './feedStore';
import singlePackReducer from './singlePackStore';
import singleTripReducer from './singleTripStore';
import tripsReducer from './tripsStore';
import gpxReducer from './gpxStore';
import destinationReducer from './destinationStore';
import chatReducer from './chatStore';
import globalItems from './globalItemsStore';
import userStore from './userStore';
import offlineQueue from './offlineQueue';
import progressReducer from './progressStore';
import { type Reducer } from 'react';
import { authApi } from './authApi';
// combine reducers
const rootReducer: Reducer<RootState> = combineReducers({
  auth: authReducer,
  dropdown: dropdownReducer,
  search: searchReducer,
  weather: weatherReducer,
  trails: trailsReducer,
  parks: parksReducer,
  items: itemsReducer,
  packs: packsReducer,
  trips: tripsReducer,
  favorites: favoritesReducer,
  singlePack: singlePackReducer,
  singleTrip: singleTripReducer,
  feed: feedReducer,
  gpx: gpxReducer,
  destination: destinationReducer,
  chat: chatReducer,
  globalItems,
  userStore,
  offlineQueue,
  progress: progressReducer,
  [authApi.reducerPath]: authApi.reducer,
});

export interface RootState {
  auth: typeof authReducer;
  dropdown: typeof dropdownReducer;
  search: typeof searchReducer;
  weather: typeof weatherReducer;
  trails: typeof trailsReducer;
  parks: typeof parksReducer;
  items: typeof itemsReducer;
  packs: typeof packsReducer;
  trips: typeof tripsReducer;
  favorites: typeof favoritesReducer;
  singlePack: typeof singlePackReducer;
  singleTrip: typeof singleTripReducer;
  feed: typeof feedReducer;
  gpx: typeof gpxReducer;
  destination: typeof destinationReducer;
  chat: typeof chatReducer;
  globalItems: typeof globalItems;
  userStore: typeof userStore;
  offlineQueue: typeof offlineQueue;
}

// configure persist store and whitelist reducers
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'globalItems', 'offlineQueue'], // add reducers to persist here
};

// create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);
const getMiddleWare = (getDefaultMiddleware) => {
const middleware = [
  ...getDefaultMiddleware({
    serializableCheck: {
      // Ignore these action types
      ignoredActions: ['persist/PERSIST'],
    },
  }), // Default middleware included in Redux Toolkit
  authApi.middleware,
  apiMessageMiddleware,
];
return middleware;
}
const store = configureStore({
  reducer: persistedReducer,

  middleware: (dm) => getMiddleWare(dm),
});

export type AppDispatch = typeof store.dispatch;

const persistor = persistStore(store);

export { store, persistor };
