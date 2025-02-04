import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { TypedUseSelectorHook } from 'react-redux';

// This is the correct way to define useAppDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// This is the correct way to define useAppSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// import {useSelector,UseDispatch} from 'react-redux';
// import { AppDispatch, RootState } from './store';
// import {TypedUseSelectorHook} from 'react-redux';
// import { use } from 'react';

// export const UseAppDispatch:()=>AppDispatch=UseAppDispatch;
// // Suggested code may be subject to a license. Learn more: ~LicenseLog:269971561.
// // Suggested code may be subject to a license. Learn more: ~LicenseLog:4289991333.
// export const useAppSelector:TypedUseSelectorHook<RootState>=useSelector;
// export const useAppDispatch:()=>AppDispatch=useDispatch;


