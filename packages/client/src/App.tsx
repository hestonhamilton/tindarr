import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login';
import CreateRoomPage from './pages/CreateRoom';
import RoomPage from './pages/Room';
import MatchPage from './pages/Match';
import AuthCallback from './pages/AuthCallback';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/room/:roomId/matches" element={<MatchPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;