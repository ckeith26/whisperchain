import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import authSlice from './authSlice';
import userSlice from './userSlice';

const useStore = create(devtools(immer((...args) => ({
  authSlice: authSlice(...args),
  userSlice: userSlice(...args),
}))));

export default useStore; 