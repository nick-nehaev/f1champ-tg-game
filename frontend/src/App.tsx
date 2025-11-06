import { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { playerAPI } from './services/api';
import { Home } from './pages/Home';
import { CreateTeam } from './pages/CreateTeam';
import { Garage } from './pages/Garage';
import { Races } from './pages/Races';
import { Standings } from './pages/Standings';
import './styles/App.css';

type Page = 'home' | 'create-team' | 'garage' | 'races' | 'standings';

function App() {
  const { isReady } = useTelegram();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeam();
  }, []);

  const checkTeam = async () => {
    try {
      setLoading(true);
      const response = await playerAPI.getMe();

      if (response.success && response.data) {
        setHasTeam(!!response.data.team);

        // Если нет команды, переходим на страницу создания
        if (!response.data.team && currentPage !== 'create-team') {
          setCurrentPage('create-team');
        }
      }
    } catch (error) {
      console.error('Error checking team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = () => {
    setHasTeam(true);
    setCurrentPage('home');
  };

  if (!isReady || loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="app">
      {/* Навигация */}
      {hasTeam && currentPage !== 'create-team' && (
        <div className="nav">
          <button
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            🏠 Главная
          </button>
          <button
            className={`nav-button ${currentPage === 'garage' ? 'active' : ''}`}
            onClick={() => setCurrentPage('garage')}
          >
            🏎️ Гараж
          </button>
          <button
            className={`nav-button ${currentPage === 'races' ? 'active' : ''}`}
            onClick={() => setCurrentPage('races')}
          >
            🏁 Гонки
          </button>
          <button
            className={`nav-button ${currentPage === 'standings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('standings')}
          >
            🏆 Турнир
          </button>
        </div>
      )}

      {/* Контент */}
      {currentPage === 'home' && <Home />}
      {currentPage === 'create-team' && (
        <CreateTeam onTeamCreated={handleTeamCreated} />
      )}
      {currentPage === 'garage' && <Garage />}
      {currentPage === 'races' && <Races />}
      {currentPage === 'standings' && <Standings />}
    </div>
  );
}

export default App;
