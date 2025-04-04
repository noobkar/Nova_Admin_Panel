import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock } from 'react-feather';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import './Login.scss';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { loginUser, loading, error } = useAuth();
  const navigate = useNavigate();

  console.log('[Login] Component mounted');

  const validate = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    console.log('[Login] Validation result:', Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Form submitted with email:', email);
    
    if (!validate()) {
      console.log('[Login] Validation failed');
      return;
    }
    
    console.log('[Login] Attempting login...');
    try {
      const success = await loginUser(email, password);
      console.log('[Login] Login attempt result:', success);
      
      if (success) {
        console.log('[Login] Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('[Login] Login failed, staying on login page');
      }
    } catch (err) {
      console.error('[Login] Unexpected error during login:', err);
    }
  };

  return (
    <div className="login">
      <div className="login__container">
        <div className="login__header">
          <Shield size={32} className="login__logo" />
          <h1 className="login__title">NOVA VPN Admin</h1>
        </div>
        
        <form className="login__form" onSubmit={handleSubmit}>
          <h2 className="login__form-title">Sign In</h2>
          
          {error && (
            <div className="login__error">
              {error}
            </div>
          )}
          
          <Input
            type="email"
            id="email"
            name="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<User size={18} />}
            fullWidth
          />
          
          <Input
            type="password"
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock size={18} />}
            fullWidth
          />
          
          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};
