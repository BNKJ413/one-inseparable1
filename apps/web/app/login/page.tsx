"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const onboardingComplete = localStorage.getItem('one_onboarding_complete');
      router.push(onboardingComplete ? '/today' : '/onboarding');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="text-center mb-lg">
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome Back</h1>
        <p className="text-muted">Sign in to One — Inseparable</p>
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
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <p className="error-message mb-md">{error}</p>}

          <Button type="submit" variant="primary" block size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="text-center mt-md">
          <Link href="/forgot-password" className="text-small">Forgot password?</Link>
        </div>
      </Card>

      <p className="text-center text-small mt-md">
        Don't have an account?{' '}
        <Link href="/register" style={{ fontWeight: 500 }}>Create one</Link>
      </p>
    </main>
  );
}
