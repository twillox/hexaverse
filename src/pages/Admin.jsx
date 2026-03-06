import React, { useState, useEffect } from 'react';
import { db, auth, ref, onValue, push, update, set, remove } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Check, Plus, Code, Settings, Lock, Trash2, List, Trophy, Calendar, Activity } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  // Tabs
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'schedule', or 'leaderboard'
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('ALL');

  // Sports definition
  const SPORTS = [
    'Basketball', 'Cricket', 'Volleyball', 'Kabaddi', 
    'Throwball', '100m Sprint', '200m Sprint', 'Relay Race', 'Badminton',
    'Carrom', 'Chess'
  ];

  // New Match Form State
  const [newMatch, setNewMatch] = useState({
    sport: SPORTS[0],
    teamA: 'VAJRA',
    teamB: 'SAMUDRA',
    time: '',
    venue: '',
    scoreA: 0,
    scoreB: 0,
    status: 'UPCOMING'
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const matchesRef = ref(db, 'matches');
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMatches(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setMatches([]);
      }
    });

    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribeLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLeaderboard(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setLeaderboard([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMatches();
      unsubscribeLeaderboard();
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => {
        setAuthError(error.message);
      });
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAddMatch = (e) => {
    e.preventDefault();
    if (!newMatch.sport || !newMatch.time || !newMatch.venue) {
      alert("Please fill all fields for the new match.");
      return;
    }
    
    setLoading(true);
    const matchesRef = ref(db, 'matches');
    push(matchesRef, newMatch)
      .then(() => {
        alert("Match added successfully!");
        setNewMatch({ ...newMatch, sport: SPORTS[0], time: '', venue: '' });
      })
      .catch(err => alert("Error adding match: " + err.message))
      .finally(() => setLoading(false));
  };

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setLoading(true);
    const teamId = newTeamName.trim().toUpperCase();
    const teamRef = ref(db, `leaderboard/${teamId}`);
    
    set(teamRef, {
      gold: 0,
      silver: 0,
      points: 0
    })
    .then(() => {
      alert(`Team ${teamId} added to leaderboard!`);
      setNewTeamName('');
    })
    .catch(err => alert("Error adding team: " + err.message))
    .finally(() => setLoading(false));
  };

  const updateScore = (matchId, team, increment, isWicket = false) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    if (isWicket) {
      const currentWkt = team === 'A' ? (match.scoreWktA || 0) : (match.scoreWktB || 0);
      const newWkt = Math.max(0, currentWkt + increment);
      update(ref(db, `matches/${matchId}`), {
        [team === 'A' ? 'scoreWktA' : 'scoreWktB']: newWkt
      }).catch(err => alert("Error updating wickets: " + err.message));
    } else {
      const currentScore = team === 'A' ? match.scoreA : match.scoreB;
      const newScore = Math.max(0, currentScore + increment);
      update(ref(db, `matches/${matchId}`), {
        [team === 'A' ? 'scoreA' : 'scoreB']: newScore
      }).catch(err => alert("Error updating score: " + err.message));
    }
  };

  const updateSetScore = (matchId, team, setNum, increment) => {
    const match = matches?.find(m => m.id === matchId);
    if (!match) return;
    
    const field = `score${team}_set${setNum}`;
    const currentScore = match[field] || 0;
    const newVal = Math.max(0, currentScore + increment);
    
    update(ref(db, `matches/${matchId}`), {
      [field]: newVal
    }).catch(err => alert("Error updating set score: " + err.message));
  };

  const updateSetWon = (matchId, team, increment) => {
    const match = matches?.find(m => m.id === matchId);
    if (!match) return;
    
    const field = `setsWon${team}`;
    const currentVal = match[field] || 0;
    const newVal = Math.max(0, currentVal + increment);
    
    update(ref(db, `matches/${matchId}`), {
      [field]: newVal
    }).catch(err => alert("Error updating sets won: " + err.message));
  };

  const resetScore = (matchId) => {
    update(ref(db, `matches/${matchId}`), { scoreA: 0, scoreB: 0 })
      .catch(err => alert("Error resetting score: " + err.message));
  };

  const updateLeaderboardStat = (teamId, stat, increment) => {
    const team = leaderboard?.find(t => t.id === teamId);
    if (!team) return;
    
    const updates = {};
    const currentVal = team[stat] || 0;
    const newVal = Math.max(0, currentVal + increment);
    updates[stat] = newVal;

    // Automated point calculation logic
    // Gold (5pts) + Silver (3pts) + Wins (2pts)
    const g = stat === 'gold' ? newVal : (team.gold || 0);
    const s = stat === 'silver' ? newVal : (team.silver || 0);
    const w = stat === 'wins' ? newVal : (team.wins || 0);
    
    updates['points'] = (g * 5) + (s * 3) + (w * 2);

    update(ref(db, `leaderboard/${teamId}`), updates)
      .catch(err => alert("Error updating stat: " + err.message));
  };

  const toggleStatus = async (matchId, currentStatus) => {
    const newStatus = currentStatus === 'LIVE' ? 'FINISHED' : 'LIVE';
    update(ref(db, `matches/${matchId}`), { status: newStatus })
      .catch(err => alert("Error toggling status: " + err.message));
  };

  const handleDeleteMatch = (matchId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this match?");
    if (confirmDelete) {
      remove(ref(db, `matches/${matchId}`))
        .catch(err => alert("Error deleting match: " + err.message));
    }
  };

  // Filter and Group Matches
  const filteredMatches = (matches || []).filter(m => {
    const matchesSearch = !searchTerm || 
      m.teamA?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.teamB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSport = filterSport === 'ALL' || m.sport === filterSport;
    
    return matchesSearch && matchesSport;
  });

  const groupedMatches = SPORTS.reduce((acc, sport) => {
    acc[sport] = filteredMatches.filter(m => m.sport === sport);
    return acc;
  }, {});

  if (authLoading) {
    return <div className="container page-content"><div className="loader">Checking Auth...</div></div>;
  }

  if (!user) {
    return (
      <div className="container page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)' }}>
        <div className="glass-panel admin-login-panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Lock size={48} className="text-accent-blue pulse-icon" style={{ margin: '0 auto 1rem auto', display: 'block', color: 'var(--accent-blue)' }} />
            <h2 className="heading-section" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Admin Access</h2>
            <p className="text-secondary">Requires authorization to proceed.</p>
          </div>
          <form onSubmit={handleLogin} className="admin-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="admin@hexaverse.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {authError && <p style={{ color: 'var(--accent-orange)', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" className="btn btn-primary w-100 mt-2">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="admin-header text-center">
        <h1 className="heading-section">
          Admin <span className="text-gradient-blue">Control Panel</span>
        </h1>
        <p className="text-secondary">Manage matches and live scores securely.</p>
        <button onClick={handleLogout} className="btn-toggle text-secondary" style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Sign Out
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <Activity size={20} /> Live Scores
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={20} /> Schedule Management
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={20} /> Leaderboard Management
        </button>
      </div>

      <div className="admin-grid">
        
        {activeTab === 'live' && (
          <div className="score-control-section">
            <div className="section-header-row">
              <h3><Settings size={20} /> Live Score Management</h3>
              <div className="admin-filters">
                <input 
                  type="text" 
                  placeholder="Search Match (Team/Sport/Venue)..." 
                  className="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="admin-sport-filter"
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                >
                  <option value="ALL">All Sports</option>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-matches-list">
              {matches.length === 0 ? (
                <p className="text-secondary text-center p-4">No matches available for live updates.</p>
              ) : (
                SPORTS.map(sport => {
                  const sportMatches = groupedMatches[sport];
                  if (sportMatches.length === 0) return null;
                  
                  return (
                    <div key={sport} className="sport-category-group">
                      <h4 className="sport-category-header">{sport}</h4>
                      <div className="sport-matches-grid">
                        {sportMatches.map(match => {
                          const getScoreInfo = (sport) => {
                            const s = sport.toLowerCase();
                            if (s === 'badminton') return { label: 'Sets', type: 'set' };
                            if (s === 'volleyball' || s === 'throwball') return { label: 'Sets', type: 'set' };
                            if (s === 'football') return { label: 'Goals', type: 'goal' };
                            if (s === 'cricket') return { label: 'Runs/Wkts', type: 'cricket' };
                            if (s === 'basketball') return { label: 'Points', type: 'basket' };
                            if (s === 'kabaddi') return { label: 'Points', type: 'points' };
                            if (s.includes('sprint') || s.includes('relay')) return { label: 'Result', type: 'solo' };
                            return { label: 'Score', type: 'generic' };
                          };
                          
                          const scoreInfo = getScoreInfo(match.sport);

                          return (
                            <div key={match.id} className={`admin-match-card status-${match.status.toLowerCase()}`}>
                              {/* 1. TIERED HEADER */}
                              <div className="admin-match-meta">
                                <div className="match-info-pill">
                                  <span className={`status-tag status-${match.status.toLowerCase()}`}>{match.status}</span>
                                  <span className="match-venue-label">{match.venue} • {match.time}</span>
                                </div>
                                <div className="match-actions-row">
                                  {match.sport.toLowerCase() === 'cricket' && (
                                    <select 
                                      className="batting-select"
                                      value={match.battingTeam || ''}
                                      onChange={(e) => update(ref(db, `matches/${match.id}`), { battingTeam: e.target.value })}
                                    >
                                      <option value="">Who is Batting?</option>
                                      <option value={match.teamA}>{match.teamA} Batting</option>
                                      <option value={match.teamB}>{match.teamB} Batting</option>
                                    </select>
                                  )}
                                  <select 
                                    className="status-select"
                                    value={match.status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      const oldStatus = match.status;
                                      update(ref(db, `matches/${match.id}`), { status: newStatus });
                                      
                                      let winner = null;
                                      let loser = null;
                                      const s = match.sport.toLowerCase();
                                      const isSetSport = s === 'volleyball' || s === 'throwball' || s === 'badminton';
                                      
                                      if (match.sport.toLowerCase().includes('sprint') || match.sport.toLowerCase().includes('relay')) {
                                        winner = match.winnerTeam;
                                      } else if (isSetSport) {
                                        if ((match.setsWonA || 0) > (match.setsWonB || 0)) {
                                          winner = match.teamA;
                                          loser = match.teamB;
                                        } else if ((match.setsWonB || 0) > (match.setsWonA || 0)) {
                                          winner = match.teamB;
                                          loser = match.teamA;
                                        }
                                      } else {
                                        if (match.scoreA > match.scoreB) {
                                          winner = match.teamA;
                                          loser = match.teamB;
                                        } else if (match.scoreB > match.scoreA) {
                                          winner = match.teamB;
                                          loser = match.teamA;
                                        }
                                      }

                                      if (oldStatus !== 'FINISHED' && newStatus === 'FINISHED') {
                                        if (winner) updateLeaderboardStat(winner, 'wins', 1);
                                        if (loser) updateLeaderboardStat(loser, 'losses', 1);
                                      } else if (oldStatus === 'FINISHED' && newStatus !== 'FINISHED') {
                                        if (winner) updateLeaderboardStat(winner, 'wins', -1);
                                        if (loser) updateLeaderboardStat(loser, 'losses', -1);
                                      }
                                    }}
                                  >
                                    <option value="UPCOMING">UPCOMING</option>
                                    <option value="LIVE">LIVE</option>
                                    <option value="FINISHED">FINISHED</option>
                                  </select>
                                </div>
                              </div>

                              {/* 2. SCOREKEEPER SECTION */}
                              <div className="admin-scorekeeper">
                                {scoreInfo.type === 'solo' ? (
                                  <div className="solo-winner-controls w-100">
                                    <div className="form-row">
                                      <div className="form-group">
                                        <label>Winner Team</label>
                                        <select 
                                          value={match.winnerTeam || ''} 
                                          onChange={(e) => update(ref(db, `matches/${match.id}`), { winnerTeam: e.target.value })}
                                        >
                                          <option value="">Select Team</option>
                                          <option value="VAJRA">VAJRA</option>
                                          <option value="SAMUDRA">SAMUDRA</option>
                                          <option value="VAYU">VAYU</option>
                                          <option value="AGNI">AGNI</option>
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Athlete Name</label>
                                        <input 
                                          type="text" 
                                          placeholder="Enter Name"
                                          value={match.winnerAthlete || ''}
                                          onChange={(e) => update(ref(db, `matches/${match.id}`), { winnerAthlete: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="team-control-row">
                                    {/* SHARED SET SELECTOR */}
                                    {scoreInfo.type === 'set' && (
                                      <div className="shared-match-controls">
                                        <div className="current-set-selector">
                                          <label>Active Set (SX)</label>
                                          <div className="mgmt-btns">
                                            {[1, 2, 3].map(num => (
                                              <button 
                                                key={num}
                                                className={`score-btn small ${match.currentSet === num ? 'active' : ''}`}
                                                onClick={() => update(ref(db, `matches/${match.id}`), { currentSet: num })}
                                              >
                                                S{num}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* TEAM A */}
                                    <div className="team-control">
                                      <span className="admin-team-name">{match.teamA}</span>
                                      <div className="admin-score-actions">
                                        {scoreInfo.type === 'cricket' ? (
                                          <div className="cricket-controls-group">
                                            <div className="score-row">
                                              <button className="score-btn minus" onClick={() => updateScore(match.id, 'A', -1)}>-1</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 1)}>+1</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 4)}>+4</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 6)}>+6</button>
                                            </div>
                                            <div className="wicket-row">
                                              <button className="score-btn minus wicket-btn" onClick={() => updateScore(match.id, 'A', -1, true)}>-W</button>
                                              <button className="score-btn plus wicket-btn" onClick={() => updateScore(match.id, 'A', 1, true)}>+W</button>
                                            </div>
                                          </div>
                                        ) : scoreInfo.type === 'set' ? (
                                          <div className="set-controls-group-modern">
                                            <div className="active-set-score-mgmt">
                                              <button className="score-btn minus" onClick={() => updateSetScore(match.id, 'A', match.currentSet || 1, -1)}>-1</button>
                                              <span className="admin-current-score">
                                                {match[`scoreA_set${match.currentSet || 1}`] || 0}
                                              </span>
                                              <button className="score-btn plus" onClick={() => updateSetScore(match.id, 'A', match.currentSet || 1, 1)}>+1</button>
                                            </div>

                                            <div className="sets-won-manager">
                                              <span className="set-mgmt-label">{match.teamA} Sets Won</span>
                                              <div className="mgmt-btns">
                                                <button className="score-btn minus small" onClick={() => updateSetWon(match.id, 'A', -1)}>-</button>
                                                <span className="mgmt-val">{match.setsWonA || 0}</span>
                                                <button className="score-btn plus small" onClick={() => updateSetWon(match.id, 'A', 1)}>+</button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : scoreInfo.type === 'basket' ? (
                                          <div className="score-control-buttons">
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 1)}>+1</button>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 2)}>+2</button>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 3)}>+3</button>
                                          </div>
                                        ) : (
                                          <div className="score-control-buttons">
                                            <button className="score-btn minus" onClick={() => updateScore(match.id, 'A', -1)}>-1</button>
                                            <span className="admin-current-score">{match.scoreA}</span>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 1)}>+1</button>
                                          </div>
                                        )}
                                      </div>
                                      {scoreInfo.type === 'cricket' && (
                                        <div className="cricket-score-display">
                                          <span className="admin-current-score">{match.scoreA} / {match.scoreWktA || 0}</span>
                                        </div>
                                      )}
                                      {scoreInfo.type === 'basket' && (
                                        <span className="admin-current-score">{match.scoreA}</span>
                                      )}
                                    </div>

                                    {/* VS DIVIDER */}
                                    <div className="admin-vs-divider">
                                      <div className="admin-vs-circle">VS</div>
                                    </div>

                                    {/* TEAM B */}
                                    <div className="team-control">
                                      <span className="admin-team-name">{match.teamB}</span>
                                      <div className="admin-score-actions">
                                        {scoreInfo.type === 'cricket' ? (
                                          <div className="cricket-controls-group">
                                            <div className="score-row">
                                              <button className="score-btn minus" onClick={() => updateScore(match.id, 'B', -1)}>-1</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 1)}>+1</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 4)}>+4</button>
                                              <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 6)}>+6</button>
                                            </div>
                                            <div className="wicket-row">
                                              <button className="score-btn minus wicket-btn" onClick={() => updateScore(match.id, 'B', -1, true)}>-W</button>
                                              <button className="score-btn plus wicket-btn" onClick={() => updateScore(match.id, 'B', 1, true)}>+W</button>
                                            </div>
                                          </div>
                                        ) : scoreInfo.type === 'set' ? (
                                          <div className="set-controls-group-modern">
                                            <div className="active-set-score-mgmt">
                                              <button className="score-btn minus" onClick={() => updateSetScore(match.id, 'B', match.currentSet || 1, -1)}>-1</button>
                                              <span className="admin-current-score">
                                                {match[`scoreB_set${match.currentSet || 1}`] || 0}
                                              </span>
                                              <button className="score-btn plus" onClick={() => updateSetScore(match.id, 'B', match.currentSet || 1, 1)}>+1</button>
                                            </div>

                                            <div className="sets-won-manager">
                                              <span className="set-mgmt-label">{match.teamB} Sets Won</span>
                                              <div className="mgmt-btns">
                                                <button className="score-btn minus small" onClick={() => updateSetWon(match.id, 'B', -1)}>-</button>
                                                <span className="mgmt-val">{match.setsWonB || 0}</span>
                                                <button className="score-btn plus small" onClick={() => updateSetWon(match.id, 'B', 1)}>+</button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : scoreInfo.type === 'basket' ? (
                                          <div className="score-control-buttons">
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 1)}>+1</button>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 2)}>+2</button>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 3)}>+3</button>
                                          </div>
                                        ) : (
                                          <div className="score-control-buttons">
                                            <button className="score-btn minus" onClick={() => updateScore(match.id, 'B', -1)}>-1</button>
                                            <span className="admin-current-score">{match.scoreB}</span>
                                            <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 1)}>+1</button>
                                          </div>
                                        )}
                                      </div>
                                      {scoreInfo.type === 'cricket' && (
                                        <div className="cricket-score-display">
                                          <span className="admin-current-score">{match.scoreB} / {match.scoreWktB || 0}</span>
                                        </div>
                                      )}
                                      {scoreInfo.type === 'basket' && (
                                        <span className="admin-current-score">{match.scoreB}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="admin-match-footer">
                                <span className="footer-match-type">{match.sport} • {match.status}</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => resetScore(match.id)}>
                                  Reset
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <>
            {/* ADD MATCH SECTION */}
            <div className="glass-panel admin-panel add-match-panel" style={{ height: 'fit-content' }}>
              <h3><Plus size={20}/> Schedule New Match</h3>
              <form onSubmit={handleAddMatch} className="admin-form">
                <div className="form-group">
                  <label>Sport</label>
                  <select 
                    value={newMatch.sport} 
                    onChange={e => setNewMatch({...newMatch, sport: e.target.value})}
                  >
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Team A</label>
                    <select 
                      value={newMatch.teamA} 
                      onChange={e => setNewMatch({...newMatch, teamA: e.target.value})}
                    >
                      <option value="VAJRA">VAJRA</option>
                      <option value="SAMUDRA">SAMUDRA</option>
                      <option value="VAYU">VAYU</option>
                      <option value="AGNI">AGNI</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Team B</label>
                    <select 
                      value={newMatch.teamB} 
                      onChange={e => setNewMatch({...newMatch, teamB: e.target.value})}
                    >
                      <option value="VAJRA">VAJRA</option>
                      <option value="SAMUDRA">SAMUDRA</option>
                      <option value="VAYU">VAYU</option>
                      <option value="AGNI">AGNI</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10:00 AM"
                      value={newMatch.time}
                      onChange={e => setNewMatch({...newMatch, time: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Venue</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Main Arena"
                      value={newMatch.venue}
                      onChange={e => setNewMatch({...newMatch, venue: e.target.value})}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Match'}
                </button>
              </form>
            </div>

            {/* SCHEDULE LIST SECTION */}
            <div className="schedule-list-section">
              <h3><List size={20} /> Current Fixtures</h3>
              <div className="admin-matches-list">
                {matches.length === 0 ? (
                  <p className="text-secondary text-center p-4">No fixtures scheduled.</p>
                ) : (
                  matches.map(match => (
                    <div key={match.id} className="glass-panel admin-match-card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="sport-badge" style={{ fontSize: '0.7rem' }}>{match.sport}</span>
                          <h4 style={{ margin: '0.5rem 0' }}>{match.teamA} Vs {match.teamB}</h4>
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{match.time} | {match.venue}</span>
                        </div>
                        <button 
                          className="btn-icon-danger"
                          onClick={() => handleDeleteMatch(match.id)}
                          title="Delete Match"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* LEADERBOARD MANAGEMENT SECTION */}
        {activeTab === 'leaderboard' && (
          <div className="admin-leaderboard-container">
            <div className="glass-panel admin-panel add-team-panel" style={{ height: 'fit-content', marginBottom: '2rem' }}>
              <h3><Plus size={20}/> Initialize New Team</h3>
              <form onSubmit={handleAddTeam} className="admin-form">
                <div className="form-group">
                  <label>Team Name</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. VAJRA"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Adding...' : 'Add Team'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="glass-panel admin-panel leaderboard-management-panel">
              <h3><Trophy size={20} /> Leaderboard Management</h3>
            <div className="admin-leaderboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {leaderboard.length === 0 ? (
                <p className="text-secondary text-center p-4">No leaderboard data found.</p>
              ) : (
                leaderboard.map(team => (
                  <div key={team.id} className="admin-match-card" style={{ borderTopColor: 'var(--accent-orange)' }}>
                    <h4 className="admin-team-name text-center" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{team.id}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🥇 Gold</span>
                        <div className="score-control-buttons">
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'gold', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.gold || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'gold', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🥈 Silver</span>
                        <div className="score-control-buttons">
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'silver', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.silver || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'silver', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--accent-green)' }}>🏆 Wins</span>
                        <div className="score-control-buttons" style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}>
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'wins', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.wins || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'wins', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--accent-orange)' }}>❌ Loss</span>
                        <div className="score-control-buttons" style={{ borderColor: 'rgba(255, 106, 0, 0.3)' }}>
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'losses', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.losses || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'losses', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Points</span>
                        <div className="score-control-buttons" style={{ borderColor: 'var(--accent-blue)', opacity: 0.8 }}>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px', color: 'var(--accent-blue)', margin: '0.5rem' }}>{team.points || 0}</span>
                        </div>
                      </div>
                      <div className="point-info" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        (G: 5pt | S: 3pt | W: 2pt)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Admin;
