"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';

const BATTLE_TYPES = [
  { id: 'lust', label: 'Lust / Temptation', icon: '👁️', scripture: 'Job 31:1 - I made a covenant with my eyes not to look lustfully.' },
  { id: 'resentment', label: 'Resentment', icon: '😠', scripture: 'Ephesians 4:31 - Get rid of all bitterness, rage and anger.' },
  { id: 'comparison', label: 'Comparison', icon: '👥', scripture: 'Galatians 6:4 - Each one should test their own actions.' },
  { id: 'fear', label: 'Fear / Anxiety', icon: '😨', scripture: 'Isaiah 41:10 - Do not fear, for I am with you.' },
  { id: 'anger', label: 'Anger', icon: '🔥', scripture: 'James 1:19-20 - Be slow to become angry.' },
  { id: 'pride', label: 'Pride', icon: '👑', scripture: 'Proverbs 11:2 - With humility comes wisdom.' },
  { id: 'unforgiveness', label: 'Unforgiveness', icon: '⛓️', scripture: 'Colossians 3:13 - Forgive as the Lord forgave you.' },
];

const PRACTICAL_STEPS: Record<string, string[]> = {
  lust: [
    'Turn your eyes away immediately - don\'t linger',
    'Speak truth: "This isn\'t who I want to be"',
    'Think of your spouse with gratitude',
    'Call or text your spouse right now',
    'Remove yourself from the situation if needed',
  ],
  resentment: [
    'Name the specific hurt without blaming',
    'Ask: "What do I need to let go of?"',
    'Choose to release instead of rehearse',
    'Pray for your spouse\'s blessing',
    'Plan one kind act toward them today',
  ],
  comparison: [
    'Unfollow or mute triggering accounts',
    'List 3 things you love about YOUR marriage',
    'Remember: You see others\' highlight reel',
    'Celebrate what\'s unique about your story',
    'Talk to your spouse about a shared dream',
  ],
  fear: [
    'Name the fear specifically',
    'Ask: "Is this based on fact or feeling?"',
    'Share your worry with your spouse',
    'Take one small action against the fear',
    'Remember: You\'re not alone in this',
  ],
  anger: [
    'Step away before responding',
    'Take 5 slow, deep breaths',
    'Ask: "What\'s underneath this anger?"',
    'Choose to respond, not react',
    'Wait until calm to discuss the issue',
  ],
  pride: [
    'Ask: "Am I seeking to understand or to win?"',
    'Admit one thing you got wrong',
    'Ask your spouse for their perspective',
    'Say "I\'m sorry" without "but..."',
    'Choose humility as strength, not weakness',
  ],
  unforgiveness: [
    'Acknowledge the hurt is real',
    'Forgiveness is a choice, not a feeling',
    'Release the debt - stop collecting interest',
    'Pray for grace to let go',
    'Focus on your own healing, not revenge',
  ],
};

export default function MindBattlePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedBattle, setSelectedBattle] = useState<string | null>(null);
  const [showPrayer, setShowPrayer] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const battle = BATTLE_TYPES.find(b => b.id === selectedBattle);
  const steps = selectedBattle ? PRACTICAL_STEPS[selectedBattle] : [];

  if (isLoading) {
    return (
      <main className="page-with-nav container">
        <div className="loading"><div className="spinner" /></div>
        <BottomNav />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="page-with-nav container">
      <div className="mb-md">
        <h2>🧠 Mind Battle</h2>
        <p className="text-small">Winning the war within</p>
      </div>

      {!selectedBattle ? (
        <>
          <Card>
            <h4 className="mb-md">What are you struggling with?</h4>
            <div className="flex flex-col gap-sm">
              {BATTLE_TYPES.map(type => (
                <div
                  key={type.id}
                  className="checkbox-item"
                  onClick={() => setSelectedBattle(type.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '24px' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{type.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <p className="text-small text-center text-muted">
            This is completely private. Taking this step shows courage.
          </p>
        </>
      ) : (
        <>
          <Button variant="ghost" className="mb-md" onClick={() => setSelectedBattle(null)}>
            ← Back to battles
          </Button>

          <Card highlight>
            <div className="flex items-center gap-md mb-md">
              <span style={{ fontSize: '36px' }}>{battle?.icon}</span>
              <div>
                <h3>{battle?.label}</h3>
                <p className="text-small">You're not alone in this</p>
              </div>
            </div>
          </Card>

          {user?.faithMode !== false && (
            <Card scripture>
              <p className="text-small" style={{ fontWeight: 500, color: 'var(--accent-gold-dark)' }}>
                📖 Scripture for this battle:
              </p>
              <p className="scripture-text" style={{ marginTop: '8px' }}>
                "{battle?.scripture}"
              </p>
            </Card>
          )}

          <Card>
            <h4 className="mb-md">✅ Practical Steps</h4>
            <div className="flex flex-col gap-sm">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-sm items-center" style={{ padding: '8px 0' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-gold-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span className="text-small">{step}</span>
                </div>
              ))}
            </div>
          </Card>

          {user?.faithMode !== false && (
            <Card>
              <Button 
                variant="outline" 
                block 
                onClick={() => setShowPrayer(!showPrayer)}
              >
                🙏 {showPrayer ? 'Hide Prayer' : 'Pray Now'}
              </Button>
              
              {showPrayer && (
                <div className="mt-md" style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ fontStyle: 'italic', lineHeight: 1.7 }}>
                    "Lord, I confess this struggle to You. I don't want this to have power over me or hurt my marriage.
                    Give me strength to turn away and grace to walk in freedom.
                    Guard my mind and help me think on things that are true, noble, and pure.
                    Thank You that Your power is made perfect in my weakness. Amen."
                  </p>
                  <p className="text-small text-center mt-sm">- 2 Corinthians 12:9, Philippians 4:8</p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <h4 className="mb-md">More Resources</h4>
            <div className="flex flex-col gap-sm">
              <Button variant="outline" block onClick={() => router.push('/scripture')}>
                📖 Scripture Vault
              </Button>
              <Button variant="outline" block onClick={() => router.push('/connect')}>
                💝 Connect with Spouse
              </Button>
              <Button variant="ghost" block onClick={() => router.push('/today')}>
                Back to Today
              </Button>
            </div>
          </Card>
        </>
      )}

      <BottomNav />
    </main>
  );
}
