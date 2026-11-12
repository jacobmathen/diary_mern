import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../lib/api';
export const loadSession = createAsyncThunk('auth/load', () => api('/auth/me'));
export const authenticate = createAsyncThunk('auth/submit', ({ mode, values }) => api('/auth/' + mode, { method: 'POST', body: JSON.stringify(values) }));
export const logout = createAsyncThunk('auth/logout', () => api('/auth/logout', { method: 'POST' }));
export const loadEntries = createAsyncThunk('entries/load', () => api('/entries'));
const auth = createSlice({ name: 'auth', initialState: { user: null, ready: false, busy: false, error: '' }, reducers: {}, extraReducers: b => {
 b.addCase(loadSession.fulfilled, (s,a) => { s.user=a.payload.user; s.ready=true; }).addCase(loadSession.rejected, s => { s.ready=true; });
 b.addCase(authenticate.pending, s => { s.busy=true; s.error=''; }).addCase(authenticate.fulfilled, (s,a) => { s.user=a.payload.user; s.busy=false; }).addCase(authenticate.rejected, (s,a) => { s.busy=false; s.error=a.error.message; });
 b.addCase(logout.fulfilled, s => { s.user=null; });
 b.addCase(loadEntries.rejected, (s,a) => { if(a.error.message==='Please sign in again.')s.user=null; });
}});
const entries = createSlice({ name: 'entries', initialState: { items: [], loading: true, error: '' }, reducers: {
 upsert: (s,a) => { const i=s.items.findIndex(e=>e._id===a.payload._id); if(i<0)s.items.unshift(a.payload);else s.items[i]=a.payload; s.items.sort((a,b)=>b.date.localeCompare(a.date)); },
 remove: (s,a) => { s.items=s.items.filter(e=>e._id!==a.payload); }
}, extraReducers: b => {
 b.addCase(loadEntries.pending,s=>{s.loading=true;s.error='';}).addCase(loadEntries.fulfilled,(s,a)=>{s.items=a.payload.entries;s.loading=false;}).addCase(loadEntries.rejected,(s,a)=>{s.error=a.error.message;s.loading=false;});
 b.addCase(logout.fulfilled,s=>{s.items=[];s.loading=true;});
}});
export const {upsert,remove}=entries.actions;
export const store=configureStore({reducer:{auth:auth.reducer,entries:entries.reducer}});
