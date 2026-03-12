import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trophy, Crosshair, ChevronDown, ChevronUp } from 'lucide-react';
import { db, ref, onValue } from '../firebase';
import './Teams.css';

const Teams = () => {
  const [stats, setStats] = useState({});
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Teams
    const teamsRef = ref(db, 'teams');
    const unsubTeams = onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedTeams = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTeams(formattedTeams);
      } else {
        setTeams([]);
      }
      setLoading(false);
    });

    const leaderboardRef = ref(db, 'leaderboard');
    const unsubLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      }
    });

    const matchesRef = ref(db, 'matches');
    const unsubMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedMatches = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMatches(formattedMatches);
      }
    });

    return () => {
      unsubTeams();
      unsubLeaderboard();
      unsubMatches();
    };
  }, []);

  const toggleExpand = (e, teamId) => {
    e.preventDefault();
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  const getTeamWins = (teamName) => {
    return matches.filter(m => m.status === 'Finished' && m.winnerTeam === teamName).length;
  };

  const getTeamMatches = (teamName) => {
    const teamMatches = matches.filter(m => m.teamA === teamName || m.teamB === teamName);
    // Sort by date ascending (assuming m.date is a valid date string or timestamp)
    teamMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    return teamMatches;
  };

  return (
    <div className="container page-content">
      <h1 className="heading-section">Participating <span className="text-gradient-blue">Teams</span></h1>
      <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        Four houses. One champion. Choose your allegiance.
      </p>

      <div className="teams-grid">
        {loading ? (
          <div className="text-center p-4 w-100">
            <div className="loading-spinner"></div>
            <p className="text-secondary mt-2">Loading Teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center p-4 w-100">
            <p className="text-secondary">No team profiles found.</p>
          </div>
        ) : (
          teams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const teamMatches = getTeamMatches(team.name);
            const teamWins = getTeamWins(team.name);
            
            return (
              <div 
                key={team.id} 
                className="team-card glass-panel"
                style={{ 
                  '--team-color': team.color, 
                  '--team-glow': `${team.color}80`,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <button 
                  onClick={(e) => toggleExpand(e, team.id)} 
                  style={{ 
                    position: 'absolute', 
                    top: '15px', 
                    right: '15px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                >
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                
                <Link 
                  to={`/teams/${team.id}`}
                  style={{ 
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div className="team-icon-wrapper">
                    {team.logo ? (
                      <img src={team.logo} alt={`${team.name} Logo`} className="team-logo-img" />
                    ) : (
                      <Shield size={60} color={team.color} />
                    )}
                    <div className="icon-glow"></div>
                  </div>
                  <h2 className="team-name">{team.name}</h2>
                  
                  <div className="team-stats-row">
                    <div className="team-stat-item">
                      <Trophy size={14} color={team.color} />
                      <span>{stats[team.id]?.points || 0} pts</span>
                    </div>
                    <div className="team-stat-item">
                      <Crosshair size={14} color="#39FF14" />
                      <span>{teamWins}W</span>
                    </div>
                  </div>

                  <div className="team-captain">
                    <span className="captain-label">Captain:</span>
                    <span className="captain-name">{team.captain || 'Not Assigned'}</span>
                  </div>
                  <p className="team-desc">{team.description}</p>
                </Link>

                {isExpanded && (
                  <div className="scheduled-games-section" style={{ marginTop: '1.5rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center' }}>SCHEDULED GAMES</h3>
                    {teamMatches.length > 0 ? (
                      <div className="matches-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {teamMatches.map(match => (
                          <div key={match.id} style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${team.color}40`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{match.sport}</span>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '2px 8px', 
                                borderRadius: '12px',
                                background: match.status === 'Live' ? 'rgba(255, 69, 0, 0.2)' : match.status === 'Finished' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                color: match.status === 'Live' ? '#FF4500' : match.status === 'Finished' ? '#39FF14' : '#C0C0C0',
                                fontWeight: 'bold'
                              }}>
                                {match.status}
                              </span>
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', margin: '4px 0' }}>
                              <span style={{ color: match.teamA === team.name ? team.color : '#fff' }}>{match.teamA}</span>
                              <span style={{ margin: '0 8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>vs</span>
                              <span style={{ color: match.teamB === team.name ? team.color : '#fff' }}>{match.teamB}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              {new Date(match.date).toLocaleDateString()} {match.time && `• ${match.time}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No scheduled matches found.</p>
                    )}
                  </div>
                )}

                <div className="team-border-bottom"></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Teams;
