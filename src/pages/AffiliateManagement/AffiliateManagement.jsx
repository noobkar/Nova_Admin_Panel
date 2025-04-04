import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useNavigation } from '../../hooks/useNavigation';
import { getApiData, mockApi } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import './AffiliateManagement.scss';

export const AffiliateManagement = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  
  const [affiliates, setAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAffiliate, setCurrentAffiliate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    commission_rate: 10,
    status: 'active',
    payment_method: 'bank_transfer',
    payment_details: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage('Affiliate Management');
    fetchAffiliates();
  }, [searchTerm, selectedStatus, currentPageNumber]);

  const fetchAffiliates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPageNumber,
        perPage: 10,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      const response = await getApiData('/admin/affiliates', mockApi.getAffiliates, params);
      
      // Transform the data if needed
      let affiliatesList = [];
      if (Array.isArray(response)) {
        affiliatesList = response;
      } else if (response && response.data) {
        affiliatesList = response.data.map(affiliate => ({
          id: affiliate.id,
          ...affiliate.attributes
        }));
        
        // Handle pagination
        if (response.meta) {
          setCurrentPageNumber(response.meta.current_page);
          setTotalPages(response.meta.total_pages);
        }
      }
      
      setAffiliates(affiliatesList);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
      setError('Failed to load affiliates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPageNumber(1); // Reset to first page on new search
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setCurrentPageNumber(1); // Reset to first page on new filter
  };

  const handleAddAffiliate = () => {
    setCurrentAffiliate(null);
    setFormData({
      name: '',
      email: '',
      website: '',
      commission_rate: 10,
      status: 'active',
      payment_method: 'bank_transfer',
      payment_details: ''
    });
    setIsModalOpen(true);
  };

  const handleEditAffiliate = (affiliate) => {
    setCurrentAffiliate(affiliate);
    setFormData({
      name: affiliate.name,
      email: affiliate.email,
      website: affiliate.website,
      commission_rate: affiliate.commission_rate,
      status: affiliate.status,
      payment_method: affiliate.payment_method,
      payment_details: affiliate.payment_details
    });
    setIsModalOpen(true);
  };

  const handleDeleteAffiliate = async (id) => {
    if (window.confirm('Are you sure you want to delete this affiliate?')) {
      setLoading(true);
      try {
        await getApiData(`/admin/affiliates/${id}/delete`, () => {}, { affiliateId: id });
        fetchAffiliates();
      } catch (err) {
        console.error('Error deleting affiliate:', err);
        setError('Failed to delete affiliate. Please try again later.');
        setLoading(false);
      }
    }
  };

  const handleAffiliateStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      await getApiData(`/admin/affiliates/${id}/status`, () => {}, {
        affiliateId: id,
        status: newStatus
      });
      fetchAffiliates();
    } catch (err) {
      console.error('Error updating affiliate status:', err);
      setError('Failed to update affiliate status. Please try again later.');
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: name === 'commission_rate' ? parseInt(value, 10) : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (currentAffiliate) {
        // Update existing affiliate
        await getApiData(`/admin/affiliates/${currentAffiliate.id}/update`, () => {}, {
          affiliateId: currentAffiliate.id,
          affiliateData: formData
        });
      } else {
        // Create new affiliate
        await getApiData('/admin/affiliates/create', () => {}, {
          affiliateData: formData
        });
      }
      
      setIsModalOpen(false);
      fetchAffiliates();
    } catch (err) {
      console.error('Error saving affiliate:', err);
      setError('Failed to save affiliate. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageNumber(newPage);
    }
  };

  return (
    <div className="affiliate-management">
      <div className="affiliate-management__header">
        <h1>Affiliate Management</h1>
        <Button 
          variant="primary" 
          onClick={handleAddAffiliate}
        >
          Add New Affiliate
        </Button>
      </div>
      
      <Card className="affiliate-management__filters">
        <div className="affiliate-management__search">
          <Input
            type="text"
            placeholder="Search affiliates..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="affiliate-management__status-filter">
          <button 
            className={`affiliate-management__filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`affiliate-management__filter-btn ${selectedStatus === 'active' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('active')}
          >
            Active
          </button>
          <button 
            className={`affiliate-management__filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`affiliate-management__filter-btn ${selectedStatus === 'suspended' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('suspended')}
          >
            Suspended
          </button>
        </div>
      </Card>
      
      <Card className="affiliate-management__table-card">
        {loading && <div className="affiliate-management__loading">Loading affiliates...</div>}
        
        {error && <div className="affiliate-management__error">{error}</div>}
        
        {!loading && !error && (
          <>
            {affiliates.length === 0 ? (
              <div className="affiliate-management__empty">
                No affiliates found. Try adjusting your search or filters.
              </div>
            ) : (
              <>
                <div className="affiliate-management__table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Website</th>
                        <th>Commission Rate</th>
                        <th>Status</th>
                        <th>Referred Users</th>
                        <th>Total Earnings</th>
                        <th>Pending Payment</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliates.map(affiliate => (
                        <tr key={affiliate.id}>
                          <td>{affiliate.name}</td>
                          <td>{affiliate.email}</td>
                          <td>
                            <a href={affiliate.website} target="_blank" rel="noopener noreferrer">
                              {affiliate.website.replace(/(^\w+:|^)\/\//, '')}
                            </a>
                          </td>
                          <td>{affiliate.commission_rate}%</td>
                          <td>
                            <span className={`affiliate-management__status affiliate-management__status--${affiliate.status}`}>
                              {affiliate.status}
                            </span>
                          </td>
                          <td>{affiliate.referred_users}</td>
                          <td>{formatCurrency(affiliate.total_earnings)}</td>
                          <td>{formatCurrency(affiliate.pending_payment)}</td>
                          <td>{formatDate(affiliate.joined_at)}</td>
                          <td>
                            <div className="affiliate-management__actions">
                              <Button 
                                variant="icon" 
                                icon="edit" 
                                onClick={() => handleEditAffiliate(affiliate)}
                                title="Edit"
                              />
                              
                              {affiliate.status === 'active' ? (
                                <Button 
                                  variant="icon" 
                                  icon="pause"
                                  onClick={() => handleAffiliateStatus(affiliate.id, 'suspended')}
                                  title="Suspend"
                                />
                              ) : affiliate.status === 'pending' ? (
                                <Button 
                                  variant="icon" 
                                  icon="check"
                                  onClick={() => handleAffiliateStatus(affiliate.id, 'active')}
                                  title="Approve"
                                />
                              ) : (
                                <Button 
                                  variant="icon" 
                                  icon="play"
                                  onClick={() => handleAffiliateStatus(affiliate.id, 'active')}
                                  title="Activate"
                                />
                              )}
                              
                              <Button 
                                variant="icon" 
                                icon="trash" 
                                onClick={() => handleDeleteAffiliate(affiliate.id)}
                                title="Delete"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="affiliate-management__pagination">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPageNumber - 1)}
                      disabled={currentPageNumber === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="affiliate-management__page-info">
                      Page {currentPageNumber} of {totalPages}
                    </span>
                    
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(currentPageNumber + 1)}
                      disabled={currentPageNumber === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Card>
      
      {isModalOpen && (
        <div className="affiliate-management__modal">
          <div className="affiliate-management__modal-content">
            <div className="affiliate-management__modal-header">
              <h2>{currentAffiliate ? 'Edit Affiliate' : 'Add New Affiliate'}</h2>
              <Button 
                variant="icon" 
                icon="x" 
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="affiliate-management__form-group">
                <Input
                  label="Affiliate Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="affiliate-management__form-group">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="affiliate-management__form-group">
                <Input
                  label="Website"
                  type="url"
                  name="website"
                  placeholder="https://"
                  value={formData.website}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="affiliate-management__form-group">
                <Input
                  label="Commission Rate (%)"
                  type="number"
                  min="1"
                  max="50"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="affiliate-management__form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="affiliate-management__form-group">
                <label htmlFor="payment_method">Payment Method</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleFormChange}
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="affiliate-management__form-group">
                <Input
                  label="Payment Details"
                  name="payment_details"
                  value={formData.payment_details}
                  onChange={handleFormChange}
                  required
                  multiline
                  rows={3}
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
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (currentAffiliate ? 'Update Affiliate' : 'Add Affiliate')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManagement;
