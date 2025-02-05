import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

