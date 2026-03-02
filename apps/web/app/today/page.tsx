"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { anchorsApi } from '../lib/api';

export default function TodayPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [anchor, setAnchor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const onboardingComplete = localStorage.getItem('one_onboarding_complete');
    if (!isLoading && isAuthenticated && !onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    // Load streak from localStorage
    const savedStreak = localStorage.getItem('one_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }

    const savedPoints = localStorage.getItem('one_points');
    if (savedPoints) {
      setPoints(parseInt(savedPoints, 10));
    }

    loadAnchor();
  }, [isLoading, isAuthenticated, router, user]);

  const loadAnchor = async () => {
    const coupleData = localStorage.getItem('one_couple');
    const couple = coupleData ? JSON.parse(coupleData) : null;
    const coupleId = couple?.coupleId || user?.coupleId;

    if (!coupleId) {
      setLoading(false);
      return;
    }

    try {
      const { anchor: anchorData } = await anchorsApi.today(coupleId);
      setAnchor(anchorData);
    } catch (e: any) {
      // Use demo anchor if API fails
      setAnchor({
        id: 'demo',
        principleText: user?.faithMode !== false 
          ? 'Be kind and compassionate to one another - Ephesians 4:32'
          : 'Choose patience over reaction today',
        scripture: user?.faithMode !== false ? {
          reference: 'Ephesians 4:32',
          text: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',
          marriageMeaning: 'In marriage, we daily choose kindness over criticism.',
        } : null,
        actionIdea: {
          title: 'Three Words of Encouragement',
          description: 'Tell your spouse three specific things you appreciate about them today.',
        },
        status: 'PENDING',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const coupleData = localStorage.getItem('one_couple');
    const couple = coupleData ? JSON.parse(coupleData) : null;
    const coupleId = couple?.coupleId || user?.coupleId;

    if (!coupleId || !anchor?.id || !user?.id) {
      setToast({ show: true, message: 'Unable to complete anchor', type: 'error' });
      return;
    }

    setCompleting(true);

    try {
      const result = await anchorsApi.complete(coupleId, user.id, anchor.id);
      const newStreak = result.streak;
      const newPoints = points + result.pointsAwarded;
      setStreak(newStreak);
      setPoints(newPoints);
      localStorage.setItem('one_streak', String(newStreak));
      localStorage.setItem('one_points', String(newPoints));
      setToast({ show: true, message: `🎉 +${result.pointsAwarded} points! Streak: ${newStreak} days`, type: 'success' });
      setAnchor({ ...anchor, status: 'DONE' });
    } catch (e: any) {
      // Demo mode fallback
      const newStreak = streak + 1;
      const newPoints = points + 10;
      setStreak(newStreak);
      setPoints(newPoints);
      localStorage.setItem('one_streak', String(newStreak));
      localStorage.setItem('one_points', String(newPoints));
      setToast({ show: true, message: `🎉 +10 points! Streak: ${newStreak} days`, type: 'success' });
      setAnchor({ ...anchor, status: 'DONE' });
    } finally {
      setCompleting(false);
    }
  };

  const getCoupleId = () => {
    if (user?.coupleId) return user.coupleId;
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('one_couple') || '{}')?.coupleId || null;
      } catch {
        return null;
      }
    }
    return null;
  };
  const coupleId = getCoupleId();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading || loading) {
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

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="fade-in">☀️ {getGreeting()}</h2>
          <p className="page-header-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-sm">
          {streak > 0 && (
            <div className="streak-display">
              <span className="streak-display-icon">🔥</span>
              {streak}
            </div>
          )}
          {points > 0 && (
            <div className="points-badge">⭐ {points}</div>
          )}
        </div>
      </div>

      {/* Not Paired */}
      {!coupleId ? (
        <Card highlight className="slide-up">
          <div className="text-center">
            <div className="empty-state-icon" style={{ fontSize: '64px', marginBottom: '16px' }}>👫</div>
            <h3>Pair with Your Partner</h3>
            <p className="text-muted mt-sm mb-lg">
              Connect your accounts to unlock daily anchors and shared activities.
            </p>
            <Button variant="gold" block onClick={() => router.push('/settings')}>
              Set Up Pairing
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Today's Anchor Card */}
          <Card highlight className="slide-up">
            <div className="flex justify-between items-center mb-md">
              <span className="text-small font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Today's Anchor
              </span>
              {user?.faithMode !== false && (
                <span className="mode-indicator mode-faith">✨ Faith</span>
              )}
            </div>

            {/* Scripture Section */}
            {anchor?.scripture ? (
              <div className="mb-md">
                <h3 className="scripture-ref" style={{ marginBottom: '8px', fontSize: '18px' }}>
                  {anchor.scripture.reference}
                </h3>
                {anchor.scripture.text && (
                  <div className="scripture-verse">
                    {anchor.scripture.text}
                  </div>
                )}
                {anchor.scripture.marriageMeaning && (
                  <p className="text-small" style={{ color: 'var(--fg-secondary)', marginTop: '8px' }}>
                    💑 {anchor.scripture.marriageMeaning}
                  </p>
                )}
              </div>
            ) : (
              <h3 style={{ marginBottom: '16px', lineHeight: 1.4 }}>
                {anchor?.principleText || 'Connect with your spouse today'}
              </h3>
            )}

            {/* Action Idea */}
            {anchor?.actionIdea && (
              <div className="action-prompt">
                <p className="action-prompt-title">
                  🎯 {anchor.actionIdea.title}
                </p>
                <p className="action-prompt-text">{anchor.actionIdea.description}</p>
              </div>
            )}

            {/* Complete Button */}
            <Button
              variant={anchor?.status === 'DONE' ? 'gold' : 'primary'}
              block
              size="lg"
              onClick={handleComplete}
              disabled={anchor?.status === 'DONE'}
              loading={completing}
              className="mt-md"
            >
              {anchor?.status === 'DONE' ? (
                <>
                  <span className="success-checkmark" style={{ width: 24, height: 24, fontSize: 14, marginRight: 8 }}>✓</span>
                  Completed Today!
                </>
              ) : (
                'Mark as Done'
              )}
            </Button>
          </Card>

          {/* Quick Actions */}
          <Card className="slide-up" style={{ animationDelay: '100ms' }}>
            <h4 className="mb-md">Quick Actions</h4>
            <div className="grid grid-2 gap-sm">
              <Button variant="outline" onClick={() => router.push('/connect')}>
                💝 Connect Ideas
              </Button>
              <Button variant="outline" onClick={() => router.push('/scripture')}>
                📖 Scripture
              </Button>
              <Button variant="outline" onClick={() => router.push('/tension')}>
                💬 Had Tension
              </Button>
              <Button variant="outline" onClick={() => router.push('/mind')}>
                🧠 Mind Battle
              </Button>
            </div>
          </Card>

          {/* Streak Progress */}
          <Card className="slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-md">
              <h4>Connection Streak</h4>
              <div className="streak-display">
                <span className="streak-display-icon">🔥</span>
                {streak || 0} days
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, ((streak || 0) / 7) * 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-center mt-sm">
              <p className="text-small">
                {streak >= 7 
                  ? '🌟 Amazing! Keep the momentum going.'
                  : `${7 - (streak || 0)} more days to your first reward!`}
              </p>
              <p className="text-small text-accent">{streak || 0}/7</p>
            </div>
            
            {/* Streak Milestones */}
            {streak >= 7 && (
              <div className="success-box mt-md">
                <span>🏆</span>
                <span>You've unlocked the 7-day streak badge!</span>
              </div>
            )}
          </Card>

          {/* Daily Tip */}
          <Card className="slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-start gap-sm">
              <span style={{ fontSize: '24px' }}>💡</span>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Daily Tip</h4>
                <p className="text-small">
                  Small, consistent moments of connection build stronger bonds than occasional grand gestures. 
                  {user?.faithMode !== false && " Let God's Word guide your interactions today."}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <BottomNav />
    </main>
  );
}
