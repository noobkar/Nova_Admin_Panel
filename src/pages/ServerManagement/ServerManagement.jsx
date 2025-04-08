import React, { useState, useEffect } from 'react';
import { Edit, Trash, Power, X, Search, AlertTriangle, Tool, Server } from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Loading } from '../../components/common/Loading/Loading';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import './ServerManagement.scss';

export const ServerManagement = () => {
  // State
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    server_type: 'free',
    status: 'active',
    ip_address: '',
    config_type: 'url',
    config_url: '',
    config_file: null,
    image: null
  });

  // Hooks
  const { 
    loading, 
    error, 
    fetchServers,
    fetchServerDetails,
    createServer,
    updateServer,
    deleteServer
  } = useApi();

  // Load servers on mount and when filters change
  useEffect(() => {
    loadServers(pagination.currentPage);
  }, [selectedStatus]);

  // Load servers function
  const loadServers = async (page = 1) => {
    try {
      const data = await fetchServers(page, 10, selectedStatus !== 'all' ? selectedStatus : null);
      
      if (data && data.data) {
        setServers(data.data);
        
        if (data.meta) {
          setPagination({
            currentPage: data.meta.current_page,
            totalPages: data.meta.total_pages,
            totalCount: data.meta.total_count
          });
        }
      } else {
        setServers([]);
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
      loadServers(1); // Reset to first page on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Status filter handling
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Add server
  const handleAddServer = () => {
    setCurrentServer(null);
    setFormData({
      name: '',
      description: '',
      server_type: 'free',
      status: 'active',
      ip_address: '',
      config_type: 'url',
      config_url: '',
      config_file: null,
      image: null
    });
    setIsModalOpen(true);
  };

  // Edit server
  const handleEditServer = async (server) => {
    try {
      const serverData = await fetchServerDetails(server.id);
      
      if (serverData) {
        setCurrentServer(serverData.data);
        const attributes = serverData.data.attributes;
        
        setFormData({
          name: attributes.name || '',
          description: attributes.description || '',
          server_type: attributes.server_type || 'free',
          status: attributes.status || 'active',
          ip_address: attributes.ip_address || '',
          config_type: attributes.config?.type || 'url',
          config_url: attributes.config?.url || '',
          config_file: null, // Can't pre-fill file inputs
          image: null // Can't pre-fill file inputs
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading server details:', err);
    }
  };

  // Delete server
  const handleDeleteServer = async (id) => {
    if (window.confirm('Are you sure you want to delete this server? All associated assignments will be removed.')) {
      try {
        await deleteServer(id);
        loadServers(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting server:', err);
      }
    }
  };

  // Update server status
  const handleServerStatus = async (id, newStatus) => {
    try {
      const serverToUpdate = servers.find(server => server.id === id);
      if (!serverToUpdate) return;
      
      await updateServer(id, {
        ...serverToUpdate.attributes,
        status: newStatus
      });
      
      loadServers(pagination.currentPage);
    } catch (err) {
      console.error('Error updating server status:', err);
    }
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'config_file' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        config_file: files[0],
        config_type: 'file'
      }));
    } else if (name === 'image' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        image: files[0]
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for multipart/form-data requests
      const serverFormData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        // Only add config_url if config_type is url
        if (key === 'config_url' && formData.config_type !== 'url') {
          return;
        }
        
        // Only add config_file if config_type is file and there's a file
        if (key === 'config_file' && (formData.config_type !== 'file' || !formData.config_file)) {
          return;
        }
        
        // Only add image if there's a file
        if (key === 'image' && !formData.image) {
          return;
        }
        
        // Add the field
        serverFormData.append(key, formData[key]);
      });
      
      if (currentServer) {
        // Update existing server
        await updateServer(currentServer.id, serverFormData);
      } else {
        // Create new server
        await createServer(serverFormData);
      }
      
      setIsModalOpen(false);
      loadServers(pagination.currentPage);
    } catch (err) {
      console.error('Error saving server:', err);
    }
  };

  // Pagination handler
  const handlePageChange = (page) => {
    loadServers(page);
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

  // Filter servers for search
  const filteredServers = servers.filter(server => {
    return server.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (server.attributes.description && server.attributes.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
           server.attributes.ip_address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="server-management">
      <Card>
        <div className="server-management__header">
          <h2 className="server-management__title">Server Management</h2>
          <Button 
            variant="primary" 
            onClick={handleAddServer}
          >
            Add Server
          </Button>
        </div>
        
        <div className="server-management__filters">
          <div className="server-management__search">
            <Input
              type="text"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={handleSearch}
              icon={<Search size={16} />}
            />
          </div>
          
          <div className="server-management__status-filters">
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
              variant={selectedStatus === 'maintenance' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleStatusFilter('maintenance')}
            >
              Maintenance
            </Button>
            <Button 
              variant={selectedStatus === 'inactive' ? 'primary' : 'secondary'} 
              size="small"
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
        
        {loading ? (
          <Loading message="Loading servers..." />
        ) : error ? (
          <ErrorMessage 
            message={error} 
            retryAction={() => loadServers(pagination.currentPage)}
          />
        ) : (
          <div className="server-management__table-container">
            {filteredServers.length === 0 ? (
              <EmptyState 
                message="No servers found. Try adjusting your search or filters."
                icon={Server}
                action={
                  <Button 
                    variant="primary" 
                    onClick={handleAddServer}
                  >
                    Add Server
                  </Button>
                }
              />
            ) : (
              <>
                <table className="server-management__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>IP Address</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServers.map(server => (
                      <tr key={server.id}>
                        <td>
                          <div className="server-management__server-name">
                            {server.attributes.name}
                            {server.attributes.description && (
                              <div className="server-management__server-description">
                                {server.attributes.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`server-management__type server-management__type--${server.attributes.server_type}`}>
                            {server.attributes.server_type === 'premium' ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td>
                          <span className={`server-management__status server-management__status--${server.attributes.status}`}>
                            {server.attributes.status}
                          </span>
                        </td>
                        <td>{server.attributes.ip_address}</td>
                        <td>{formatDate(server.attributes.created_at)}</td>
                        <td className="server-management__actions">
                          {server.attributes.status !== 'active' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'active')}
                              title="Activate Server"
                            >
                              <Power size={16} />
                            </Button>
                          )}
                          {server.attributes.status !== 'maintenance' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'maintenance')}
                              title="Set to Maintenance"
                            >
                              <Tool size={16} />
                            </Button>
                          )}
                          {server.attributes.status !== 'inactive' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'inactive')}
                              title="Deactivate Server"
                            >
                              <AlertTriangle size={16} />
                            </Button>
                          )}
                          <Button
                            variant="icon"
                            onClick={() => handleEditServer(server)}
                            title="Edit Server"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => handleDeleteServer(server.id)}
                            title="Delete Server"
                          >
                            <Trash size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {pagination.totalPages > 1 && (
                  <div className="server-management__pagination">
                    <Button 
                      variant="secondary" 
                      size="small"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="server-management__pagination-info">
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
        <div className="server-management__modal-overlay">
          <div className="server-management__modal">
            <div className="server-management__modal-header">
              <h2>{currentServer ? 'Edit Server' : 'Add New Server'}</h2>
              <Button 
                variant="icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleFormSubmit} encType="multipart/form-data">
              <div className="server-management__form-group">
                <Input
                  label="Server Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="server-management__form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="server-management__textarea"
                  rows={3}
                />
              </div>
              <div className="server-management__form-group">
                <Input
                  label="IP Address"
                  name="ip_address"
                  value={formData.ip_address}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="server-management__form-group">
                <label htmlFor="server_type">Server Type</label>
                <select
                  id="server_type"
                  name="server_type"
                  value={formData.server_type}
                  onChange={handleFormChange}
                  required
                  className="server-management__select"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="server-management__form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="server-management__select"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="server-management__form-group">
                <label htmlFor="config_type">Configuration Type</label>
                <select
                  id="config_type"
                  name="config_type"
                  value={formData.config_type}
                  onChange={handleFormChange}
                  required
                  className="server-management__select"
                >
                  <option value="url">URL</option>
                  <option value="file">File</option>
                </select>
              </div>
              
              {formData.config_type === 'url' ? (
                <div className="server-management__form-group">
                  <Input
                    label="Configuration URL"
                    name="config_url"
                    value={formData.config_url}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              ) : (
                <div className="server-management__form-group">
                  <label htmlFor="config_file">Configuration File</label>
                  <input
                    type="file"
                    id="config_file"
                    name="config_file"
                    onChange={handleFormChange}
                    className="server-management__file-input"
                    accept=".json,.yaml,.xml,.txt"
                    required={!currentServer}
                  />
                  <div className="server-management__file-help">
                    Supported formats: JSON, YAML, XML, TXT (max 10MB)
                  </div>
                </div>
              )}
              
              <div className="server-management__form-group">
                <label htmlFor="image">Server Image (Optional)</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleFormChange}
                  className="server-management__file-input"
                  accept="image/jpeg,image/png,image/gif,image/svg+xml"
                />
                <div className="server-management__file-help">
                  Supported formats: JPG, PNG, GIF, SVG (max 10MB)
                </div>
              </div>
              
              <div className="server-management__form-actions">
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
                  {loading ? 'Saving...' : (currentServer ? 'Update Server' : 'Add Server')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerManagement;