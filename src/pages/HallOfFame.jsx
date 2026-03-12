import React, { useState, useEffect } from 'react';
import { db, ref, onValue } from '../firebase';
import './Teams.css'; // Reusing existing card styles

const HallOfFame = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const championsRef = ref(db, 'champions');
    const unsubscribe = onValue(championsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by year descending (latest first)
        formattedData.sort((a, b) => b.year - a.year);
        setChampions(formattedData);
      } else {
        // Fallback static data if no data exists
        setChampions([
          {
            id: 'demo-champ',
            year: '2025',
            name: 'VAJRA',
            logo: '/vajra.png',
            color: '#FFD700',
            description: '"Striking with the force and precision of thunder. The undisputed kings of the 2025 Hexaverse season."'
          }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container page-content">
      <h1 className="heading-section">
        Hall of <span className="text-gradient-blue">Fame</span>
      </h1>
      <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        Honoring the legends and past champions of Hexaverse.
      </p>

      {loading ? (
        <div className="loader">Loading Champions...</div>
      ) : (
        <div className="teams-grid">
          {champions.map((champ) => (
            <div 
              key={champ.id} 
              className="team-card glass-panel text-center"
              style={{ 
                '--team-color': champ.color || '#FFD700', 
                '--team-glow': `${champ.color || '#FFD700'}80`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem'
              }}
            >
              <div 
                className="champion-badge" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.05) 100%)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  color: '#FFD700',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  letterSpacing: '1px'
                }}
              >
                {champ.year} CHAMPION
              </div>
              <div className="team-icon-wrapper" style={{ margin: '1rem auto' }}>
                <img src={champ.logo} alt={`${champ.name} Logo`} className="team-logo-img" />
                <div className="icon-glow"></div>
              </div>
              <h2 className="team-name" style={{ marginTop: '1rem', fontSize: '2rem', letterSpacing: '2px' }}>TEAM {champ.name}</h2>
              <p className="team-desc" style={{ marginTop: '1rem', fontStyle: 'italic', opacity: 0.9 }}>
                {champ.description}
              </p>
              <div className="team-border-bottom"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
