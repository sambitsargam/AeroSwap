import React, { useState, useEffect } from 'react';
import './LandingPage.css';

const LandingPage = ({ onEnterApp }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: "🔗",
      title: "Cross-Chain Swaps",
      description: "Seamlessly swap tokens across 5+ blockchain networks",
      color: "#FF6B6B"
    },
    {
      icon: "🛡️",
      title: "MEV Protection",
      description: "Advanced MEV shield with commit-reveal mechanisms",
      color: "#4ECDC4"
    },
    {
      icon: "📦",
      title: "Partial Fills",
      description: "Break large orders into optimal smaller chunks",
      color: "#45B7D1"
    },
    {
      icon: "🚀",
      title: "1inch Integration",
      description: "Best prices through DEX aggregation protocols",
      color: "#96CEB4"
    }
  ];

  const stats = [
    { value: "$2.5B+", label: "Total Volume", icon: "💰" },
    { value: "50K+", label: "Active Users", icon: "👥" },
    { value: "5+", label: "Blockchain Networks", icon: "🌐" },
    { value: "99.9%", label: "Uptime", icon: "⚡" }
  ];

  const chains = [
    { name: "Ethereum", logo: "Ξ", color: "#627EEA" },
    { name: "Polygon", logo: "⬟", color: "#8247E5" },
    { name: "BSC", logo: "◆", color: "#F3BA2F" },
    { name: "Bitcoin", logo: "₿", color: "#F7931A" },
    { name: "Solana", logo: "◎", color: "#00FFA3" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [features.length]);

  const floatingElements = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="floating-element"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`
      }}
    >
      {['💎', '🚀', '⚡', '🌟', '💫'][Math.floor(Math.random() * 5)]}
    </div>
  ));

  return (
    <div className={`landing-page ${isVisible ? 'visible' : ''}`}>
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        {floatingElements}
      </div>

      {/* Mouse Follower */}
      <div 
        className="mouse-follower"
        style={{
          left: mousePosition.x - 10,
          top: mousePosition.y - 10
        }}
      ></div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-icon">✈️</span>
          <span className="logo-text">AeroSwap</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Analytics</a>
          <a href="#chains">Networks</a>
          <button className="nav-cta" onClick={onEnterApp}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🎉 New: MEV Protection Now Live!</span>
          </div>
          
          <h1 className="hero-title">
            The Future of
            <span className="gradient-text"> Cross-Chain </span>
            DeFi Trading
          </h1>
          
          <p className="hero-description">
            Experience lightning-fast, secure, and intelligent token swaps across multiple blockchain networks. 
            Protected by advanced MEV shields and powered by cutting-edge DeFi protocols.
          </p>

          <div className="hero-buttons">
            <button className="primary-button" onClick={onEnterApp}>
              <span>Start Trading</span>
              <div className="button-glow"></div>
            </button>
            <button className="secondary-button">
              <span>Watch Demo</span>
              <span className="play-icon">▶️</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">$2.5B+</span>
              <span className="stat-label">Trading Volume</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">50K+</span>
              <span className="stat-label">Active Traders</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="trading-interface-preview">
            <div className="interface-header">
              <div className="header-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="interface-title">AeroSwap Trading</span>
            </div>
            <div className="interface-body">
              <div className="swap-preview">
                <div className="token-input">
                  <span className="token-symbol">ETH</span>
                  <span className="token-amount">1.0</span>
                </div>
                <div className="swap-arrow">↓</div>
                <div className="token-output">
                  <span className="token-symbol">USDC</span>
                  <span className="token-amount">2,834.52</span>
                </div>
              </div>
              <div className="swap-button-preview">Swap Tokens</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Revolutionary Features</h2>
          <p>Built for the next generation of DeFi traders</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card ${index === currentFeature ? 'active' : ''}`}
              style={{ '--accent-color': feature.color }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-glow"></div>
            </div>
          ))}
        </div>

        <div className="features-showcase">
          <div className="showcase-content">
            <div className="showcase-feature">
              <span className="showcase-icon">{features[currentFeature].icon}</span>
              <h3>{features[currentFeature].title}</h3>
              <p>{features[currentFeature].description}</p>
            </div>
          </div>
          <div className="showcase-visual">
            <div className="rotating-globe">
              {chains.map((chain, index) => (
                <div 
                  key={index}
                  className="globe-node"
                  style={{
                    '--rotation': `${index * 72}deg`,
                    '--color': chain.color
                  }}
                >
                  <span>{chain.logo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-container">
          <h2>Trusted by Thousands</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chains Section */}
      <section id="chains" className="chains-section">
        <div className="section-header">
          <h2>Multi-Chain Universe</h2>
          <p>Seamlessly trade across all major blockchain networks</p>
        </div>

        <div className="chains-grid">
          {chains.map((chain, index) => (
            <div 
              key={index}
              className="chain-card"
              style={{ '--chain-color': chain.color }}
            >
              <div className="chain-logo">{chain.logo}</div>
              <div className="chain-name">{chain.name}</div>
              <div className="chain-status">
                <span className="status-dot"></span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Experience the Future?</h2>
          <p>Join thousands of traders already using AeroSwap for secure, fast cross-chain trading</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={onEnterApp}>
              Launch AeroSwap
              <span className="arrow">→</span>
            </button>
            <button className="cta-secondary">
              Read Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>✈️</span>
              <span>AeroSwap</span>
            </div>
            <p>The next generation of cross-chain DeFi trading</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#chains">Supported Chains</a>
              <a href="#stats">Analytics</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <button onClick={() => alert('Coming Soon!')}>Documentation</button>
              <button onClick={() => alert('Coming Soon!')}>API</button>
              <button onClick={() => alert('Coming Soon!')}>Support</button>
            </div>
            <div className="footer-column">
              <h4>Community</h4>
              <button onClick={() => alert('Coming Soon!')}>Discord</button>
              <button onClick={() => alert('Coming Soon!')}>Twitter</button>
              <button onClick={() => alert('Coming Soon!')}>GitHub</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 AeroSwap. Built with ❤️ for DeFi.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
