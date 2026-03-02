"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import { apiPost } from '../lib/api';

const DONATION_AMOUNTS = [
  { amount: 1200, label: '$12' },
  { amount: 2500, label: '$25' },
  { amount: 5000, label: '$50' },
  { amount: 10000, label: '$100' },
];

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState(1200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const givingSuccess = searchParams?.get('giving') === 'success';

  const handleDonate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiPost<{ url: string }>('/api/billing/create-donation-session', {
        amountCents: selectedAmount,
      });
      window.location.href = res.url;
    } catch (e: any) {
      setError(e.message || 'Failed to process donation');
      setLoading(false);
    }
  };

  if (givingSuccess) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Card highlight>
          <div className="text-center">
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>❤️</span>
            <h2>Thank You!</h2>
            <p className="text-muted mt-sm mb-lg">
              Your generosity helps couples build stronger marriages. 
              Thank you for supporting the mission.
            </p>
            <Button variant="gold" block onClick={() => router.push('/today')}>
              Continue to App →
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container" style={{ minHeight: '100vh', paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="text-center mb-lg">
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🙏 Support the Mission</h1>
        <p className="text-muted">Help marriages thrive</p>
      </div>

      <Card highlight>
        <div className="text-center mb-lg">
          <p style={{ fontSize: '16px', lineHeight: 1.7 }}>
            Your donation helps us provide relationship tools to couples 
            who can't afford them, keeping marriages strong and families together.
          </p>
        </div>

        <h4 className="mb-md">Choose an amount</h4>
        <div className="grid grid-2 gap-sm mb-lg">
          {DONATION_AMOUNTS.map(({ amount, label }) => (
            <button
              key={amount}
              className={`tab ${selectedAmount === amount ? 'active' : ''}`}
              onClick={() => setSelectedAmount(amount)}
              style={{ fontSize: '18px', fontWeight: 600, padding: '16px' }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="error-message mb-md text-center">{error}</p>}

        <Button variant="gold" block size="lg" onClick={handleDonate} loading={loading}>
          Donate {DONATION_AMOUNTS.find(d => d.amount === selectedAmount)?.label}
        </Button>
      </Card>

      <Card>
        <h4 className="mb-md">Where Your Donation Goes</h4>
        <div className="flex flex-col gap-sm">
          <div className="flex gap-sm items-center">
            <span>👫</span>
            <span className="text-small">Subsidized memberships for couples in need</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>📚</span>
            <span className="text-small">Free relationship resources and content</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>🛠️</span>
            <span className="text-small">App development and maintenance</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>🌍</span>
            <span className="text-small">Expanding to reach more couples worldwide</span>
          </div>
        </div>
      </Card>

      <div className="text-center mt-lg">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Go Back
        </Button>
      </div>
    </main>
  );
}



export default function SupportPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /></div>}>
      <SupportPageContent />
    </Suspense>
  );
}
