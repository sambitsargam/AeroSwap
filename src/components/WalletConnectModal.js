/**
 * WalletConnect QR Code Modal Component
 * Custom QR code modal for better UX
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './WalletConnectModal.css';

const WalletConnectModal = ({ 
  isOpen, 
  onClose, 
  uri, 
  onConnect,
  title = "Connect Your Wallet",
  subtitle = "Scan QR code with a WalletConnect compatible wallet"
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const modalRef = useRef(null);

  // Generate QR code when URI changes
  useEffect(() => {
    if (uri && isOpen) {
      generateQRCode(uri);
    }
  }, [uri, isOpen]);

  // Handle modal click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const generateQRCode = async (uri) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const qrCodeUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeDataUrl(qrCodeUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URI:', err);
    }
  };

  const walletOptions = [
    {
      name: 'MetaMask',
      icon: '🦊',
      deepLink: `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`,
      description: 'Connect using MetaMask mobile app'
    },
    {
      name: 'Trust Wallet',
      icon: '🛡️',
      deepLink: `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`,
      description: 'Connect using Trust Wallet mobile app'
    },
    {
      name: 'Rainbow',
      icon: '🌈',
      deepLink: `https://rnbwapp.com/wc?uri=${encodeURIComponent(uri)}`,
      description: 'Connect using Rainbow mobile app'
    },
    {
      name: 'Coinbase Wallet',
      icon: '💙',
      deepLink: `https://go.cb-w.com/wc?uri=${encodeURIComponent(uri)}`,
      description: 'Connect using Coinbase Wallet mobile app'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="wallet-connect-modal-overlay">
      <div className="wallet-connect-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="qr-section">
            <p className="subtitle">{subtitle}</p>
            
            {isLoading && (
              <div className="qr-loading">
                <div className="spinner"></div>
                <p>Generating QR code...</p>
              </div>
            )}

            {error && (
              <div className="qr-error">
                <p>❌ {error}</p>
                <button onClick={() => generateQRCode(uri)}>
                  Try Again
                </button>
              </div>
            )}

            {qrCodeDataUrl && !isLoading && !error && (
              <div className="qr-container">
                <img 
                  src={qrCodeDataUrl} 
                  alt="WalletConnect QR Code"
                  className="qr-code"
                />
                <div className="qr-actions">
                  <button 
                    className="copy-button"
                    onClick={copyToClipboard}
                  >
                    {isCopied ? '✅ Copied!' : '📋 Copy URI'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="wallet-options">
            <h3>Or connect directly:</h3>
            <div className="wallet-grid">
              {walletOptions.map((wallet, index) => (
                <a
                  key={index}
                  href={wallet.deepLink}
                  className="wallet-option"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="wallet-icon">{wallet.icon}</span>
                  <div className="wallet-info">
                    <span className="wallet-name">{wallet.name}</span>
                    <span className="wallet-description">{wallet.description}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="connection-status">
            <div className="status-indicator">
              <div className="pulse-dot"></div>
              <span>Waiting for connection...</span>
            </div>
            <p className="help-text">
              Use your phone's camera to scan the QR code or tap one of the wallet options above
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <p className="powered-by">
            Powered by <strong>WalletConnect</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;