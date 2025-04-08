import React, { useState, useEffect } from 'react';
import { Search, Check, X, Edit, ExternalLink } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Loading } from '../../components/common/Loading/Loading';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import './AffiliateManagement.scss';

export const AffiliateManagement = () => {
  // State
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [formData, setFormData] = useState({
    notes: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  // API hooks
  const { 
    loading, 
    error, 
    callApi,
    approveAffiliateApplication,
    rejectAffiliateApplication
  } = useApi();

  // Load affiliate applications on mount and when filters change
  useEffect(() => {
    loadAffiliateApplications(pagination.currentPage);
  }, [selectedStatus]);

  // Load affiliate applications function
  const loadAffiliateApplications = async (page = 1) => {
    try {
      const data = await callApi(
        async () => {
          return await fetch(`/api/v1/admin/affiliate-applications?page=${page}&per_page=10${selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''}`);
        }
      );
      
      if (data && data.data) {
        setApplications(data.data);
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count
          });
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Error loading affiliate applications:', err);
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

  // View application details
  const handleViewApplication = (application) => {
    setCurrentApplication(application);
    setFormData({
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle approve application
  const handleApproveApplication = async (e) => {
    e.preventDefault();
    
    try {
      await approveAffiliateApplication(currentApplication.id, { notes: formData.notes });
      setIsModalOpen(false);
      loadAffiliateApplications(pagination.currentPage);
    } catch (err) {
      console.error('Error approving application:', err);
    }
  };

  // Handle reject application
  const handleRejectApplication = async (e) => {
    e.preventDefault();
    
    try {
      await rejectAffiliateApplication(currentApplication.id, { notes: formData.notes });
      setIsModalOpen(false);
      loadAffiliateApplications(pagination.currentPage);
    } catch (err) {
      console.error('Error rejecting application:', err);
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadAffiliateApplications(page);
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

  // Filter applications based on search term
  const filteredApplications = applications.filter(application => {
    if (!searchTerm) return true;
    
    // Search in user email or username if available
    const email = application.relationships?.user?.data?.attributes?.email || '';
    const username = application.relationships?.user?.data?.attributes?.username || '';
    
    return email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="affiliate-management">
      <Card>
        <div className="affiliate-management__header">
          <h2 className="affiliate-management__title">Affiliate Applications</h2>
        </div>
        
        <div className="affiliate-management__filters">
          <div className="affiliate-management__search">
            <Input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="affiliate-management__status-filters">
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
        </div>
        
        {loading ? (
          <Loading message="Loading affiliate applications..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            retryAction={() => loadAffiliateApplications(pagination.currentPage)}
          />
        ) : (
          <div className="affiliate-management__table-container">
            {filteredApplications.length === 0 ? (
              <EmptyState 
                message="No affiliate applications found. Try adjusting your search or filters."
                icon={ExternalLink}
              />
            ) : (
              <>
                <table className="affiliate-management__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Processed</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map(application => (
                      <tr key={application.id}>
                        <td>
                          <div className="affiliate-management__user">
                            <div className="affiliate-management__username">
                              {application.relationships?.user?.data?.attributes?.username || 'Unknown User'}
                            </div>
                            <div className="affiliate-management__email">
                              {application.relationships?.user?.data?.attributes?.email || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`affiliate-management__status affiliate-management__status--${application.attributes.status}`}>
                            {application.attributes.status}
                          </span>
                        </td>
                        <td>{formatDate(application.attributes.submitted_at)}</td>
                        <td>{formatDate(application.attributes.processed_at)}</td>
                        <td>
                          <div className="affiliate-management__notes" title={application.attributes.notes}>
                            {application.attributes.notes || '-'}
                          </div>
                        </td>
                        <td className="affiliate-management__actions">
                          <Button
                            variant="icon"
                            onClick={() => handleViewApplication(application)}
                            title="View Application"
                          >
                            <Edit size={16} />
                          </Button>
                          
                          {application.attributes.status === 'pending' && (
                            <>
                              <Button
                                variant="icon"
                                onClick={() => {
                                  setCurrentApplication(application);
                                  setFormData({ notes: '' });
                                  handleApproveApplication({ preventDefault: () => {} });
                                }}
                                title="Approve Application"
                              >
                                <Check size={16} />
                              </Button>
                              
                              <Button
                                variant="icon"
                                onClick={() => {
                                  setCurrentApplication(application);
                                  setFormData({ notes: '' });
                                  setIsModalOpen(true);
                                }}
                                title="Reject Application"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="affiliate-management__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="affiliate-management__pagination-info">
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

      {isModalOpen && (
        <div className="affiliate-management__modal-overlay">
          <div className="affiliate-management__modal">
            <div className="affiliate-management__modal-header">
              <h2>
                {currentApplication.attributes.status === 'pending' 
                  ? 'Process Affiliate Application' 
                  : 'View Affiliate Application'}
              </h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="affiliate-management__application-details">
              <div className="affiliate-management__detail-row">
                <div className="affiliate-management__detail-label">User:</div>
                <div className="affiliate-management__detail-value">
                  {currentApplication.relationships?.user?.data?.attributes?.username}
                  <div className="affiliate-management__detail-secondary">
                    {currentApplication.relationships?.user?.data?.attributes?.email}
                  </div>
                </div>
              </div>
              
              <div className="affiliate-management__detail-row">
                <div className="affiliate-management__detail-label">Status:</div>
                <div className="affiliate-management__detail-value">
                  <span className={`affiliate-management__status affiliate-management__status--${currentApplication.attributes.status}`}>
                    {currentApplication.attributes.status}
                  </span>
                </div>
              </div>
              
              <div className="affiliate-management__detail-row">
                <div className="affiliate-management__detail-label">Submitted:</div>
                <div className="affiliate-management__detail-value">
                  {formatDate(currentApplication.attributes.submitted_at)}
                </div>
              </div>
              
              {currentApplication.attributes.processed_at && (
                <div className="affiliate-management__detail-row">
                  <div className="affiliate-management__detail-label">Processed:</div>
                  <div className="affiliate-management__detail-value">
                    {formatDate(currentApplication.attributes.processed_at)}
                  </div>
                </div>
              )}
              
              {currentApplication.attributes.notes && (
                <div className="affiliate-management__detail-row">
                  <div className="affiliate-management__detail-label">Notes:</div>
                  <div className="affiliate-management__detail-value">
                    {currentApplication.attributes.notes}
                  </div>
                </div>
              )}
            </div>
            
            {currentApplication.attributes.status === 'pending' && (
              <form>
                <div className="affiliate-management__form-group">
                  <label htmlFor="notes">Admin Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    className="affiliate-management__textarea"
                    rows={3}
                    placeholder="Add notes about this application..."
                  />
                </div>
                
                <div className="affiliate-management__form-actions">
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="error" 
                    type="button"
                    onClick={handleRejectApplication}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="primary" 
                    type="button"
                    onClick={handleApproveApplication}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                </div>
              </form>
            )}
            
            {currentApplication.attributes.status !== 'pending' && (
              <div className="affiliate-management__form-actions">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManagement;