import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { AndroidBiometryStrength, BiometryType, BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseConfigured, googleProvider, webAuth } from './firebase.js';
import {
  Aperture, ArrowDownToLine, ArrowLeft, AudioLines, BadgeCheck, Bell, Check,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, CircleHelp, Clapperboard,
  Clock3, Cloud, Crop, Expand, Film, Fingerprint, FolderOpen, Image, Layers3,
  LayoutTemplate, ListPlus, LockKeyhole, LogIn, LogOut, Moon, MoreHorizontal,
  Music2, Pause, Play, Plus, RefreshCw, Save, Scissors, Settings2, Share2,
  ShieldCheck, Smartphone, Sparkles, Sun, WandSparkles, Volume2, VolumeX, X,
} from 'lucide-react';

const defaultProject = {
  name: 'Where the wild things grow',
  prompt: 'A cinematic journey through a misty mountain valley at sunrise, golden light spilling through the pines, slow drone shot, dreamy film grain',
  duration: 18,
  effect: 'Cinematic',
  aspect: '16:9',
};

const effectOptions = [
  { name: 'Cinematic', detail: 'Film tones · soft grain', icon: Aperture },
  { name: 'Dreamy', detail: 'Soft focus · glow', icon: Sparkles },
  { name: 'Vintage', detail: '35mm · warm fade', icon: Film },
  { name: 'Vibrant', detail: 'Rich color · crisp', icon: Sun },
];

function readSavedProjects() {
  try {
    const saved = window.localStorage.getItem('plotpixel-projects');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Could not read saved projects:', error);
    return [];
  }
}

function readCurrentProject() {
  try {
    const saved = window.localStorage.getItem('plotpixel-current-project');
    return saved ? { ...defaultProject, ...JSON.parse(saved) } : defaultProject;
  } catch (error) {
    console.error('Could not read the current project:', error);
    return defaultProject;
  }
}

function readDarkTheme() {
  try {
    return window.localStorage.getItem('plotpixel-theme') !== 'light';
  } catch (error) {
    console.error('Could not read theme preference:', error);
    return true;
  }
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function LandscapePreview({ effect, intensity = 72, adjustments }) {
  const strength = intensity / 100;
  const effectFilter = {
    Cinematic: `sepia(${strength * 0.13}) saturate(${1 - strength * 0.12}) contrast(${1 + strength * 0.1})`,
    Dreamy: `brightness(${1 + strength * 0.12}) blur(${strength * 0.65}px) saturate(${1 - strength * 0.12})`,
    Vintage: `sepia(${strength * 0.48}) contrast(${1 - strength * 0.1}) saturate(${1 - strength * 0.2})`,
    Vibrant: `saturate(${1 + strength * 0.65}) contrast(${1 + strength * 0.08})`,
  }[effect] || '';
  const imageAdjustments = adjustments
    ? `brightness(${0.65 + adjustments.Brightness / 100 * 0.7}) contrast(${0.65 + adjustments.Contrast / 100 * 0.7}) saturate(${0.5 + adjustments.Saturation / 100}) sepia(${adjustments.Temperature / 100 * 0.12})`
    : '';
  return (
    <div className="preview-art" aria-label="Illustrated cinematic mountain valley preview" role="img">
      <svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ filter: `${effectFilter} ${imageAdjustments}`.trim() }}>
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#213c3c" />
            <stop offset=".52" stopColor="#d79b68" />
            <stop offset="1" stopColor="#e9c28a" />
          </linearGradient>
          <linearGradient id="lake" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#415d57" />
            <stop offset="1" stopColor="#172f32" />
          </linearGradient>
          <linearGradient id="haze" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#f2c08a" stopOpacity=".7" />
            <stop offset="1" stopColor="#f2c08a" stopOpacity="0" />
          </linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <rect width="960" height="540" fill="url(#sky)" />
        <circle cx="492" cy="265" r="86" fill="#f3ca91" opacity=".4" filter="url(#blur)" />
        <circle cx="492" cy="265" r="41" fill="#ffe0a4" opacity=".86" />
        <path d="M0 310 120 192l92 85 146-163 132 143 102-112 174 169 76-84 118 101v209H0Z" fill="#60716a" opacity=".82" />
        <path d="m241 277 117-163 74 83-37-14-35 31-24-8-36 40-31-4Z" fill="#e4c7a3" opacity=".73" />
        <path d="m491 246 101-101 109 101-41-20-34 15-34-24-29 24-34-9Z" fill="#e9c9a0" opacity=".62" />
        <path d="M0 350 132 274l125 63 120-73 121 81 91-67 99 70 141-89 131 83v198H0Z" fill="#334b45" />
        <rect y="370" width="960" height="170" fill="url(#haze)" />
        <path d="M0 406q158-45 318 8t303-3 339 7v122H0Z" fill="url(#lake)" />
        <path d="M402 410q88 23 180 1" stroke="#efc58d" strokeWidth="5" opacity=".36" fill="none" />
        <path d="M462 427q67 14 125 1M436 445q96 14 182 1M499 465q57 8 112 0" stroke="#d6b381" strokeWidth="2" opacity=".3" fill="none" />
        <g fill="#182f2c">
          <path d="m65 435 20-123 20 123h-13l19 37H60l18-37ZM147 447l23-159 24 159h-15l22 42h-63l20-42ZM796 448l19-143 20 143h-14l19 41h-56l19-41ZM875 442l22-166 23 166h-15l22 49h-61l20-49Z" />
        </g>
      </svg>
      <div className="art-vignette" />
    </div>
  );
}

