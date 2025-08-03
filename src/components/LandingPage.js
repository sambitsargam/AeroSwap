import React, { useState, useEffect } from 'react';
import './LandingPage.css';

const LandingPage = ({ onEnterApp }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

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

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

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

      {/* Technology Section */}
      <section className="technology-section">
        <div className="section-header">
          <h2>Powered by Cutting-Edge Technology</h2>
          <p>Built on the most advanced DeFi protocols and security standards</p>
        </div>

        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon">🔐</div>
            <h3>Hash-Time-Lock Contracts</h3>
            <p>Atomic swaps with cryptographic security ensuring trustless cross-chain transactions</p>
            <div className="tech-details">
              <span>• ECDSA & EdDSA support</span>
              <span>• Timeout protection</span>
              <span>• Secret reveal mechanism</span>
            </div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">⚡</div>
            <h3>1inch Protocol Integration</h3>
            <p>Best-in-class DEX aggregation providing optimal swap rates across multiple protocols</p>
            <div className="tech-details">
              <span>• 100+ DEX sources</span>
              <span>• Gas optimization</span>
              <span>• Real-time pricing</span>
            </div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">🛡️</div>
            <h3>MEV Protection Suite</h3>
            <p>Advanced commit-reveal schemes and private mempools to protect against front-running</p>
            <div className="tech-details">
              <span>• Commit-reveal batching</span>
              <span>• Private mempool access</span>
              <span>• FIFO order execution</span>
            </div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">🧩</div>
            <h3>Partial Fill Engine</h3>
            <p>Intelligent order splitting and liquidity provider matching for large transactions</p>
            <div className="tech-details">
              <span>• Dynamic order splitting</span>
              <span>• LP matching algorithm</span>
              <span>• Slippage minimization</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>How AeroSwap Works</h2>
          <p>Simple steps to experience the future of cross-chain trading</p>
        </div>

        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Connect Your Wallet</h3>
              <p>Securely connect MetaMask or any Web3 wallet to start trading</p>
              <div className="step-visual">
                <div className="wallet-icon">👛</div>
              </div>
            </div>
          </div>

          <div className="step-connector"></div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Select Tokens & Chains</h3>
              <p>Choose from 1000+ tokens across 5+ blockchain networks</p>
              <div className="step-visual">
                <div className="token-selector">
                  <span className="token-a">ETH</span>
                  <span className="swap-arrow">↔</span>
                  <span className="token-b">USDC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="step-connector"></div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Choose Protection Mode</h3>
              <p>Enable MEV protection, partial fills, or cross-chain routing</p>
              <div className="step-visual">
                <div className="protection-modes">
                  <span className="mode-icon">🛡️</span>
                  <span className="mode-icon">📦</span>
                  <span className="mode-icon">🌉</span>
                </div>
              </div>
            </div>
          </div>

          <div className="step-connector"></div>

          <div className="step-item">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Execute Swap</h3>
              <p>Confirm transaction and enjoy secure, optimized trading</p>
              <div className="step-visual">
                <div className="success-checkmark">✅</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="section-header">
          <h2>Enterprise-Grade Security</h2>
          <p>Your funds and data are protected by military-grade security protocols</p>
        </div>

        <div className="security-grid">
          <div className="security-feature">
            <div className="security-icon">🔒</div>
            <h3>Smart Contract Audits</h3>
            <p>All contracts audited by leading security firms</p>
          </div>

          <div className="security-feature">
            <div className="security-icon">🔑</div>
            <h3>Non-Custodial</h3>
            <p>You maintain full control of your private keys</p>
          </div>

          <div className="security-feature">
            <div className="security-icon">🛡️</div>
            <h3>MEV Protection</h3>
            <p>Advanced protection against front-running attacks</p>
          </div>

          <div className="security-feature">
            <div className="security-icon">⚡</div>
            <h3>Real-time Monitoring</h3>
            <p>24/7 system monitoring and anomaly detection</p>
          </div>

          <div className="security-feature">
            <div className="security-icon">🌐</div>
            <h3>Decentralized</h3>
            <p>No single point of failure or central authority</p>
          </div>

          <div className="security-feature">
            <div className="security-icon">🔐</div>
            <h3>Encrypted Communications</h3>
            <p>End-to-end encryption for all data transmission</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2>Trusted by DeFi Traders Worldwide</h2>
          <p>See what our community is saying about AeroSwap</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              "AeroSwap's MEV protection saved me thousands on large trades. The cross-chain functionality is seamless!"
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍💼</div>
              <div className="author-info">
                <div className="author-name">Alex Chen</div>
                <div className="author-title">DeFi Portfolio Manager</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              "Finally, a DEX that understands the needs of institutional traders. Partial fills are a game-changer."
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍💻</div>
              <div className="author-info">
                <div className="author-name">Sarah Rodriguez</div>
                <div className="author-title">Crypto Fund Director</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              "The UI is beautiful and the advanced features actually work. Best cross-chain experience I've had."
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍🔬</div>
              <div className="author-info">
                <div className="author-name">Marcus Weber</div>
                <div className="author-title">DeFi Researcher</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Get answers to common questions about AeroSwap</p>
        </div>

        <div className="faq-container">
          <div className="faq-item">
            <div className="faq-question" onClick={() => toggleFAQ(0)}>
              <span>What makes AeroSwap different from other DEXs?</span>
              <span className="faq-toggle">{expandedFAQ === 0 ? '−' : '+'}</span>
            </div>
            {expandedFAQ === 0 && (
              <div className="faq-answer">
                AeroSwap combines advanced MEV protection, cross-chain atomic swaps, and partial fill capabilities in a single platform. Our hybrid HTLC technology enables truly trustless cross-chain trading.
              </div>
            )}
          </div>

          <div className="faq-item">
            <div className="faq-question" onClick={() => toggleFAQ(1)}>
              <span>Which blockchains does AeroSwap support?</span>
              <span className="faq-toggle">{expandedFAQ === 1 ? '−' : '+'}</span>
            </div>
            {expandedFAQ === 1 && (
              <div className="faq-answer">
                We support Ethereum, Polygon, Binance Smart Chain, Bitcoin, and Solana, with more chains being added regularly through our Universal Chain Adapter SDK.
              </div>
            )}
          </div>

          <div className="faq-item">
            <div className="faq-question" onClick={() => toggleFAQ(2)}>
              <span>How does MEV protection work?</span>
              <span className="faq-toggle">{expandedFAQ === 2 ? '−' : '+'}</span>
            </div>
            {expandedFAQ === 2 && (
              <div className="faq-answer">
                Our MEV shield uses commit-reveal schemes and private mempool access to prevent front-running. Orders are batched and executed in FIFO order to ensure fair pricing.
              </div>
            )}
          </div>

          <div className="faq-item">
            <div className="faq-question" onClick={() => toggleFAQ(3)}>
              <span>Are there any fees for using AeroSwap?</span>
              <span className="faq-toggle">{expandedFAQ === 3 ? '−' : '+'}</span>
            </div>
            {expandedFAQ === 3 && (
              <div className="faq-answer">
                AeroSwap charges a competitive 0.3% protocol fee on swaps. Gas fees depend on the source blockchain. MEV protection and partial fills are included at no extra cost.
              </div>
            )}
          </div>

          <div className="faq-item">
            <div className="faq-question" onClick={() => toggleFAQ(4)}>
              <span>Is AeroSwap audited and secure?</span>
              <span className="faq-toggle">{expandedFAQ === 4 ? '−' : '+'}</span>
            </div>
            {expandedFAQ === 4 && (
              <div className="faq-answer">
                Yes, all our smart contracts have been audited by leading security firms. We're non-custodial, meaning you always maintain control of your funds and private keys.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h2>Stay Updated</h2>
            <p>Get the latest news, features, and updates from AeroSwap</p>
          </div>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email address"
              className="newsletter-input"
            />
            <button className="newsletter-button">
              Subscribe
              <span className="button-arrow">→</span>
            </button>
          </div>
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
