import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock } from 'react-feather';
import { login } from '../../services/auth';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import './Login.scss';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setError(Object.keys(errors).length > 0 ? 'Please correct the form errors' : null);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
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

export default Login;