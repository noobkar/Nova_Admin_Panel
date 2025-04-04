import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  Server, 
  Link as LinkIcon,
  DollarSign,
  Briefcase,
  CreditCard,
  Settings, 
  Menu, 
  X, 
  User, 
  LogOut 
} from 'react-feather';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import './Sidebar.scss';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { isDarkMode } = useTheme();

  const navItems = [
    { icon: <BarChart2 size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users size={20} />, label: 'User Management', path: '/users' },
    { icon: <Server size={20} />, label: 'Server Management', path: '/servers' },
    { icon: <LinkIcon size={20} />, label: 'Server Assignments', path: '/server-assignments' },
    { icon: <Briefcase size={20} />, label: 'Affiliate Management', path: '/affiliates' },
    { icon: <DollarSign size={20} />, label: 'Commission Management', path: '/commissions' },
    { icon: <CreditCard size={20} />, label: 'Withdrawal Requests', path: '/withdrawals' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];
  
  const isCurrentPath = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        {!isCollapsed && (
          <div className="sidebar__logo">
            <Server size={24} className="sidebar__logo-icon" />
            <h1 className="sidebar__logo-text">NOVA VPN</h1>
          </div>
        )}
        {isCollapsed && <Server size={24} className="sidebar__logo-icon sidebar__logo-icon--center" />}
        <button 
          className="sidebar__toggle"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {navItems.map((item, index) => (
            <li key={index} className="sidebar__nav-item">
              <Link
                to={item.path}
                className={`sidebar__nav-link ${isCurrentPath(item.path) ? 'sidebar__nav-link--active' : ''}`}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="sidebar__nav-label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar__footer">
        {!isCollapsed ? (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              <User size={20} />
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">Admin User</div>
              <div className="sidebar__user-email">admin@novavpn.io</div>
            </div>
          </div>
        ) : (
          <div className="sidebar__user-avatar sidebar__user-avatar--center">
            <User size={20} />
          </div>
        )}
        
        <button 
          className="sidebar__logout"
          onClick={logout}
          aria-label="Log out"
        >
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && <LogOut size={20} />}
        </button>
      </div>
    </aside>
  );
};
