"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingCard from '../components/LoadingCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

interface ActionIdea {
  id: string;
  title: string;
  description: string;
  timeRequired: string;
  loveLanguage: string;
  mode: 'faith' | 'emotional' | 'physical' | 'actionable';
  completed?: boolean;
}

const LOVE_LANGUAGE_CONFIG: Record<string, { label: string; icon: string; bgClass: string }> = {
  words: { label: 'Words', icon: '💬', bgClass: 'love-icon-words' },
  time: { label: 'Time', icon: '⏰', bgClass: 'love-icon-time' },
  touch: { label: 'Touch', icon: '🤝', bgClass: 'love-icon-touch' },
  service: { label: 'Service', icon: '🛠️', bgClass: 'love-icon-service' },
  gifts: { label: 'Gifts', icon: '🎁', bgClass: 'love-icon-gifts' },
};

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  faith: { label: '✨ Faith', className: 'mode-faith' },
  emotional: { label: '💛 Emotional', className: 'mode-emotional' },
  physical: { label: '💕 Physical', className: 'mode-physical' },
  actionable: { label: '✅ Quick', className: 'mode-actionable' },
};

// Comprehensive action ideas library
const ACTION_IDEAS: ActionIdea[] = [
  // Words of Affirmation
  { id: '1', title: 'Three things I admire', description: 'Tell your spouse three specific things you admire about them today', timeRequired: '2min', loveLanguage: 'words', mode: 'emotional' },
  { id: '6', title: 'Pray together', description: 'Spend 5 minutes praying for each other out loud', timeRequired: '7min', loveLanguage: 'words', mode: 'faith' },
  { id: '8', title: 'Scripture blessing', description: 'Read Ephesians 4:32 and discuss how to apply it today', timeRequired: '7min', loveLanguage: 'words', mode: 'faith' },
  { id: '11', title: 'Gratitude text', description: "Send a text expressing one thing you're grateful for about them", timeRequired: '2min', loveLanguage: 'words', mode: 'emotional' },
  { id: '12', title: 'Morning blessing', description: 'Bless your spouse before they start their day with encouraging words', timeRequired: '2min', loveLanguage: 'words', mode: 'faith' },
  { id: '13', title: 'Compliment their character', description: 'Tell your spouse something you admire about who they are, not what they do', timeRequired: '2min', loveLanguage: 'words', mode: 'emotional' },
  { id: '14', title: 'Love letter', description: 'Write a short love letter sharing your favorite memory together', timeRequired: '7min', loveLanguage: 'words', mode: 'emotional' },
  { id: '15', title: 'Pray over their worry', description: "Ask what's stressing them and pray specifically for that situation", timeRequired: '7min', loveLanguage: 'words', mode: 'faith' },
  
  // Quality Time
  { id: '2', title: 'Phone-free dinner', description: 'Have dinner together with no phones at the table', timeRequired: '20min', loveLanguage: 'time', mode: 'actionable' },
  { id: '7', title: 'Walk and talk', description: 'Take a 15-minute walk together, phones away', timeRequired: '20min', loveLanguage: 'time', mode: 'actionable' },
  { id: '10', title: 'Plan a micro-date', description: 'Schedule a 30-minute date for this week', timeRequired: '2min', loveLanguage: 'time', mode: 'actionable' },
  { id: '16', title: 'Morning coffee together', description: 'Wake up 10 minutes early to have coffee or tea together', timeRequired: '7min', loveLanguage: 'time', mode: 'actionable' },
  { id: '17', title: 'Dream together', description: 'Share one dream or goal you have for your future together', timeRequired: '7min', loveLanguage: 'time', mode: 'emotional' },
  { id: '18', title: 'Devotional time', description: 'Read a short devotional together and discuss what stands out', timeRequired: '7min', loveLanguage: 'time', mode: 'faith' },
  { id: '19', title: 'Sunset moment', description: 'Watch the sunset together, even if just from a window', timeRequired: '7min', loveLanguage: 'time', mode: 'emotional' },
  { id: '20', title: 'Cook together', description: 'Prepare a simple meal together as a team', timeRequired: '20min', loveLanguage: 'time', mode: 'actionable' },
  
  // Physical Touch
  { id: '3', title: '10-second hug', description: 'Give a long, meaningful hug when you see each other', timeRequired: '2min', loveLanguage: 'touch', mode: 'physical' },
  { id: '9', title: 'Hand massage', description: 'Give your spouse a gentle 5-minute hand massage', timeRequired: '7min', loveLanguage: 'touch', mode: 'physical' },
  { id: '21', title: 'Hold hands', description: 'Hold hands while watching TV, walking, or riding in the car', timeRequired: '2min', loveLanguage: 'touch', mode: 'physical' },
  { id: '22', title: 'Back rub', description: 'Offer a 5-minute shoulder or back rub while they relax', timeRequired: '7min', loveLanguage: 'touch', mode: 'physical' },
  { id: '23', title: 'Foot rub', description: 'Give your spouse a relaxing foot massage after a long day', timeRequired: '7min', loveLanguage: 'touch', mode: 'physical' },
  { id: '24', title: 'Kiss hello & goodbye', description: 'Make it a point to kiss meaningfully when you part and reunite', timeRequired: '2min', loveLanguage: 'touch', mode: 'physical' },
  { id: '25', title: 'Cuddle time', description: 'Spend 15 minutes cuddling on the couch, no screens', timeRequired: '20min', loveLanguage: 'touch', mode: 'physical' },
  
  // Acts of Service
  { id: '4', title: 'Take one task', description: 'Do one chore your spouse usually handles without being asked', timeRequired: '7min', loveLanguage: 'service', mode: 'actionable' },
  { id: '26', title: 'Make their coffee', description: 'Prepare their morning drink exactly how they like it', timeRequired: '2min', loveLanguage: 'service', mode: 'actionable' },
  { id: '27', title: 'Fill their gas tank', description: "Fill up their car so they don't have to worry about it", timeRequired: '7min', loveLanguage: 'service', mode: 'actionable' },
  { id: '28', title: 'Prepare their lunch', description: 'Pack a lunch for them with a little note inside', timeRequired: '7min', loveLanguage: 'service', mode: 'actionable' },
  { id: '29', title: 'Handle bedtime', description: "Take over the kids' bedtime routine so they can rest", timeRequired: '20min', loveLanguage: 'service', mode: 'actionable' },
  { id: '30', title: 'Run their errand', description: "Offer to do one errand they've been putting off", timeRequired: '20min', loveLanguage: 'service', mode: 'actionable' },
  { id: '31', title: 'Set up their favorite show', description: 'Have their favorite show queued up and snacks ready', timeRequired: '7min', loveLanguage: 'service', mode: 'actionable' },
  
  // Receiving Gifts
  { id: '5', title: 'Surprise note', description: "Leave a loving note somewhere they'll find it", timeRequired: '2min', loveLanguage: 'gifts', mode: 'emotional' },
  { id: '32', title: 'Their favorite treat', description: 'Surprise them with their favorite snack or drink', timeRequired: '7min', loveLanguage: 'gifts', mode: 'actionable' },
  { id: '33', title: 'Flower surprise', description: 'Pick a flower or buy a small bouquet just because', timeRequired: '7min', loveLanguage: 'gifts', mode: 'emotional' },
  { id: '34', title: 'Memory scrapbook page', description: 'Create a single page with photos and notes from a favorite memory', timeRequired: '20min', loveLanguage: 'gifts', mode: 'emotional' },
  { id: '35', title: 'Playlist gift', description: 'Create a short playlist of songs that remind you of them', timeRequired: '7min', loveLanguage: 'gifts', mode: 'emotional' },
  { id: '36', title: 'Book or article', description: "Share a book, article, or video you think they'd enjoy", timeRequired: '2min', loveLanguage: 'gifts', mode: 'actionable' },
  { id: '37', title: 'Meaningful verse', description: 'Write out a Bible verse on a card that speaks to your marriage', timeRequired: '7min', loveLanguage: 'gifts', mode: 'faith' },
];

