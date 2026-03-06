import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import { Activity, Trophy, Search, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Fixtures.css';

const Fixtures = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('ALL');
  
  const location = useLocation();

  const SPORTS = [
    'Basketball', 'Cricket', 'Volleyball', 'Kabaddi', 
    'Throwball', '100m Sprint', '200m Sprint', 'Relay Race', 'Badminton',
    'Carrom', 'Chess'
  ];

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    
    // Setup real-time listener
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedMatches = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMatches(formattedMatches);
      } else {
        setMatches([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync with URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sportParam = params.get('sport');
    if (sportParam && filterSport !== sportParam.toUpperCase()) {
      setFilterSport(sportParam.toUpperCase());
    }
  }, [location.search, filterSport]);

  // Filter Logic
  const filteredMatches = matches.filter(match => {
    const teamA = (match.teamA || '').toLowerCase();
    const teamB = (match.teamB || '').toLowerCase();
    const sport = (match.sport || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = 
      teamA.includes(search) ||
      teamB.includes(search) ||
      sport.includes(search);
    
    const matchesSport = filterSport === 'ALL' || sport.toUpperCase() === filterSport.toUpperCase();
    const isReady = match.status !== 'UPCOMING';
    
    return matchesSearch && matchesSport && isReady;
  });

  return (
    <div className="container page-content">
      <div className="live-header">
        <h1 className="heading-section">
          Match <span className="text-gradient-blue">Fixtures</span>
        </h1>
        <div className="live-indicator-badge">
          <Activity size={24} className="pulse-icon" />
          <span>Real-Time Command Center</span>
        </div>
      </div>

      <div className="fixtures-filter-bar glass-panel">
        <div className="search-box">
          <Search size={20} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Search teams or sports..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="sport-filter">
          <Filter size={20} className="text-secondary" />
          <select 
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Sports</option>
            {SPORTS.map(s => (
              <option key={s} value={s.toUpperCase()}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading Matches...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="no-data">
          <h3>No Matches Found</h3>
          <p className="text-secondary">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="scoreboard-grid">
          {filteredMatches.map((match) => {
            const isFinished = match.status === 'FINISHED';
            const s = (match.sport || '').toLowerCase();
            const isSolo = s.includes('sprint') || s.includes('relay');
            const isSetSport = s === 'volleyball' || s === 'throwball' || s === 'badminton';
            const isCricket = s === 'cricket';
            const isVertical = isCricket || isSolo; // Remove set sports from vertical layout as per user request
            
            let winA = false;
            let winB = false;

            if (isFinished) {
              if (isSolo) {
                if (match.winnerTeam === match.teamA) winA = true;
                if (match.winnerTeam === match.teamB) winB = true;
              } else if (isSetSport) {
                if ((match.setsWonA || 0) > (match.setsWonB || 0)) winA = true;
                if ((match.setsWonB || 0) > (match.setsWonA || 0)) winB = true;
              } else {
                if (match.scoreA > match.scoreB) winA = true;
                if (match.scoreB > match.scoreA) winB = true;
              }
            }

            return (
              <div 
                key={match.id} 
                className={`match-card glass-panel ${match.status === 'LIVE' ? 'is-live' : ''} ${isFinished ? 'finished' : ''}`}
              >
                <div className="match-header">
                  <span className="sport-tag">
                    {match.sport} {isSetSport && <span className="set-indicator-inline">- S{match.currentSet || 1}</span>}
                  </span>
                  {match.status === 'LIVE' ? (
                    <span className="live-indicator">
                      <span className="live-dot"></span> LIVE
                    </span>
                  ) : (
                    <span className="finished-indicator">{match.status}</span>
                  )}
                </div>
                
                <div className="match-card-content">
                    <div className="match-teams-score">
                      {!isVertical && (
                        <div className="team">
                          <span className={`team-name ${winA ? 'winner-highlight' : ''}`}>{match.teamA}</span>
                        </div>
                      )}
                      
                      <div className={`score-display ${isVertical ? 'full-width-score' : ''}`}>
                        {isSolo ? (
                          <div className="solo-result-wrapper">
                            <span className="result-label">WINNER</span>
                            <span className="result-value winner-highlight" style={{ fontSize: '1.8rem' }}>{match.winnerTeam || 'TBD'}</span>
                            {match.winnerAthlete && (
                              <span className="athlete-name">Athlete: {match.winnerAthlete}</span>
                            )}
                          </div>
                        ) : isVertical ? (
                          <div className={`score-display-vertical ${match.sport.toLowerCase() === 'cricket' ? '' : 'sets-layout'}`}>
                            <div className={`team-score-block ${match.battingTeam === match.teamA ? 'batting' : ''}`}>
                              <span className="team-name-small">{match.teamA}</span>
                              <div className="score-main">
                                {match.scoreA}
                                {isCricket && <span className="wkt-sm">/{match.scoreWktA || 0}</span>}
                              </div>
                              {(match.sport.toLowerCase() === 'volleyball' || match.sport.toLowerCase() === 'throwball') && (
                                <div className="sets-row">
                                  {[1, 2, 3].map(s => match[`scoreA_set${s}`] !== undefined && (
                                    <span key={s} className="set-pill">S{s}: {match[`scoreA_set${s}`]}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="vs-divider-small">VS</div>
                            <div className={`team-score-block ${match.battingTeam === match.teamB ? 'batting' : ''}`}>
                              <span className="team-name-small">{match.teamB}</span>
                              <div className="score-main">
                                {match.scoreB}
                                {isCricket && <span className="wkt-sm">/{match.scoreWktB || 0}</span>}
                              </div>
                              {(match.sport.toLowerCase() === 'volleyball' || match.sport.toLowerCase() === 'throwball') && (
                                <div className="sets-row">
                                  {[1, 2, 3].map(s => match[`scoreB_set${s}`] !== undefined && (
                                    <span key={s} className="set-pill">S{s}: {match[`scoreB_set${s}`]}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="score-main-row">
                              <div className={`score-wrapper ${match.battingTeam === match.teamA ? 'batting' : (match.battingTeam && match.battingTeam === match.teamB ? 'bowling' : '')}`}>
                                <span className={`score-number ${match.status === 'LIVE' ? 'live-score-text' : ''} ${winA ? 'winner-highlight' : ''}`}>
                                  {isSetSport ? (match[`scoreA_set${match.currentSet || 1}`] || 0) : match.scoreA}
                                </span>
                              </div>
                              <span className="score-divider">-</span>
                              <div className={`score-wrapper ${match.battingTeam === match.teamB ? 'batting' : (match.battingTeam && match.battingTeam === match.teamA ? 'bowling' : '')}`}>
                                <span className={`score-number ${match.status === 'LIVE' ? 'live-score-text' : ''} ${winB ? 'winner-highlight' : ''}`}>
                                  {isSetSport ? (match[`scoreB_set${match.currentSet || 1}`] || 0) : match.scoreB}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {!isVertical && (
                        <div className="team text-right">
                          <span className={`team-name ${winB ? 'winner-highlight' : ''}`}>{match.teamB}</span>
                        </div>
                      )}
                    </div>
                    
                  {/* Winner Overlay for Finished Matches */}
                  {match.status === 'FINISHED' && (
                    <div className="match-winner-overlay">
                      <div className="winner-msg-box">
                        <Trophy size={32} color="var(--accent-green)" />
                        <h2 className="winner-text">
                          {match.winnerTeam || (winA ? match.teamA : match.teamB)} WINS
                        </h2>
                      </div>
                    </div>
                  )}

                  <div className="match-footer text-secondary">
                    <span>{match.time}</span>
                    <span>{match.venue}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Fixtures;
