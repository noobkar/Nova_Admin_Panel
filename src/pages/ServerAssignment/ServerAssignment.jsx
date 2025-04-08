import React, { useState, useEffect } from 'react';
import { Edit, Trash, Search, RefreshCw, UserCheck, UserX } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Loading } from '../../components/common/Loading/Loading';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import './ServerAssignment.scss';

export const ServerAssignment = () => {
  // State
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [formData, setFormData] = useState({
    user_id: '',
    server_id: '',
    status: 'active',
    is_premium: false,
    is_public: false,
    expires_at: '',
    bandwidth_limit: 500
  });

  // API hooks
  const { 
    loading, 
    error, 
    fetchServerAssignments,
    fetchUsers,
    fetchServers,
    createServerAssignment,
    updateServerAssignment,
    deleteServerAssignment,
    approveRequest,
    rejectRequest
  } = useApi();

  // Load assignments, users, servers on mount
  useEffect(() => {
    loadAssignments(pagination.currentPage);
    loadUsers();
    loadServers();
  }, [selectedStatus]);

  // Load assignments function
  const loadAssignments = async (page = 1) => {
    try {
      const data = await fetchServerAssignments(
        page, 
        10, 
        selectedStatus !== 'all' ? selectedStatus : null
      );
      
      if (data && data.data) {
        setAssignments(data.data);
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count
          });
        }
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  // Load users function
  const loadUsers = async () => {
    try {
      const data = await fetchUsers(1, 100, null, 'active');
      if (data && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Load servers function
  const loadServers = async () => {
    try {
      const data = await fetchServers(1, 100, 'active');
      if (data && data.data) {
        setServers(data.data);
      }
    } catch (err) {
      console.error('Error loading servers:', err);
    }
  };

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // For assignments, we'll filter client-side since the API doesn't 
      // support searching on user or server name
      // In a real app, this would ideally be done on the server
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Status filter handling
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Add assignment
  const handleAddAssignment = () => {
    // Set default expiration date to 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const formattedDate = oneYearFromNow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    setCurrentAssignment(null);
    setFormData({
      user_id: '',
      server_id: '',
      status: 'active',
      is_premium: false,
      is_public: false,
      expires_at: formattedDate,
      bandwidth_limit: 500
    });
    setIsModalOpen(true);
  };

  // Edit assignment
  const handleEditAssignment = (assignment) => {
    // Parse expires_at date for form
    let expiresAt = '';
    if (assignment.attributes.expires_at) {
      expiresAt = new Date(assignment.attributes.expires_at).toISOString().split('T')[0];
    }
    
    setCurrentAssignment(assignment);
    setFormData({
      user_id: assignment.attributes.user_id,
      server_id: assignment.attributes.server_id,
      status: assignment.attributes.status,
      is_premium: assignment.attributes.is_premium || false,
      is_public: assignment.attributes.is_public || false,
      expires_at: expiresAt,
      bandwidth_limit: assignment.attributes.bandwidth_limit || 500
    });
    setIsModalOpen(true);
  };

  // Delete assignment
  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteServerAssignment(id);
        loadAssignments(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting assignment:', err);
      }
    }
  };

  // Update assignment status
  const handleAssignmentStatus = async (id, newStatus) => {
    try {
      const assignmentToUpdate = assignments.find(a => a.id === id);
      if (!assignmentToUpdate) return;
      
      await updateServerAssignment(id, {
        ...assignmentToUpdate.attributes,
        status: newStatus
      });
      
      loadAssignments(pagination.currentPage);
    } catch (err) {
      console.error('Error updating assignment status:', err);
    }
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format form data for API
      const assignmentData = {
        ...formData,
        user_id: Number(formData.user_id),
        server_id: Number(formData.server_id),
        bandwidth_limit: Number(formData.bandwidth_limit),
        // Convert YYYY-MM-DD to ISO date string if exists
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };
      
      if (currentAssignment) {
        // Update existing assignment
        await updateServerAssignment(currentAssignment.id, assignmentData);
      } else {
        // Create new assignment
        await createServerAssignment(assignmentData);
      }
      
      setIsModalOpen(false);
      loadAssignments(pagination.currentPage);
    } catch (err) {
      console.error('Error saving assignment:', err);
    }
  };

  // Handle approve request
  const handleApproveRequest = async (id) => {
    if (window.confirm('Are you sure you want to approve this server request?')) {
      try {
        await approveRequest(id);
        loadAssignments(pagination.currentPage);
      } catch (err) {
        console.error('Error approving request:', err);
      }
    }
  };

  // Handle reject request
  const handleRejectRequest = async (id) => {
    if (window.confirm('Are you sure you want to reject this server request?')) {
      try {
        await rejectRequest(id);
        loadAssignments(pagination.currentPage);
      } catch (err) {
        console.error('Error rejecting request:', err);
      }
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadAssignments(page);
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

  // Helper to get user name from ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId.toString());
    return user ? user.attributes.username : 'Unknown User';
  };

  // Helper to get server name from ID
  const getServerName = (serverId) => {
    const server = servers.find(s => s.id === serverId.toString());
    return server ? server.attributes.name : 'Unknown Server';
  };

  // Calculate bandwidth usage percentage
  const calculateUsagePercentage = (current, limit) => {
    if (!limit) return 0;
    const percentage = (current / limit) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true;
    
    const userName = getUserName(assignment.attributes.user_id).toLowerCase();
    const serverName = getServerName(assignment.attributes.server_id).toLowerCase();
    
    return userName.includes(searchTerm.toLowerCase()) || 
           serverName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="server-assignment">
      <Card>
        <div className="server-assignment__header">
          <h2 className="server-assignment__title">Server Assignments</h2>
          <Button onClick={handleAddAssignment} variant="primary">New Assignment</Button>
        </div>
        
        <div className="server-assignment__filters">
          <div className="server-assignment__search">
            <Input
              type="text"
              placeholder="Search by user or server..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="server-assignment__status-filters">
            <Button 
              variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedStatus === 'active' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button 
              variant={selectedStatus === 'inactive' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
            <Button 
              variant={selectedStatus === 'expired' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('expired')}
            >
              Expired
            </Button>
            <Button 
              variant={selectedStatus === 'pending' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
        
        {loading ? (
          <Loading message="Loading server assignments..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            retryAction={() => loadAssignments(pagination.currentPage)}
          />
        ) : (
          <div className="server-assignment__table-container">
            {filteredAssignments.length === 0 ? (
              <EmptyState 
                message="No server assignments found. Try adjusting your search or filters."
                icon={RefreshCw}
                action={
                  <Button 
                    variant="primary" 
                    onClick={handleAddAssignment}
                  >
                    Create New Assignment
                  </Button>
                }
              />
            ) : (
              <>
                <table className="server-assignment__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Server</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td>{getUserName(assignment.attributes.user_id)}</td>
                        <td>{getServerName(assignment.attributes.server_id)}</td>
                        <td>
                          <span className={`server-assignment__status server-assignment__status--${assignment.attributes.status}`}>
                            {assignment.attributes.status}
                          </span>
                        </td>
                        <td>
                          <span className={`server-assignment__type ${assignment.attributes.is_premium ? 'server-assignment__type--premium' : ''}`}>
                            {assignment.attributes.is_premium ? 'Premium' : 'Standard'}
                          </span>
                        </td>
                        <td>{formatDate(assignment.attributes.expires_at)}</td>
                        <td className="server-assignment__actions">
                          {assignment.attributes.status === 'pending' && (
                            <>
                              <Button
                                variant="icon"
                                onClick={() => handleApproveRequest(assignment.id)}
                                title="Approve Request"
                              >
                                <UserCheck size={16} />
                              </Button>
                              <Button
                                variant="icon"
                                onClick={() => handleRejectRequest(assignment.id)}
                                title="Reject Request"
                              >
                                <UserX size={16} />
                              </Button>
                            </>
                          )}
                          {assignment.attributes.status !== 'pending' && (
                            <>
                              {assignment.attributes.status !== 'active' && (
                                <Button
                                  variant="icon"
                                  onClick={() => handleAssignmentStatus(assignment.id, 'active')}
                                  title="Activate Assignment"
                                >
                                  <UserCheck size={16} />
                                </Button>
                              )}
                              {assignment.attributes.status !== 'inactive' && (
                                <Button
                                  variant="icon"
                                  onClick={() => handleAssignmentStatus(assignment.id, 'inactive')}
                                  title="Deactivate Assignment"
                                >
                                  <UserX size={16} />
                                </Button>
                              )}
                              <Button
                                variant="icon"
                                onClick={() => handleEditAssignment(assignment)}
                                title="Edit Assignment"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="icon"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                title="Delete Assignment"
                              >
                                <Trash size={16} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="server-assignment__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="server-assignment__pagination-info">
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
        <div className="server-assignment__modal-overlay">
          <div className="server-assignment__modal">
            <div className="server-assignment__modal-header">
              <h2>{currentAssignment ? 'Edit Assignment' : 'New Server Assignment'}</h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <Trash size={18} />
              </Button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="server-assignment__form-group">
                <label htmlFor="user_id">User</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleFormChange}
                  required
                  className="server-assignment__select"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.attributes.username} ({user.attributes.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="server-assignment__form-group">
                <label htmlFor="server_id">Server</label>
                <select
                  id="server_id"
                  name="server_id"
                  value={formData.server_id}
                  onChange={handleFormChange}
                  required
                  className="server-assignment__select"
                >
                  <option value="">Select Server</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>
                      {server.attributes.name} ({server.attributes.description || server.attributes.ip_address})
                    </option>
                  ))}
                </select>
              </div>
              <div className="server-assignment__form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="server-assignment__select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="server-assignment__form-group">
                <div className="server-assignment__checkbox-group">
                  <input
                    type="checkbox"
                    id="is_premium"
                    name="is_premium"
                    checked={formData.is_premium}
                    onChange={handleFormChange}
                    className="server-assignment__checkbox"
                  />
                  <label htmlFor="is_premium" className="server-assignment__checkbox-label">
                    Premium Assignment
                  </label>
                </div>
              </div>
              <div className="server-assignment__form-group">
                <div className="server-assignment__checkbox-group">
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleFormChange}
                    className="server-assignment__checkbox"
                  />
                  <label htmlFor="is_public" className="server-assignment__checkbox-label">
                    Public Assignment
                  </label>
                </div>
              </div>
              <div className="server-assignment__form-group">
                <Input
                  label="Expiration Date"
                  type="date"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleFormChange}
                />
              </div>
              <div className="server-assignment__form-group">
                <Input
                  label="Bandwidth Limit (GB)"
                  type="number"
                  min="0"
                  name="bandwidth_limit"
                  value={formData.bandwidth_limit}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="server-assignment__form-actions">
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
                  {loading ? 'Saving...' : (currentAssignment ? 'Update Assignment' : 'Create Assignment')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerAssignment;