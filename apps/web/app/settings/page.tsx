"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Toggle from '../components/Toggle';
import Toast from '../components/Toast';
import { apiPost } from '../lib/api';

const LOVE_LANGUAGES = [
  { id: 'words', label: 'Words of Affirmation', icon: '💬', description: 'Verbal compliments and encouragement' },
  { id: 'time', label: 'Quality Time', icon: '⏰', description: 'Undivided attention and presence' },
  { id: 'touch', label: 'Physical Touch', icon: '🤝', description: 'Physical affection and closeness' },
  { id: 'service', label: 'Acts of Service', icon: '🛠️', description: 'Helpful actions that ease their burden' },
  { id: 'gifts', label: 'Receiving Gifts', icon: '🎁', description: 'Thoughtful presents and symbols of love' },
];

const ANCHOR_TIMES = [
  { id: 'morning', label: 'Morning', icon: '🌅', time: '6-9 AM' },
  { id: 'midday', label: 'Midday', icon: '☀️', time: '11 AM-1 PM' },
  { id: 'evening', label: 'Evening', icon: '🌇', time: '5-8 PM' },
  { id: 'bedtime', label: 'Bedtime', icon: '🌙', time: '9-11 PM' },
];

const TIME_OPTIONS = [
  { id: '2min', label: '2 min', description: 'Quick micro-moments' },
  { id: '7min', label: '7 min', description: 'Brief but meaningful' },
  { id: '20min', label: '20 min', description: 'Deeper connection' },
];

const BOUNDARY_OPTIONS = [
  { id: 'pg', label: 'PG', description: 'Family friendly' },
  { id: 'romantic', label: 'Romantic', description: 'Includes romantic gestures' },
  { id: 'married', label: 'Married', description: 'Full marital intimacy' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, updateUserLocal } = useAuth();
  
  // Preferences state
  const [faithMode, setFaithMode] = useState(true);
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [anchorTimes, setAnchorTimes] = useState<string[]>(['morning', 'evening']);
  const [timeAvailability, setTimeAvailability] = useState('7min');
  const [boundaries, setBoundaries] = useState('romantic');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Partner pairing
  const [partnerCode, setPartnerCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [pairingMode, setPairingMode] = useState<'join' | 'create' | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load user preferences
    if (user) {
      setFaithMode(user.faithMode ?? true);
      setLoveLanguages(user.loveLanguages || []);
      setAnchorTimes(user.anchorTimes || ['morning', 'evening']);
      setTimeAvailability(user.timeAvailability || '7min');
      setBoundaries(user.boundaries || 'romantic');
    }
  }, [user, isLoading, isAuthenticated, router]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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

  const savePreferences = async () => {
    setSaving(true);
    try {
      await apiPost('/api/user/preferences', {
        faithMode,
        loveLanguages,
        anchorTimes,
        timeAvailability,
        boundaries,
        notificationsEnabled,
      });
      updateUserLocal({ faithMode, loveLanguages, anchorTimes, timeAvailability, boundaries });
      setToast({ show: true, message: 'Preferences saved! ✅', type: 'success' });
    } catch (e: any) {
      // Still update locally
      updateUserLocal({ faithMode, loveLanguages, anchorTimes, timeAvailability, boundaries });
      setToast({ show: true, message: 'Saved locally', type: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const handleFaithModeToggle = async (value: boolean) => {
    setFaithMode(value);
    updateUserLocal({ faithMode: value });
    try {
      await apiPost('/api/user/preferences', { faithMode: value });
      setToast({ show: true, message: value ? 'Faith Mode enabled ✨' : 'Faith Mode disabled', type: 'success' });
    } catch {
      setToast({ show: true, message: 'Saved locally', type: 'success' });
    }
  };

  const handleCreateCouple = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ coupleId: string; pairCode: string }>('/api/couple/create', {});
      setGeneratedCode(res.pairCode);
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Failed to create code', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!partnerCode.trim()) {
      setToast({ show: true, message: 'Please enter a partner code', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiPost<{ coupleId: string }>('/api/couple/join', { pairCode: partnerCode });
      localStorage.setItem('one_couple', JSON.stringify({ coupleId: res.coupleId }));
      updateUserLocal({ coupleId: res.coupleId });
      setToast({ show: true, message: 'Successfully paired! 💑', type: 'success' });
      setPairingMode(null);
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Invalid code', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSubscribe = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ url: string }>('/api/billing/create-checkout-session', { 
        userId: user?.id, 
        email: user?.email 
      });
      window.location.href = res.url;
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Payment setup failed', type: 'error' });
      setSaving(false);
    }
  };

  const handleDonate = async () => {
    setSaving(true);
    try {
      const res = await apiPost<{ url: string }>('/api/billing/create-donation-session', { 
        userId: user?.id, 
        email: user?.email,
        amountCents: 1200 
      });
      window.location.href = res.url;
    } catch (e: any) {
      setToast({ show: true, message: e.message || 'Donation setup failed', type: 'error' });
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="page-with-nav container">
        <div className="loading"><div className="spinner" /></div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="page-with-nav container">
      {/* Toast */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>⚙️ Settings</h2>
          <p className="page-header-subtitle">Manage your preferences</p>
        </div>
      </div>

      {/* Account Section */}
      <Card>
        <div className="flex items-center gap-md">
          <div className="icon-circle icon-lg" style={{ background: 'var(--accent-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', fontSize: '20px' }}>
            {user?.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 4 }}>{user?.name || 'User'}</h4>
            <p className="text-small">{user?.email}</p>
          </div>
          {user?.coupleId ? (
            <div className="connection-status connected">
              <span className="connection-status-dot" />
              Paired
            </div>
          ) : (
            <div className="connection-status pending">
              <span className="connection-status-dot" />
              Single
            </div>
          )}
        </div>
      </Card>

      {/* Faith Mode - Always Visible */}
      <Card highlight>
        <Toggle
          label={faithMode ? '✨ Faith Mode ON' : '✨ Faith Mode OFF'}
          description={faithMode 
            ? 'Scripture and prayer are at the core of your daily anchors' 
            : 'Practical principles without explicit faith content'}
          checked={faithMode}
          onChange={handleFaithModeToggle}
        />
      </Card>

      {/* Love Languages - Collapsible */}
      <Card>
        <div 
          className="settings-header"
          onClick={() => toggleSection('love')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSection === 'love'}
        >
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '20px' }}>💕</span>
            <div>
              <h4 style={{ marginBottom: 2 }}>Love Languages</h4>
              <p className="text-small">
                {loveLanguages.length > 0 
                  ? loveLanguages.map(l => LOVE_LANGUAGES.find(ll => ll.id === l)?.icon).join(' ')
                  : 'Not set'}
              </p>
            </div>
          </div>
          <span className="settings-expand-icon">{expandedSection === 'love' ? '▲' : '▼'}</span>
        </div>
        
        <div className={`settings-content ${expandedSection === 'love' ? 'expanded' : ''}`} style={{ maxHeight: expandedSection === 'love' ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
          <div style={{ paddingTop: '16px' }}>
            <p className="text-small mb-md">Select your top 1-2 love languages:</p>
            <div className="checkbox-group">
              {LOVE_LANGUAGES.map(lang => (
                <div
                  key={lang.id}
                  className={`checkbox-item ${loveLanguages.includes(lang.id) ? 'selected' : ''}`}
                  onClick={() => toggleLoveLanguage(lang.id)}
                >
                  <span className={`love-icon love-icon-${lang.id}`}>{lang.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{lang.label}</div>
                    <p className="text-small">{lang.description}</p>
                  </div>
                  {loveLanguages.includes(lang.id) && <span className="badge badge-sm">✓</span>}
                </div>
              ))}
            </div>
            <Button variant="primary" block className="mt-md" onClick={savePreferences} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Anchor Times - Collapsible */}
      <Card>
        <div 
          className="settings-header"
          onClick={() => toggleSection('anchor')}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '20px' }}>⏰</span>
            <div>
              <h4 style={{ marginBottom: 2 }}>Anchor Times</h4>
              <p className="text-small">
                {anchorTimes.length > 0 
                  ? anchorTimes.map(t => ANCHOR_TIMES.find(at => at.id === t)?.icon).join(' ')
                  : 'Not set'}
              </p>
            </div>
          </div>
          <span className="settings-expand-icon">{expandedSection === 'anchor' ? '▲' : '▼'}</span>
        </div>
        
        <div className={`settings-content ${expandedSection === 'anchor' ? 'expanded' : ''}`} style={{ maxHeight: expandedSection === 'anchor' ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
          <div style={{ paddingTop: '16px' }}>
            <p className="text-small mb-md">When should we nudge you to connect?</p>
            <div className="checkbox-group">
              {ANCHOR_TIMES.map(time => (
                <div
                  key={time.id}
                  className={`checkbox-item ${anchorTimes.includes(time.id) ? 'selected' : ''}`}
                  onClick={() => toggleAnchorTime(time.id)}
                >
                  <span style={{ fontSize: '20px' }}>{time.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{time.label}</div>
                    <p className="text-small">{time.time}</p>
                  </div>
                  {anchorTimes.includes(time.id) && <span className="badge badge-sm">✓</span>}
                </div>
              ))}
            </div>
            <Button variant="primary" block className="mt-md" onClick={savePreferences} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Preferences - Collapsible */}
      <Card>
        <div 
          className="settings-header"
          onClick={() => toggleSection('prefs')}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '20px' }}>📝</span>
            <div>
              <h4 style={{ marginBottom: 2 }}>Content Preferences</h4>
              <p className="text-small">
                {TIME_OPTIONS.find(t => t.id === timeAvailability)?.label} • {BOUNDARY_OPTIONS.find(b => b.id === boundaries)?.label}
              </p>
            </div>
          </div>
          <span className="settings-expand-icon">{expandedSection === 'prefs' ? '▲' : '▼'}</span>
        </div>
        
        <div style={{ maxHeight: expandedSection === 'prefs' ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
          <div style={{ paddingTop: '16px' }}>
            <div className="mb-lg">
              <p className="filter-label">Time Available</p>
              <div className="tabs">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={`tab ${timeAvailability === opt.id ? 'active' : ''}`}
                    onClick={() => setTimeAvailability(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-md">
              <p className="filter-label">Content Boundaries</p>
              <div className="tabs">
                {BOUNDARY_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={`tab ${boundaries === opt.id ? 'active' : ''}`}
                    onClick={() => setBoundaries(opt.id)}
                    title={opt.description}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" block onClick={savePreferences} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Partner Connection */}
      <Card>
        <div className="flex items-center gap-sm mb-md">
          <span style={{ fontSize: '20px' }}>👫</span>
          <h4>Partner Connection</h4>
        </div>
        
        {user?.coupleId ? (
          <div className="success-box">
            <span>✅</span>
            <span>You're paired with your partner! Daily anchors are synced.</span>
          </div>
        ) : !pairingMode ? (
          <div className="flex flex-col gap-sm">
            <Button variant="outline" block onClick={() => setPairingMode('join')}>
              🔑 I have a partner code
            </Button>
            <Button variant="outline" block onClick={() => { setPairingMode('create'); handleCreateCouple(); }}>
              ✨ Generate new code
            </Button>
          </div>
        ) : pairingMode === 'join' ? (
          <div>
            <p className="text-small mb-sm">Enter the code your partner shared:</p>
            <Input
              placeholder="Enter code"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              maxLength={10}
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 600 }}
            />
            <div className="flex gap-sm mt-md">
              <Button variant="ghost" onClick={() => setPairingMode(null)}>Cancel</Button>
              <Button variant="primary" block loading={saving} onClick={handleJoinCouple}>Join Partner</Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {saving ? (
              <div className="loading"><div className="spinner" /></div>
            ) : generatedCode ? (
              <>
                <p className="text-small mb-sm">Share this code with your partner:</p>
                <div className="partner-code">{generatedCode}</div>
                <button 
                  className={`copy-btn ${codeCopied ? 'copied' : ''}`} 
                  onClick={copyCode}
                  style={{ margin: '0 auto' }}
                >
                  {codeCopied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </>
            ) : null}
            <Button variant="ghost" block className="mt-md" onClick={() => setPairingMode(null)}>Done</Button>
          </div>
        )}
      </Card>

      {/* Notifications */}
      <Card>
        <Toggle
          label="🔔 Push Notifications"
          description="Receive daily anchor reminders at your selected times"
          checked={notificationsEnabled}
          onChange={(val) => { setNotificationsEnabled(val); savePreferences(); }}
        />
      </Card>

      {/* Subscription */}
      <Card>
        <div className="flex items-center gap-sm mb-md">
          <span style={{ fontSize: '20px' }}>💛</span>
          <h4>Support One — Inseparable</h4>
        </div>
        <p className="text-small mb-md">Help us strengthen marriages and unlock all premium features.</p>
        <div className="flex flex-col gap-sm">
          <Button variant="gold" block onClick={handleSubscribe} loading={saving}>
            Start Membership — $12/mo
          </Button>
          <Button variant="outline" block onClick={handleDonate} loading={saving}>
            🙏 One-Time Gift ($12)
          </Button>
        </div>
      </Card>

      {/* Quick Links */}
      <Card>
        <div className="flex flex-col gap-sm">
          <Button variant="ghost" block onClick={() => router.push('/pricing')} style={{ justifyContent: 'space-between' }}>
            <span>View Pricing Plans</span>
            <span>→</span>
          </Button>
          <div className="divider" />
          <Button variant="ghost" block onClick={() => router.push('/support')} style={{ justifyContent: 'space-between' }}>
            <span>Help & Support</span>
            <span>→</span>
          </Button>
        </div>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        block 
        onClick={handleLogout} 
        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
        className="mb-lg"
      >
        Log Out
      </Button>

      <BottomNav />
    </main>
  );
}
