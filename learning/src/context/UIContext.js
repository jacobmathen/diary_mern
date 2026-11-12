import {createContext,useContext} from 'react';
export const UIContext=createContext(null);
export const useUI=()=>useContext(UIContext);
