"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';
import { scriptureApi } from '../lib/api';

interface Scripture {
  id: string;
  reference: string;
  text?: string;
  category?: string;
  battleType?: string;
  marriageMeaning?: string;
  actionPrompt?: string;
  prayerPrompt?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'Romance', label: 'Romance', icon: '💕' },
  { id: 'Unity', label: 'Unity', icon: '🤝' },
  { id: 'Communication', label: 'Communication', icon: '💬' },
  { id: 'Forgiveness', label: 'Forgiveness', icon: '🙏' },
  { id: 'Guard Mind', label: 'Guard Mind', icon: '🛡️' },
  { id: 'Lust', label: 'Purity', icon: '✨' },
  { id: 'Anger', label: 'Peace', icon: '🕊️' },
];

// Sample scriptures - in production these come from API
const SAMPLE_SCRIPTURES: Scripture[] = [
  { 
    id: '1', 
    reference: 'Ephesians 4:32', 
    text: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.', 
    category: 'Forgiveness', 
    marriageMeaning: 'In marriage, we daily choose kindness over criticism, compassion over contempt.', 
    actionPrompt: 'Today, forgive one small thing without mentioning it.', 
    prayerPrompt: 'Lord, give us hearts quick to forgive.' 
  },
  { 
    id: '2', 
    reference: '1 Corinthians 13:4-5', 
    text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking.', 
    category: 'Romance', 
    marriageMeaning: 'Real love is action, not just feeling. It chooses patience in frustration.', 
    actionPrompt: 'Practice patience in one interaction today.', 
    prayerPrompt: 'Help us love with Your patient love.' 
  },
  { 
    id: '3', 
    reference: 'Proverbs 15:1', 
    text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.', 
    category: 'Communication', 
    marriageMeaning: 'Your tone matters as much as your words. Gentleness de-escalates conflict.', 
    actionPrompt: 'Respond to one frustration with gentleness today.', 
    prayerPrompt: 'Lord, guard our tongues and soften our responses.' 
  },
  { 
    id: '4', 
    reference: 'Ecclesiastes 4:9-10', 
    text: 'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.', 
    category: 'Unity', 
    marriageMeaning: 'Marriage is partnership. You are stronger together than apart.', 
    actionPrompt: 'Ask your spouse: "How can I help you today?"', 
    prayerPrompt: 'Unite us as partners in all things.' 
  },
  { 
    id: '5', 
    reference: 'Philippians 4:8', 
    text: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.', 
    category: 'Guard Mind', 
    battleType: 'Lust', 
    marriageMeaning: 'Guard your mind. What you dwell on shapes your desires and actions.', 
    actionPrompt: 'Replace one negative thought with truth about your spouse.', 
    prayerPrompt: 'Guard our minds from thoughts that harm our marriage.' 
  },
  { 
    id: '6', 
    reference: 'Colossians 3:13', 
    text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.', 
    category: 'Forgiveness', 
    marriageMeaning: "Forgiveness isn't optional in marriage—it's the air we breathe together.", 
    actionPrompt: "Release one grudge you've been holding.", 
    prayerPrompt: 'Help us forgive as You have forgiven us.' 
  },
  { 
    id: '7', 
    reference: 'Song of Solomon 4:7', 
    text: 'You are altogether beautiful, my darling; there is no flaw in you.', 
    category: 'Romance', 
    marriageMeaning: 'Speak beauty over your spouse. Your words shape how they see themselves.', 
    actionPrompt: 'Tell your spouse one thing you find beautiful about them.', 
    prayerPrompt: 'Help us see each other through Your eyes of love.' 
  },
  { 
    id: '8', 
    reference: 'James 1:19', 
    text: 'My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry.', 
    category: 'Communication', 
    battleType: 'Anger', 
    marriageMeaning: 'Listen twice as much as you speak. Slow down before reacting.', 
    actionPrompt: 'In your next conversation, listen fully before responding.', 
    prayerPrompt: 'Make us quick to listen and slow to anger.' 
  },
  { 
    id: '9', 
    reference: 'Matthew 5:28', 
    text: 'But I tell you that anyone who looks at a woman lustfully has already committed adultery with her in his heart.', 
    category: 'Guard Mind', 
    battleType: 'Lust', 
    marriageMeaning: 'Guard your eyes and heart. Faithfulness begins in the mind.', 
    actionPrompt: 'Set one boundary to protect your eyes today.', 
    prayerPrompt: 'Keep our hearts and eyes faithful to each other.' 
  },
  { 
    id: '10', 
    reference: 'Ephesians 4:26-27', 
    text: 'In your anger do not sin: Do not let the sun go down while you are still angry, and do not give the devil a foothold.', 
    category: 'Communication', 
    battleType: 'Anger', 
    marriageMeaning: "Resolve conflict quickly. Don't let bitterness take root overnight.", 
    actionPrompt: "If there's unresolved tension, address it before bed.", 
    prayerPrompt: 'Help us not go to bed angry.' 
  },
  {
    id: '11',
    reference: 'Genesis 2:24',
    text: 'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
    category: 'Unity',
    marriageMeaning: 'Your marriage comes before all other relationships except God.',
    actionPrompt: 'Discuss one way to prioritize your marriage this week.',
    prayerPrompt: 'Help us put our marriage above all earthly relationships.'
  },
  {
    id: '12',
    reference: 'Proverbs 31:10-11',
    text: 'A wife of noble character who can find? She is worth far more than rubies. Her husband has full confidence in her.',
    category: 'Romance',
    marriageMeaning: 'Trust and character are the foundations of lasting love.',
    actionPrompt: 'Express confidence in your spouse about something today.',
    prayerPrompt: 'Build trust and character in our marriage.'
  }
];

