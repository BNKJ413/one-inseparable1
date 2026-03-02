"use client";

import { useRouter } from 'next/navigation';
import Card from '../components/Card';
import Button from '../components/Button';

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '$0',
    period: 'forever',
    features: [
      'Daily anchors (limited)',
      'Basic love language matching',
      'Scripture Vault access',
      'Connect screen basics',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'member',
    name: 'Inseparable',
    price: '$12',
    period: '/month',
    features: [
      'Unlimited daily anchors',
      'Full love language engine',
      'All Scripture Vault features',
      'Tension repair guides',
      'Mind battle resources',
      'Streak rewards & stickers',
      'Priority support',
    ],
    cta: 'Start Membership',
    highlighted: true,
  },
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="container" style={{ minHeight: '100vh', paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="text-center mb-lg">
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Simple Pricing</h1>
        <p className="text-muted">Invest in your marriage</p>
      </div>

      {PLANS.map(plan => (
        <Card key={plan.id} highlight={plan.highlighted}>
          {plan.highlighted && (
            <div className="text-center mb-sm">
              <span className="badge">⭐ Most Popular</span>
            </div>
          )}
          <div className="text-center mb-md">
            <h3>{plan.name}</h3>
            <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '8px' }}>
              {plan.price}
              <span className="text-small text-muted">{plan.period}</span>
            </div>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-sm" style={{ padding: '8px 0' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            variant={plan.highlighted ? 'gold' : 'outline'} 
            block 
            size="lg"
            onClick={() => router.push(plan.id === 'free' ? '/register' : '/settings')}
          >
            {plan.cta}
          </Button>
        </Card>
      ))}

      <Card>
        <div className="text-center">
          <h4 className="mb-sm">🙏 Support the Mission</h4>
          <p className="text-small mb-md">
            Help us make relationship tools accessible to everyone. 
            Your donation supports couples who can't afford premium features.
          </p>
          <Button variant="outline" block onClick={() => router.push('/support')}>
            Make a Donation
          </Button>
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
