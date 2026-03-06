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

  // Sports definition
  const SPORTS = [
    'Cricket', 'Volleyball', 'Basketball', 'Badminton', 
    '100m Sprint', 'Kabaddi', 'Relay Race', 'Throwball'
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
      wins: 0,
      losses: 0,
      points: 0
    })
    .then(() => {
      alert(`Team ${teamId} added to leaderboard!`);
      setNewTeamName('');
    })
    .catch(err => alert("Error adding team: " + err.message))
    .finally(() => setLoading(false));
  };

  const updateScore = (matchId, team, increment) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const currentScore = team === 'A' ? match.scoreA : match.scoreB;
    const newScore = Math.max(0, currentScore + increment); // Ensure no negative scores

    update(ref(db, `matches/${matchId}`), {
      [team === 'A' ? 'scoreA' : 'scoreB']: newScore
    }).catch(err => alert("Error updating score: " + err.message));
  };

  const resetScore = (matchId) => {
    update(ref(db, `matches/${matchId}`), { scoreA: 0, scoreB: 0 })
      .catch(err => alert("Error resetting score: " + err.message));
  };

  const updateLeaderboardStat = (teamId, stat, increment) => {
    const team = leaderboard.find(t => t.id === teamId);
    if (!team) return;
    const currentVal = team[stat] || 0;
    const newVal = Math.max(0, currentVal + increment);
    update(ref(db, `leaderboard/${teamId}`), {
      [stat]: newVal
    }).catch(err => alert("Error updating stat: " + err.message));
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

  // Group Matches by Sport
  const groupedMatches = SPORTS.reduce((acc, sport) => {
    acc[sport] = matches.filter(m => m.sport === sport);
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

      <div className="admin-grid" style={{ gridTemplateColumns: activeTab === 'leaderboard' ? '1fr' : '1fr 2fr' }}>
        
        {activeTab === 'live' && (
          <div className="score-control-section" style={{ gridColumn: '1 / span 2' }}>
            <h3><Settings size={20} /> Live Score Management</h3>
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
                        {sportMatches.map(match => (
                          <div key={match.id} className="glass-panel admin-match-card">
                            <div className="admin-match-header">
                              <span className={`status-tag ${match.status.toLowerCase()}`}>{match.status}</span>
                              <button 
                                className={`btn-toggle ${match.status === 'LIVE' ? 'is-live-btn' : ''}`}
                                onClick={() => toggleStatus(match.id, match.status)}
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                              >
                                {match.status === 'LIVE' ? 'MARK FINISHED' : 'SET LIVE'}
                              </button>
                            </div>

                            <div className="admin-scorekeeper">
                              <div className="team-control">
                                <span className="admin-team-name">{match.teamA}</span>
                                <div className="score-control-buttons">
                                  <button className="score-btn minus" onClick={() => updateScore(match.id, 'A', -1)}>-1</button>
                                  <span className="admin-current-score">{match.scoreA}</span>
                                  <button className="score-btn plus" onClick={() => updateScore(match.id, 'A', 1)}>+1</button>
                                </div>
                              </div>
                              <div className="admin-vs">VS</div>
                              <div className="team-control">
                                <span className="admin-team-name">{match.teamB}</span>
                                <div className="score-control-buttons">
                                  <button className="score-btn minus" onClick={() => updateScore(match.id, 'B', -1)}>-1</button>
                                  <span className="admin-current-score">{match.scoreB}</span>
                                  <button className="score-btn plus" onClick={() => updateScore(match.id, 'B', 1)}>+1</button>
                                </div>
                              </div>
                            </div>

                            <div className="admin-match-footer">
                              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{match.time} | {match.venue}</span>
                              <button className="btn btn-secondary btn-sm" onClick={() => resetScore(match.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                Reset
                              </button>
                            </div>
                          </div>
                        ))}
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
                          <h4 style={{ margin: '0.5rem 0' }}>{match.teamA} vs {match.teamB}</h4>
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
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Wins</span>
                        <div className="score-control-buttons">
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'wins', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.wins || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'wins', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Losses</span>
                        <div className="score-control-buttons">
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'losses', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px' }}>{team.losses || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'losses', 1)}>+1</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-secondary" style={{ color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Points</span>
                        <div className="score-control-buttons" style={{ borderColor: 'var(--accent-green)' }}>
                          <button className="score-btn minus" onClick={() => updateLeaderboardStat(team.id, 'points', -1)}>-1</button>
                          <span className="admin-current-score" style={{ fontSize: '1.2rem', minWidth: '30px', color: 'var(--accent-green)' }}>{team.points || 0}</span>
                          <button className="score-btn plus" onClick={() => updateLeaderboardStat(team.id, 'points', 1)}>+1</button>
                        </div>
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
