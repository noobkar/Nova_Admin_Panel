import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useNavigation } from '../../hooks/useNavigation';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import './WithdrawalManagement.scss';

export const WithdrawalManagement = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  const { get, post, put, loading, error } = useApi();
  
  const [withdrawals, setWithdrawals] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState(null);
  const [formData, setFormData] = useState({
    status: 'approved',
    admin_notes: '',
    payment_details: ''
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0
  });

  useEffect(() => {
    setCurrentPage('Withdrawal Requests');
    fetchAffiliates();
    fetchWithdrawals();
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
        { id: 4, name: 'Privacy Advocates Network', email: 'affiliates@privacyadvocates.net' },
        { id: 5, name: 'Cyber Security Today', email: 'partners@cybersecuritytoday.com' }
      ]);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      // In a real app, you would fetch from your API
      // const response = await get('/withdrawals');
      // setWithdrawals(response.data);
      
      // Using mock data
      setWithdrawals([
        { 
          id: 1, 
          affiliate_id: 1, 
          amount: 350.50, 
          status: 'pending', 
          payment_method: 'paypal',
          payment_details: 'payments@techbloggers.com',
          requested_at: '2025-04-02T10:30:00Z',
          processed_at: null,
          admin_notes: '',
          available_balance: 350.50
        },
        { 
          id: 2, 
          affiliate_id: 2, 
          amount: 780.00, 
          status: 'approved', 
          payment_method: 'bank_transfer',
          payment_details: 'IBAN: DE89370400440532013000',
          requested_at: '2025-04-01T14:15:00Z',
          processed_at: '2025-04-03T09:20:00Z',
          admin_notes: 'Processed via batch transfer',
          available_balance: 0
        },
        { 
          id: 3, 
          affiliate_id: 5, 
          amount: 525.75, 
          status: 'pending', 
          payment_method: 'bank_transfer',
          payment_details: 'IBAN: GB29NWBK60161331926819',
          requested_at: '2025-04-03T16:45:00Z',
          processed_at: null,
          admin_notes: '',
          available_balance: 525.75
        },
        { 
          id: 4, 
          affiliate_id: 4, 
          amount: 120.25, 
          status: 'rejected', 
          payment_method: 'paypal',
          payment_details: 'finance@privacyadvocates.net',
          requested_at: '2025-04-02T11:50:00Z',
          processed_at: '2025-04-02T15:10:00Z',
          admin_notes: 'Account suspended due to policy violation',
          available_balance: 120.25
        },
        { 
          id: 5, 
          affiliate_id: 1, 
          amount: 250.75, 
          status: 'completed', 
          payment_method: 'paypal',
          payment_details: 'payments@techbloggers.com',
          requested_at: '2025-03-15T10:30:00Z',
          processed_at: '2025-03-16T14:20:00Z',
          admin_notes: 'Payment sent via PayPal',
          available_balance: 0
        }
      ]);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // In a real app, you would fetch from your API
      // const response = await get('/withdrawal-stats');
      // setStats(response.data);
      
      // Using mock data - calculated from the withdrawals data
      const totalRequests = withdrawals.length;
      const pendingRequests = withdrawals.filter(w => w.status === 'pending').length;
      const approvedRequests = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length;
      const rejectedRequests = withdrawals.filter(w => w.status === 'rejected').length;
      const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      setStats({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalAmount
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentWithdrawal) {
        // In a real app, you would call the API
        // await put(`/withdrawals/${currentWithdrawal.id}`, {
        //   status: formData.status,
        //   admin_notes: formData.admin_notes,
        //   payment_details: formData.payment_details
        // });
        
        const now = new Date().toISOString();
        const updatedWithdrawal = {
          ...currentWithdrawal,
          status: formData.status,
          admin_notes: formData.admin_notes,
          payment_details: formData.payment_details || currentWithdrawal.payment_details,
          processed_at: (formData.status === 'approved' || formData.status === 'rejected' || formData.status === 'completed') ? now : null,
          available_balance: (formData.status === 'approved' || formData.status === 'completed') ? 0 : currentWithdrawal.amount
        };
        
        // For mock purposes, update the withdrawal in the state
        setWithdrawals(withdrawals.map(w => 
          w.id === currentWithdrawal.id ? updatedWithdrawal : w
        ));
        
        // Update stats
        fetchStats();
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating withdrawal request:', err);
    }
  };

  const handleApproveRequest = (withdrawal) => {
    setCurrentWithdrawal(withdrawal);
    setFormData({
      status: 'approved',
      admin_notes: '',
      payment_details: withdrawal.payment_details
    });
    setIsModalOpen(true);
  };

  const handleRejectRequest = (withdrawal) => {
    setCurrentWithdrawal(withdrawal);
    setFormData({
      status: 'rejected',
      admin_notes: '',
      payment_details: withdrawal.payment_details
    });
    setIsModalOpen(true);
  };

  const handleCompleteRequest = (withdrawal) => {
    setCurrentWithdrawal(withdrawal);
    setFormData({
      status: 'completed',
      admin_notes: 'Payment processed successfully',
      payment_details: withdrawal.payment_details
    });
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const affiliateName = getAffiliateName(withdrawal.affiliate_id).toLowerCase();
    const matchesSearch = affiliateName.includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || withdrawal.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="withdrawal-management">
      <div className="withdrawal-management__stats">
        <Card padding="sm" className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--total">
              <i className="icon-file-text"></i>
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.totalRequests}</div>
              <div className="withdrawal-management__stat-label">Total Requests</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--pending">
              <i className="icon-clock"></i>
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.pendingRequests}</div>
              <div className="withdrawal-management__stat-label">Pending Requests</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--approved">
              <i className="icon-check-circle"></i>
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.approvedRequests}</div>
              <div className="withdrawal-management__stat-label">Approved Requests</div>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--amount">
              <i className="icon-dollar-sign"></i>
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{formatCurrency(stats.totalAmount)}</div>
              <div className="withdrawal-management__stat-label">Total Amount</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="withdrawal-management__header">
        <div className="withdrawal-management__filters">
          <Input
            type="text"
            placeholder="Search affiliates..."
            value={searchTerm}
            onChange={handleSearch}
            icon="search"
          />
          <div className="withdrawal-management__status-filters">
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
              variant={selectedStatus === 'approved' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('approved')}
              size="sm"
            >
              Approved
            </Button>
            <Button 
              variant={selectedStatus === 'rejected' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('rejected')}
              size="sm"
            >
              Rejected
            </Button>
            <Button 
              variant={selectedStatus === 'completed' ? 'primary' : 'secondary'} 
              onClick={() => handleStatusFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>
        </div>
      </div>

      <Card title={`Withdrawal Requests (${filteredWithdrawals.length})`}>
        {loading ? (
          <div className="withdrawal-management__loading">Loading withdrawal requests...</div>
        ) : error ? (
          <div className="withdrawal-management__error">Error loading withdrawal requests: {error}</div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="withdrawal-management__empty">No withdrawal requests found matching your criteria.</div>
        ) : (
          <div className="withdrawal-management__table-container">
            <table className="withdrawal-management__table">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Requested</th>
                  <th>Processed</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map(withdrawal => (
                  <tr key={withdrawal.id}>
                    <td>{getAffiliateName(withdrawal.affiliate_id)}</td>
                    <td>{formatCurrency(withdrawal.amount)}</td>
                    <td>
                      <span className={`withdrawal-management__status withdrawal-management__status--${withdrawal.status}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td>{formatPaymentMethod(withdrawal.payment_method)}</td>
                    <td>{formatDate(withdrawal.requested_at)}</td>
                    <td>{formatDate(withdrawal.processed_at)}</td>
                    <td>
                      <div className="withdrawal-management__notes" title={withdrawal.admin_notes}>
                        {withdrawal.admin_notes || '-'}
                      </div>
                    </td>
                    <td className="withdrawal-management__actions">
                      {withdrawal.status === 'pending' && (
                        <>
                          <Button
                            variant="icon"
                            icon="check"
                            onClick={() => handleApproveRequest(withdrawal)}
                            title="Approve Request"
                          />
                          <Button
                            variant="icon"
                            icon="x"
                            onClick={() => handleRejectRequest(withdrawal)}
                            title="Reject Request"
                          />
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <Button
                          variant="icon"
                          icon="dollar-sign"
                          onClick={() => handleCompleteRequest(withdrawal)}
                          title="Mark as Completed"
                        />
                      )}
                      <Button
                        variant="icon"
                        icon="eye"
                        onClick={() => navigate(`/affiliates/${withdrawal.affiliate_id}`)}
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

      {isModalOpen && (
        <div className="withdrawal-management__modal-overlay">
          <div className="withdrawal-management__modal">
            <div className="withdrawal-management__modal-header">
              <h2>
                {formData.status === 'approved' 
                  ? 'Approve Withdrawal Request' 
                  : formData.status === 'rejected'
                    ? 'Reject Withdrawal Request'
                    : 'Complete Withdrawal Request'
                }
              </h2>
              <Button 
                variant="icon" 
                icon="x" 
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="withdrawal-management__form-info">
                <div className="withdrawal-management__form-row">
                  <div className="withdrawal-management__form-label">Affiliate:</div>
                  <div className="withdrawal-management__form-value">{getAffiliateName(currentWithdrawal?.affiliate_id)}</div>
                </div>
                <div className="withdrawal-management__form-row">
                  <div className="withdrawal-management__form-label">Amount:</div>
                  <div className="withdrawal-management__form-value">{formatCurrency(currentWithdrawal?.amount)}</div>
                </div>
                <div className="withdrawal-management__form-row">
                  <div className="withdrawal-management__form-label">Payment Method:</div>
                  <div className="withdrawal-management__form-value">{formatPaymentMethod(currentWithdrawal?.payment_method)}</div>
                </div>
                <div className="withdrawal-management__form-row">
                  <div className="withdrawal-management__form-label">Payment Details:</div>
                  <div className="withdrawal-management__form-value withdrawal-management__form-value--details">
                    {currentWithdrawal?.payment_details}
                  </div>
                </div>
              </div>
              
              <div className="withdrawal-management__form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                >
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="withdrawal-management__form-group">
                <Input
                  label="Admin Notes"
                  name="admin_notes"
                  value={formData.admin_notes}
                  onChange={handleFormChange}
                  placeholder={formData.status === 'rejected' ? 'Please provide a reason for rejection' : 'Optional notes'}
                  multiline
                  rows={3}
                  required={formData.status === 'rejected'}
                />
              </div>
              
              <div className="withdrawal-management__form-actions">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                >
                  {formData.status === 'approved' 
                    ? 'Approve Request' 
                    : formData.status === 'rejected'
                      ? 'Reject Request'
                      : 'Complete Payment'
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
