import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login';
import CreateRoomPage from './pages/CreateRoom';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;