import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, ref, onValue } from '../firebase';
import { ChevronLeft, Trophy, Crosshair, Target, Shield } from 'lucide-react';
import './TeamDetails.css';

// Fixed 6 Teams Configuration (same as Teams.jsx)
const FIXED_TEAMS = [
  {
    id: 'VAJRA',
    name: 'VAJRA',
    captain: 'TBD',
    color: '#FFD700',
    description: 'The Thunder Warriors - Unyielding and powerful',
    logo: '/vajra.png'
  },
  {
    id: 'SAMUDRA',
    name: 'SAMUDRA',
    captain: 'TBD',
    color: '#4169E1',
    description: 'The Ocean Titans - Deep strength and unity',
    logo: '/samudra.png'
  },
  {
    id: 'VAYU',
    name: 'VAYU',
    captain: 'TBD',
    color: '#87CEEB',
    description: 'The Wind Runners - Swift and unstoppable',
    logo: '/vayu.png'
  },
  {
    id: 'AGNI',
    name: 'AGNI',
    captain: 'TBD',
    color: '#FF4500',
    description: 'The Fire Warriors - Intense and fierce',
    logo: '/agni.png'
  },
  {
    id: 'HIMADRI',
    name: 'HIMADRI',
    captain: 'TBD',
    color: '#C0C0C0',
    description: 'The Mountain Guardians - Steadfast and resilient',
    logo: '/himadri.png'
  },
  {
    id: 'PRITHVI',
    name: 'PRITHVI',
    captain: 'TBD',
    color: '#8B4513',
    description: 'The Earth Defenders - Strong and grounded',
    logo: '/prithvi.png'
  }
];

const TeamDetails = () => {
  const { teamId } = useParams();
  const [teamProfile, setTeamProfile] = useState(null);
  const [teamStats, setTeamStats] = useState({ points: 0, wins: 0, losses: 0 });
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the team from fixed teams configuration
    const foundTeam = FIXED_TEAMS.find(t => t.id === teamId.toUpperCase());
    if (foundTeam) {
      setTeamProfile(foundTeam);
    }

    const statsRef = ref(db, `leaderboard/${teamId}`);
    const matchesRef = ref(db, 'matches');

    const unsubStats = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTeamStats({
          points: data.points || 0,
          wins: data.wins || 0,
          losses: data.losses || 0
        });
      }
    });

    const unsubMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allMatches = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const teamMatches = allMatches.filter(m => 
          (m.teamA && m.teamA.toUpperCase() === teamId.toUpperCase()) || 
          (m.teamB && m.teamB.toUpperCase() === teamId.toUpperCase())
        );
        setMatchHistory(teamMatches);
      }
      setLoading(false);
    });

    return () => {
      unsubStats();
      unsubMatches();
    };
  }, [teamId]);

  if (loading) {
    return (
      <div className="container page-content">
        <div className="text-center p-5">
          <div className="loading-spinner"></div>
          <p className="text-secondary mt-3">Loading Team Data...</p>
        </div>
      </div>
    );
  }

  if (!teamProfile) {
    return (
      <div className="container page-content">
        <div className="glass-panel text-center p-5">
          <h2 className="text-gradient-blue">Team Not Found</h2>
          <p className="text-secondary mt-3">The team profile you are looking for does not exist.</p>
          <Link to="/teams" className="btn btn-secondary mt-4">Back to Teams</Link>
        </div>
      </div>
    );
  }

  const teamColor = teamProfile.color || '#00BFFF';
  const teamMotto = teamProfile.description || 'Hexaverse Contender';
  const teamCaptain = teamProfile.captain || 'Team Leader';
  const teamLogo = teamProfile.logo;

  return (
    <div className="container page-content team-details-page" style={{ '--team-color': teamColor, '--team-glow': `${teamColor}80` }}>
      
      <Link to="/teams" className="back-link">
        <ChevronLeft size={20} /> Back to Teams
      </Link>

      {/* Hero Header */}
      <div className="team-hero glass-panel">
        <div className="team-hero-content">
          <div className="team-hero-icon">
            <img src={teamLogo} alt={`${teamProfile.name} Logo`} className="team-hero-logo-img" />
            <div className="hero-icon-glow"></div>
          </div>
          <div className="team-hero-text">
            <h1 className="team-title">{teamProfile.name}</h1>
            <div className="team-captain-detail">
              <span className="captain-label">Captain:</span>
              <span className="captain-name" style={{ color: teamColor }}>{teamCaptain}</span>
            </div>
            <p className="team-motto">{teamMotto}</p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="team-quick-stats">
          <div className="stat-box">
            <Trophy size={24} color={teamColor} />
            <span className="stat-value">{teamStats.points || 0}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-box">
            <Crosshair size={24} color="#39FF14" />
            <span className="stat-value">{teamStats.wins || 0}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-box">
            <Target size={24} color="#FF4B2B" />
            <span className="stat-value">{teamStats.losses || 0}</span>
            <span className="stat-label">Losses</span>
          </div>
        </div>
      </div>

      <div className="team-section">
        <h2 className="heading-section">Match <span style={{ color: teamColor }}>History</span></h2>
        
        {matchHistory.length === 0 ? (
          <div className="glass-panel text-center p-4">
            <p className="text-secondary">No recorded matches for {teamProfile.name} yet.</p>
          </div>
        ) : (
          <div className="match-history-grid">
            {matchHistory.map(match => {
              const isWin = match.winnerTeam === (match.teamA === teamProfile.name ? 'Team A' : 'Team B');
              const isFinished = match.status === 'Finished';
              
              return (
                <div key={match.id} className="glass-panel history-card" style={{ 
                  borderColor: match.status === 'Live' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                  boxShadow: isFinished && isWin ? `0 0 15px ${teamColor}40` : 'none'
                }}>
                  <div className="history-header">
                    <span className="sport-badge">{match.sport}</span>
                    <span className={`status-badge ${match.status.toLowerCase()}`}>{match.status}</span>
                  </div>
                  <div className="history-score-row">
                    <span className={`team-name ${match.teamA === teamProfile.name ? 'highlight' : ''}`}>{match.teamA}</span>
                    <div className="score-display">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <span className={`team-name ${match.teamB === teamProfile.name ? 'highlight' : ''}`}>{match.teamB}</span>
                  </div>
                  <div className="history-footer">
                    <span>{match.date}</span>
                    <span>{match.venue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeamDetails;
