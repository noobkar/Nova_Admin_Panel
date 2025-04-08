import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Calendar, Check, X, Eye } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Loading } from '../../components/common/Loading/Loading';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import './CommissionManagement.scss';

export const CommissionManagement = () => {
  // State
  const [commissions, setCommissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCommission, setCurrentCommission] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    totalAmount: 0
  });
  const [stats, setStats] = useState({
    totalCommissions: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
    rejectedCommissions: 0,
  });

  // API hooks
  const { 
    loading, 
    error, 
    fetchCommissions,
    approveCommission,
    rejectCommission
  } = useApi();

  // Load commissions on mount and when filters change
  useEffect(() => {
    loadCommissions(pagination.currentPage);
  }, [selectedStatus, selectedPeriod]);

  // Load commissions function
  const loadCommissions = async (page = 1) => {
    try {
      // Prepare date filters if period is selected
      let startDate, endDate;
      
      if (selectedPeriod !== 'all') {
        const year = currentYear;
        const month = currentMonth;
        
        // Start of month
        startDate = new Date(year, month, 1).toISOString().split('T')[0];
        
        // End of month
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      }
      
      const data = await fetchCommissions(
        page, 
        10, 
        selectedStatus !== 'all' ? selectedStatus : null,
        null, // affiliateId
        startDate,
        endDate
      );
      
      if (data) {
        if (data.data) {
          setCommissions(data.data);
        } else {
          setCommissions([]);
        }
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count,
            totalAmount: data.meta.total_amount || 0
          });
          
          // Update stats based on meta data
          setStats({
            totalCommissions: data.meta.total_amount || 0,
            pendingCommissions: data.meta.pending_amount || 0,
            approvedCommissions: data.meta.approved_amount || 0,
            rejectedCommissions: data.meta.rejected_amount || 0
          });
        }
      } else {
        setCommissions([]);
      }
    } catch (err) {
      console.error('Error loading commissions:', err);
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

  // Period filter handling
  const handlePeriodFilter = (period) => {
    setSelectedPeriod(period);
  };

  // Period change handling
  const handlePeriodChange = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (newMonth === 0) {
        newMonth = 11;
        newYear--;
      } else {
        newMonth--;
      }
    } else {
      if (newMonth === 11) {
        newMonth = 0;
        newYear++;
      } else {
        newMonth++;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Open approve/reject modal
  const handleOpenModal = (commission, action) => {
    setCurrentCommission({ ...commission, action });
    setFormData({
      reason: '',
    });
    setIsModalOpen(true);
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle approve commission
  const handleApproveCommission = async () => {
    try {
      await approveCommission(currentCommission.id);
      setIsModalOpen(false);
      loadCommissions(pagination.currentPage);
    } catch (err) {
      console.error('Error approving commission:', err);
    }
  };

  // Handle reject commission
  const handleRejectCommission = async () => {
    try {
      await rejectCommission(currentCommission.id, { reason: formData.reason });
      setIsModalOpen(false);
      loadCommissions(pagination.currentPage);
    } catch (err) {
      console.error('Error rejecting commission:', err);
    }
  };

  // Handle pay all commissions
  const handlePayAllCommissions = async () => {
    if (window.confirm('Are you sure you want to approve all pending commissions?')) {
      try {
        // In a real app, you would call a bulk approve endpoint
        // For now, we'll just iterate and approve each one
        const pendingCommissions = commissions.filter(c => c.attributes.status === 'pending');
        
        for (const commission of pendingCommissions) {
          await approveCommission(commission.id);
        }
        
        loadCommissions(pagination.currentPage);
      } catch (err) {
        console.error('Error paying all commissions:', err);
      }
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadCommissions(page);
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

  // Get current period label
  const getCurrentPeriod = () => {
    const date = new Date(currentYear, currentMonth);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter commissions based on search term
  const filteredCommissions = commissions.filter(commission => {
    if (!searchTerm) return true;
    
    // Search in affiliate name/email if available
    const affiliateName = commission.relationships?.affiliate?.data?.attributes?.name || '';
    const affiliateEmail = commission.relationships?.affiliate?.data?.attributes?.email || '';
    
    return affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           affiliateEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="commission-management">
      <div className="commission-management__stats">
        <Card className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--total">
              <DollarSign size={20} />
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.totalCommissions)}</div>
              <div className="commission-management__stat-label">Total Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--pending">
              <Calendar size={20} />
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.pendingCommissions)}</div>
              <div className="commission-management__stat-label">Pending Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--approved">
              <Check size={20} />
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.approvedCommissions)}</div>
              <div className="commission-management__stat-label">Approved Commissions</div>
            </div>
          </div>
        </Card>
        
        <Card className="commission-management__stat-card">
          <div className="commission-management__stat">
            <div className="commission-management__stat-icon commission-management__stat-icon--rejected">
              <X size={20} />
            </div>
            <div className="commission-management__stat-content">
              <div className="commission-management__stat-value">{formatCurrency(stats.rejectedCommissions)}</div>
              <div className="commission-management__stat-label">Rejected Commissions</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="commission-management__header">
        <div className="commission-management__filters">
          <div className="commission-management__search">
            <Input
              type="text"
              placeholder="Search affiliates..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="commission-management__status-filters">
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
          </div>
          
          <div className="commission-management__period">
            <Button 
              variant="icon" 
              onClick={() => handlePeriodChange('prev')}
              title="Previous Month"
            >
              <X className="rotate-45" size={16} />
            </Button>
            
            <div className="commission-management__period-display">
              <Button 
                variant={selectedPeriod === 'all' ? 'primary' : 'secondary'} 
                size="small"
                onClick={() => handlePeriodFilter('all')}
              >
                All Periods
              </Button>
              <Button 
                variant={selectedPeriod !== 'all' ? 'primary' : 'secondary'} 
                size="small"
                onClick={() => handlePeriodFilter('current')}
              >
                {getCurrentPeriod()}
              </Button>
            </div>
            
            <Button 
              variant="icon" 
              onClick={() => handlePeriodChange('next')}
              title="Next Month"
            >
              <X className="rotate-45" size={16} />
            </Button>
          </div>
        </div>
        
        <Button 
          variant="primary" 
          onClick={handlePayAllCommissions}
          disabled={!filteredCommissions.some(c => c.attributes.status === 'pending')}
        >
          Pay All Pending
        </Button>
      </div>

      <Card title={`Commission Payouts (${filteredCommissions.length})`}>
        {loading ? (
          <Loading message="Loading commissions..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            retryAction={() => loadCommissions(pagination.currentPage)}
          />
        ) : (
          <div className="commission-management__table-container">
            {filteredCommissions.length === 0 ? (
              <EmptyState 
                message="No commissions found. Try adjusting your search or filters."
                icon={DollarSign}
              />
            ) : (
              <>
                <table className="commission-management__table">
                  <thead>
                    <tr>
                      <th>Affiliate</th>
                      <th>Amount</th>
                      <th>Commission Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Approved</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.map(commission => (
                      <tr key={commission.id}>
                        <td>
                          <div className="commission-management__affiliate">
                            <div className="commission-management__affiliate-name">
                              {commission.relationships?.affiliate?.data?.attributes?.name || 'Unknown Affiliate'}
                            </div>
                            {commission.relationships?.affiliate?.data?.attributes?.email && (
                              <div className="commission-management__affiliate-email">
                                {commission.relationships?.affiliate?.data?.attributes?.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="commission-management__amount">
                          {formatCurrency(commission.attributes.amount)}
                        </td>
                        <td>
                          <span className="commission-management__type">
                            {commission.attributes.commission_type === 'referral' ? 'Referral' : 'Sale'}
                          </span>
                        </td>
                        <td>
                          <span className={`commission-management__status commission-management__status--${commission.attributes.status}`}>
                            {commission.attributes.status}
                          </span>
                        </td>
                        <td>{formatDate(commission.attributes.created_at)}</td>
                        <td>{formatDate(commission.attributes.approved_at)}</td>
                        <td className="commission-management__actions">
                          {commission.attributes.status === 'pending' && (
                            <>
                              <Button
                                variant="icon"
                                onClick={() => handleOpenModal(commission, 'approve')}
                                title="Approve Commission"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="icon"
                                onClick={() => handleOpenModal(commission, 'reject')}
                                title="Reject Commission"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="icon"
                            onClick={() => handleOpenModal(commission, 'view')}
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
                  <div className="commission-management__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="commission-management__pagination-info">
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

      {isModalOpen && currentCommission && (
        <div className="commission-management__modal-overlay">
          <div className="commission-management__modal">
            <div className="commission-management__modal-header">
              <h2>
                {currentCommission.action === 'approve' ? 'Approve Commission' : 
                 currentCommission.action === 'reject' ? 'Reject Commission' : 
                 'Commission Details'}
              </h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="commission-management__commission-details">
              <div className="commission-management__detail-row">
                <div className="commission-management__detail-label">Affiliate:</div>
                <div className="commission-management__detail-value">
                  {currentCommission.relationships?.affiliate?.data?.attributes?.name || 'Unknown Affiliate'}
                </div>
              </div>
              
              <div className="commission-management__detail-row">
                <div className="commission-management__detail-label">Amount:</div>
                <div className="commission-management__detail-value">
                  {formatCurrency(currentCommission.attributes.amount)}
                </div>
              </div>
              
              <div className="commission-management__detail-row">
                <div className="commission-management__detail-label">Type:</div>
                <div className="commission-management__detail-value">
                  {currentCommission.attributes.commission_type === 'referral' ? 'Referral' : 'Sale'}
                </div>
              </div>
              
              <div className="commission-management__detail-row">
                <div className="commission-management__detail-label">Status:</div>
                <div className="commission-management__detail-value">
                  <span className={`commission-management__status commission-management__status--${currentCommission.attributes.status}`}>
                    {currentCommission.attributes.status}
                  </span>
                </div>
              </div>
              
              <div className="commission-management__detail-row">
                <div className="commission-management__detail-label">Created:</div>
                <div className="commission-management__detail-value">
                  {formatDate(currentCommission.attributes.created_at)}
                </div>
              </div>
              
              {currentCommission.attributes.approved_at && (
                <div className="commission-management__detail-row">
                  <div className="commission-management__detail-label">Approved:</div>
                  <div className="commission-management__detail-value">
                    {formatDate(currentCommission.attributes.approved_at)}
                  </div>
                </div>
              )}
              
              {currentCommission.attributes.source_transaction && (
                <div className="commission-management__detail-row">
                  <div className="commission-management__detail-label">Transaction:</div>
                  <div className="commission-management__detail-value">
                    {currentCommission.attributes.source_transaction}
                  </div>
                </div>
              )}
            </div>
            
            {currentCommission.action === 'reject' && (
              <div className="commission-management__form-group">
                <label htmlFor="reason">Rejection Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  className="commission-management__textarea"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>
            )}
            
            <div className="commission-management__form-actions">
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => setIsModalOpen(false)}
              >
                {currentCommission.action === 'view' ? 'Close' : 'Cancel'}
              </Button>
              
              {currentCommission.action === 'approve' && (
                <Button 
                  variant="primary" 
                  onClick={handleApproveCommission}
                  disabled={loading}
                >
                  Approve Commission
                </Button>
              )}
              
              {currentCommission.action === 'reject' && (
                <Button 
                  variant="error" 
                  onClick={handleRejectCommission}
                  disabled={loading || !formData.reason}
                >
                  Reject Commission
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;