export default function ScriptureVaultPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('one_scripture_favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    loadScriptures();
  }, [isLoading, isAuthenticated, router]);

  const loadScriptures = async () => {
    setLoading(true);
    try {
      const { list } = await scriptureApi.list();
      if (list && list.length > 0) {
        setScriptures(list);
      } else {
        setScriptures(SAMPLE_SCRIPTURES);
      }
    } catch (e) {
      setScriptures(SAMPLE_SCRIPTURES);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadScriptures();
      return;
    }
    setLoading(true);
    try {
      const { list } = await scriptureApi.search(searchQuery);
      if (list && list.length > 0) {
        setScriptures(list);
      } else {
        // Filter sample data locally
        const filtered = SAMPLE_SCRIPTURES.filter(s => 
          s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.marriageMeaning?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setScriptures(filtered);
      }
    } catch (e) {
      const filtered = SAMPLE_SCRIPTURES.filter(s => 
        s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setScriptures(filtered);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (scripture: Scripture) => {
    const newFavorites = new Set(favorites);
    const wasFavorite = newFavorites.has(scripture.id);
    
    if (wasFavorite) {
      newFavorites.delete(scripture.id);
      setToast({ show: true, message: 'Removed from favorites', type: 'success' });
    } else {
      newFavorites.add(scripture.id);
      setToast({ show: true, message: `Saved ${scripture.reference} ❤️`, type: 'success' });
      // Try to save to server
      try {
        await scriptureApi.save(scripture.id);
      } catch {
        // Silent fail - still save locally
      }
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('one_scripture_favorites', JSON.stringify([...newFavorites]));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowFavoritesOnly(false);
    loadScriptures();
  };

  const filteredScriptures = scriptures.filter(s => {
    if (showFavoritesOnly && !favorites.has(s.id)) return false;
    if (selectedCategory !== 'all') {
      if (s.category !== selectedCategory && s.battleType !== selectedCategory) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <main className="page-with-nav container">
        <div className="loading"><div className="spinner" /></div>
        <BottomNav />
      </main>
    );
  }

  // Faith mode check
  if (user?.faithMode === false) {
    return (
      <main className="page-with-nav container">
        <div className="text-center" style={{ paddingTop: '60px' }}>
          <div className="empty-state-icon">📖</div>
          <h2>Scripture Vault</h2>
          <p className="text-muted mt-md mb-lg">
            Faith Mode is currently off. Enable it to access the Scripture Vault.
          </p>
          <Button variant="gold" onClick={() => router.push('/settings')}>
            Go to Settings
          </Button>
        </div>
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
          <h2>📖 Scripture Vault</h2>
          <p className="page-header-subtitle">God's Word for your marriage</p>
        </div>
        {favorites.size > 0 && (
          <button
            className={`tab ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{ fontSize: '13px' }}
          >
            ❤️ {favorites.size}
          </button>
        )}
      </div>

      {/* Search */}
      <Card>
        <div className="flex gap-sm">
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search: forgiveness, peace, love..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </Card>

      {/* Category Filters */}
      <div className="filter-section">
        <p className="filter-label">Category</p>
        <div className="filter-container scroll-x">
          <div className="filter-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center mb-md">
        <p className="text-small">
          {filteredScriptures.length} scripture{filteredScriptures.length !== 1 ? 's' : ''}
          {showFavoritesOnly && ' (favorites)'}
        </p>
        {(selectedCategory !== 'all' || showFavoritesOnly || searchQuery) && (
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={clearFilters}
            style={{ fontSize: '13px' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Scripture Cards */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filteredScriptures.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No scriptures found"
          description="Try adjusting your search or filters"
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="scripture-grid">
          {filteredScriptures.map((scripture, index) => {
            const isFavorite = favorites.has(scripture.id);
            const isExpanded = expandedId === scripture.id;
            
            return (
              <Card 
                key={scripture.id} 
                scripture 
                className={`slide-up ${isExpanded ? 'card-highlight' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-sm">
                  <span className="scripture-ref" style={{ fontSize: '16px' }}>
                    {scripture.reference}
                  </span>
                  <button
                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(scripture)}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                </div>

                {/* Scripture Text */}
                {scripture.text && (
                  <div className="scripture-verse">
                    {scripture.text}
                  </div>
                )}

                {/* Marriage Meaning */}
                {scripture.marriageMeaning && (
                  <div className="mb-md">
                    <p className="text-small" style={{ fontWeight: 600, color: 'var(--accent-gold-dark)', marginBottom: '4px' }}>
                      💑 For Your Marriage:
                    </p>
                    <p className="text-small" style={{ lineHeight: 1.6 }}>{scripture.marriageMeaning}</p>
                  </div>
                )}

                {/* Expandable Content */}
                <div style={{ 
                  maxHeight: isExpanded ? '500px' : '0', 
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-out'
                }}>
                  {/* Action Prompt */}
                  {scripture.actionPrompt && (
                    <div className="action-prompt">
                      <p className="action-prompt-title">
                        🎯 Do This Today
                      </p>
                      <p className="action-prompt-text">{scripture.actionPrompt}</p>
                    </div>
                  )}

                  {/* Prayer Prompt */}
                  {scripture.prayerPrompt && (
                    <div className="prayer-box">
                      <p className="prayer-box-title">
                        🙏 Prayer
                      </p>
                      <p className="prayer-box-text">{scripture.prayerPrompt}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-md">
                  {/* Category Tags */}
                  <div className="flex gap-xs flex-wrap">
                    {scripture.category && (
                      <span className="badge badge-sm badge-faith">{scripture.category}</span>
                    )}
                    {scripture.battleType && scripture.battleType !== scripture.category && (
                      <span className="badge badge-sm">{scripture.battleType}</span>
                    )}
                  </div>
                  
                  {/* Expand Button */}
                  {(scripture.actionPrompt || scripture.prayerPrompt) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : scripture.id)}
                      style={{ fontSize: '12px' }}
                    >
                      {isExpanded ? 'Less ▲' : 'More ▼'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
