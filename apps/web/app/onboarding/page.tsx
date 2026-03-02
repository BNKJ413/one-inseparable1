"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ProgressSteps from '../components/ProgressSteps';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import Input from '../components/Input';
import Card from '../components/Card';
import { apiPost } from '../lib/api';

const TOTAL_STEPS = 7;

const LOVE_LANGUAGES = [
  { id: 'words', label: 'Words of Affirmation', icon: '💬', description: 'Verbal compliments and encouragement' },
  { id: 'time', label: 'Quality Time', icon: '⏰', description: 'Undivided attention and presence' },
  { id: 'touch', label: 'Physical Touch', icon: '🤝', description: 'Physical affection and closeness' },
  { id: 'service', label: 'Acts of Service', icon: '🛠️', description: 'Helpful actions that ease their burden' },
  { id: 'gifts', label: 'Receiving Gifts', icon: '🎁', description: 'Thoughtful presents and symbols of love' },
];

const ANCHOR_TIMES = [
  { id: 'morning', label: 'Morning', icon: '🌅', description: 'Start the day connected (6-9 AM)' },
  { id: 'midday', label: 'Midday', icon: '☀️', description: 'Quick check-in (11 AM-1 PM)' },
  { id: 'evening', label: 'Evening', icon: '🌇', description: 'Reconnect after work (5-8 PM)' },
  { id: 'bedtime', label: 'Bedtime', icon: '🌙', description: 'Wind down together (9-11 PM)' },
];

const TIME_OPTIONS = [
  { id: '2min', label: '2 minutes', description: 'Quick micro-moments' },
  { id: '7min', label: '7 minutes', description: 'Brief but meaningful' },
  { id: '20min', label: '20 minutes', description: 'Deeper connection time' },
];

