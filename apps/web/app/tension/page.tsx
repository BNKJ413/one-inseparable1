"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';

const TENSION_TYPES = [
  { id: 'miscommunication', label: 'Miscommunication', icon: '💬', description: 'We didn\'t understand each other' },
  { id: 'hurt', label: 'Hurt Feelings', icon: '💔', description: 'Something was said that hurt' },
  { id: 'anger', label: 'Anger', icon: '😡', description: 'There was frustration or anger' },
  { id: 'withdrawal', label: 'Withdrawal', icon: '😶', description: 'One of us pulled away' },
  { id: 'ongoing', label: 'Ongoing Issue', icon: '🔁', description: 'This keeps coming up' },
];

const REPAIR_STEPS = [
  { step: 1, title: 'Pause & Breathe', description: 'Take 3 deep breaths before continuing. Allow your nervous system to calm.', icon: '🧘' },
  { step: 2, title: 'Acknowledge', description: 'Say: "I can see this affected you. I\'m sorry for my part in that."', icon: '🤝' },
  { step: 3, title: 'Listen First', description: 'Let your spouse share without interrupting. Seek to understand, not to respond.', icon: '👂' },
  { step: 4, title: 'Own Your Part', description: 'Instead of defending, own what you could have done differently.', icon: '🫂' },
  { step: 5, title: 'Reconnect', description: 'Ask: "What would help you feel connected again right now?"', icon: '💛' },
];

export default function TensionPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPrayer, setShowPrayer] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep < REPAIR_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setCurrentStep(0);
    setShowPrayer(false);
  };

  return (
    <main className="page-with-nav container">
      <div className="mb-md">
        <h2>💬 We Had Tension</h2>
        <p className="text-small">Let's work through this together</p>
      </div>

      {!selectedType ? (
        <>
          <Card>
            <h4 className="mb-md">What happened?</h4>
            <div className="flex flex-col gap-sm">
              {TENSION_TYPES.map(type => (
                <div
                  key={type.id}
                  className="checkbox-item"
                  onClick={() => handleSelectType(type.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '24px' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{type.label}</div>
                    <p className="text-small">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <p className="text-small text-center text-muted">
            This is private. Your spouse won't see what you select unless you share.
          </p>
        </>
      ) : currentStep <= REPAIR_STEPS.length ? (
        <>
          {/* Progress */}
          <div className="mb-md">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / REPAIR_STEPS.length) * 100}%` }} 
              />
            </div>
            <p className="text-small text-center mt-sm">Step {currentStep} of {REPAIR_STEPS.length}</p>
          </div>

          {currentStep > 0 && currentStep <= REPAIR_STEPS.length && (
            <Card highlight>
              <div className="text-center mb-md">
                <span style={{ fontSize: '48px' }}>{REPAIR_STEPS[currentStep - 1].icon}</span>
              </div>
              <h3 className="text-center mb-sm">{REPAIR_STEPS[currentStep - 1].title}</h3>
              <p className="text-center mb-lg">{REPAIR_STEPS[currentStep - 1].description}</p>
              
              <Button variant="primary" block onClick={handleNextStep}>
                {currentStep < REPAIR_STEPS.length ? 'Next Step →' : 'Complete ✓'}
              </Button>
            </Card>
          )}

          <Button variant="ghost" block onClick={handleReset}>
            Start Over
          </Button>
        </>
      ) : (
        <>
          <Card highlight>
            <div className="text-center">
              <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>✅</span>
              <h3>Well Done</h3>
              <p className="text-muted mt-sm mb-lg">
                Taking steps toward repair shows strength and love. You're investing in your marriage.
              </p>
            </div>
          </Card>

          {user?.faithMode !== false && (
            <Card>
              <Button 
                variant="outline" 
                block 
                onClick={() => setShowPrayer(!showPrayer)}
              >
                🙏 {showPrayer ? 'Hide Prayer' : 'Pray Together'}
              </Button>
              
              {showPrayer && (
                <div className="mt-md" style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ fontStyle: 'italic', lineHeight: 1.7 }}>
                    "Lord, thank You for this marriage. We confess our shortcomings and ask for Your grace.
                    Help us to be quick to listen, slow to speak, and slow to become angry.
                    Knit our hearts together and let peace rule in our home. Amen."
                  </p>
                  <p className="text-small text-center mt-sm">- James 1:19, Colossians 3:15</p>
                </div>
              )}
            </Card>
          )}

          <Card>
            <h4 className="mb-md">What's Next?</h4>
            <div className="flex flex-col gap-sm">
              <Button variant="outline" block onClick={() => router.push('/connect')}>
                💝 Find a Reconnection Activity
              </Button>
              <Button variant="outline" block onClick={() => router.push('/scripture')}>
                📖 Read Scripture Together
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
