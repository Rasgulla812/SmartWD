import React, { useState, useRef, useCallback } from 'react';
import type { WardrobeItem, View } from './types';
import { classifyImage, recommendOutfit, rateOutfit, type StyleRating } from './services/geminiService';
import { ShirtIcon, SparklesIcon, WandIcon, UploadCloudIcon, LoaderIcon, DownloadIcon, StarIcon, ThermometerIcon, SunIcon, MoonIcon, CameraIcon } from './components/icons';

const Header: React.FC<{ activeView: View; setActiveView: (view: View) => void; theme: string; toggleTheme: () => void }> = ({ activeView, setActiveView, theme, toggleTheme }) => {
  const navItems = [
    { id: 'wardrobe', icon: ShirtIcon, label: 'Wardrobe' },
    { id: 'recommender', icon: SparklesIcon, label: 'Outfit AI' },
    { id: 'rater', icon: StarIcon, label: 'Style AI' },
  ] as const;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-slate-950/60 backdrop-blur-2xl z-20 border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center py-4 md:py-5">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">Clothe.AI</h1>
            <nav className="hidden md:flex items-center space-x-2 bg-white/5 backdrop-blur-lg p-1.5 rounded-full border border-white/10">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group flex items-center space-x-3 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeView === item.id
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 transition-transform group-hover:rotate-45" />
                ) : (
                  <MoonIcon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                )}
              </button>
            </nav>
            <div className="md:hidden text-xs font-black uppercase tracking-widest text-slate-500">
              Smart Wardrobe
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 bg-slate-950/80 backdrop-blur-3xl z-30 flex items-center justify-around p-1.5 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-2xl transition-all duration-300 ${activeView === item.id
              ? 'text-indigo-400 scale-110'
              : 'text-slate-500'
              }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center space-y-1 px-3 py-2.5 rounded-2xl transition-all duration-300 text-slate-500"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5 stroke-2" />
          ) : (
            <MoonIcon className="w-5 h-5 stroke-2" />
          )}
          <span className="text-[9px] font-black uppercase tracking-tighter">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    </>
  );
};

const WardrobeView: React.FC<{
  items: WardrobeItem[];
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}> = ({ items, onImageUpload, isLoading }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset value so same file can be uploaded again if needed
    event.target.value = '';
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in">
      <div className="relative group p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-slate-300/30 hover:border-indigo-500 transition-all duration-500 text-center glass-card shadow-xl hover:shadow-2xl">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] md:rounded-[2.5rem] pointer-events-none"></div>
        <div className="relative z-1">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <UploadCloudIcon className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3 tracking-tight">Expand Your Wardrobe</h3>
          <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-6 md:mb-8 font-medium leading-relaxed px-4">Choose your preferred method to add new clothes to your collection.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGalleryClick}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 border border-transparent text-base md:text-lg font-black rounded-xl md:rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 md:h-6 md:w-6 text-white" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  Gallery
                </>
              )}
            </button>

            <button
              onClick={handleCameraClick}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 border border-white/10 text-base md:text-lg font-black rounded-xl md:rounded-2xl text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-300 backdrop-blur-lg disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 md:h-6 md:w-6 text-white" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="w-5 h-5 mr-3" />
                  Camera
                </>
              )}
            </button>
          </div>

          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg aspect-[4/5] md:aspect-square glass-card p-2 md:p-3 hover:translate-y-[-8px] transition-all duration-300">
              <div className="w-full h-full overflow-hidden rounded-2xl">
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute inset-x-2 bottom-2 p-3 bg-white/90 backdrop-blur-md rounded-xl md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 border border-white/50">
                <h3 className="text-slate-900 font-bold capitalize text-xs md:text-sm truncate">{item.name}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-[2.5rem] border border-white/50">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShirtIcon className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">Your Wardrobe is Empty</h3>
          <p className="text-slate-400 mt-2 text-sm md:text-base font-medium px-4">The studio is ready. Add your first item to begin.</p>
        </div>
      )}
    </div>
  );
};