const BOUNDARY_OPTIONS = [
  { id: 'pg', label: 'PG - Family Friendly', description: 'Clean, wholesome suggestions only' },
  { id: 'romantic', label: 'Romantic', description: 'Includes romantic gestures and ideas' },
  { id: 'married', label: 'Married Intimate', description: 'Full spectrum of marital intimacy' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, updateUserLocal } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Onboarding data
  const [faithMode, setFaithMode] = useState(true);
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [anchorTimes, setAnchorTimes] = useState<string[]>(['morning', 'evening']);
  const [partnerCode, setPartnerCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [pairingMode, setPairingMode] = useState<'join' | 'create' | null>(null);
  const [timeAvailability, setTimeAvailability] = useState('7min');
  const [boundaries, setBoundaries] = useState('romantic');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const toggleLoveLanguage = (id: string) => {
    setLoveLanguages(prev => {
      if (prev.includes(id)) {
        return prev.filter(l => l !== id);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const toggleAnchorTime = (id: string) => {
    setAnchorTimes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleCreateCouple = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await apiPost<{ coupleId: string; pairCode: string }>('/api/couple/create', {});
      setGeneratedCode(res.pairCode);
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!partnerCode.trim()) {
      setError('Please enter a partner code');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiPost<{ coupleId: string }>('/api/couple/join', { pairCode: partnerCode });
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
      setStep(6);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError('');
    try {
      await apiPost('/api/user/preferences', {
        faithMode,
        loveLanguages,
        anchorTimes,
        timeAvailability,
        boundaries,
      });
      updateUserLocal({ faithMode, loveLanguages, anchorTimes, timeAvailability, boundaries });
    } catch (e: any) {
      // Silently continue - backend endpoint may not exist yet
      console.log('Preferences save skipped:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 6) {
      await savePreferences();
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleComplete = () => {
    localStorage.setItem('one_onboarding_complete', 'true');
    router.push('/today');
  };

  const canProceed = () => {
    switch (step) {
      case 3: return loveLanguages.length >= 1;
      case 4: return anchorTimes.length >= 1;
      case 5: return generatedCode || (user?.coupleId);
      default: return true;
    }
  };

  if (isLoading) {
    return (
      <div className="onboarding-container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <ProgressSteps total={TOTAL_STEPS} current={step} />

      <div className="onboarding-content">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">💑</div>
              <h1>Welcome to One</h1>
              <p className="text-muted mt-md">Inseparable</p>
            </div>
            <div className="onboarding-body">
              <Card>
                <p style={{ fontSize: '16px', lineHeight: 1.7 }}>
                  One is your daily intimacy operating system — delivering the right nudge 
                  at the right time, personalized for your love languages and life.
                </p>
              </Card>
              <Card>
                <h4 className="mb-sm">What you'll get:</h4>
                <ul style={{ paddingLeft: '20px', color: 'var(--fg-secondary)' }}>
                  <li>Daily anchor moments to stay connected</li>
                  <li>Actions matched to your love languages</li>
                  <li>Scripture & faith tools (optional)</li>
                  <li>Playful rewards & streaks</li>
                </ul>
              </Card>
            </div>
          </>
        )}

        {/* Step 2: Faith Mode */}
        {step === 2 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">✨</div>
              <h2>Faith Mode</h2>
              <p className="text-muted mt-sm">Scripture-powered connection</p>
            </div>
            <div className="onboarding-body">
              <Card highlight>
                <Toggle
                  label="Faith Mode"
                  description="Keep Scripture and prayer at the core of your daily anchors"
                  checked={faithMode}
                  onChange={setFaithMode}
                />
              </Card>
              {faithMode ? (
                <Card>
                  <h4 className="mb-sm">📖 With Faith Mode ON:</h4>
                  <ul style={{ paddingLeft: '20px', color: 'var(--fg-secondary)', fontSize: '14px' }}>
                    <li>Daily Scripture for your marriage</li>
                    <li>Prayer prompts for each other</li>
                    <li>Faith-based action ideas</li>
                    <li>Access to Scripture Vault</li>
                  </ul>
                </Card>
              ) : (
                <Card>
                  <h4 className="mb-sm">💛 With Faith Mode OFF:</h4>
                  <ul style={{ paddingLeft: '20px', color: 'var(--fg-secondary)', fontSize: '14px' }}>
                    <li>Practical relationship principles</li>
                    <li>Research-backed connection tips</li>
                    <li>Emotionally-focused actions</li>
                    <li>You can turn Faith Mode on anytime</li>
                  </ul>
                </Card>
              )}
              <p className="text-small text-center mt-md">
                You can change this anytime in Settings
              </p>
            </div>
          </>
        )}

        {/* Step 3: Love Languages */}
        {step === 3 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">💕</div>
              <h2>Your Love Languages</h2>
              <p className="text-muted mt-sm">Select your top 1-2 love languages</p>
            </div>
            <div className="onboarding-body">
              <div className="checkbox-group">
                {LOVE_LANGUAGES.map(lang => (
                  <div
                    key={lang.id}
                    className={`checkbox-item ${loveLanguages.includes(lang.id) ? 'selected' : ''}`}
                    onClick={() => toggleLoveLanguage(lang.id)}
                  >
                    <span style={{ fontSize: '24px' }}>{lang.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{lang.label}</div>
                      <p className="text-small">{lang.description}</p>
                    </div>
                    {loveLanguages.includes(lang.id) && (
                      <span className="badge">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-small text-center mt-md">
                Selected: {loveLanguages.length}/2
              </p>
            </div>
          </>
        )}

        {/* Step 4: Anchor Times */}
        {step === 4 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">⏰</div>
              <h2>Anchor Times</h2>
              <p className="text-muted mt-sm">When should we nudge you to connect?</p>
            </div>
            <div className="onboarding-body">
              <div className="checkbox-group">
                {ANCHOR_TIMES.map(time => (
                  <div
                    key={time.id}
                    className={`checkbox-item ${anchorTimes.includes(time.id) ? 'selected' : ''}`}
                    onClick={() => toggleAnchorTime(time.id)}
                  >
                    <span style={{ fontSize: '24px' }}>{time.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{time.label}</div>
                      <p className="text-small">{time.description}</p>
                    </div>
                    {anchorTimes.includes(time.id) && (
                      <span className="badge">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-small text-center mt-md">
                We recommend at least 2 anchor times daily
              </p>
            </div>
          </>
        )}

        {/* Step 5: Partner Pairing */}
        {step === 5 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">👫</div>
              <h2>Pair with Partner</h2>
              <p className="text-muted mt-sm">Connect your accounts together</p>
            </div>
            <div className="onboarding-body">
              {user?.coupleId ? (
                <Card highlight>
                  <div className="text-center">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3>You're paired!</h3>
                    <p className="text-muted mt-sm">Your accounts are connected</p>
                  </div>
                </Card>
              ) : !pairingMode ? (
                <>
                  <Card onClick={() => setPairingMode('join')} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-md">
                      <span style={{ fontSize: '32px' }}>🔑</span>
                      <div>
                        <h4>I have a partner code</h4>
                        <p className="text-small">Enter the code your partner shared</p>
                      </div>
                    </div>
                  </Card>
                  <Card onClick={() => { setPairingMode('create'); handleCreateCouple(); }} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-md">
                      <span style={{ fontSize: '32px' }}>✨</span>
                      <div>
                        <h4>Generate a new code</h4>
                        <p className="text-small">Create a code to share with your partner</p>
                      </div>
                    </div>
                  </Card>
                  <p className="text-small text-center mt-md">
                    You can pair later from Settings
                  </p>
                </>
              ) : pairingMode === 'join' ? (
                <Card>
                  <h4 className="mb-md">Enter Partner Code</h4>
                  <Input
                    placeholder="Enter 6-character code"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
                  />
                  {error && <p className="error-message">{error}</p>}
                  <div className="flex gap-sm mt-md">
                    <Button variant="ghost" onClick={() => setPairingMode(null)}>Back</Button>
                    <Button variant="primary" block loading={saving} onClick={handleJoinCouple}>Join</Button>
                  </div>
                </Card>
              ) : (
                <Card highlight>
                  <h4 className="mb-md text-center">Your Partner Code</h4>
                  {saving ? (
                    <div className="loading"><div className="spinner" /></div>
                  ) : generatedCode ? (
                    <>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 700, 
                        textAlign: 'center',
                        letterSpacing: '8px',
                        padding: '16px',
                        background: 'var(--accent-gold-light)',
                        borderRadius: '12px',
                        marginBottom: '16px'
                      }}>
                        {generatedCode}
                      </div>
                      <p className="text-small text-center">
                        Share this code with your partner to connect your accounts
                      </p>
                    </>
                  ) : (
                    <p className="text-center">Generating code...</p>
                  )}
                  {error && <p className="error-message text-center">{error}</p>}
                  <Button variant="ghost" block className="mt-md" onClick={() => setPairingMode(null)}>Back</Button>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Step 6: Preferences */}
        {step === 6 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">⚙️</div>
              <h2>Your Preferences</h2>
              <p className="text-muted mt-sm">Customize your experience</p>
            </div>
            <div className="onboarding-body">
              <Card>
                <h4 className="mb-md">Time Available</h4>
                <p className="text-small mb-md">How much time can you typically spend on connection activities?</p>
                <div className="radio-group">
                  {TIME_OPTIONS.map(opt => (
                    <div
                      key={opt.id}
                      className={`radio-item ${timeAvailability === opt.id ? 'selected' : ''}`}
                      onClick={() => setTimeAvailability(opt.id)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                        <p className="text-small">{opt.description}</p>
                      </div>
                      {timeAvailability === opt.id && <span className="badge">✓</span>}
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h4 className="mb-md">Content Boundaries</h4>
                <p className="text-small mb-md">What level of suggestions are you comfortable with?</p>
                <div className="radio-group">
                  {BOUNDARY_OPTIONS.map(opt => (
                    <div
                      key={opt.id}
                      className={`radio-item ${boundaries === opt.id ? 'selected' : ''}`}
                      onClick={() => setBoundaries(opt.id)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                        <p className="text-small">{opt.description}</p>
                      </div>
                      {boundaries === opt.id && <span className="badge">✓</span>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Step 7: Complete */}
        {step === 7 && (
          <>
            <div className="onboarding-header">
              <div className="onboarding-illustration">🎉</div>
              <h2>You're All Set!</h2>
              <p className="text-muted mt-sm">Your journey to deeper connection starts now</p>
            </div>
            <div className="onboarding-body">
              <Card highlight>
                <h4 className="mb-md">Your Setup:</h4>
                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Faith Mode</span>
                    <span>{faithMode ? '✅ On' : '❌ Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Love Languages</span>
                    <span>{loveLanguages.map(l => LOVE_LANGUAGES.find(ll => ll.id === l)?.icon).join(' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Anchor Times</span>
                    <span>{anchorTimes.map(t => ANCHOR_TIMES.find(at => at.id === t)?.icon).join(' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Time</span>
                    <span>{TIME_OPTIONS.find(t => t.id === timeAvailability)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Partner</span>
                    <span>{user?.coupleId || generatedCode ? '✅ Paired' : '⏳ Pending'}</span>
                  </div>
                </div>
              </Card>
              <Card>
                <h4 className="mb-sm">What's Next:</h4>
                <ul style={{ paddingLeft: '20px', color: 'var(--fg-secondary)', fontSize: '14px' }}>
                  <li>Check your "Today" screen for daily anchors</li>
                  <li>Explore the Connect screen for action ideas</li>
                  <li>Visit Scripture Vault for faith resources</li>
                  <li>Earn points & build your streak!</li>
                </ul>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="onboarding-footer">
        {error && step !== 5 && <p className="error-message text-center mb-md">{error}</p>}
        <div className="flex gap-sm">
          {step > 1 && step < 7 && (
            <Button variant="ghost" onClick={handleBack}>Back</Button>
          )}
          {step < 7 ? (
            <Button
              variant="primary"
              block
              onClick={handleNext}
              disabled={!canProceed()}
              loading={saving}
            >
              {step === 5 && !user?.coupleId && !generatedCode ? 'Skip for now' : 'Continue'}
            </Button>
          ) : (
            <Button variant="gold" block size="lg" onClick={handleComplete}>
              Start Your Journey →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
