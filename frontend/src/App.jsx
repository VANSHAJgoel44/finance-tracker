import React, { Suspense, useContext} from 'react';
import { BrowserRouter, Routes, Route,Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard =React.lazy(() => import('./pages/Dashboard'));
const Transactions= React.lazy(() => import('./pages/Transactions'));

function PrivateRoute({ children }) {
  const { user } =useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div style={{padding:20}}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
