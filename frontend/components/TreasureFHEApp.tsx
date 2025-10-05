"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useTreasureFHE } from "@/hooks/useTreasureFHE";

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(40, 0, 0, 0.9) 100%)',
  border: '2px solid rgba(218, 165, 32, 0.3)',
  borderRadius: '16px',
  padding: '28px',
  marginBottom: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(218, 165, 32, 0.05)',
  backdropFilter: 'blur(10px)',
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)',
  color: '#000',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(218, 165, 32, 0.4)',
  marginRight: '12px',
  marginBottom: '12px',
};

const buttonHoverStyle: React.CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 6px 20px rgba(218, 165, 32, 0.6)',
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
  color: '#fff',
  boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)',
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #444 0%, #222 100%)',
  color: '#666',
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.5)',
  border: '2px solid rgba(218, 165, 32, 0.3)',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '1rem',
  color: '#f5f5f5',
  outline: 'none',
  width: '200px',
  marginRight: '12px',
  transition: 'border-color 0.3s ease',
};

const labelStyle: React.CSSProperties = {
  color: '#DAA520',
  fontWeight: '600',
  marginBottom: '8px',
  display: 'block',
  fontSize: '0.95rem',
  letterSpacing: '0.5px',
};

const valueStyle: React.CSSProperties = {
  color: '#f5f5f5',
  fontSize: '1.1rem',
  marginBottom: '16px',
  padding: '10px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '6px',
  borderLeft: '3px solid #DAA520',
};

const statusBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 14px',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: '600',
  marginLeft: '10px',
};

const truncateHandle = (handle: string | undefined): string => {
  if (!handle) return "---";
  if (handle.length <= 10) return handle;
  return handle.substring(0, 10) + ".....";
};

