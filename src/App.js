import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Officers from './pages/Officers';
import Alerts from './pages/Alerts';
import MyProfile from './pages/MyProfile';
import Layout from './components/Layout';

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d2240' }}>
      <div style={{ color:'#c8a800', fontFamily:'Georgia,serif', fontSize:18 }}>Loading...</div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/officers" element={<Officers />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/profile" element={<MyProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
