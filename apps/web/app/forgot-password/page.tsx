"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../lib/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Card highlight>
          <div className="text-center">
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>✉️</span>
            <h2>Check Your Email</h2>
            <p className="text-muted mt-sm mb-lg">
              If an account exists for {email}, we've sent password reset instructions.
            </p>
            <Button variant="primary" block onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="text-center mb-lg">
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Reset Password</h1>
        <p className="text-muted">We'll send you reset instructions</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {error && <p className="error-message mb-md">{error}</p>}

          <Button type="submit" variant="primary" block size="lg" loading={loading}>
            Send Reset Link
          </Button>
        </form>
      </Card>

      <p className="text-center text-small mt-md">
        Remember your password?{' '}
        <Link href="/login" style={{ fontWeight: 500 }}>Sign in</Link>
      </p>
    </main>
  );
}
