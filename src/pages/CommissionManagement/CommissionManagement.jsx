import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useNavigation } from '../../hooks/useNavigation';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import './CommissionManagement.scss';

export const CommissionManagement = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  const { get, post, put, loading, error } = useApi();
  
  const [commissions, setCommissions] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalAffiliates: 0,
    activeAffiliates: 0
  });

  useEffect(() => {
    setCurrentPage('Commission Management');
    fetchAffiliates();
    fetchCommissions();
    fetchStats();
  }, []);

  const fetchAffiliates = async () => {
    try {
      // In a real app, you would fetch from your API
      // const response = await get('/affiliates');
      // setAffiliates(response.data);
      
      // Using mock data
      setAffiliates([
        { id: 1, name: 'Tech Bloggers Inc', email: 'partners@techbloggers.com' },
        { id: 2, name: 'VPN Review Hub', email: 'affiliates@vpnreviewhub.com' },
        { id: 3, name: 'Security First Blog', email: 'partnerships@securityfirst.blog' },
        { id: 4, name: 'Privacy Advocates Network', email: 'affiliates@privacyadvocates.net' },
        { id: 5, name: 'Cyber Security Today', email: 'partners@cybersecuritytoday.com' }
      ]);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    }
  };

  const fetchCommissions = async () => {
    try {
      // In a real app, you would fetch from your API
      // const response = await get('/commissions');
      // setCommissions(response.data);
      
      // Using mock data
      setCommissions([
        { 
          id: 1, 
          affiliate_id: 1, 
          amount: 250.75, 
          status: 'paid', 
          payment_date: '2025-03-15T10:30:00Z',
          created_at: '2025-03-01T00:00:00Z',
          period: 'February 2025',
          referrals: 12,
          payment_method: 'PayPal',
          transaction_id: 'PAY-1234567890'
        },
        { 
          id: 2, 
          affiliate_id: 2, 
          amount: 780.50, 
          status: 'pending', 
          payment_date: null,
          created_at: '2025-04-01T00:00:00Z',
          period: 'March 2025',
          referrals: 25,
          payment_method: null,
          transaction_id: null
        },
        { 
          id: 3, 
          affiliate_id: 5, 
          amount: 525.25, 
          status: 'pending', 
          payment_date: null,
          created_at: '2025-04-01T00:00:00Z',
          period: 'March 2025',
          referrals: 18,
          payment_method: null,
          transaction_id: null
        },
        { 
          id: 4, 
          affiliate_id: 1, 
          amount: 350.50, 
          status: 'pending', 
          payment_date: null,
          created_at: '2025-04-01T00:00:00Z',
          period: 'March 2025',
          referrals: 15,
          payment_method: null,
          transaction_id: null
        },
        { 
          id: 5, 
          affiliate_id: 4, 
          amount: 120.25, 
          status: 'pending', 
          payment_date: null,
          created_at: '2025-04-01T00:00:00Z',
          period: 'March 2025',
          referrals: 5,
          payment_method: null,
          transaction_id: null
        }
      ]);
    } catch (err) {
      console.error('Error fetching commissions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // In a real app, you would fetch from your API
      // const response = await get('/commission-stats');
      // setStats(response.data);
      
      // Using mock data
      setStats({
        totalCommissions: 2027.25,
        pendingCommissions: 1776.50,
        paidCommissions: 250.75,
        totalAffiliates: 5,
        activeAffiliates: 4
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  const handlePeriodFilter = (period) => {
    setSelectedPeriod(period);
  };

  const handlePeriodChange = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Mark this commission as paid?')) {
      try {
        // In a real app, you would call the API
        // await put(`/commissions/${id}/pay`, { 
        //   status: 'paid',
        //   payment_date: new Date().toISOString(),
        //   payment_method: 'Manual Payment',
        //   transaction_id: `MANUAL-${Date.now()}`
        // });
        
        // For mock purposes, update the commission in the state
        setCommissions(commissions.map(commission => 
          commission.id === id 
            ? { 
                ...commission, 
                status: 'paid',
                payment_date: new Date().toISOString(),
                payment_method: 'Manual Payment',
                transaction_id: `MANUAL-${Date.now()}`
              } 
            : commission
        ));
        
        // Update stats
        const paidCommission = commissions.find(c => c.id === id);
        if (paidCommission) {
          setStats(prev => ({
            ...prev,
            pendingCommissions: prev.pendingCommissions - paidCommission.amount,
            paidCommissions: prev.paidCommissions + paidCommission.amount
          }));
        }
      } catch (err) {
        console.error('Error marking commission as paid:', err);
      }
    }
  };

  const handlePayAllCommissions = async () => {
    if (window.confirm('Are you sure you want to mark all pending commissions as paid?')) {
      try {
        // In a real app, you would call the API
        // await post('/commissions/pay-all', { 
        //   status: 'paid',
        //   payment_date: new Date().toISOString(),
        //   payment_method: 'Batch Payment',
        //   transaction_id: `BATCH-${Date.now()}`
        // });
        
        const now = new Date().toISOString();
        const transactionBatchId = `BATCH-${Date.now()}`;
        
        // For mock purposes, update all pending commissions in the state
        setCommissions(commissions.map(commission => 
          commission.status === 'pending'
            ? { 
                ...commission, 
                status: 'paid',
                payment_date: now,
                payment_method: 'Batch Payment',
                transaction_id: transactionBatchId
              } 
            : commission
        ));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          paidCommissions: prev.paidCommissions + prev.pendingCommissions,
          pendingCommissions: 0
        }));
      } catch (err) {
        console.error('Error marking all commissions as paid:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not paid yet';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAffiliateName = (id) => {
    const affiliate = affiliates.find(a => a.id === id);
    return affiliate ? affiliate.name : 'Unknown Affiliate';
  };

  const formatPeriod = (month, year) => {
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCurrentPeriod = () => {
    return formatPeriod(currentMonth, currentYear);
  };

  const filteredCommissions = commissions.filter(commission => {
    const affiliateName = getAffiliateName(commission.affiliate_id).toLowerCase();
    const matchesSearch = affiliateName.includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || commission.status === selectedStatus;
    const matchesPeriod = selectedPeriod === 'all' || commission.period === getCurrentPeriod();
    
    return matchesSearch && matchesStatus && (selectedPeriod === 'all' || matchesPeriod);
  });

  return (
    <div className="commission-management">
      <div className="commission-management__stats">
        <Card padding="sm" className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--total">
              <i className="icon-dollar-sign"></i>
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.totalCommissions)}</div>
              <div className="commission-management__stat-label">Total Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--pending">
              <i className="icon-clock"></i>
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.pendingCommissions)}</div>
              <div className="commission-management__stat-label">Pending Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--paid">
              <i className="icon-check-circle"></i>
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.paidCommissions)}</div>
              <div className="commission-management__stat-label">Paid Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--affiliates">
              <i className="icon-users"></i>
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{stats.activeAffiliates} / {stats.totalAffiliates}</div>
              <div className="commission-management__stat-label">Active Affiliates</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="commission-management__header">
        <div className="commission-management__filters">
          <Input
            type="text"
            placeholder="Search affiliates..."
            value={searchTerm}
            onChange={handleSearch}
            icon="search"
          />
          <div className="commission-management__status-filters">
            <Button 
              variant={selectedStatus === 'all' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={selectedStatus === 'pending' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button 
              variant={selectedStatus === 'paid' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('paid')}
              size="sm"
            >
              Paid
            </Button>
          </div>
          
          <div className="commission-management__period">
            <Button 
              variant="icon" 
              icon="chevron-left"
              onClick={() => handlePeriodChange('prev')}
            />
            <div className="commission-management__period-display">
              <Button 
                variant={selectedPeriod === 'all' ? 'primary' : 'secondary'} 
                onClick={() => handlePeriodFilter('all')}
                size="sm"
              >
                All Periods
              </Button>
              <Button 
                variant={selectedPeriod !== 'all' ? 'primary' : 'secondary'} 
                onClick={() => handlePeriodFilter(getCurrentPeriod())}
                size="sm"
              >
                {getCurrentPeriod()}
              </Button>
            </div>
            <Button 
              variant="icon" 
              icon="chevron-right"
              onClick={() => handlePeriodChange('next')}
            />
          </div>
        </div>
        
        <Button 
          variant="primary" 
          onClick={handlePayAllCommissions}
          icon="dollar-sign"
          disabled={!filteredCommissions.some(c => c.status === 'pending')}
        >
          Pay All Pending
        </Button>
      </div>

      <Card title={`Commission Payouts (${filteredCommissions.length})`}>
        {loading ? (
          <div className="commission-management__loading">Loading commissions...</div>
        ) : error ? (
          <div className="commission-management__error">Error loading commissions: {error}</div>
        ) : filteredCommissions.length === 0 ? (
          <div className="commission-management__empty">No commissions found matching your criteria.</div>
        ) : (
          <div className="commission-management__table-container">
            <table className="commission-management__table">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Period</th>
                  <th>Referrals</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Payment Method</th>
                  <th>Transaction ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map(commission => (
                  <tr key={commission.id}>
                    <td>{getAffiliateName(commission.affiliate_id)}</td>
                    <td>{commission.period}</td>
                    <td>{commission.referrals}</td>
                    <td>{formatCurrency(commission.amount)}</td>
                    <td>
                      <span className={`commission-management__status commission-management__status--${commission.status}`}>
                        {commission.status}
                      </span>
                    </td>
                    <td>{formatDate(commission.payment_date)}</td>
                    <td>{commission.payment_method || '-'}</td>
                    <td>
                      <span className="commission-management__transaction">
                        {commission.transaction_id || '-'}
                      </span>
                    </td>
                    <td className="commission-management__actions">
                      {commission.status === 'pending' && (
                        <Button
                          variant="icon"
                          icon="check-circle"
                          onClick={() => handleMarkAsPaid(commission.id)}
                          title="Mark as Paid"
                        />
                      )}
                      <Button
                        variant="icon"
                        icon="eye"
                        onClick={() => navigate(`/affiliates/${commission.affiliate_id}`)}
                        title="View Affiliate"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CommissionManagement;
