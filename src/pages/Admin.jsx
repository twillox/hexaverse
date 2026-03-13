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
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'schedule', 'leaderboard', 'points'
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('ALL');
  const [selectedLiveSport, setSelectedLiveSport] = useState(null);

  // Point System State
  const [pointSystem, setPointSystem] = useState({
    outdoorTeamGold: 8,
    outdoorTeamSilver: 5,
    outdoorSingleGold: 5,
    outdoorSingleSilver: 3,
    indoorTeamGold: 5,
    indoorTeamSilver: 3,
    indoorSingleGold: 3,
    indoorSingleSilver: 1
  });

  // Initialize all 6 teams if they don't exist
  useEffect(() => {
    const sixTeams = ['VAJRA', 'SAMUDRA', 'VAYU', 'AGNI', 'HIMADRI', 'PRITHVI'];
    const checks = sixTeams.map(teamId => {
      const teamRef = ref(db, `leaderboard/${teamId}`);
      return onValue(teamRef, (snapshot) => {
        if (!snapshot.exists()) {
          set(ref(db, `leaderboard/${teamId}`), {
            gold: 0,
            silver: 0,
            points: 0
          });
        }
      });
    });

    // Load point system
    const pointsRef = ref(db, 'pointSystem');
    const unsubPoints = onValue(pointsRef, (snapshot) => {
      if (snapshot.exists()) {
        setPointSystem(snapshot.val());
      }
    });

    return () => {
      checks.forEach(unsub => unsub());
      unsubPoints();
    };
  }, []);
  // Sports definition
  const SPORTS = [
    'Basketball', 'Cricket', 'Volleyball', 'Kabaddi', 
    'Throwball', '100m Sprint', '200m Sprint', 'Relay Race', 'Badminton',
    'Carrom', 'Chess'
  ];

  // New Match Form State
  const [newMatch, setNewMatch] = useState({
    sport: SPORTS[0],
    category: 'Outdoor',
    format: 'League',
    teamA: 'VAJRA',
    teamB: 'SAMUDRA',
    venue: '',
    date: '13 March',
    scoreA: 0,
    scoreB: 0,
    winnerTeam: null,
    status: 'Upcoming'
  });

  const [localMatchEdits, setLocalMatchEdits] = useState({});
  const [localLeaderboardEdits, setLocalLeaderboardEdits] = useState({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const matchesRef = ref(db, 'matches');
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedMatches = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMatches(formattedMatches);
        
        // Initialize local edits if not set
        setLocalMatchEdits(prev => {
          const newEdits = { ...prev };
          formattedMatches.forEach(m => {
            if (!newEdits[m.id]) {
              newEdits[m.id] = {
                scoreA: m.scoreA || 0,
                scoreB: m.scoreB || 0,
                status: m.status || 'Upcoming',
                winnerTeam: m.winnerTeam || '',
              };
            }
          });
          return newEdits;
        });

      } else {
        setMatches([]);
      }
    });

    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribeLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedLb = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setLeaderboard(formattedLb);
        
        // initialize local edits
        setLocalLeaderboardEdits(prev => {
          const newEdits = { ...prev };
          formattedLb.forEach(t => {
            if (!newEdits[t.id]) {
              newEdits[t.id] = {
                gold: t.gold || 0,
                silver: t.silver || 0,
                points: t.points || 0,
              };
            }
          });
          return newEdits;
        });
      } else {
        setLeaderboard([]);
      }
    });

    const teamsRef = ref(db, 'teams');
    const unsubscribeTeams = onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedTeams = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setTeams(formattedTeams);
        

      } else {
        setTeams([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMatches();
      unsubscribeLeaderboard();
      unsubscribeTeams();
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
    
    if (!newMatch.sport || !newMatch.venue) {
      alert("Please fill all fields for the new match.");
      return;
    }
    
    setLoading(true);
    const matchesRef = ref(db, 'matches');
    push(matchesRef, { ...newMatch, date: '13 March', scoreA: 0, scoreB: 0, winnerTeam: null, status: 'Upcoming' })
      .then(() => {
        alert("Match added successfully!");
        setNewMatch({ ...newMatch, venue: '' });
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

  const handleMatchEditChange = (matchId, field, value) => {
    setLocalMatchEdits(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const handleUpdateMatch = (matchId) => {
    const changes = localMatchEdits[matchId];
    if (!changes) return;
    update(ref(db, `matches/${matchId}`), {
      scoreA: Number(changes.scoreA),
      scoreB: Number(changes.scoreB),
      status: changes.status,
      winnerTeam: changes.winnerTeam || null
    })
    .then(() => alert("Match updated successfully!"))
    .catch(err => alert("Error updating match: " + err.message));
  };

  const handleLeaderboardEditChange = (teamId, field, value) => {
    setLocalLeaderboardEdits(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value
      }
    }));
  };

  const saveAllLeaderboardChanges = () => {
    setLoading(true);
    const updates = {};
    Object.keys(localLeaderboardEdits).forEach(teamId => {
      const edits = localLeaderboardEdits[teamId];
      updates[`leaderboard/${teamId}/gold`] = Number(edits.gold) || 0;
      updates[`leaderboard/${teamId}/silver`] = Number(edits.silver) || 0;
      updates[`leaderboard/${teamId}/points`] = Number(edits.points) || 0;
    });

    update(ref(db), updates)
      .then(() => alert("Leaderboard successfully updated!"))
      .catch(err => alert("Error updating leaderboard: " + err.message))
      .finally(() => setLoading(false));
  };










  const handleSavePointSystem = () => {
    setLoading(true);
    update(ref(db, 'pointSystem'), pointSystem)
      .then(() => alert("Point system updated successfully!"))
      .catch(err => alert("Error updating point system: " + err.message))
      .finally(() => setLoading(false));
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${period}`;
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
        <button 
          className={`admin-tab-btn ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          <Settings size={20} /> Point System
        </button>
      </div>

      <div className="admin-grid">
        
        {activeTab === 'live' && (
          <div className="score-control-section">
            <div className="section-header-row">
              <h3>
                <Activity size={20} /> 
                {selectedLiveSport ? ` Live: ${selectedLiveSport}` : ' Live Score Center'}
              </h3>
              <div className="admin-filters">
                {selectedLiveSport && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLiveSport(null)}>
                    ← Back to Sports
                  </button>
                )}
                <input 
                  type="text" 
                  placeholder="Search Match..." 
                  className="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {!selectedLiveSport ? (
              <div className="live-sports-grid">
                {SPORTS.map(sport => {
                  const sportMatches = matches.filter(m => m.sport === sport);
                  if (sportMatches.length === 0) return null;
                  
                  return (
                    <div 
                      key={sport} 
                      className="sport-select-card glass-panel"
                      onClick={() => setSelectedLiveSport(sport)}
                    >
                      <div className="sport-card-info">
                        <h4>{sport}</h4>
                        <span className="match-count">{sportMatches.length} Matches</span>
                      </div>
                      <Plus className="icon-plus" size={24} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-matches-list">
                <div className="sport-category-group">
                  <div className="sport-matches-grid">
                    {filteredMatches
                      .filter(m => m.sport === selectedLiveSport)
                      .map(match => {
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
                        const isLive = match.status === 'Live';
                        const edits = localMatchEdits[match.id] || { scoreA: 0, scoreB: 0, status: 'Upcoming', winnerTeam: '' };

                        return (
                          <div key={match.id} className={`admin-match-card status-${match.status.toLowerCase()}`}>
                            <div className="admin-match-meta">
                              <div className="match-info-pill">
                                <span className={`status-tag status-${match.status.toLowerCase()}`}>{match.status}</span>
                                <span className="match-venue-label">{match.venue} • 13 March</span>
                              </div>
                            </div>

                            <div className="admin-scorekeeper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                              
                              <div className="team-control-row" style={{ justifyContent: 'space-around', alignItems: 'center' }}>
                                <div className="team-control text-center">
                                  <span className="admin-team-name">{match.teamA}</span>
                                  <input 
                                    type="number"
                                    className="admin-search-input"
                                    style={{ width: '80px', textAlign: 'center', marginTop: '0.5rem' }}
                                    value={edits.scoreA}
                                    onChange={(e) => handleMatchEditChange(match.id, 'scoreA', e.target.value)}
                                  />
                                </div>

                                <div className="admin-vs-divider">
                                  <div className="admin-vs-circle">VS</div>
                                </div>

                                <div className="team-control text-center">
                                  <span className="admin-team-name">{match.teamB}</span>
                                  <input 
                                    type="number"
                                    className="admin-search-input"
                                    style={{ width: '80px', textAlign: 'center', marginTop: '0.5rem' }}
                                    value={edits.scoreB}
                                    onChange={(e) => handleMatchEditChange(match.id, 'scoreB', e.target.value)}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <select 
                                  className="admin-search-input" 
                                  style={{ flex: 1 }}
                                  value={edits.status}
                                  onChange={(e) => handleMatchEditChange(match.id, 'status', e.target.value)}
                                >
                                  <option value="Upcoming">Upcoming</option>
                                  <option value="Live">Live</option>
                                  <option value="Finished">Finished</option>
                                </select>

                                <select 
                                  className="admin-search-input"
                                  style={{ flex: 1 }}
                                  value={edits.winnerTeam}
                                  onChange={(e) => handleMatchEditChange(match.id, 'winnerTeam', e.target.value)}
                                >
                                  <option value="">No Winner Yet</option>
                                  <option value={match.teamA}>{match.teamA}</option>
                                  <option value={match.teamB}>{match.teamB}</option>
                                </select>
                              </div>

                              <button className="btn btn-primary w-100" onClick={() => handleUpdateMatch(match.id)}>
                                Update
                              </button>
                            </div>

                            <div className="admin-match-footer">
                              <span className="footer-match-type">{match.sport} • {match.status}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <>
            {/* ADD MATCH SECTION */}
            <div className="glass-panel admin-panel add-match-panel" style={{ height: 'fit-content' }}>
              <h3><Plus size={20}/> Schedule New Match</h3>
              <form onSubmit={handleAddMatch} className="admin-form">
                <div className="form-group">
                  <label>Sport & Format</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      style={{ flex: 1 }}
                      value={newMatch.sport} 
                      onChange={e => setNewMatch({...newMatch, sport: e.target.value})}
                    >
                      {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                    <select
                      style={{ flex: 1 }}
                      value={newMatch.category}
                      onChange={e => setNewMatch({...newMatch, category: e.target.value})}
                    >
                      <option value="Outdoor">Outdoor</option>
                      <option value="Indoor">Indoor</option>
                      <option value="Esports">Esports</option>
                    </select>
                    <select
                      style={{ flex: 1 }}
                      value={newMatch.format}
                      onChange={e => setNewMatch({...newMatch, format: e.target.value})}
                    >
                      <option value="League">League</option>
                      <option value="Knockout">Knockout</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>
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
                    <label>Event Date</label>
                    <input 
                      type="text" 
                      value="13 March"
                      readOnly
                      style={{ opacity: 0.7 }}
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
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>13 March | {match.venue}</span>
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
                leaderboard.map(team => {
                  const edits = localLeaderboardEdits[team.id] || { gold: 0, silver: 0, points: 0 };
                  
                  return (
                    <div key={team.id} className="admin-match-card" style={{ borderTopColor: 'var(--accent-orange)' }}>
                      <h4 className="admin-team-name text-center" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{team.id}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🥇 Gold</span>
                          <input 
                            type="number"
                            className="admin-search-input"
                            style={{ width: '80px', textAlign: 'center' }}
                            value={edits.gold}
                            onChange={e => handleLeaderboardEditChange(team.id, 'gold', e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🥈 Silver</span>
                          <input 
                            type="number"
                            className="admin-search-input"
                            style={{ width: '80px', textAlign: 'center' }}
                            value={edits.silver}
                            onChange={e => handleLeaderboardEditChange(team.id, 'silver', e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-secondary" style={{ color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Total Points</span>
                          <input 
                            type="number"
                            className="admin-search-input"
                            style={{ width: '80px', textAlign: 'center' }}
                            value={edits.points}
                            onChange={e => handleLeaderboardEditChange(team.id, 'points', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {leaderboard.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }} 
                  onClick={saveAllLeaderboardChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save All Leaderboard Changes'}
                </button>
              </div>
            )}
            </div>
          </div>
        )}

        {/* POINT SYSTEM MANAGEMENT */}
        {activeTab === 'points' && (
          <div className="admin-points-container">
            <div className="glass-panel admin-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3><Settings size={20} /> Tournament Point System Configuration</h3>
              <p className="text-secondary" style={{ marginBottom: '2rem' }}>Configure points awarded for Gold and Silver in different sport categories</p>
              
              <div className="points-config-grid">
                {/* OUTDOOR TEAM SPORTS */}
                <div className="point-category-card glass-panel">
                  <h4 style={{ color: 'var(--accent-blue)', marginBottom: '1rem', borderBottom: '1px solid rgba(0, 191, 255, 0.3)', paddingBottom: '0.5rem' }}>Outdoor - Team Sports</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>🥇 Gold Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.outdoorTeamGold}
                        onChange={(e) => setPointSystem({...pointSystem, outdoorTeamGold: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>🥈 Silver Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.outdoorTeamSilver}
                        onChange={(e) => setPointSystem({...pointSystem, outdoorTeamSilver: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* OUTDOOR SINGLE SPORTS */}
                <div className="point-category-card glass-panel">
                  <h4 style={{ color: 'var(--accent-green)', marginBottom: '1rem', borderBottom: '1px solid rgba(57, 255, 20, 0.3)', paddingBottom: '0.5rem' }}>Outdoor - Single Sports</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>🥇 Gold Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.outdoorSingleGold}
                        onChange={(e) => setPointSystem({...pointSystem, outdoorSingleGold: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>🥈 Silver Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.outdoorSingleSilver}
                        onChange={(e) => setPointSystem({...pointSystem, outdoorSingleSilver: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* INDOOR TEAM SPORTS */}
                <div className="point-category-card glass-panel">
                  <h4 style={{ color: 'var(--accent-orange)', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 106, 0, 0.3)', paddingBottom: '0.5rem' }}>Indoor & Esports - Team Sports</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>🥇 Gold Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.indoorTeamGold}
                        onChange={(e) => setPointSystem({...pointSystem, indoorTeamGold: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>🥈 Silver Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.indoorTeamSilver}
                        onChange={(e) => setPointSystem({...pointSystem, indoorTeamSilver: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* INDOOR SINGLE SPORTS */}
                <div className="point-category-card glass-panel">
                  <h4 style={{ color: '#FF1493', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 20, 147, 0.3)', paddingBottom: '0.5rem' }}>Indoor & Esports - Single Sports</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>🥇 Gold Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.indoorSingleGold}
                        onChange={(e) => setPointSystem({...pointSystem, indoorSingleGold: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label>🥈 Silver Medal Points</label>
                      <input 
                        type="number"
                        value={pointSystem.indoorSingleSilver}
                        onChange={(e) => setPointSystem({...pointSystem, indoorSingleSilver: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }} 
                  onClick={handleSavePointSystem}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Point System'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
