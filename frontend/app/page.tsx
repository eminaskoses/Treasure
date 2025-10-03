"use client";

import { ethers } from "ethers";
import { useEffect } from "react";
import { TreasureFHEApp } from "@/components/TreasureFHEApp";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

export default function Page() {
  // Provide mock chain mapping for hardhat
  const mockChains: Readonly<Record<number, string>> = { 31337: "http://localhost:8545" };
  useEffect(() => {
    // no-op, ensure client side only
  }, []);
  return (
    <MetaMaskEthersSignerProvider initialMockChains={mockChains}>
      <main style={{ 
        minHeight: '100vh',
        padding: '40px 24px',
        background: 'radial-gradient(ellipse at top, rgba(139, 0, 0, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(218, 165, 32, 0.1) 0%, transparent 50%)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #B8860B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              textShadow: '0 0 30px rgba(218, 165, 32, 0.5)',
            }}>
              ⚜️ TreasureFHE ⚜️
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#DAA520',
              fontWeight: '500',
              letterSpacing: '1px',
            }}>
              Encrypted Treasure Box - Powered by Zama FHEVM
            </p>
          </div>
          <TreasureFHEApp />
        </div>
      </main>
    </MetaMaskEthersSignerProvider>
  );
}