export const TreasureFHEApp = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    isConnecting,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
    error: mmError,
  } = useMetaMaskEthersSigner();

  const { instance, status, error } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const app = useTreasureFHE({
    instance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [fundAmount, setFundAmount] = useState<string>("0.01");
  const [buttonHover, setButtonHover] = useState<string>("");

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}>
        <div style={{
          ...cardStyle,
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '24px',
          }}>🔐</div>
          <h2 style={{
            color: '#DAA520',
            marginBottom: '16px',
            fontSize: '1.8rem',
          }}>Welcome to TreasureFHE</h2>
          <p style={{
            color: '#ccc',
            marginBottom: '32px',
            fontSize: '1.1rem',
          }}>
            Connect your wallet to unlock encrypted treasures
          </p>
          <button 
            onClick={connect}
            disabled={isConnecting}
            style={isConnecting ? disabledButtonStyle : (buttonHover === 'connect' ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle)}
            onMouseEnter={() => setButtonHover('connect')}
            onMouseLeave={() => setButtonHover('')}
          >
            {isConnecting ? '⏳ Connecting...' : '🦊 Connect MetaMask'}
          </button>
          {mmError && (
            <div style={{
              ...valueStyle,
              marginTop: '16px',
              borderLeft: '3px solid #DC143C',
              color: '#DC143C',
            }}>
              <strong>Error:</strong> {mmError.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (app.isDeployed === false) {
    return (
      <div style={cardStyle}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px',
          }}>⚠️</div>
          <h2 style={{
            color: '#DC143C',
            marginBottom: '12px',
          }}>Contract Not Deployed</h2>
          <p style={{
            color: '#ccc',
            fontSize: '1.1rem',
          }}>
            TreasureFHE is not deployed on this chain.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (status === 'ready') {
      return (
        <span style={{
          ...statusBadgeStyle,
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid #22c55e',
          color: '#22c55e',
        }}>
          ✓ Ready
        </span>
      );
    } else if (status === 'loading') {
      return (
        <span style={{
          ...statusBadgeStyle,
          background: 'rgba(234, 179, 8, 0.2)',
          border: '1px solid #eab308',
          color: '#eab308',
        }}>
          ⏳ Loading
        </span>
      );
    } else if (status === 'error') {
      return (
        <span style={{
          ...statusBadgeStyle,
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          color: '#ef4444',
        }}>
          ✗ Error
        </span>
      );
    } else {
      return (
        <span style={{
          ...statusBadgeStyle,
          background: 'rgba(156, 163, 175, 0.2)',
          border: '1px solid #9ca3af',
          color: '#9ca3af',
        }}>
          ○ Idle
        </span>
      );
    }
  };

  return (
    <div>
      {/* System Status Card */}
      <div style={cardStyle}>
        <h2 style={{
          color: '#DAA520',
          marginBottom: '20px',
          fontSize: '1.5rem',
          borderBottom: '2px solid rgba(218, 165, 32, 0.3)',
          paddingBottom: '12px',
        }}>
          🔧 System Status
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={labelStyle} className="inline">FHEVM Instance:</span>
          {getStatusBadge()}
        </div>
        {error && (
          <div style={{
            ...valueStyle,
            borderLeft: '3px solid #DC143C',
            color: '#DC143C',
          }}>
            <strong>Error:</strong> {error.message}
          </div>
        )}
        {app.message && (
          <div style={{
            ...valueStyle,
            borderLeft: '3px solid #DAA520',
            color: '#DAA520',
            fontStyle: 'italic',
          }}>
            💬 {app.message}
          </div>
        )}
      </div>

      {/* Actions Card */}
      <div style={cardStyle}>
        <h2 style={{
          color: '#DAA520',
          marginBottom: '20px',
          fontSize: '1.5rem',
          borderBottom: '2px solid rgba(218, 165, 32, 0.3)',
          paddingBottom: '12px',
        }}>
          🎮 Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            disabled={!app.canGetAll} 
            onClick={app.refreshAll}
            style={!app.canGetAll ? disabledButtonStyle : (buttonHover === 'refresh' ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle)}
            onMouseEnter={() => setButtonHover('refresh')}
            onMouseLeave={() => setButtonHover('')}
          >
            🔄 Refresh
          </button>
          <button 
            disabled={!app.canBuy} 
            onClick={() => app.buyKeys()}
            style={!app.canBuy ? disabledButtonStyle : (buttonHover === 'buy' ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle)}
            onMouseEnter={() => setButtonHover('buy')}
            onMouseLeave={() => setButtonHover('')}
          >
            🔑 Buy 1 Key (0.0002 ETH)
          </button>
          <button 
            disabled={!app.canOpen} 
            onClick={app.openBox}
            style={!app.canOpen ? disabledButtonStyle : (buttonHover === 'open' ? { ...dangerButtonStyle, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(220, 20, 60, 0.6)' } : dangerButtonStyle)}
            onMouseEnter={() => setButtonHover('open')}
            onMouseLeave={() => setButtonHover('')}
          >
            📦 Open Box
          </button>
          <button 
            disabled={!app.canDecryptLast} 
            onClick={app.decryptLastReward}
            style={!app.canDecryptLast ? disabledButtonStyle : (buttonHover === 'decrypt' ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle)}
            onMouseEnter={() => setButtonHover('decrypt')}
            onMouseLeave={() => setButtonHover('')}
          >
            🔓 Decrypt Reward
          </button>
          <button 
            disabled={!app.canClaim} 
            onClick={app.claimReward}
            style={!app.canClaim ? disabledButtonStyle : (buttonHover === 'claim' ? { ...dangerButtonStyle, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(220, 20, 60, 0.6)' } : dangerButtonStyle)}
            onMouseEnter={() => setButtonHover('claim')}
            onMouseLeave={() => setButtonHover('')}
          >
            💰 Claim Reward
          </button>
        </div>
      </div>

      {/* Prize Pool Card */}
      <div style={cardStyle}>
        <h2 style={{
          color: '#DAA520',
          marginBottom: '20px',
          fontSize: '1.5rem',
          borderBottom: '2px solid rgba(218, 165, 32, 0.3)',
          paddingBottom: '12px',
        }}>
          💎 Prize Pool
        </h2>
        <div style={valueStyle}>
          <span style={labelStyle}>Total Balance:</span>
          <div style={{ fontSize: '1.8rem', color: '#DAA520', fontWeight: 'bold' }}>
            {app.poolBalanceWei ? ethers.formatEther(app.poolBalanceWei) + " ETH" : "---"}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
          <input 
            value={fundAmount} 
            onChange={(e) => setFundAmount(e.target.value)} 
            placeholder="Amount in ETH"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#DAA520'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(218, 165, 32, 0.3)'}
          />
          <button 
            disabled={!app.canFund} 
            onClick={() => app.fundPool(fundAmount)}
            style={!app.canFund ? disabledButtonStyle : (buttonHover === 'fund' ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle)}
            onMouseEnter={() => setButtonHover('fund')}
            onMouseLeave={() => setButtonHover('')}
          >
            💸 Fund Pool (Owner Only)
          </button>
        </div>
      </div>

      {/* Player Stats Card */}
      <div style={cardStyle}>
        <h2 style={{
          color: '#DAA520',
          marginBottom: '20px',
          fontSize: '1.5rem',
          borderBottom: '2px solid rgba(218, 165, 32, 0.3)',
          paddingBottom: '12px',
        }}>
          👤 Your Stats
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={labelStyle}>🔑 My Keys (Encrypted):</span>
              <div style={valueStyle}>
                {truncateHandle(app.keyHandle)}
              </div>
            </div>
            <div>
              <span style={labelStyle}>🎁 Last Reward (Encrypted):</span>
              <div style={valueStyle}>
                {truncateHandle(app.lastRewardHandle)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={labelStyle}>🔑 My Keys (Decrypted):</span>
              <div style={valueStyle}>
                {app.keyClear !== undefined ? String(app.keyClear) : "Not decrypted yet"}
              </div>
            </div>
            <div>
              <span style={labelStyle}>🎁 Last Reward (Decrypted):</span>
              <div style={{
                ...valueStyle,
                color: app.isLastDecrypted ? '#22c55e' : '#ccc',
                fontWeight: app.isLastDecrypted ? 'bold' : 'normal',
              }}>
                {app.isLastDecrypted ? `${String(app.lastRewardClear)} Wei` : "Not decrypted yet"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