const OutfitRecommenderView: React.FC<{
  wardrobeItems: WardrobeItem[];
  onGetRecommendation: () => void;
  recommendation: string | null;
  isLoading: boolean;
}> = ({ wardrobeItems, onGetRecommendation, recommendation, isLoading }) => {
  return (
    <div className="text-center">
      <div className="max-w-2xl mx-auto">
        <SparklesIcon className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
        <h2 className="mt-6 text-2xl font-black tracking-tight sm:text-5xl text-white px-2">Outfit Recommendation</h2>
        <p className="mt-3 text-sm md:text-xl text-slate-300 font-medium leading-relaxed px-4 opacity-80">Let our AI stylist create the perfect outfit from your wardrobe.</p>
        <button
          onClick={onGetRecommendation}
          disabled={isLoading || wardrobeItems.length === 0}
          className="mt-8 inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 border border-transparent text-base md:text-lg font-black rounded-full text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:bg-slate-800 disabled:cursor-not-allowed transition-all duration-300 w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Thinking...
            </>
          ) : (
            "Generate My Outfit"
          )}
        </button>
        {wardrobeItems.length === 0 && <p className="text-sm mt-4 text-amber-600">Add items to your wardrobe to get a recommendation.</p>}
      </div>

      {recommendation && (
        <div className="mt-8 md:mt-12 max-w-3xl mx-auto glass-card rounded-2xl md:rounded-3xl p-6 md:p-10 text-left shadow-2xl animate-fade-in border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-1 bg-indigo-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white">Stylist Recommendation</h3>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-300 text-base md:text-lg">{recommendation}</p>
        </div>
      )}
    </div>
  );
};


