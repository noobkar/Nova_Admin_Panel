import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import { getApiData, mockApi, apiService } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Edit, Trash, AlertCircle, Search, RefreshCw, UserCheck, UserX } from 'react-feather';
import './ServerAssignment.scss';

export const ServerAssignment = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [formData, setFormData] = useState({
    user_id: '',
    server_id: '',
    status: 'active',
    expires_at: '',
    bandwidth_limit: 0
  });

  useEffect(() => {
    setCurrentPage('Server Assignment');
    fetchAssignments();
    fetchUsers();
    fetchServers();
  }, [setCurrentPage, selectedStatus]);

  const fetchAssignments = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        perPage: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      const response = await getApiData('/admin/assignments', mockApi.getAssignments, params);
      
      // Extract assignment data and transform if necessary
      let assignmentData = [];
      let paginationData = { currentPage: 1, totalPages: 1, totalCount: 0 };
      
      if (response && response.data && Array.isArray(response.data)) {
        // Format from the API with data array and pagination in meta
        assignmentData = response.data.map(assignment => ({
          id: assignment.id,
          user_id: assignment.attributes.user_id,
          server_id: assignment.attributes.server_id,
          status: assignment.attributes.status,
          created_at: assignment.attributes.created_at,
          expires_at: assignment.attributes.expires_at,
          bandwidth_limit: assignment.attributes.bandwidth_limit,
          current_usage: assignment.attributes.current_usage
        }));
        
        if (response.meta) {
          paginationData = {
            currentPage: response.meta.current_page,
            totalPages: response.meta.total_pages,
            totalCount: response.meta.total_count
          };
        }
      } else if (Array.isArray(response)) {
        // Simple array format (likely from mock data)
        assignmentData = response;
      }
      
      setAssignments(assignmentData);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getApiData('/admin/users', mockApi.getUsers, { perPage: 100 });
      
      let userData = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        // Format from the API with data array
        userData = response.data.map(user => ({
          id: user.id,
          name: user.attributes.name,
          email: user.attributes.email,
          status: user.attributes.status
        }));
      } else if (Array.isArray(response)) {
        // Simple array format (likely from mock data)
        userData = response;
      }
      
      setUsers(userData.filter(user => user.status === 'active'));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(prev => prev || 'Failed to load user data');
    }
  };

  const fetchServers = async () => {
    try {
      const response = await getApiData('/admin/servers', mockApi.getServers, { perPage: 100 });
      
      let serverData = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        // Format from the API with data array
        serverData = response.data.map(server => ({
          id: server.id,
          name: server.attributes.name,
          location: server.attributes.description || 'Unknown',
          status: server.attributes.status,
          server_type: server.attributes.server_type
        }));
      } else if (Array.isArray(response)) {
        // Simple array format (likely from mock data)
        serverData = response;
      }
      
      setServers(serverData);
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError(prev => prev || 'Failed to load server data');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  const handleAddAssignment = () => {
    setCurrentAssignment(null);
    
    // Set default expiration date to 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const formattedDate = oneYearFromNow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    setFormData({
      user_id: '',
      server_id: '',
      status: 'active',
      expires_at: formattedDate,
      bandwidth_limit: 500 // Default bandwidth 500GB
    });
    
    setIsModalOpen(true);
  };

  const handleEditAssignment = async (assignment) => {
    setLoading(true);
    try {
      // For edit, we want to fetch the complete assignment details
      const assignmentDetails = await getApiData(`/admin/assignments/${assignment.id}`, 
        () => ({ data: { attributes: assignment } }),
        { assignmentId: assignment.id }
      );
      
      const assignmentData = assignmentDetails.attributes || assignmentDetails;
      
      setCurrentAssignment(assignmentData);
      
      // Format expires_at as YYYY-MM-DD for the date input
      let expiresAt = '';
      if (assignmentData.expires_at) {
        expiresAt = new Date(assignmentData.expires_at).toISOString().split('T')[0];
      }
      
      setFormData({
        user_id: assignmentData.user_id?.toString() || '',
        server_id: assignmentData.server_id?.toString() || '',
        status: assignmentData.status || 'active',
        expires_at: expiresAt,
        bandwidth_limit: assignmentData.bandwidth_limit || 0
      });
      
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      alert('Failed to load assignment details for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setLoading(true);
      try {
        await getApiData(`/admin/assignments/${id}/delete`, () => {}, { assignmentId: id });
        
        // Remove the assignment from the UI
        setAssignments(assignments.filter(assignment => assignment.id !== id));
        alert('Assignment deleted successfully');
      } catch (err) {
        console.error('Error deleting assignment:', err);
        alert('Failed to delete assignment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignmentStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      const assignment = assignments.find(a => a.id === id);
      if (!assignment) throw new Error('Assignment not found');
      
      const updatedData = {
        status: newStatus
      };
      
      await getApiData(`/admin/assignments/${id}/update`, () => {}, { 
        assignmentId: id,
        assignmentData: updatedData
      });
      
      // Update the assignment status in the UI
      setAssignments(assignments.map(assignment => 
        assignment.id === id 
          ? { ...assignment, status: newStatus } 
          : assignment
      ));
    } catch (err) {
      console.error('Error updating assignment status:', err);
      alert('Failed to update assignment status');
    } finally {
      setLoading(false);
    }
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
    
    const isEditing = !!currentAssignment;
    setLoading(true);
    
    try {
      const formDataToSend = {
        user_id: parseInt(formData.user_id),
        server_id: parseInt(formData.server_id),
        status: formData.status,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        bandwidth_limit: parseInt(formData.bandwidth_limit)
      };
      
      if (isEditing) {
        // Edit existing assignment
        await getApiData(`/admin/assignments/${currentAssignment.id}/update`, () => {}, {
          assignmentId: currentAssignment.id,
          assignmentData: formDataToSend
        });
        
        alert('Assignment updated successfully');
      } else {
        // Add new assignment
        await getApiData('/admin/assignments/create', () => {}, {
          assignmentData: formDataToSend
        });
        
        alert('Assignment created successfully');
      }
      
      // Close modal and refresh the assignment list
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err) {
      console.error('Error saving assignment:', err);
      alert(`Failed to ${isEditing ? 'update' : 'create'} assignment`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id == userId);
    return user ? user.name : 'Unknown User';
  };

  const getServerName = (serverId) => {
    const server = servers.find(s => s.id == serverId);
    return server ? server.name : 'Unknown Server';
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => {
    const userName = getUserName(assignment.user_id).toLowerCase();
    const serverName = getServerName(assignment.server_id).toLowerCase();
    
    return userName.includes(searchTerm.toLowerCase()) || 
           serverName.includes(searchTerm.toLowerCase());
  });

  const handlePageChange = (page) => {
    fetchAssignments(page);
  };

  // Calculate bandwidth usage percentage
  const calculateUsagePercentage = (current, limit) => {
    if (!limit) return 0;
    const percentage = (current / limit) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

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
              variant={selectedStatus === 'all' ? 'primary' : 'outline'}
              size="small"
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedStatus === 'active' ? 'primary' : 'outline'}
              size="small"
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button 
              variant={selectedStatus === 'suspended' ? 'primary' : 'outline'} 
              size="small"
              onClick={() => handleStatusFilter('suspended')}
            >
              Suspended
            </Button>
            <Button 
              variant={selectedStatus === 'expired' ? 'primary' : 'outline'} 
              size="small"
              onClick={() => handleStatusFilter('expired')}
            >
              Expired
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="server-assignment__loading">
            <AlertCircle size={20} />
            <span>Loading assignments...</span>
          </div>
        ) : error ? (
          <div className="server-assignment__error">{error}</div>
        ) : (
          <div className="server-assignment__table-container">
            {filteredAssignments.length === 0 ? (
              <div className="server-assignment__empty">
                No assignments match your search criteria.
              </div>
            ) : (
              <>
                <table className="server-assignment__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Server</th>
                      <th>Status</th>
                      <th>Bandwidth</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td>{getUserName(assignment.user_id)}</td>
                        <td>{getServerName(assignment.server_id)}</td>
                        <td>
                          <span className={`server-assignment__status server-assignment__status--${assignment.status}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td>
                          <div className="server-assignment__bandwidth">
                            <div className="server-assignment__bandwidth-info">
                              {assignment.current_usage || 0} / {assignment.bandwidth_limit || 0} GB
                            </div>
                            <div className="server-assignment__bandwidth-bar">
                              <div 
                                className="server-assignment__bandwidth-progress"
                                style={{ 
                                  width: `${calculateUsagePercentage(assignment.current_usage, assignment.bandwidth_limit)}%`,
                                  backgroundColor: calculateUsagePercentage(assignment.current_usage, assignment.bandwidth_limit) > 90 ? '#e74c3c' : '#3498db'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(assignment.expires_at)}</td>
                        <td className="server-assignment__actions">
                          {assignment.status !== 'active' && (
                            <Button
                              variant="icon"
                              onClick={() => handleAssignmentStatus(assignment.id, 'active')}
                              title="Activate Assignment"
                            >
                              <UserCheck size={16} />
                            </Button>
                          )}
                          {assignment.status !== 'suspended' && (
                            <Button
                              variant="icon"
                              onClick={() => handleAssignmentStatus(assignment.id, 'suspended')}
                              title="Suspend Assignment"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="server-assignment__pagination">
                    <Button 
                      variant="outline" 
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
                      variant="outline" 
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
                      {user.name} ({user.email})
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
                  {servers
                    .filter(server => server.status === 'active')
                    .map(server => (
                      <option key={server.id} value={server.id}>
                        {server.name} ({server.location})
                      </option>
                    ))
                  }
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
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="server-assignment__form-group">
                <Input
                  label="Expiration Date"
                  type="date"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleFormChange}
                  required
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
                  disabled={loading}
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
