import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleQuickDemo = (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setIsLoading(true);
    setFeedback({
      message: `Authenticating demo ${
        role === 'citizen'
          ? 'Citizen'
          : role === 'staff'
          ? 'Nagar Nigam Staff'
          : role === 'worker'
          ? 'Sanitation Crew (Driver / Collector)'
          : 'Recycling Partner'
      }...`,
    });

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(demoUser);
    }, 600);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;

    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      setIsLoading(false);

      // Determine role from input or default to citizen
      let user = DEMO_USERS.citizen;
      if (loginIdentifier.includes('staff') || loginIdentifier.includes('gov') || loginIdentifier.includes('verma')) {
        user = DEMO_USERS.staff;
      } else if (
        loginIdentifier.includes('worker') ||
        loginIdentifier.includes('driver') ||
        loginIdentifier.includes('ramesh') ||
        loginIdentifier.includes('collector')
      ) {
        user = DEMO_USERS.worker;
      } else if (loginIdentifier.includes('recycler') || loginIdentifier.includes('greencycle') || loginIdentifier.includes('mehta')) {
        user = DEMO_USERS.recycler;
      } else {
        user = {
          ...DEMO_USERS.citizen,
          email: loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@swachh.citizen`,
        };
      }

      setFeedback({
        message: `Welcome back, ${user.firstName}! Redirecting to ${
          user.role === 'citizen'
            ? 'Citizen Dashboard'
            : user.role === 'staff'
            ? 'Operations Command'
            : user.role === 'worker'
            ? 'Sanitation Worker Portal'
            : 'Recycler Marketplace'
        }...`,
      });

      setTimeout(() => {
        onLoginSuccess(user);
      }, 700);
    }, 900);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !registerEmail || !registerPassword || !agreeTerms) return;

    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      setIsLoading(false);
      const newUser: User = {
        id: `usr-${Date.now()}`,
        firstName,
        lastName: lastName || '',
        email: registerEmail,
        role: selectedRole,
        ward: selectedRole === 'citizen' ? 'Ward 14 (Indirapuram Sector 4)' : selectedRole === 'staff' ? 'Central Zone' : undefined,
        greenPoints: selectedRole === 'citizen' ? 100 : undefined,
        organization: selectedRole === 'recycler' ? `${firstName} Green Solutions Pvt Ltd` : undefined,
        aadharVerified: true,
      };

      setFeedback({
        message: `Account created successfully! Welcome to SwachhConnect, ${newUser.firstName}.`,
      });

      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 800);
    }, 1000);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 bg-[#ffffff]">
      <div className="w-full max-w-md bg-[#ffffff] border border-[#e0e3e5] rounded-lg p-6 shadow-sm">
        {/* Auth Toggle */}
        <div className="flex border-b border-[#e0e3e5] mb-6">
          <button
            type="button"
            className={`flex-1 py-2 font-semibold text-sm text-center border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-[#154212] text-[#154212]'
                : 'border-transparent text-[#515f74] hover:text-[#154212]'
            }`}
            id="tab-login"
            onClick={() => {
              setActiveTab('login');
              setFeedback(null);
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 font-semibold text-sm text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-[#154212] text-[#154212]'
                : 'border-transparent text-[#515f74] hover:text-[#154212]'
            }`}
            id="tab-register"
            onClick={() => {
              setActiveTab('register');
              setFeedback(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form className="space-y-4" id="login-form" onSubmit={handleLoginSubmit}>
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e] mb-1">Welcome Back</h1>
              <p className="text-sm text-[#42493e]">Sign in to access your dashboard.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1" htmlFor="login-email">
                  Mobile Number or Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e] placeholder-[#72796e]"
                  id="login-email"
                  placeholder="10-digit mobile or email"
                  required
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#42493e]" htmlFor="login-password">
                    Password / OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Demo Reset: You can use any 4+ character password or 1-click quick demo buttons below.')}
                    className="text-xs text-[#154212] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e]"
                  id="login-password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full bg-[#154212] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-75"
              id="login-submit"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              {isLoading && (
                <span className="material-symbols-outlined text-base animate-spin" id="login-spinner">
                  progress_activity
                </span>
              )}
            </button>
          </form>
        )}

        {/* Registration Form */}
        {activeTab === 'register' && (
          <form className="space-y-4" id="register-form" onSubmit={handleRegisterSubmit}>
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e] mb-1">Create Account</h1>
              <p className="text-sm text-[#42493e]">Join SwachhConnect to support your local Nagar Nigam.</p>
            </div>

            <div className="space-y-3">
              {/* Role Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#42493e] mb-2">Select Your Role</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="relative">
                    <input
                      checked={selectedRole === 'citizen'}
                      onChange={() => setSelectedRole('citizen')}
                      className="role-radio sr-only"
                      id="role-citizen"
                      name="role"
                      type="radio"
                      value="citizen"
                    />
                    <label
                      className={`flex flex-col items-center justify-center p-2.5 border rounded cursor-pointer transition-colors h-full ${
                        selectedRole === 'citizen'
                          ? 'border-[#154212] bg-[#f7f9fb]'
                          : 'border-[#c2c9bb] hover:bg-[#eceef0]'
                      }`}
                      htmlFor="role-citizen"
                    >
                      <span className={`material-symbols-outlined mb-1 ${selectedRole === 'citizen' ? 'text-[#154212]' : 'text-[#515f74]'}`}>
                        person
                      </span>
                      <span className="text-xs font-medium text-center leading-tight">Citizen</span>
                      {selectedRole === 'citizen' && (
                        <span className="material-symbols-outlined absolute top-1 right-1 text-[#154212] text-[16px]">
                          check_circle
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      checked={selectedRole === 'staff'}
                      onChange={() => setSelectedRole('staff')}
                      className="role-radio sr-only"
                      id="role-staff"
                      name="role"
                      type="radio"
                      value="staff"
                    />
                    <label
                      className={`flex flex-col items-center justify-center p-2.5 border rounded cursor-pointer transition-colors h-full ${
                        selectedRole === 'staff'
                          ? 'border-[#154212] bg-[#f7f9fb]'
                          : 'border-[#c2c9bb] hover:bg-[#eceef0]'
                      }`}
                      htmlFor="role-staff"
                    >
                      <span className={`material-symbols-outlined mb-1 ${selectedRole === 'staff' ? 'text-[#154212]' : 'text-[#515f74]'}`}>
                        badge
                      </span>
                      <span className="text-xs font-medium text-center leading-tight">Nagar Nigam Staff</span>
                      {selectedRole === 'staff' && (
                        <span className="material-symbols-outlined absolute top-1 right-1 text-[#154212] text-[16px]">
                          check_circle
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      checked={selectedRole === 'recycler'}
                      onChange={() => setSelectedRole('recycler')}
                      className="role-radio sr-only"
                      id="role-recycler"
                      name="role"
                      type="radio"
                      value="recycler"
                    />
                    <label
                      className={`flex flex-col items-center justify-center p-2.5 border rounded cursor-pointer transition-colors h-full ${
                        selectedRole === 'recycler'
                          ? 'border-[#154212] bg-[#f7f9fb]'
                          : 'border-[#c2c9bb] hover:bg-[#eceef0]'
                      }`}
                      htmlFor="role-recycler"
                    >
                      <span className={`material-symbols-outlined mb-1 ${selectedRole === 'recycler' ? 'text-[#154212]' : 'text-[#515f74]'}`}>
                        recycling
                      </span>
                      <span className="text-xs font-medium text-center leading-tight">Recycling Partner</span>
                      {selectedRole === 'recycler' && (
                        <span className="material-symbols-outlined absolute top-1 right-1 text-[#154212] text-[16px]">
                          check_circle
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      checked={selectedRole === 'worker'}
                      onChange={() => setSelectedRole('worker')}
                      className="role-radio sr-only"
                      id="role-worker"
                      name="role"
                      type="radio"
                      value="worker"
                    />
                    <label
                      className={`flex flex-col items-center justify-center p-2.5 border rounded cursor-pointer transition-colors h-full ${
                        selectedRole === 'worker'
                          ? 'border-[#154212] bg-[#f7f9fb]'
                          : 'border-[#c2c9bb] hover:bg-[#eceef0]'
                      }`}
                      htmlFor="role-worker"
                    >
                      <span className={`material-symbols-outlined mb-1 ${selectedRole === 'worker' ? 'text-[#154212]' : 'text-[#515f74]'}`}>
                        local_shipping
                      </span>
                      <span className="text-xs font-medium text-center leading-tight">Field Crew / Driver</span>
                      {selectedRole === 'worker' && (
                        <span className="material-symbols-outlined absolute top-1 right-1 text-[#154212] text-[16px]">
                          check_circle
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1" htmlFor="reg-fname">
                    First Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e]"
                    id="reg-fname"
                    required
                    type="text"
                    placeholder="e.g. Aarav"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1" htmlFor="reg-lname">
                    Last Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e]"
                    id="reg-lname"
                    required
                    type="text"
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1" htmlFor="reg-email">
                  Mobile Number or Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e]"
                  id="reg-email"
                  placeholder="10-digit mobile or email"
                  required
                  type="text"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1" htmlFor="reg-password">
                  Password / Aadhar Link
                </label>
                <input
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded bg-white focus:border-[#154212] focus:ring-1 focus:ring-[#154212] focus:outline-none text-sm text-[#191c1e]"
                  id="reg-password"
                  minLength={6}
                  placeholder="Min 6 characters"
                  required
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2 mt-2">
                <input
                  className="mt-1 border-[#c2c9bb] rounded text-[#154212] focus:ring-[#154212]"
                  id="terms"
                  required
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label className="text-xs text-[#42493e]" htmlFor="terms">
                  I agree to the <span className="text-[#154212] font-semibold cursor-pointer underline">Terms of Service</span> and confirm my details for SwachhBharat compliance.
                </label>
              </div>
            </div>

            <button
              className="w-full bg-[#154212] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-75"
              id="reg-submit"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              {isLoading && (
                <span className="material-symbols-outlined text-base animate-spin" id="reg-spinner">
                  progress_activity
                </span>
              )}
            </button>
          </form>
        )}

        {/* API Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded text-xs text-center border font-medium ${
              feedback.isError
                ? 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30'
                : 'bg-[#2d5a27] text-white border-[#154212]'
            }`}
            id="api-feedback"
          >
            {feedback.message}
          </div>
        )}

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="mt-6 pt-5 border-t border-[#e0e3e5]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#515f74] text-center mb-3">
            Quick 1-Click Persona Access (Instant Demo)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              className="flex flex-col items-center justify-center p-2 rounded border border-[#c2c9bb] bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#154212] text-[20px] mb-0.5">person</span>
              <span className="font-semibold text-[11px] text-[#191c1e]">Citizen</span>
              <span className="text-[9px] text-[#515f74]">Report & Track</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('staff')}
              className="flex flex-col items-center justify-center p-2 rounded border border-[#c2c9bb] bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#515f74] text-[20px] mb-0.5">badge</span>
              <span className="font-semibold text-[11px] text-[#191c1e]">Nagar Nigam</span>
              <span className="text-[9px] text-[#515f74]">Fleet & Bins</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('worker')}
              className="flex flex-col items-center justify-center p-2 rounded border border-[#c2c9bb] bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#154212] text-[20px] mb-0.5">local_shipping</span>
              <span className="font-semibold text-[11px] text-[#191c1e]">Field Worker</span>
              <span className="text-[9px] text-[#515f74]">Driver & Crew</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('recycler')}
              className="flex flex-col items-center justify-center p-2 rounded border border-[#c2c9bb] bg-[#f7f9fb] hover:bg-[#eceef0] transition-colors text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#60233e] text-[20px] mb-0.5">recycling</span>
              <span className="font-semibold text-[11px] text-[#191c1e]">Recycler</span>
              <span className="text-[9px] text-[#515f74]">Scrap Bids</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
