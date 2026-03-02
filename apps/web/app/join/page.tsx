"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { apiPost } from '../lib/api';

export default function JoinPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUserLocal } = useAuth();
  const [mode, setMode] = useState<'choose' | 'join' | 'create'>('choose');
  const [partnerCode, setPartnerCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleCreateCouple = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiPost<{ coupleId: string; pairCode: string }>('/api/couple/create', {});
      setGeneratedCode(res.pairCode);
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!partnerCode.trim()) {
      setError('Please enter a partner code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost<{ coupleId: string }>('/api/couple/join', { pairCode: partnerCode });
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
      router.push('/today');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading"><div className="spinner" /></div>
      </main>
    );
  }

  // Already paired
  if (user?.coupleId) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Card highlight>
          <div className="text-center">
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>✅</span>
            <h2>You're Paired!</h2>
            <p className="text-muted mt-sm mb-lg">
              Your accounts are connected with your partner.
            </p>
            <Button variant="gold" block onClick={() => router.push('/today')}>
              Go to Today →
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="text-center mb-lg">
        <h1>👫 Pair with Partner</h1>
        <p className="text-muted">Connect your accounts together</p>
      </div>

      {mode === 'choose' && (
        <>
          <Card onClick={() => setMode('join')} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-md">
              <span style={{ fontSize: '32px' }}>🔑</span>
              <div>
                <h4>I have a partner code</h4>
                <p className="text-small">Enter the code your partner shared</p>
              </div>
            </div>
          </Card>

          <Card onClick={() => { setMode('create'); handleCreateCouple(); }} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-md">
              <span style={{ fontSize: '32px' }}>✨</span>
              <div>
                <h4>Generate a new code</h4>
                <p className="text-small">Create a code to share with your partner</p>
              </div>
            </div>
          </Card>

          <Button variant="ghost" block className="mt-md" onClick={() => router.push('/today')}>
            Skip for now
          </Button>
        </>
      )}

      {mode === 'join' && (
        <Card>
          <h4 className="mb-md">Enter Partner Code</h4>
          <Input
            placeholder="Enter code"
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
            maxLength={10}
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '6px' }}
          />
          {error && <p className="error-message mt-sm">{error}</p>}
          <div className="flex gap-sm mt-lg">
            <Button variant="ghost" onClick={() => { setMode('choose'); setError(''); }}>Back</Button>
            <Button variant="primary" block loading={loading} onClick={handleJoinCouple}>Join Partner</Button>
          </div>
        </Card>
      )}

      {mode === 'create' && (
        <Card highlight>
          <h4 className="mb-md text-center">Your Partner Code</h4>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : generatedCode ? (
            <>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 700, 
                textAlign: 'center',
                letterSpacing: '8px',
                padding: '20px',
                background: 'var(--accent-gold-light)',
                borderRadius: '16px',
                marginBottom: '16px'
              }}>
                {generatedCode}
              </div>
              <p className="text-small text-center mb-lg">
                Share this code with your partner. Once they enter it, you'll be connected!
              </p>
              <Button variant="gold" block onClick={() => router.push('/today')}>
                Continue to App →
              </Button>
            </>
          ) : null}
          {error && <p className="error-message text-center">{error}</p>}
          <Button variant="ghost" block className="mt-md" onClick={() => { setMode('choose'); setError(''); setGeneratedCode(''); }}>
            Back
          </Button>
        </Card>
      )}
    </main>
  );
}
