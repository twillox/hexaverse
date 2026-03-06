import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, ref, onValue } from '../firebase';
import { ChevronLeft, Trophy, Crosshair, Target, Shield } from 'lucide-react';
import './TeamDetails.css';

const teamColors = {
  VAJRA: '#FFD700',
  SAMUDRA: '#00BFFF',
  VAYU: '#E0FFFF',
  AGNI: '#FF4500'
};

const teamMottos = {
  VAJRA: 'The thunderstorm. Indestructible and unyielding force.',
  SAMUDRA: 'The vast ocean. Deep, relentless, and overpowering.',
  VAYU: 'The wind. Swift, unseen, and omnipresent.',
  AGNI: 'The fire. Fierce, consuming, and radiant.'
};

const teamCaptains = {
  VAJRA: 'Kotte Ashwath',
  AGNI: 'M.Rohitha Reddy',
  VAYU: 'Spandan Sahu',
  SAMUDRA: 'Sarthak Nashine'
};

const TeamDetails = () => {
  const { teamId } = useParams();
  const [teamStats, setTeamStats] = useState({ points: 0, wins: 0, losses: 0 });
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const teamColor = teamColors[teamId] || '#00BFFF';
  const teamMotto = teamMottos[teamId] || 'Hexaverse Contender';
  const teamCaptain = teamCaptains[teamId] || 'Team Leader';

  useEffect(() => {
    const statsRef = ref(db, `leaderboard/${teamId}`);
    const matchesRef = ref(db, 'matches');

    const unsubStats = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTeamStats(snapshot.val());
      }
    });

    const unsubMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allMatches = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const teamMatches = allMatches.filter(m => m.teamA === teamId || m.teamB === teamId);
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
    return <div className="container page-content"><div className="loader">Loading Team Data...</div></div>;
  }

  const teamLogos = {
    VAJRA: '/vajra.png',
    SAMUDRA: '/samudra.png',
    VAYU: '/vayu.png',
    AGNI: '/agni.png'
  };

  const teamLogo = teamLogos[teamId] || '/vajra.png';

  return (
    <div className="container page-content team-details-page" style={{ '--team-color': teamColor, '--team-glow': `${teamColor}80` }}>
      
      <Link to="/teams" className="back-link">
        <ChevronLeft size={20} /> Back to Teams
      </Link>

      {/* Hero Header */}
      <div className="team-hero glass-panel">
        <div className="team-hero-content">
          <div className="team-hero-icon">
            <img src={teamLogo} alt={`${teamId} Logo`} className="team-hero-logo-img" />
            <div className="hero-icon-glow"></div>
          </div>
          <div className="team-hero-text">
            <h1 className="team-title">{teamId}</h1>
            <div className="team-captain-detail">
              <span className="captain-label">Captain:</span>
              <span className="captain-name">{teamCaptain}</span>
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
            <Crosshair size={24} color={teamColor} />
            <span className="stat-value">{teamStats.wins || 0}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-box">
            <Target size={24} color={teamColor} />
            <span className="stat-value">{teamStats.losses || 0}</span>
            <span className="stat-label">Losses</span>
          </div>
        </div>
      </div>

      <div className="team-section">
        <h2 className="heading-section">Match <span style={{ color: teamColor }}>History</span></h2>
        
        {matchHistory.length === 0 ? (
          <div className="glass-panel text-center p-4">
            <p className="text-secondary">No recorded matches for {teamId} yet.</p>
          </div>
        ) : (
          <div className="match-history-grid">
            {matchHistory.map(match => (
              <div key={match.id} className="glass-panel history-card" style={{ borderColor: match.status === 'LIVE' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)' }}>
                <div className="history-header">
                  <span className="sport-badge">{match.sport}</span>
                  <span className={`status-badge ${match.status.toLowerCase()}`}>{match.status}</span>
                </div>
                <div className="history-score-row">
                  <span className={`team-name ${match.teamA === teamId ? 'highlight' : ''}`}>{match.teamA}</span>
                  <div className="score-display">
                    {match.scoreA} - {match.scoreB}
                  </div>
                  <span className={`team-name ${match.teamB === teamId ? 'highlight' : ''}`}>{match.teamB}</span>
                </div>
                <div className="history-footer">
                  <span>{match.time}</span>
                  <span>{match.venue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeamDetails;
