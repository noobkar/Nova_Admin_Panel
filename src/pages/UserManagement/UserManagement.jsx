import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useNavigation } from '../../hooks/useNavigation';
import { getApiData, mockApi, apiService } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Edit, Trash, X, AlertCircle, Search } from 'react-feather';
import './UserManagement.scss';

export const UserManagement = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    password: '',
    password_confirmation: ''
  });

  useEffect(() => {
    // Set the current page for navigation context
    setCurrentPage('User Management');
    fetchUsers();
  }, [setCurrentPage, selectedStatus]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        perPage: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      const response = await getApiData('/admin/users', mockApi.getUsers, params);
      
      // Extract user data and transform if necessary
      let userData = [];
      let paginationData = { currentPage: 1, totalPages: 1, totalCount: 0 };
      
      if (response && response.data && Array.isArray(response.data)) {
        // Format from the API with data array and pagination in meta
        userData = response.data.map(user => ({
          id: user.id,
          name: user.attributes.name,
          email: user.attributes.email,
          role: user.attributes.role,
          status: user.attributes.status,
          created_at: user.attributes.created_at,
          updated_at: user.attributes.updated_at
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
        userData = response;
      }
      
      setUsers(userData);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      password: '',
      password_confirmation: ''
    });
    setIsModalOpen(true);
  };

  const handleEditUser = async (user) => {
    setLoading(true);
    try {
      // For edit, we want to fetch the complete user details
      const userDetails = await getApiData(`/admin/users/${user.id}`, 
        () => ({ data: { attributes: user } }),
        { userId: user.id }
      );
      
      const userData = userDetails.attributes || userDetails;
      
      setCurrentUser(userData);
      setFormData({
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
        status: userData.status,
        password: '',
        password_confirmation: ''
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to load user details for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      try {
        await getApiData(`/admin/users/${id}/delete`, () => {}, { userId: id });
        
        // Remove the user from the UI
        setUsers(users.filter(user => user.id !== id));
        alert('User deleted successfully');
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      } finally {
        setLoading(false);
      }
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
    
    const isEditing = !!currentUser;
    setLoading(true);
    
    try {
      const formDataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      
      // Add password fields only if they are filled in
      if (formData.password) {
        formDataToSend.password = formData.password;
        formDataToSend.password_confirmation = formData.password_confirmation;
      }
      
      if (isEditing) {
        // Edit existing user
        await getApiData(`/admin/users/${currentUser.id}/update`, () => {}, {
          userId: currentUser.id,
          userData: formDataToSend
        });
        
        alert('User updated successfully');
      } else {
        // Password is required for new users
        if (!formData.password) {
          alert('Password is required for new users');
          setLoading(false);
          return;
        }
        
        // Add new user
        await getApiData('/admin/users/create', () => {}, {
          userData: formDataToSend
        });
        
        alert('User created successfully');
      }
      
      // Close modal and refresh the user list
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      alert(`Failed to ${isEditing ? 'update' : 'create'} user: ${err.message || 'Unknown error'}`);
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    return user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  return (
    <div className="user-management">
      <Card>
        <div className="user-management__header">
          <h2 className="user-management__title">User Management</h2>
          <Button onClick={handleAddUser} variant="primary">Add User</Button>
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
              variant={selectedStatus === 'inactive' ? 'primary' : 'outline'} 
              size="small"
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
            <Button 
              variant={selectedStatus === 'suspended' ? 'primary' : 'outline'} 
              size="small"
              onClick={() => handleStatusFilter('suspended')}
            >
              Suspended
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
            {filteredUsers.length === 0 ? (
              <div className="user-management__empty">
                No users match your search criteria.
              </div>
            ) : (
              <>
                <table className="user-management__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`user-management__role user-management__role--${user.role}`}>
                            {user.role === 'admin' ? 'Administrator' : 
                              user.role === 'manager' ? 'Manager' : 'User'}
                          </span>
                        </td>
                        <td>
                          <span className={`user-management__status user-management__status--${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
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
                      variant="outline" 
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
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
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
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  required
                  className="user-management__select"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
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
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="user-management__form-group">
                <Input
                  label={`${currentUser ? 'New Password (leave blank to keep current)' : 'Password'}`}
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading || (formData.password !== formData.password_confirmation && formData.password_confirmation)}
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
