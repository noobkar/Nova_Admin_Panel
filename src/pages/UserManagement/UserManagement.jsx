import React, { useState, useEffect } from 'react';
import { Edit, Trash, X, AlertCircle, Search } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import './UserManagement.scss';

export const UserManagement = () => {
  // State
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    status: 'active',
    password: '',
    password_confirmation: ''
  });

  // Hooks
  const { 
    loading, 
    error, 
    fetchUsers,
    fetchUserDetails,
    createUser,
    updateUser,
    deleteUser
  } = useApi();

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers(pagination.currentPage);
  }, [selectedStatus]);

  // Load users function
  const loadUsers = async (page = 1) => {
    try {
      const data = await fetchUsers(page, 10, searchTerm, selectedStatus !== 'all' ? selectedStatus : null);
      
      if (data && data.data) {
        setUsers(data.data);
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count
          });
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1); // Reset to first page on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Status filter handling
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Add user
  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      email: '',
      username: '',
      status: 'active',
      password: '',
      password_confirmation: ''
    });
    setIsModalOpen(true);
  };

  // Edit user
  const handleEditUser = async (user) => {
    try {
      const userData = await fetchUserDetails(user.id);
      
      if (userData) {
        setCurrentUser(userData.data);
        setFormData({
          email: userData.data.attributes.email,
          username: userData.data.attributes.username,
          status: userData.data.attributes.status,
          password: '',
          password_confirmation: ''
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading user details:', err);
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(id);
        loadUsers(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.password_confirmation) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      if (currentUser) {
        // Edit existing user
        const userData = { ...formData };
        
        // Only include password if provided
        if (!userData.password) {
          delete userData.password;
          delete userData.password_confirmation;
        }
        
        await updateUser(currentUser.id, userData);
      } else {
        // Create new user
        await createUser(formData);
      }
      
      setIsModalOpen(false);
      loadUsers(pagination.currentPage);
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadUsers(page);
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

  return (
    <div className="user-management">
      <Card>
        <div className="user-management__header">
          <h2 className="user-management__title">User Management</h2>
          <Button 
            variant="primary" 
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </div>
        
        <div className="user-management__filters">
          <div className="user-management__search">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="user-management__status-filters">
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
              variant={selectedStatus === 'pending' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="user-management__loading">
            <AlertCircle size={20} />
            <span>Loading users...</span>
          </div>
        ) : error ? (
          <div className="user-management__error">{error}</div>
        ) : (
          <div className="user-management__table-container">
            {users.length === 0 ? (
              <div className="user-management__empty">
                No users found. Try adjusting your search or filters.
              </div>
            ) : (
              <>
                <table className="user-management__table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.attributes.username}</td>
                        <td>{user.attributes.email}</td>
                        <td>
                          <span className={`user-management__status user-management__status--${user.attributes.status}`}>
                            {user.attributes.status}
                          </span>
                        </td>
                        <td>{formatDate(user.attributes.created_at)}</td>
                        <td>{formatDate(user.attributes.last_login)}</td>
                        <td className="user-management__actions">
                          <Button
                            variant="icon"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                          >
                            <Trash size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="user-management__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="user-management__pagination-info">
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
        <div className="user-management__modal-overlay">
          <div className="user-management__modal">
            <div className="user-management__modal-header">
              <h2>{currentUser ? 'Edit User' : 'Add New User'}</h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="user-management__form-group">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="user-management__form-group">
                <Input
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="user-management__form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="user-management__select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="user-management__form-group">
                <Input
                  label={currentUser ? "New Password (leave blank to keep current)" : "Password"}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={!currentUser}
                />
              </div>
              <div className="user-management__form-group">
                <Input
                  label="Confirm Password"
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleFormChange}
                  required={!currentUser || formData.password.length > 0}
                />
                {formData.password !== formData.password_confirmation && formData.password_confirmation && (
                  <div className="user-management__form-error">
                    Passwords do not match
                  </div>
                )}
              </div>
              <div className="user-management__form-actions">
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
                  disabled={
                    loading || 
                    (formData.password !== formData.password_confirmation && formData.password_confirmation)
                  }
                >
                  {loading ? 'Saving...' : (currentUser ? 'Update User' : 'Add User')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;