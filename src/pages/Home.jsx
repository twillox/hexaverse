import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Trophy, Clock, Users } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="glow-orb top-left"></div>
        <div className="glow-orb bottom-right"></div>
        <div className="grid-bg"></div>

        <div className="hero-content">
          <h2 className="subtitle">NIAT SPORTS FEST</h2>
          <h1 className="heading-massive hero-title pulse-glow">HEXAVERSE <span className="text-white">2.0</span></h1>
          <p className="hero-description text-secondary">
            Experience the future of sports. The ultimate college esport and athletic tournament command center.
          </p>
          
          <div className="hero-actions">
            <NavLink to="/live" className="btn btn-primary neon-border">
              <span className="live-dot" style={{ backgroundColor: '#fff', boxShadow: '0 0 10px #fff' }}></span>
              View Live Scores
            </NavLink>
            <NavLink to="/schedule" className="btn btn-secondary">
              Match Schedule
              <ArrowRight size={20} />
            </NavLink>
          </div>
        </div>

        {/* Animated streak elements */}
        <div className="streak streak-1"></div>
        <div className="streak streak-2"></div>
        <div className="streak streak-3"></div>
      </section>

      {/* Quick Stats/Features */}
      <section className="container features-section">
        <div className="glass-panel feature-card">
          <Trophy size={40} className="feature-icon text-accent-orange" color="var(--accent-orange)" />
          <h3>4 Elite Teams</h3>
          <p>Battling for ultimate supremacy in the Hexaverse.</p>
        </div>
        <div className="glass-panel feature-card">
          <Clock size={40} className="feature-icon text-accent-blue" color="var(--accent-blue)" />
          <h3>Real-time Action</h3>
          <p>Live score updates powered by cutting-edge telemetry.</p>
        </div>
        <div className="glass-panel feature-card">
          <Users size={40} className="feature-icon text-accent-green" color="var(--accent-green)" />
          <h3>Live Viewers</h3>
          <p>Join hundreds of students tuning into the live dashboard.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
