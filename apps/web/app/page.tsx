"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from './components/Button';
import Card from './components/Card';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('one_access_token');
    const onboardingComplete = localStorage.getItem('one_onboarding_complete');
    
    if (token && onboardingComplete) {
      router.push('/today');
    } else if (token) {
      router.push('/onboarding');
    }
  }, [router]);

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="text-center mb-lg">
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
          One <span className="badge">Inseparable</span>
        </h1>
        <p className="text-muted">
          A warm, practical couples app with Faith Mode, daily anchors, and Scripture tools.
        </p>
      </div>

      <Card highlight>
        <div className="onboarding-illustration text-center" style={{ fontSize: '48px', marginBottom: '16px' }}>
          💑
        </div>
        <h3 className="text-center mb-sm">Stay Connected, Every Day</h3>
        <p className="text-small text-center mb-lg">
          Daily micro-actions personalized to your love languages. 
          Smart nudges that catch drift before it becomes distance.
        </p>
        <div className="flex flex-col gap-sm">
          <Button variant="primary" block size="lg" onClick={() => router.push('/register')}>
            Create Account
          </Button>
          <Button variant="outline" block onClick={() => router.push('/login')}>
            I Already Have an Account
          </Button>
        </div>
      </Card>

      <Card>
        <h4 className="mb-sm">✨ What Makes One Different</h4>
        <div className="flex flex-col gap-sm" style={{ fontSize: '14px' }}>
          <div className="flex gap-sm items-center">
            <span>🎯</span>
            <span>Love language-matched actions</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>📖</span>
            <span>Faith Mode with Scripture tools</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>⏰</span>
            <span>Daily anchors that fit busy lives</span>
          </div>
          <div className="flex gap-sm items-center">
            <span>🏆</span>
            <span>Streaks & rewards that motivate</span>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="mb-sm">Pricing</h4>
        <p className="text-small mb-md">
          ✅ Free Starter • 💛 Inseparable Membership $12/mo • 🙏 Support the Mission
        </p>
        <Button variant="ghost" block onClick={() => router.push('/pricing')}>
          View Pricing →
        </Button>
      </Card>
    </main>
  );
}