const AiOutfitRaterView: React.FC<{
  onRateOutfit: (description: string, venue: string, weather: string, preference: string) => void;
  rating: StyleRating | null;
  isLoading: boolean;
}> = ({ onRateOutfit, rating, isLoading }) => {
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('Professional');
  const [weather, setWeather] = useState('Mild');
  const [selectedPreference, setSelectedPreference] = useState('Minimalist');
  const [customPreference, setCustomPreference] = useState('');

  const venues = ['Professional', 'Casual Party', 'College', 'Date Night', 'Formal Event', 'Gym/Athletic'];
  const weathers = ['Hot/Sunny', 'Cold/Winter', 'Rainy', 'Mild/Spring', 'Humid'];
  const preferences = ['Minimalist', 'Streetwear', 'Classic Professional', 'Vintage/Retro', 'Avant-garde', 'Bohemian', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      const finalPreference = selectedPreference === 'Other' ? customPreference : selectedPreference;
      onRateOutfit(description, venue, weather, finalPreference);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start animate-fade-in">
      <div className="w-full lg:w-1/2 space-y-8">
        <div className="text-left">
          <div className="inline-flex items-center justify-center p-3 md:p-4 bg-indigo-600 rounded-2xl md:rounded-[1.5rem] shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6">
            <StarIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">AI Style Critic</h2>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed font-medium">Describe your outfit and context. Get a professional rating and tips to make it "super cool" yet professional.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider">Outfit Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Navy blazer with a white crisp shirt, dark denim jeans...'"
              className="w-full h-32 p-4 md:p-5 bg-slate-900/40 border-2 border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-0 focus:outline-none transition-all duration-300 resize-none font-medium text-sm md:text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Venue / Occasion</label>
              <select
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full p-4 bg-slate-900/40 border-2 border-white/5 rounded-2xl text-white focus:border-indigo-500 focus:outline-none font-medium appearance-none"
              >
                {venues.map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Weather Context</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full p-4 bg-slate-900/40 border-2 border-white/5 rounded-2xl text-white focus:border-indigo-500 focus:outline-none font-medium appearance-none"
              >
                {weathers.map(w => <option key={w} value={w} className="bg-slate-900">{w}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Style Preference</label>
              <select
                value={selectedPreference}
                onChange={(e) => setSelectedPreference(e.target.value)}
                className="w-full p-4 bg-slate-900/40 border-2 border-white/5 rounded-2xl text-white focus:border-indigo-500 focus:outline-none font-medium appearance-none"
              >
                {preferences.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {selectedPreference === 'Other' && (
              <div className="space-y-2 animate-fade-in">
                <input
                  type="text"
                  value={customPreference}
                  onChange={(e) => setCustomPreference(e.target.value)}
                  placeholder="Describe your custom style preference..."
                  className="w-full p-4 bg-slate-900/40 border-2 border-white/5 rounded-2xl text-white focus:border-indigo-500 focus:outline-none font-medium"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="w-full inline-flex items-center justify-center px-8 py-4 md:py-5 border border-transparent text-lg md:text-xl font-black rounded-xl md:rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:bg-slate-800 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                Reviewing Look...
              </>
            ) : (
              "Rate My Style"
            )}
          </button>
        </form>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="relative min-h-[500px] glass-card rounded-[2.5rem] border-4 border-white/40 flex flex-col items-center justify-center p-10 shadow-2xl overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 md:p-8">
              <div className="relative mb-6 md:mb-8">
                <StarIcon className="animate-bounce h-16 w-16 md:h-20 md:w-20 text-indigo-400" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-indigo-500 rounded-full scale-150"></div>
              </div>
              <h3 className="text-lg md:text-2xl font-black text-white mb-2">Analyzing Style...</h3>
              <p className="text-slate-400 text-xs md:text-base font-medium">Evaluating color harmony and occasion fit.</p>
            </div>
          )}

          {!isLoading && !rating && (
            <div className="text-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/5">
                <StarIcon className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">Style Report Awaits</h3>
              <p className="text-slate-300 max-w-[240px] md:max-w-xs mx-auto text-base md:text-lg leading-relaxed font-medium px-4">Submit your outfit details to see how you rank among the stylishly professional.</p>
            </div>
          )}

          {rating && !isLoading && (
            <div className="w-full animate-fade-in">
              <div className="flex flex-col xs:flex-row items-center justify-between mb-8 md:mb-10 gap-6 xs:gap-0 mt-4 md:mt-0">
                <div className="space-y-1 text-center xs:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Rating</span>
                  <div className="flex items-baseline justify-center xs:justify-start space-x-2">
                    <h2 className="text-5xl md:text-7xl font-black text-white">{rating.score}</h2>
                    <span className="text-lg md:text-2xl font-bold text-slate-600">/ 10</span>
                  </div>
                </div>
                <div className={`px-5 py-2.5 rounded-full font-black text-[10px] md:text-sm uppercase tracking-tighter shadow-lg shrink-0 ${rating.score >= 8 ? 'bg-emerald-500 text-white' : rating.score >= 5 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                  {rating.score >= 8 ? 'Elite Style' : rating.score >= 5 ? 'Looking Good' : 'Needs Work'}
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
                  <h4 className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 md:mb-4">Professional Critique</h4>
                  <p className="text-slate-200 text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">{rating.explanation}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-400 group">
                  <div className="flex items-center space-x-2">
                    <ThermometerIcon className="h-4 w-4 md:h-5 md:w-5 group-hover:text-sky-500 transition-colors" />
                    <span className="text-xs md:text-sm font-bold">{weather}</span>
                  </div>
                  <span className="hidden sm:block h-1 w-1 bg-slate-600 rounded-full"></span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm font-bold uppercase tracking-tighter opacity-50">Event</span>
                    <span className="text-xs md:text-sm font-bold text-slate-300">{venue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IntroLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  React.useEffect(() => {
    // Start the opening animation after a short delay
    const openTimer = setTimeout(() => setIsActive(true), 1000);

    // Hide the loader completely after animation finishes
    const hideTimer = setTimeout(() => {
      setIsHidden(true);
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (isHidden) return null;

  return (
    <div className={`intro-container ${isActive ? 'intro-active' : ''}`}>
      <div className="cupboard-label">Clothe-AI</div>
      <div className="door door-left">
        <div className="handle"></div>
      </div>
      <div className="door door-right">
        <div className="handle"></div>
      </div>
      <div className="intro-overlay"></div>
    </div>
  );
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeView, setActiveView] = useState<View>('wardrobe');
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [styleRating, setStyleRating] = useState<StyleRating | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const name = await classifyImage(file);
      const newItem: WardrobeItem = {
        id: new Date().toISOString(),
        name,
        imageUrl: URL.createObjectURL(file),
      };
      setWardrobeItems(prev => [newItem, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGetRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const itemNames = wardrobeItems.map(item => item.name);
      const result = await recommendOutfit(itemNames);
      setRecommendation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [wardrobeItems]);

  const handleRateOutfit = useCallback(async (description: string, venue: string, weather: string, preference: string) => {
    setIsLoading(true);
    setError(null);
    setStyleRating(null);
    try {
      const result = await rateOutfit(description, venue, weather, preference);
      setStyleRating(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      {showIntro && <IntroLoader onComplete={() => setShowIntro(false)} />}
      <div className={`min-h-screen bg-professional text-slate-100 transition-all duration-1000 ${showIntro ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        <div className="bg-blob" style={{ top: '-10%', left: '-5%' }}></div>
        <div className="bg-blob-2"></div>

        <Header activeView={activeView} setActiveView={setActiveView} theme={theme} toggleTheme={toggleTheme} />

        <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-36 pb-32 md:pb-12 relative z-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl relative mb-8 animate-shake shadow-sm backdrop-blur-md" role="alert">
              <strong className="font-bold">System Note: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="animate-fade-in delay-200">
            {activeView === 'wardrobe' && <WardrobeView items={wardrobeItems} onImageUpload={handleImageUpload} isLoading={isLoading} />}
            {activeView === 'recommender' && <OutfitRecommenderView wardrobeItems={wardrobeItems} onGetRecommendation={handleGetRecommendation} recommendation={recommendation} isLoading={isLoading} />}
            {activeView === 'rater' && <AiOutfitRaterView onRateOutfit={handleRateOutfit} rating={styleRating} isLoading={isLoading} />}
          </div>
        </main>
      </div>
    </>
  );
}