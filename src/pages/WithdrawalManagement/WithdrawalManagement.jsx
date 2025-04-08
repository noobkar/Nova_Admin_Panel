import React, { useState, useEffect } from 'react';
import { Search, Check, X, DollarSign, Clock, AlertCircle, FileText, Eye } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Loading } from '../../components/common/Loading/Loading';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import './WithdrawalManagement.scss';

export const WithdrawalManagement = () => {
  // State
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    transaction_id: '',
    notes: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    totalAmount: 0
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0,
    totalAmount: 0
  });

  // API hooks
  const { 
    loading, 
    error, 
    fetchWithdrawalRequests, 
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    completeWithdrawalRequest
  } = useApi();

  // Load withdrawals on mount and when filters change
  useEffect(() => {
    loadWithdrawals(pagination.currentPage);
  }, [selectedStatus]);

  // Load withdrawals function
  const loadWithdrawals = async (page = 1) => {
    try {
      const data = await fetchWithdrawalRequests(
        page, 
        10, 
        selectedStatus !== 'all' ? selectedStatus : null
      );
      
      if (data) {
        if (data.data) {
          setWithdrawals(data.data);
        } else {
          setWithdrawals([]);
        }
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count,
            totalAmount: data.meta.total_amount || 0
          });
          
          // Update stats based on meta data if available
          // This is a simplified approach - in a real app, you might have a separate API endpoint for stats
          const pendingRequests = data.data.filter(w => w.attributes.status === 'pending').length;
          const approvedRequests = data.data.filter(w => w.attributes.status === 'approved').length;
          const rejectedRequests = data.data.filter(w => w.attributes.status === 'rejected').length;
          const completedRequests = data.data.filter(w => w.attributes.status === 'completed').length;
          
          setStats({
            totalRequests: data.meta.total_count,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            completedRequests,
            totalAmount: data.meta.total_amount || 0
          });
        }
      } else {
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    }
  };

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Filter in the client-side since the API doesn't support searching
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Status filter handling
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Open modal with specific action
  const handleOpenModal = (withdrawal, action) => {
    setCurrentWithdrawal({ ...withdrawal, action });
    setFormData({
      reason: '',
      transaction_id: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle approve withdrawal
  const handleApproveWithdrawal = async () => {
    try {
      await approveWithdrawalRequest(currentWithdrawal.id);
      setIsModalOpen(false);
      loadWithdrawals(pagination.currentPage);
    } catch (err) {
      console.error('Error approving withdrawal:', err);
    }
  };

  // Handle reject withdrawal
  const handleRejectWithdrawal = async () => {
    try {
      await rejectWithdrawalRequest(currentWithdrawal.id, { reason: formData.reason });
      setIsModalOpen(false);
      loadWithdrawals(pagination.currentPage);
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
    }
  };

  // Handle complete withdrawal
  const handleCompleteWithdrawal = async () => {
    try {
      await completeWithdrawalRequest(currentWithdrawal.id, {
        transaction_id: formData.transaction_id,
        notes: formData.notes
      });
      setIsModalOpen(false);
      loadWithdrawals(pagination.currentPage);
    } catch (err) {
      console.error('Error completing withdrawal:', err);
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadWithdrawals(page);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount || 0);
  };

  // Format payment method for display
  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    
    const methodMap = {
      'bank_transfer': 'Bank Transfer',
      'paypal': 'PayPal',
      'crypto': 'Cryptocurrency',
      'check': 'Check'
    };
    
    return methodMap[method] || method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  // Filter withdrawals based on search term
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (!searchTerm) return true;
    
    // Search in user/account info
    const userName = withdrawal.attributes.user_id || '';
    const paymentDetails = withdrawal.attributes.payment_details ? JSON.stringify(withdrawal.attributes.payment_details) : '';
    
    return userName.toString().includes(searchTerm) || paymentDetails.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="withdrawal-management">
      <div className="withdrawal-management__stats">
        <Card className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--total">
              <FileText size={20} />
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.totalRequests}</div>
              <div className="withdrawal-management__stat-label">Total Requests</div>
            </div>
          </div>
        </Card>
        
        <Card className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--pending">
              <Clock size={20} />
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.pendingRequests}</div>
              <div className="withdrawal-management__stat-label">Pending Requests</div>
            </div>
          </div>
        </Card>
        
        <Card className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--approved">
              <Check size={20} />
            </div>
            <div className="withdrawal-management__stat-content">
              <div className="withdrawal-management__stat-value">{stats.approvedRequests}</div>
              <div className="withdrawal-management__stat-label">Approved Requests</div>
            </div>
          </div>
        </Card>
        
        <Card className="withdrawal-management__stat-card">
          <div className="withdrawal-management__stat">
            <div className="withdrawal-management__stat-icon withdrawal-management__stat-icon--amount">
              <DollarSign size={20} />
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
          <div className="withdrawal-management__search">
            <Input
              type="text"
              placeholder="Search withdrawals..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="withdrawal-management__status-filters">
            <Button 
              variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedStatus === 'pending' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={selectedStatus === 'approved' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('approved')}
            >
              Approved
            </Button>
            <Button 
              variant={selectedStatus === 'rejected' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('rejected')}
            >
              Rejected
            </Button>
            <Button 
              variant={selectedStatus === 'completed' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </div>

      <Card title={`Withdrawal Requests (${filteredWithdrawals.length})`}>
        {loading ? (
          <Loading message="Loading withdrawal requests..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            retryAction={() => loadWithdrawals(pagination.currentPage)}
          />
        ) : (
          <div className="withdrawal-management__table-container">
            {filteredWithdrawals.length === 0 ? (
              <EmptyState 
                message="No withdrawal requests found. Try adjusting your search or filters."
                icon={DollarSign}
              />
            ) : (
              <>
                <table className="withdrawal-management__table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Processed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map(withdrawal => (
                      <tr key={withdrawal.id}>
                        <td>{withdrawal.attributes.user_id}</td>
                        <td className="withdrawal-management__amount">
                          {formatCurrency(withdrawal.attributes.amount)}
                        </td>
                        <td>{formatPaymentMethod(withdrawal.attributes.payment_method)}</td>
                        <td>
                          <span className={`withdrawal-management__status withdrawal-management__status--${withdrawal.attributes.status}`}>
                            {withdrawal.attributes.status}
                          </span>
                        </td>
                        <td>{formatDate(withdrawal.attributes.created_at)}</td>
                        <td>{formatDate(withdrawal.attributes.completed_at || withdrawal.attributes.approved_at)}</td>
                        <td className="withdrawal-management__actions">
                          {withdrawal.attributes.status === 'pending' && (
                            <>
                              <Button
                                variant="icon"
                                onClick={() => handleOpenModal(withdrawal, 'approve')}
                                title="Approve Request"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="icon"
                                onClick={() => handleOpenModal(withdrawal, 'reject')}
                                title="Reject Request"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          
                          {withdrawal.attributes.status === 'approved' && (
                            <Button
                              variant="icon"
                              onClick={() => handleOpenModal(withdrawal, 'complete')}
                              title="Complete Payment"
                            >
                              <DollarSign size={16} />
                            </Button>
                          )}
                          
                          <Button
                            variant="icon"
                            onClick={() => handleOpenModal(withdrawal, 'view')}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="withdrawal-management__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="withdrawal-management__pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && currentWithdrawal && (
        <div className="withdrawal-management__modal-overlay">
          <div className="withdrawal-management__modal">
            <div className="withdrawal-management__modal-header">
              <h2>
                {currentWithdrawal.action === 'approve' ? 'Approve Withdrawal Request' : 
                 currentWithdrawal.action === 'reject' ? 'Reject Withdrawal Request' : 
                 currentWithdrawal.action === 'complete' ? 'Complete Withdrawal Payment' :
                 'Withdrawal Request Details'}
              </h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="withdrawal-management__withdrawal-details">
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">User ID:</div>
                <div className="withdrawal-management__detail-value">
                  {currentWithdrawal.attributes.user_id}
                </div>
              </div>
              
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">Amount:</div>
                <div className="withdrawal-management__detail-value">
                  {formatCurrency(currentWithdrawal.attributes.amount)}
                </div>
              </div>
              
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">Payment Method:</div>
                <div className="withdrawal-management__detail-value">
                  {formatPaymentMethod(currentWithdrawal.attributes.payment_method)}
                </div>
              </div>
              
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">Payment Details:</div>
                <div className="withdrawal-management__detail-value withdrawal-management__detail-value--details">
                  {currentWithdrawal.attributes.payment_details 
                    ? JSON.stringify(currentWithdrawal.attributes.payment_details, null, 2)
                    : 'No payment details provided'}
                </div>
              </div>
              
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">Status:</div>
                <div className="withdrawal-management__detail-value">
                  <span className={`withdrawal-management__status withdrawal-management__status--${currentWithdrawal.attributes.status}`}>
                    {currentWithdrawal.attributes.status}
                  </span>
                </div>
              </div>
              
              <div className="withdrawal-management__detail-row">
                <div className="withdrawal-management__detail-label">Requested:</div>
                <div className="withdrawal-management__detail-value">
                  {formatDate(currentWithdrawal.attributes.created_at)}
                </div>
              </div>
              
              {currentWithdrawal.attributes.approved_at && (
                <div className="withdrawal-management__detail-row">
                  <div className="withdrawal-management__detail-label">Approved:</div>
                  <div className="withdrawal-management__detail-value">
                    {formatDate(currentWithdrawal.attributes.approved_at)}
                  </div>
                </div>
              )}
              
              {currentWithdrawal.attributes.completed_at && (
                <div className="withdrawal-management__detail-row">
                  <div className="withdrawal-management__detail-label">Completed:</div>
                  <div className="withdrawal-management__detail-value">
                    {formatDate(currentWithdrawal.attributes.completed_at)}
                  </div>
                </div>
              )}
              
              {currentWithdrawal.attributes.notes && (
                <div className="withdrawal-management__detail-row">
                  <div className="withdrawal-management__detail-label">Notes:</div>
                  <div className="withdrawal-management__detail-value">
                    {currentWithdrawal.attributes.notes}
                  </div>
                </div>
              )}
            </div>
            
            {currentWithdrawal.action === 'reject' && (
              <div className="withdrawal-management__form-group">
                <label htmlFor="reason">Rejection Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  className="withdrawal-management__textarea"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>
            )}
            
            {currentWithdrawal.action === 'complete' && (
              <>
                <div className="withdrawal-management__form-group">
                  <label htmlFor="transaction_id">Transaction ID</label>
                  <Input
                    id="transaction_id"
                    name="transaction_id"
                    value={formData.transaction_id}
                    onChange={handleFormChange}
                    placeholder="Enter transaction reference ID..."
                  />
                </div>
                <div className="withdrawal-management__form-group">
                  <label htmlFor="notes">Payment Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    className="withdrawal-management__textarea"
                    rows={3}
                    placeholder="Add notes about this payment..."
                  />
                </div>
              </>
            )}
            
            <div className="withdrawal-management__form-actions">
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => setIsModalOpen(false)}
              >
                {currentWithdrawal.action === 'view' ? 'Close' : 'Cancel'}
              </Button>
              
              {currentWithdrawal.action === 'approve' && (
                <Button 
                  variant="primary" 
                  onClick={handleApproveWithdrawal}
                  disabled={loading}
                >
                  Approve Request
                </Button>
              )}
              
              {currentWithdrawal.action === 'reject' && (
                <Button 
                  variant="error" 
                  onClick={handleRejectWithdrawal}
                  disabled={loading || !formData.reason}
                >
                  Reject Request
                </Button>
              )}
              
              {currentWithdrawal.action === 'complete' && (
                <Button 
                  variant="primary" 
                  onClick={handleCompleteWithdrawal}
                  disabled={loading}
                >
                  Complete Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;