type FilterKey = 'all' | 'words' | 'time' | 'touch' | 'service' | 'gifts';
type TimeFilter = 'all' | '2min' | '7min' | '20min';

export default function ConnectPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [actions, setActions] = useState<ActionIdea[]>([]);
  const [languageFilter, setLanguageFilter] = useState<FilterKey>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showFaithOnly, setShowFaithOnly] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Load completed actions from localStorage
    const saved = localStorage.getItem('one_completed_actions');
    if (saved) {
      setCompletedIds(new Set(JSON.parse(saved)));
    }

    // Filter actions based on user preferences
    let filtered = [...ACTION_IDEAS];
    
    // Hide faith mode actions if user has it off
    if (user?.faithMode === false) {
      filtered = filtered.filter(a => a.mode !== 'faith');
    }

    // Sort by user's love languages first
    if (user?.loveLanguages && user.loveLanguages.length > 0) {
      filtered.sort((a, b) => {
        const aMatch = user.loveLanguages!.includes(a.loveLanguage) ? 0 : 1;
        const bMatch = user.loveLanguages!.includes(b.loveLanguage) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    setActions(filtered);
  }, [user, isLoading, isAuthenticated, router]);

  const handleMarkDone = (action: ActionIdea) => {
    const newCompleted = new Set(completedIds);
    const wasCompleted = newCompleted.has(action.id);
    
    if (wasCompleted) {
      newCompleted.delete(action.id);
    } else {
      newCompleted.add(action.id);
      setToast({ show: true, message: `✨ "${action.title}" completed! +10 points`, type: 'success' });
    }
    
    setCompletedIds(newCompleted);
    localStorage.setItem('one_completed_actions', JSON.stringify([...newCompleted]));
  };

  const filteredActions = actions.filter(action => {
    if (languageFilter !== 'all' && action.loveLanguage !== languageFilter) return false;
    if (timeFilter !== 'all' && action.timeRequired !== timeFilter) return false;
    if (showFaithOnly && action.mode !== 'faith') return false;
    return true;
  });

  const completedCount = filteredActions.filter(a => completedIds.has(a.id)).length;

  if (isLoading) {
    return (
      <main className="page-with-nav container">
        <div className="mb-md">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
        <LoadingCard count={3} />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="page-with-nav container">
      {/* Toast Notification */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>💝 Connect</h2>
          <p className="page-header-subtitle">Choose an action that fits your moment</p>
        </div>
        {completedCount > 0 && (
          <div className="points-badge">⭐ {completedCount * 10} pts</div>
        )}
      </div>

      {/* Love Language Filter */}
      <div className="filter-section">
        <p className="filter-label">Love Language</p>
        <div className="filter-container scroll-x">
          <div className="filter-pills">
            <button
              className={`filter-pill ${languageFilter === 'all' ? 'active' : ''}`}
              onClick={() => setLanguageFilter('all')}
            >
              All
            </button>
            {Object.entries(LOVE_LANGUAGE_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`filter-pill ${languageFilter === key ? 'active' : ''}`}
                onClick={() => setLanguageFilter(key as FilterKey)}
              >
                <span className={`love-icon ${config.bgClass}`}>{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time & Mode Filters */}
      <div className="flex gap-md mb-lg flex-wrap">
        <div style={{ flex: '1 1 200px' }}>
          <p className="filter-label">Time Available</p>
          <div className="tabs">
            {(['all', '2min', '7min', '20min'] as TimeFilter[]).map(t => (
              <button
                key={t}
                className={`tab ${timeFilter === t ? 'active' : ''}`}
                onClick={() => setTimeFilter(t)}
              >
                {t === 'all' ? 'Any' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Faith Mode Toggle */}
      {user?.faithMode !== false && (
        <div className="mb-lg">
          <button
            className={`tab ${showFaithOnly ? 'active' : ''}`}
            onClick={() => setShowFaithOnly(!showFaithOnly)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="mode-indicator mode-faith">✨</span>
            Faith Actions Only
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center mb-md">
        <p className="text-small">
          Showing {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''}
        </p>
        {completedCount > 0 && (
          <p className="text-small text-accent">
            {completedCount} completed today
          </p>
        )}
      </div>

      {/* Action Cards Grid */}
      {filteredActions.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No actions match your filters"
          description="Try adjusting your filter settings to see more options"
          actionLabel="Clear Filters"
          onAction={() => { setLanguageFilter('all'); setTimeFilter('all'); setShowFaithOnly(false); }}
        />
      ) : (
        <div className="action-grid">
          {filteredActions.map((action, index) => {
            const isCompleted = completedIds.has(action.id);
            const langConfig = LOVE_LANGUAGE_CONFIG[action.loveLanguage];
            const modeConfig = MODE_CONFIG[action.mode];
            
            return (
              <div
                key={action.id}
                className={`card card-action ${isCompleted ? 'completed' : ''} slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-sm">
                  <div className="flex gap-xs flex-wrap">
                    <span className={`badge badge-sm badge-${action.loveLanguage}`}>
                      {langConfig?.icon} {langConfig?.label}
                    </span>
                    {action.mode !== 'actionable' && (
                      <span className={`mode-indicator ${modeConfig?.className}`}>
                        {modeConfig?.label}
                      </span>
                    )}
                  </div>
                  <span className="time-badge">
                    <span className="time-badge-icon">⏱️</span>
                    {action.timeRequired}
                  </span>
                </div>
                
                {/* Card Content */}
                <h4 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{action.title}</h4>
                <p className="text-small" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                  {action.description}
                </p>
                
                {/* Action Button */}
                <Button
                  variant={isCompleted ? 'gold' : 'primary'}
                  size="sm"
                  block
                  onClick={() => handleMarkDone(action)}
                >
                  {isCompleted ? (
                    <>
                      <span className="success-checkmark" style={{ width: 20, height: 20, fontSize: 12 }}>✓</span>
                      Done!
                    </>
                  ) : (
                    'Mark as Done'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