function App() {
  const [project, setProject] = useState(readCurrentProject);
  const [savedProjects, setSavedProjects] = useState(readSavedProjects);
  const [activeNav, setActiveNav] = useState('Studio');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [darkMode, setDarkMode] = useState(readDarkTheme);
  const [authUser, setAuthUser] = useState(null);
  const [authPending, setAuthPending] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [biometricInitializing, setBiometricInitializing] = useState(() => Capacitor.getPlatform() === 'android');
  const [importedVideo, setImportedVideo] = useState(null);
  const videoInputRef = useRef(null);
  const videoElementRef = useRef(null);
  const [selectedEffect, setSelectedEffect] = useState(project.effect);
  const [effectIntensity, setEffectIntensity] = useState(72);
  const [adjustments, setAdjustments] = useState({ Brightness: 54, Contrast: 62, Saturation: 68, Temperature: 58 });
  const [prompt, setPrompt] = useState(() => project.prompt);
  const [toast, setToast] = useState('');
  const [showFaceEditor, setShowFaceEditor] = useState(false);
  const [consent, setConsent] = useState(false);
  const [faceImage, setFaceImage] = useState('');
  const [targetPerson, setTargetPerson] = useState('person-1');
  const [volumeOn, setVolumeOn] = useState(true);
  const [activeTab, setActiveTab] = useState('Effects');
  const [savedAt, setSavedAt] = useState('All changes saved');

  useEffect(() => {
    try {
      window.localStorage.setItem('plotpixel-projects', JSON.stringify(savedProjects));
    } catch (error) {
      console.error('Could not save projects:', error);
      setToast('Could not save your projects in this browser.');
    }
  }, [savedProjects]);

  useEffect(() => {
    try {
      window.localStorage.setItem('plotpixel-current-project', JSON.stringify({
        ...project,
        prompt,
        effect: selectedEffect,
      }));
    } catch (error) {
      console.error('Could not autosave the current project:', error);
      setToast('Could not autosave your project in this browser.');
    }
  }, [project, prompt, selectedEffect]);

  useEffect(() => {
    if (!playing || importedVideo) return undefined;
    const timer = window.setInterval(() => {
      setProgress((value) => value >= 100 ? 0 : value + 0.3);
    }, 120);
    return () => window.clearInterval(timer);
  }, [playing, importedVideo]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (faceImage) URL.revokeObjectURL(faceImage);
  }, [faceImage]);

  const formattedTime = useMemo(
    () => formatTime((progress / 100) * project.duration),
    [progress, project.duration],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try {
      window.localStorage.setItem('plotpixel-theme', darkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Could not save theme preference:', error);
      setToast('Could not save the theme preference in this browser.');
    }
  }, [darkMode]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let authListener;
      let disposed = false;

      const initializeNative = async () => {
        try {
          authListener = await FirebaseAuthentication.addListener('authStateChange', ({ user }) => setAuthUser(user));
          if (disposed) {
            await authListener.remove();
            return;
          }
          const currentUser = await FirebaseAuthentication.getCurrentUser();
          setAuthUser(currentUser.user);
        } catch (error) {
          console.error('Could not initialize Android Google sign-in:', error);
          if (!disposed) setToast('Android Google sign-in needs Firebase to be configured.');
        }

        try {
          const [lockPreference, biometry] = await Promise.all([
            Preferences.get({ key: 'plotpixel-fingerprint-lock' }),
            BiometricAuth.checkBiometry(),
          ]);
          if (disposed) return;
          const hasFingerprint = biometry.biometryTypes.includes(BiometryType.fingerprintAuthentication);
          setBiometricAvailable(Capacitor.getPlatform() === 'android' && hasFingerprint && biometry.isAvailable);
          const enabled = lockPreference.value === 'true';
          if (enabled) setBiometricLocked(true);
          setBiometricEnabled(enabled);
          setBiometricLocked(enabled);
          if (enabled) await verifyFingerprintUnlock();
          setBiometricInitializing(false);
        } catch (error) {
          console.error('Could not initialize Android fingerprint lock:', error);
          if (!disposed) {
            setBiometricLocked(false);
            setBiometricInitializing(false);
            setToast('Could not initialize the Android fingerprint lock.');
          }
        }
      };

      void initializeNative();
      return () => {
        disposed = true;
        void authListener?.remove();
      };
    }

    if (!webAuth) return undefined;
    return onAuthStateChanged(webAuth, (user) => setAuthUser(user), (error) => {
      console.error('Could not observe Google sign-in state:', error);
      setToast('Could not check your Google sign-in state.');
    });
  }, []);

  useEffect(() => {
    if (!biometricEnabled || Capacitor.getPlatform() !== 'android') return undefined;
    let listener;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void verifyFingerprintUnlock();
    }).then((handle) => {
      listener = handle;
    }).catch((error) => {
      console.error('Could not listen for Android app resume:', error);
      setToast('Fingerprint lock is enabled, but app-resume protection could not start.');
    });
    return () => {
      void listener?.remove();
    };
  }, [biometricEnabled]);

  useEffect(() => () => {
    if (importedVideo?.url) URL.revokeObjectURL(importedVideo.url);
  }, [importedVideo]);

  function updateProject(key, value) {
    setProject((current) => ({ ...current, [key]: value }));
    setSavedAt('Saving…');
    window.setTimeout(() => setSavedAt('All changes saved'), 700);
  }

  function saveProject() {
    const nextProject = { ...project, prompt, effect: selectedEffect, updatedAt: new Date().toISOString() };
    setSavedProjects((current) => [nextProject, ...current.filter((item) => item.name !== nextProject.name)]);
    setSavedAt('Saved just now');
    setToast('Project saved to this browser');
  }

  function createProject() {
    const next = { ...defaultProject, name: 'Untitled project' };
    setProject(next);
    setPrompt(next.prompt);
    setSelectedEffect(next.effect);
    setActiveNav('Studio');
    setProgress(0);
    setToast('A fresh canvas is ready');
  }

  function selectProject(item) {
    setProject(item);
    setPrompt(item.prompt);
    setSelectedEffect(item.effect || 'Cinematic');
    setActiveNav('Studio');
    setProgress(0);
  }

  function generateVideo() {
    if (!prompt.trim()) {
      setToast('Add a prompt first to create your video.');
      return;
    }
    setToast('AI video rendering is not connected yet. Add a video-generation provider to render this prompt.');
  }

  function handleFaceUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast('Choose an image file to use as a reference.');
      return;
    }
    if (faceImage) URL.revokeObjectURL(faceImage);
    setFaceImage(URL.createObjectURL(file));
  }

  function exportVideo() {
    setToast('Connect a video-rendering service to export your film.');
  }

  async function handleGoogleAuth() {
    setAuthPending(true);
    try {
      if (Capacitor.getPlatform() === 'android') {
        const result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: true });
        setAuthUser(result.user);
        setToast(`Signed in${result.user?.displayName ? ` as ${result.user.displayName}` : ''}.`);
      } else if (firebaseConfigured && webAuth) {
        const result = await signInWithPopup(webAuth, googleProvider);
        setAuthUser(result.user);
        setToast(`Signed in as ${result.user.displayName || result.user.email}.`);
      } else {
        setToast('Google sign-in is not configured. Add the Firebase web settings from .env.example.');
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setToast(`Google sign-in failed: ${error.message || 'check your Firebase configuration.'}`);
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut() {
    try {
      if (Capacitor.getPlatform() === 'android') {
        await FirebaseAuthentication.signOut();
      } else if (webAuth) {
        await signOut(webAuth);
      }
      setAuthUser(null);
      setToast('You have been signed out.');
    } catch (error) {
      console.error('Sign-out failed:', error);
      setToast(`Sign-out failed: ${error.message || 'please try again.'}`);
    }
  }

  async function toggleBiometricLock() {
    if (!biometricAvailable) {
      setToast('Enroll a fingerprint on this Android device to use the app lock.');
      return;
    }
    try {
      await BiometricAuth.authenticate({
        reason: biometricEnabled ? 'Confirm to disable the app lock' : 'Confirm to enable the app lock',
        androidTitle: 'Confirm fingerprint',
        androidBiometryStrength: AndroidBiometryStrength.strong,
        allowDeviceCredential: false,
      });
      const enabled = !biometricEnabled;
      await Preferences.set({ key: 'plotpixel-fingerprint-lock', value: String(enabled) });
      setBiometricEnabled(enabled);
      setBiometricLocked(false);
      setToast(enabled ? 'Fingerprint lock enabled.' : 'Fingerprint lock disabled.');
    } catch (error) {
      console.error('Could not update fingerprint lock:', error);
      setToast(`Fingerprint verification failed: ${error.message || 'setting unchanged.'}`);
    }
  }

  function handleVideoImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setToast('Choose a video file to import.');
      event.target.value = '';
      return;
    }
    setImportedVideo({ name: file.name, url: URL.createObjectURL(file) });
    setPlaying(false);
    setProgress(0);
    event.target.value = '';
  }

  function handleVideoMetadata(event) {
    const duration = event.currentTarget.duration;
    if (Number.isFinite(duration) && duration > 0) {
      updateProject('duration', Math.ceil(duration));
      setProgress(0);
    }
  }

  function handleVideoTimeUpdate(event) {
    const { currentTime, duration } = event.currentTarget;
    if (Number.isFinite(duration) && duration > 0) setProgress((currentTime / duration) * 100);
  }

  function setSequenceDuration(value) {
    const duration = Number(value);
    if (Number.isFinite(duration) && duration > 0) updateProject('duration', Math.ceil(duration));
  }

  async function verifyFingerprintUnlock() {
    setBiometricLocked(true);
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock PlotPixel',
        androidTitle: 'Unlock PlotPixel',
        androidBiometryStrength: AndroidBiometryStrength.strong,
        allowDeviceCredential: true,
      });
      setBiometricLocked(false);
    } catch (error) {
      console.error('Fingerprint authentication did not succeed:', error);
      setToast('Fingerprint verification was not completed. The app remains locked.');
    }
  }

  function togglePreviewPlayback() {
    if (videoElementRef.current) {
      if (videoElementRef.current.paused) void videoElementRef.current.play();
      else videoElementRef.current.pause();
      return;
    }
    setPlaying((current) => !current);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActiveNav('Studio'); }}>
          <span className="brand-mark"><Clapperboard size={19} strokeWidth={2.3} /></span>
          <span>PLOT<span>PIXEL</span></span>
        </a>

        <button className="workspace-switcher" onClick={() => setToast('Workspace settings are coming soon.')}>
          <span className="workspace-avatar">P</span>
          <span className="workspace-label"><strong>Personal workspace</strong><small>Free plan</small></span>
          <ChevronsUpDown size={15} />
        </button>

        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {[
            { name: 'Studio', icon: Clapperboard },
            { name: 'Projects', icon: FolderOpen },
            { name: 'Assets', icon: Image },
            { name: 'Templates', icon: LayoutTemplate },
          ].map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${activeNav === name ? 'active' : ''}`} onClick={() => setActiveNav(name)}>
              <Icon size={17} strokeWidth={1.9} /><span>{name}</span>
              {name === 'Projects' && savedProjects.length > 0 && <span className="nav-count">{savedProjects.length}</span>}
            </button>
          ))}
        </nav>

        <div className="side-section-label tools-label">CREATE</div>
        <nav className="side-nav" aria-label="Creation tools">
          <button className="nav-item" onClick={createProject}><Sparkles size={17} /><span>AI video</span><span className="new-pill">NEW</span></button>
          <button className="nav-item" onClick={() => { setShowFaceEditor(true); setActiveNav('Studio'); }}><Aperture size={17} /><span>Face studio</span></button>
          <button className="nav-item" onClick={() => setToast('Audio tools are ready to connect to your media.') }><AudioLines size={17} /><span>AI audio</span></button>
        </nav>

          <button aria-label="Settings" className={`nav-item settings-nav ${activeNav === 'Settings' ? 'active' : ''}`} onClick={() => setActiveNav('Settings')}><Settings2 size={17} /><span>Settings</span></button>
          <div className="sidebar-spacer" />
          <div className="storage-card">
            <div className="storage-heading"><span>Local files</span><span>No app cap</span></div>
            <p>Uses available device storage</p>
        </div>
          <button className="profile-button" onClick={authUser ? handleSignOut : handleGoogleAuth} disabled={authPending}>
            <span className="profile-avatar">{authUser?.displayName?.[0] || 'G'}</span>
            <span className="profile-info"><strong>{authUser?.displayName || 'Sign in with Google'}</strong><small>{authUser?.email || 'Connect your account'}</small></span>
            {authUser ? <LogOut size={15} /> : <LogIn size={15} />}
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span className="crumb-muted">{activeNav === 'Studio' ? 'My projects' : activeNav}</span>
            <ChevronRight size={14} />
            <span className="crumb-current">{project.name}</span>
            <button className="title-chevron" title="Rename project" onClick={() => {
              const name = window.prompt('Name your project', project.name);
              if (name?.trim()) updateProject('name', name.trim());
            }}><ChevronDown size={14} /></button>
            <span className="save-status"><Cloud size={14} /> {savedAt}</span>
          </div>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast('You’re all caught up.')}>
              <Bell size={17} /><i />
            </button>
            <button className="help-button" onClick={() => setToast('Tip: describe your scene, camera movement, mood, and lighting in your prompt.')}>
              <CircleHelp size={16} /><span>Help</span>
            </button>
            <button className="theme-toggle" title={`Switch to ${darkMode ? 'light' : 'dark'} theme`} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} theme`} onClick={() => setDarkMode((current) => !current)}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="save-button" onClick={saveProject}><Save size={15} /><span>Save</span></button>
            <button className="share-button" onClick={() => setToast('Share links will be available when cloud sync is connected.')}><Share2 size={15} /> Share</button>
            <button className="export-button" onClick={exportVideo}><ArrowDownToLine size={16} /> Export</button>
          </div>
        </header>

        {activeNav === 'Settings' ? (
          <section className="settings-view">
            <div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="settings-intro">Make PlotPixel work the way you do.</p>
            <div className="settings-card">
              <div className="settings-row"><span className="settings-icon"><Moon size={17} /></span><span className="settings-row-copy"><strong>Dark theme</strong><small>Use a darker palette throughout the editor.</small></span><button className={`settings-switch ${darkMode ? 'on' : ''}`} role="switch" aria-checked={darkMode} aria-label="Dark theme" onClick={() => setDarkMode((current) => !current)}><i /></button></div>
              <div className="settings-row"><span className="settings-icon google-icon">G</span><span className="settings-row-copy"><strong>{authUser ? 'Google account connected' : 'Google account'}</strong><small>{authUser?.email || 'Use the same account on web and Android.'}</small></span>{authUser ? <button className="secondary-button" onClick={handleSignOut}><LogOut size={14} /> Sign out</button> : <button className="google-signin-button" disabled={authPending} onClick={handleGoogleAuth}><LogIn size={14} />{authPending ? 'Connecting…' : 'Continue with Google'}</button>}</div>
              <div className="settings-row"><span className="settings-icon"><Fingerprint size={18} /></span><span className="settings-row-copy"><strong>Android fingerprint lock</strong><small>{biometricAvailable ? 'Ask for your enrolled fingerprint when opening or returning to the app.' : 'Available on Android when a fingerprint is enrolled on this device.'}</small></span><button className={`settings-switch ${biometricEnabled ? 'on' : ''}`} role="switch" aria-checked={biometricEnabled} aria-label="Android fingerprint lock" disabled={!biometricAvailable} onClick={toggleBiometricLock}><i /></button></div>
              <div className="settings-row"><span className="settings-icon"><Smartphone size={17} /></span><span className="settings-row-copy"><strong>Video length and file size</strong><small>PlotPixel does not impose a duration or file-size cap on local video imports. Available memory, storage, browser, and device limits still apply.</small></span><span className="unlimited-badge"><ShieldCheck size={13} /> No app cap</span></div>
            </div>
            <div className="auth-setup-note"><strong>Sign-in setup</strong><p>Firebase client settings are loaded from the local <code>.env</code>. Android uses <code>app.PlotPixel.com</code>; add the debug/release signing SHA fingerprints in Firebase and re-download <code>google-services.json</code> if the OAuth Android client is missing.</p></div>
          </section>
        ) : activeNav === 'Projects' ? (
          <section className="library-view">
            <div className="library-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Your projects</h1><p>Pick up where your next big idea left off.</p></div><button className="primary-button" onClick={createProject}><Plus size={16} /> New project</button></div>
            <div className="project-grid">
              <button className="new-project-card" onClick={createProject}><span className="new-project-icon"><Plus size={22} /></span><strong>Create a new video</strong><span>Start with a prompt or a blank canvas</span></button>
              {savedProjects.map((item, index) => <button className="saved-project-card" key={`${item.name}-${index}`} onClick={() => selectProject(item)}><div className="project-thumb"><LandscapePreview /><span><Play size={14} fill="currentColor" /></span></div><strong>{item.name}</strong><small>{item.effect || 'Cinematic'} · {formatTime(item.duration)}</small></button>)}
              <button className="saved-project-card" onClick={() => selectProject(defaultProject)}><div className="project-thumb"><LandscapePreview /><span><Play size={14} fill="currentColor" /></span></div><strong>Where the wild things grow</strong><small>Edited just now · {formatTime(defaultProject.duration)}</small></button>
            </div>
          </section>
        ) : activeNav === 'Assets' || activeNav === 'Templates' ? (
          <section className="library-view">
            <div className="library-heading"><div><div className="eyebrow">PLOTPIXEL LIBRARY</div><h1>{activeNav}</h1><p>{activeNav === 'Assets' ? 'Keep your creative ingredients close at hand.' : 'A little inspiration to get you moving.'}</p></div>{activeNav === 'Assets' && <label className="primary-button upload-button"><Plus size={16} /> Upload files<input type="file" accept="image/*,video/*,audio/*" onChange={() => setToast('Asset upload is available when cloud storage is connected.')} /></label>}</div>
            <div className="empty-library"><span>{activeNav === 'Assets' ? <Layers3 size={28} /> : <LayoutTemplate size={28} />}</span><strong>{activeNav === 'Assets' ? 'Your media library is ready' : 'Templates are on the way'}</strong><p>{activeNav === 'Assets' ? 'Upload footage, images, and audio to use across your projects.' : 'Video starters, styles, and storyboards will show up here.'}</p><button className="secondary-button" onClick={() => setActiveNav('Studio')}>Back to studio</button></div>
          </section>
        ) : (
          <div className="editor-layout">
            <section className="editor-main">
              <div className="welcome-row">
                <div><div className="eyebrow">YOUR CREATIVE STUDIO</div><h1>Make something <span>remarkable.</span></h1></div>
                <button className="new-canvas-button" onClick={createProject}><Plus size={15} /> New project</button>
              </div>

              <section className="prompt-card">
                <div className="prompt-heading"><span className="prompt-sparkle"><WandSparkles size={16} /></span><div><strong>Turn a thought into a film</strong><span>Describe the video you want to create</span></div><button className="prompt-tip" onClick={() => setToast('Try: subject + setting + camera movement + mood + lighting.')}>Prompt tips <ChevronRight size={13} /></button></div>
                <textarea aria-label="Video prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A quiet morning in the mountains, golden light drifting over the trees..." rows={2} />
                <div className="prompt-footer">
                  <div className="prompt-tools">
                    <button onClick={() => videoInputRef.current?.click()}><Image size={15} /> Import video</button>
                    <input ref={videoInputRef} type="file" accept="video/*" className="visually-hidden" onChange={handleVideoImport} />
                    <span className="tool-divider" />
                    <button onClick={() => setToast('Describe your scene in any language.')}><Sparkles size={14} /> Enhance prompt</button>
                  </div>
                  <div className="generate-group">
                    <button className="generate-button" onClick={generateVideo}><Sparkles size={15} />Generate video<span className="key-hint">↵</span></button>
                    <button className="generate-options" aria-label="Generation options" onClick={() => setToast('Local video imports have no PlotPixel time or size cap. AI generation depends on the connected provider.')}><ChevronDown size={15} /></button>
                  </div>
                </div>
              </section>

              <div className="studio-workspace">
                <div className="section-toolbar">
                  <div className="section-tabs"><button className="tab-back" aria-label="Back" onClick={() => setActiveNav('Projects')}><ArrowLeft size={15} /></button><button className="workspace-tab active"><Film size={15} /> Editor</button><button className="workspace-tab" onClick={() => setToast('Storyboard view is coming soon.')}><Layers3 size={15} /> Storyboard</button></div>
                  <div className="canvas-tools"><button title="Undo" onClick={() => setToast('Nothing to undo yet.')}><RefreshCw size={15} /></button><span className="tool-divider" /><button title="Canvas size" onClick={() => setToast(`Canvas ratio: ${project.aspect}`)}><Crop size={15} /><span>{project.aspect}</span><ChevronDown size={13} /></button><button title="Fit preview" onClick={() => setToast('Preview fit to canvas.')}><Expand size={15} /></button></div>
                </div>

                <div className="video-stage">
                  {importedVideo
                    ? <video ref={videoElementRef} className="imported-video" src={importedVideo.url} muted={!volumeOn} onLoadedMetadata={handleVideoMetadata} onTimeUpdate={handleVideoTimeUpdate} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ filter: `brightness(${0.65 + adjustments.Brightness / 100 * 0.7}) contrast(${0.65 + adjustments.Contrast / 100 * 0.7}) saturate(${0.5 + adjustments.Saturation / 100}) sepia(${adjustments.Temperature / 100 * 0.12})` }} />
                    : <LandscapePreview effect={selectedEffect} intensity={effectIntensity} adjustments={adjustments} />}
                  <div className="preview-top-left"><span className="live-dot" /> {importedVideo ? 'IMPORTED VIDEO' : 'PREVIEW'}</div>
                  <button className="preview-expand" title="Expand preview" onClick={() => setToast('The preview is fitted to your workspace.')}><Expand size={15} /></button>
                  <div className="preview-caption"><span>SCENE 01</span><span>{project.effect.toUpperCase()} GRADE</span></div>
                  <div className="stage-controls">
                    <span className="stage-time">{formattedTime} <i>/</i> {formatTime(project.duration)}</span>
                    <div className="playback-buttons"><button aria-label="Previous scene" onClick={() => { setProgress(0); if (videoElementRef.current) videoElementRef.current.currentTime = 0; }}><ChevronLeft size={17} /></button><button className="play-button" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={togglePreviewPlayback}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><button aria-label="Next scene" onClick={() => { const next = Math.min(progress + 10, 100); setProgress(next); if (videoElementRef.current) videoElementRef.current.currentTime = project.duration * next / 100; }}><ChevronRight size={17} /></button></div>
                    <button className="volume-button" aria-label={volumeOn ? 'Mute' : 'Unmute'} onClick={() => setVolumeOn(!volumeOn)}>{volumeOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                  </div>
                  <div className="playback-line"><span style={{ width: `${progress}%` }} /><i style={{ left: `${progress}%` }} /></div>
                </div>

                <div className="timeline">
                  <div className="timeline-header">
                    <div className="timeline-length"><strong>Timeline</strong><span className="timeline-duration"><Clock3 size={13} /> {formatTime(project.duration)}</span><label>Sequence seconds<input aria-label="Sequence length in seconds" type="number" min="1" step="1" value={project.duration} onChange={(event) => setSequenceDuration(event.target.value)} /></label></div>
                    <div className="timeline-actions"><button title="Add track" onClick={() => setToast('Additional tracks are ready for imported media.')}><ListPlus size={16} /></button><button title="Timeline settings" onClick={() => setToast('Timeline settings are up to date.')}><Settings2 size={15} /></button><span /><button title="Zoom out" onClick={() => setToast('Timeline zoom adjusted.')}><span className="zoom-minus">−</span></button><div className="zoom-track"><i /></div><button title="Zoom in" onClick={() => setToast('Timeline zoom adjusted.')}><Plus size={14} /></button></div>
                  </div>
                  <div className="timeline-ruler">{[0, 0.25, 0.5, 0.75, 1].map((fraction) => <span key={fraction}>{formatTime(project.duration * fraction)}</span>)}</div>
                  <div className="track-row">
                    <div className="track-label"><Film size={15} /><span>Video 1</span><button title="Track options" onClick={() => setToast('Track options')}><MoreHorizontal size={15} /></button></div>
                    <div className="track-content">
                      <button className="clip video-clip" onClick={() => setToast('Video clip selected · import any local video with no PlotPixel size or duration cap.')}>
                        <span className="clip-thumbnails"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><span className="clip-name"><Scissors size={12} /> {importedVideo?.name || 'Mountain sunrise'} · {formatTime(project.duration)}</span>
                      </button>
                    </div>
                  </div>
                  <div className="track-row audio-row">
                    <div className="track-label"><Music2 size={15} /><span>Audio 1</span><button title="Track options" onClick={() => setToast('Track options')}><MoreHorizontal size={15} /></button></div>
                    <div className="track-content"><button className="clip audio-clip" onClick={() => setToast('Audio track selected · add music or voiceover from Assets.')}><span className="waveform">{Array.from({ length: 64 }, (_, index) => <i key={index} style={{ height: `${12 + ((index * 17 + 19) % 75)}%` }} />)}</span><span className="audio-name"><Music2 size={12} /> Golden Hour · ambient</span></button></div>
                  </div>
                  <div className="timeline-playhead" style={{ left: `calc(116px + (100% - 132px) * ${progress / 100})` }}><span /></div>
                </div>
              </div>

              <div className="below-workspace">
                <div className="scene-card"><span className="scene-thumb"><LandscapePreview /><b>01</b></span><span className="scene-copy"><strong>{importedVideo?.name || 'Mountain sunrise'}</strong><small>{formatTime(project.duration)} · 1 clip</small></span><button onClick={() => setToast('Add another scene to extend your story.')}><Plus size={15} /></button></div>
                <button className="add-scene-button" onClick={() => setToast('New scene added to your storyboard.')}><Plus size={16} /><span>Add scene</span></button>
              </div>
            </section>

            <aside className="inspector">
              <div className="inspector-header"><div><span className="inspector-icon"><WandSparkles size={15} /></span><strong>Fine-tune</strong></div><button aria-label="Inspector options" onClick={() => setToast('Your edits are saved automatically.')}><MoreHorizontal size={17} /></button></div>
              <div className="inspector-tabs"><button className={activeTab === 'Effects' ? 'selected' : ''} onClick={() => setActiveTab('Effects')}>Effects</button><button className={activeTab === 'Adjust' ? 'selected' : ''} onClick={() => setActiveTab('Adjust')}>Adjust</button><button className={activeTab === 'Audio' ? 'selected' : ''} onClick={() => setActiveTab('Audio')}>Audio</button></div>
              {activeTab === 'Effects' ? (
                <>
                  <div className="inspector-section"><div className="inspector-label">VISUAL STYLE <button onClick={() => setSelectedEffect('Cinematic')}>Reset</button></div>
                    <div className="effect-list">{effectOptions.map(({ name, detail, icon: Icon }) => <button key={name} className={`effect-option ${selectedEffect === name ? 'chosen' : ''}`} onClick={() => { setSelectedEffect(name); updateProject('effect', name); }}><span className="effect-icon"><Icon size={16} /></span><span className="effect-text"><strong>{name}</strong><small>{detail}</small></span>{selectedEffect === name && <span className="effect-check"><Check size={12} /></span>}</button>)}</div>
                  </div>
                  <div className="inspector-section intensity-section"><div className="intensity-heading"><span>Effect intensity</span><strong>{effectIntensity}%</strong></div><input aria-label="Effect intensity" type="range" min="0" max="100" value={effectIntensity} onChange={(event) => setEffectIntensity(Number(event.target.value))} /></div>
                  <div className="inspector-section"><div className="inspector-label">COLOR GRADE</div><button className="grade-card" onClick={() => setToast('Color grading controls are ready to adjust.')}><span className="grade-swatch"><i /><i /><i /><i /></span><span><strong>Golden hour</strong><small>Warm · cinematic</small></span><ChevronRight size={15} /></button></div>
                  <div className="inspector-section"><div className="inspector-label">AI TOOLS</div><button className="ai-tool-button" onClick={() => { setShowFaceEditor(true); setConsent(false); }}><span className="ai-tool-icon face-icon"><Aperture size={16} /></span><span><strong>Face studio</strong><small>With consent, always</small></span><ChevronRight size={15} /></button><button className="ai-tool-button" onClick={() => setToast('Background removal is available when AI processing is connected.')}><span className="ai-tool-icon"><Sparkles size={16} /></span><span><strong>Remove background</strong><small>One-click cutout</small></span><ChevronRight size={15} /></button></div>
                  <div className="inspector-tip"><Sparkles size={15} /><p><strong>Little pro tip</strong><br />Try pairing a warm grade with soft grain for that filmic feel.</p><button onClick={() => setToast('Tip saved for later.')}>Got it</button></div>
                </>
              ) : activeTab === 'Adjust' ? (
                <div className="adjust-panel"><div className="inspector-label">IMAGE ADJUSTMENTS</div>{Object.entries(adjustments).map(([label, value]) => <label className="adjust-control" key={label}><span>{label}<b>{value}</b></span><input type="range" min="0" max="100" value={value} aria-label={label} onChange={(event) => setAdjustments((current) => ({ ...current, [label]: Number(event.target.value) }))} /></label>)}<button className="reset-adjust" onClick={() => setAdjustments({ Brightness: 54, Contrast: 62, Saturation: 68, Temperature: 58 })}>Reset adjustments</button></div>
              ) : (
                <div className="audio-panel"><div className="inspector-label">SOUND DESIGN</div><div className="audio-choice"><span className="audio-choice-icon"><Music2 size={17} /></span><span><strong>Golden Hour</strong><small>Ambient · 00:24</small></span><button aria-label="Play audio" onClick={() => setToast('Audio preview is ready.')}><Play size={14} fill="currentColor" /></button></div><label className="adjust-control"><span>Music volume<b>78%</b></span><input type="range" defaultValue="78" aria-label="Music volume" /></label><button className="ai-tool-button" onClick={() => setToast('Voiceover recording is ready to connect.')}><span className="ai-tool-icon"><AudioLines size={16} /></span><span><strong>Add voiceover</strong><small>Record or generate narration</small></span><Plus size={15} /></button><button className="ai-tool-button" onClick={() => setToast('Audio ducking enabled for voiceover tracks.')}><span className="ai-tool-icon"><Volume2 size={16} /></span><span><strong>Auto ducking</strong><small>Balance music and speech</small></span><Check size={14} /></button></div>
              )}
              <div className="inspector-footer"><span><BadgeCheck size={14} /> Non-destructive editing</span><button onClick={() => setToast('Editing shortcuts: Space to play · S to split · ⌘Z to undo.')}><CircleHelp size={14} /> Shortcuts</button></div>
            </aside>
          </div>
        )}
      </main>

      {showFaceEditor && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowFaceEditor(false); }}>
        <section className="face-modal" role="dialog" aria-modal="true" aria-labelledby="face-modal-title">
          <div className="modal-top"><span className="modal-symbol"><Aperture size={19} /></span><button className="modal-close" aria-label="Close" onClick={() => setShowFaceEditor(false)}><X size={18} /></button></div>
          <div className="eyebrow">RESPONSIBLE AI EDITING</div><h2 id="face-modal-title">Face studio</h2><p className="face-modal-intro">Edit a face in your video using a reference image. Only work with people who have given clear permission.</p>
          <div className="consent-notice"><LockKeyhole size={17} /><span><strong>Consent matters.</strong> Uploading a face is only appropriate when the person has agreed to this edit.</span></div>
          <label className={`face-upload ${faceImage ? 'has-image' : ''}`} htmlFor="face-reference">
            {faceImage ? <img src={faceImage} alt="Selected reference face" /> : <span className="upload-icon"><Image size={20} /></span>}
            <strong>{faceImage ? 'Reference image selected' : 'Add a reference face'}</strong><small>{faceImage ? 'Choose a different image' : 'Choose an image from your device'}</small>
            <input id="face-reference" type="file" accept="image/*" onChange={handleFaceUpload} />
          </label>
          <label className="target-person-label" htmlFor="target-person">APPLY TO
            <select id="target-person" value={targetPerson} onChange={(event) => setTargetPerson(event.target.value)}>
              <option value="person-1">Person 1 · selected clip</option>
              <option value="person-2">Person 2 · selected clip</option>
            </select>
          </label>
          <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I confirm I have permission from the person depicted to use their likeness in this edit.</span></label>
          <div className="modal-actions"><button className="cancel-button" onClick={() => setShowFaceEditor(false)}>Cancel</button><button className="apply-face-button" disabled={!consent || !faceImage} onClick={() => { setShowFaceEditor(false); setToast('Face edit is ready when your approved AI service is connected.'); }}><Sparkles size={15} /> Continue</button></div>
          <div className="privacy-note"><LockKeyhole size={12} /> Reference images stay on your device in this demo.</div>
        </section>
      </div>}

      {(biometricLocked || biometricInitializing) && <div className="biometric-lock-screen" role="dialog" aria-modal="true" aria-labelledby="biometric-lock-title">
        <div className="biometric-lock-card"><span className="biometric-lock-icon"><Fingerprint size={27} /></span><h2 id="biometric-lock-title">{biometricInitializing && !biometricLocked ? 'Checking app lock…' : 'PlotPixel is locked'}</h2><p>Verify your fingerprint to continue. You can also use your Android device credentials.</p>{!biometricInitializing && <button className="google-signin-button" onClick={verifyFingerprintUnlock}><Fingerprint size={15} /> Try fingerprint again</button>}<small>The system prompt provides the device-credential fallback.</small></div>
      </div>}

      {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}
    </div>
  );
}

export default App;
