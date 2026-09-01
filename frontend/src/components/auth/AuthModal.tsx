import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ThreeBackground } from '../ui/ThreeBackground';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2,
  Zap,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  X,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email address or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    job_title: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export const AuthModal: React.FC = () => {
  const { login, register: registerUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { addToast } = useNotifications();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justRegisteredEmail, setJustRegisteredEmail] = useState<string | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ssoModal, setSsoModal] = useState<string | null>(null);

  // 3D Tilt State for Interactive Live Card Effect (desktop only)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices — disable tilt on mobile
  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / rect.height) * 12,
      y: (x / rect.width) * 12,
    });
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setTilt({ x: 0, y: 0 });
  };

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      job_title: '',
      password: '',
      confirm_password: '',
    },
  });

  const handleLoginSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await login(data.email.trim(), data.password);
      addToast('Welcome Back!', 'Successfully authenticated to NexusFlow Platform.', 'success');
    } catch (err: any) {
      if (!err.response) {
        addToast(
          'Connection Error',
          'Backend API is unreachable. Please ensure the Django server is running on http://127.0.0.1:8000',
          'error'
        );
        return;
      }
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email/username or password credentials.';
      addToast('Login Failed', detail, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      addToast(
        'Account Created Successfully! 🎉',
        'Please sign in with your email and password to access your workspace.',
        'success'
      );
      setJustRegisteredEmail(data.email);
      loginForm.setValue('email', data.email);
      loginForm.setValue('password', '');
      setIsSignUp(false);
    } catch (err: any) {
      if (!err.response) {
        addToast(
          'Connection Error',
          'Backend API is unreachable. Please ensure the Django server is running on http://127.0.0.1:8000',
          'error'
        );
        return;
      }
      const respData = err.response?.data;
      const errMsg =
        respData?.password?.[0] ||
        respData?.email?.[0] ||
        respData?.username?.[0] ||
        respData?.non_field_errors?.[0] ||
        respData?.detail ||
        (typeof respData === 'object' && respData !== null
          ? Object.values(respData).flat().join(' ')
          : null) ||
        'Registration failed. Please check your inputs.';
      addToast('Registration Failed', errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOClick = (provider: string) => {
    setSsoModal(provider);
  };

  const featureCards = [
    {
      title: 'Real-Time WebSocket Sync',
      desc: 'Instant state propagation across team boards with zero latency.',
      icon: Activity,
      tag: 'Live Broadcast',
    },
    {
      title: '3D Spatial Workspace',
      desc: 'Immersive WebGL rendering engine tailored for enterprise teams.',
      icon: Layers,
      tag: 'WebGL Engine',
    },
    {
      title: 'Multi-Tenant Security',
      desc: 'JWT authentication, RBAC roles, and isolated project scope.',
      icon: ShieldCheck,
      tag: 'Enterprise Grade',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 py-6 sm:py-10 bg-slate-100/90 dark:bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto card-3d-perspective">

      {/* Floating Theme Toggle Switch on Login & Signup Page */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg backdrop-blur-md transition-all duration-200 active:scale-95 text-xs font-bold"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* SSO Coming Soon Overlay */}
      {ssoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center animate-fade-in">
            <button
              onClick={() => setSsoModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 shadow-xs">
              <Clock className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-3">
              <Sparkles className="w-3 h-3" />
              Coming Soon
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              {ssoModal} Sign‑In
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              OAuth integration with <span className="text-blue-600 dark:text-blue-400 font-semibold">{ssoModal}</span> is actively being built and will be available in NexusFlow v2.5.
            </p>
            <p className="text-xs text-slate-500 mb-6">In the meantime, use your email and password to sign in.</p>
            <button
              onClick={() => setSsoModal(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-xs active:scale-95"
            >
              Use Email & Password
            </button>
          </div>
        </div>
      )}

      {/* Interactive 3D Canvas Background */}
      <ThreeBackground />

      {/* Main 2-Column Split Card Container */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isTouchDevice ? 'none' : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.1s ease-out',
        }}
        className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 my-auto card-3d-body transition-all duration-300"
      >
        {/* Left Side: Product Showcase Corporate Panel — hidden on mobile */}
        <div className="hidden md:flex md:col-span-5 p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">

          {/* Minimalist Radial Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-25 pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-3" style={{ transform: 'translateZ(20px)' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full text-[11px] font-bold text-blue-600 dark:text-blue-400 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>NexusFlow Enterprise v2.4</span>
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Collaborative Workspaces
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Build, track, and ship high-velocity projects in real-time.
              </p>
            </div>
          </div>

          {/* Center: Corporate Feature & Activity Cards */}
          <div className="my-5 relative z-10 space-y-3" style={{ transform: 'translateZ(30px)' }}>

            {/* Live Socket Status Pill */}
            <div className="p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>WebSockets Active</span>
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Broadcasting workspace events</div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </div>

            {/* Dynamic Feature Slider Card */}
            <div className="p-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-xs">
                    {React.createElement(featureCards[activeFeatureTab].icon, { className: 'w-4 h-4' })}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                    {featureCards[activeFeatureTab].title}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {featureCards[activeFeatureTab].tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                {featureCards[activeFeatureTab].desc}
              </p>

              {/* Slider Controls */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  {featureCards.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveFeatureTab(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${activeFeatureTab === idx
                          ? 'w-5 bg-blue-600 dark:bg-blue-500'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                        }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveFeatureTab((prev) => (prev + 1) % featureCards.length)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition active:scale-95"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Active Team Presence Live Card */}
            <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Workspace Members</span>
              </div>
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700">
                  AA
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700">
                  JD
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700">
                  MK
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400" style={{ transform: 'translateZ(15px)' }}>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>SaaS Uptime 99.9%</span>
            </span>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              NexusFlow Engine
            </span>
          </div>
        </div>

        {/* Right Side: Form & SSO Authentication Card */}
        <div className="md:col-span-7 p-5 sm:p-6 md:p-7 flex flex-col justify-center bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 relative z-10">
          <div>
            {/* Header Title */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {isSignUp ? 'Create your Account' : 'Sign in to Workspace'}
                </h2>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/30">
                  {isSignUp ? 'Free Plan' : 'Sign In'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isSignUp
                  ? 'Join high-velocity engineering teams on NexusFlow'
                  : 'Enter your credentials to access your live workspace'}
              </p>
            </div>

            {/* Success Notice if Just Registered */}
            {justRegisteredEmail && !isSignUp && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium shadow-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Account created! Enter password for <strong>{justRegisteredEmail}</strong> to sign in.
                </span>
              </div>
            )}



            {/* Form Body */}
            {!isSignUp ? (
              <form
                onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                className="space-y-3.5"
                autoComplete="off"
              >
                <Input
                  label="Email or Username"
                  type="text"
                  placeholder="admin@pulse.com or admin"
                  autoComplete="off"
                  leftIcon={<Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {...loginForm.register('email')}
                  error={loginForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none hover:text-blue-600 dark:hover:text-blue-400 transition text-slate-400 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...loginForm.register('password')}
                  error={loginForm.formState.errors.password?.message}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-1 py-3 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-xl border border-blue-500/30 transition-all duration-200 active:scale-95"
                  isLoading={isLoading}
                >
                  Sign In to Workspace
                </Button>
              </form>
            ) : (
              <form
                onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
                className="space-y-3"
                autoComplete="off"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="Azeem"
                    autoComplete="off"
                    {...registerForm.register('first_name')}
                    error={registerForm.formState.errors.first_name?.message}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Aslam"
                    autoComplete="off"
                    {...registerForm.register('last_name')}
                    error={registerForm.formState.errors.last_name?.message}
                  />
                </div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="azeem@company.com"
                  autoComplete="off"
                  leftIcon={<Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {...registerForm.register('email')}
                  error={registerForm.formState.errors.email?.message}
                />
                <Input
                  label="Username"
                  placeholder="azeemaslam"
                  autoComplete="off"
                  leftIcon={<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {...registerForm.register('username')}
                  error={registerForm.formState.errors.username?.message}
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none hover:text-blue-600 dark:hover:text-blue-400 transition text-slate-400 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...registerForm.register('password')}
                  error={registerForm.formState.errors.password?.message}
                />
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none hover:text-blue-600 dark:hover:text-blue-400 transition text-slate-400 p-0.5"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  {...registerForm.register('confirm_password')}
                  error={registerForm.formState.errors.confirm_password?.message}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-1 py-3 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-xl border border-blue-500/30 transition-all duration-200 active:scale-95"
                  isLoading={isLoading}
                >
                  Create Free Account
                </Button>
              </form>
            )}

            {/* SSO Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-950 px-3 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800 rounded-full">
                  Or continue with SSO
                </span>
              </div>
            </div>

            {/* SSO Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleSSOClick('Google')}
                className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full leading-none shadow-xs">Soon</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => handleSSOClick('GitHub')}
                className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0 fill-current text-slate-800 dark:text-slate-100" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full leading-none shadow-xs">Soon</span>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={() => handleSSOClick('Microsoft')}
                className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#00a4ef" d="M13 1h10v10H13z" />
                  <path fill="#7fba00" d="M1 13h10v10H1z" />
                  <path fill="#ffb900" d="M13 13h10v10H13z" />
                </svg>
                <span>Microsoft</span>
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full leading-none shadow-xs">Soon</span>
              </button>
            </div>

            {/* Security Badge Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>256-bit TLS Encrypted</span>
              </span>

              {/* Switch Tab between Sign In and Sign Up */}
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  {isSignUp ? 'Existing user?' : 'New here?'}
                </span>{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setJustRegisteredEmail(null);
                  }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition"
                >
                  <span>{isSignUp ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
