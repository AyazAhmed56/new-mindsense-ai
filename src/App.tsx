import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProfileSetup } from './pages/ProfileSetup';
import { BaselineCollection } from './pages/BaselineCollection';
import { Profile } from './pages/Profile';
import { MainLayout } from './layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/baseline-collection" element={<BaselineCollection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/app" element={<MainLayout />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
