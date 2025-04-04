import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import { getApiData, mockApi, apiService } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Edit, Trash, Power, X, Search, AlertCircle } from 'react-feather';
import './ServerManagement.scss';

export const ServerManagement = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useNavigation();
  
  const [servers, setServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    // Set the current page for navigation context
    setCurrentPage('Server Management');
    fetchServers();
  }, [setCurrentPage, selectedStatus]);

  const fetchServers = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        perPage: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      const response = await getApiData('/admin/servers', mockApi.getServers, params);
      
      // Extract server data and transform if necessary
      let serverData = [];
      let paginationData = { currentPage: 1, totalPages: 1, totalCount: 0 };
      
      if (response && response.data && Array.isArray(response.data)) {
        // Format from the API with data array and pagination in meta
        serverData = response.data.map(server => ({
          id: server.id,
          name: server.attributes.name,
          description: server.attributes.description,
          status: server.attributes.status,
          server_type: server.attributes.server_type,
          ip_address: server.attributes.ip_address,
          created_at: server.attributes.created_at,
          updated_at: server.attributes.updated_at,
          image: server.attributes.image?.url || null,
          config: server.attributes.config
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
        serverData = response;
      }
      
      setServers(serverData);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError('Failed to load servers data');
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

  const handleEditServer = async (server) => {
    setLoading(true);
    try {
      // For edit, we want to fetch the complete server details
      const serverDetails = await getApiData(`/admin/servers/${server.id}`, 
        () => ({ data: { attributes: server } }),
        { serverId: server.id }
      );
      
      const serverData = serverDetails.attributes || serverDetails;
      
      setCurrentServer(serverData);
      setFormData({
        name: serverData.name,
        description: serverData.description || '',
        server_type: serverData.server_type || 'free',
        status: serverData.status,
        ip_address: serverData.ip_address || '',
        config_type: serverData.config?.type || 'url',
        config_url: serverData.config?.url || '',
        config_file: null, // Cannot pre-load files
        image: null // Cannot pre-load files
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching server details:', err);
      alert('Failed to load server details for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (id) => {
    if (window.confirm('Are you sure you want to delete this server? This will remove all server assignments.')) {
      setLoading(true);
      try {
        await getApiData(`/admin/servers/${id}/delete`, () => {}, { serverId: id });
        
        // Remove the server from the UI
        setServers(servers.filter(server => server.id !== id));
        alert('Server deleted successfully');
      } catch (err) {
        console.error('Error deleting server:', err);
        alert('Failed to delete server');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleServerStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      const server = servers.find(s => s.id === id);
      if (!server) throw new Error('Server not found');
      
      const updatedData = {
        status: newStatus
      };
      
      await getApiData(`/admin/servers/${id}/update`, () => {}, { 
        serverId: id,
        serverData: updatedData
      });
      
      // Update the server status in the UI
      setServers(servers.map(server => 
        server.id === id 
          ? { ...server, status: newStatus } 
          : server
      ));
    } catch (err) {
      console.error('Error updating server status:', err);
      alert('Failed to update server status');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'config_file' && files) {
      setFormData(prev => ({
        ...prev,
        config_file: files[0] || null,
        config_type: files[0] ? 'file' : prev.config_type
      }));
    } else if (name === 'image' && files) {
      setFormData(prev => ({
        ...prev,
        image: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const isEditing = !!currentServer;
    setLoading(true);
    
    try {
      const formDataToSend = {
        name: formData.name,
        description: formData.description,
        server_type: formData.server_type,
        status: formData.status,
        ip_address: formData.ip_address,
        config_type: formData.config_type
      };
      
      // Add the appropriate config field based on config_type
      if (formData.config_type === 'url') {
        formDataToSend.config_url = formData.config_url;
      } else if (formData.config_type === 'file' && formData.config_file) {
        formDataToSend.config_file = formData.config_file;
      }
      
      // Add image if present
      if (formData.image) {
        formDataToSend.image = formData.image;
      }
      
      if (isEditing) {
        // Edit existing server
        await getApiData(`/admin/servers/${currentServer.id}/update`, () => {}, {
          serverId: currentServer.id,
          serverData: formDataToSend
        });
        
        alert('Server updated successfully');
      } else {
        // Add new server
        await getApiData('/admin/servers/create', () => {}, {
          serverData: formDataToSend
        });
        
        alert('Server created successfully');
      }
      
      // Close modal and refresh the server list
      setIsModalOpen(false);
      fetchServers();
    } catch (err) {
      console.error('Error saving server:', err);
      alert(`Failed to ${isEditing ? 'update' : 'create'} server`);
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

  // Filter servers based on search term
  const filteredServers = servers.filter(server => {
    return server.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           server.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           server.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handlePageChange = (page) => {
    fetchServers(page);
  };

  return (
    <div className="server-management">
      <Card>
        <div className="server-management__header">
          <h2 className="server-management__title">Server Management</h2>
          <Button onClick={handleAddServer} variant="primary">Add Server</Button>
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
              variant={selectedStatus === 'maintenance' ? 'primary' : 'outline'}
              size="small"
              onClick={() => handleStatusFilter('maintenance')}
            >
              Maintenance
            </Button>
            <Button 
              variant={selectedStatus === 'inactive' ? 'primary' : 'outline'} 
              size="small"
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="server-management__loading">
            <AlertCircle size={20} />
            <span>Loading servers...</span>
          </div>
        ) : error ? (
          <div className="server-management__error">{error}</div>
        ) : (
          <div className="server-management__table-container">
            {filteredServers.length === 0 ? (
              <div className="server-management__empty">
                No servers match your search criteria.
              </div>
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
                            {server.name}
                            {server.description && (
                              <span className="server-management__server-description">
                                {server.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`server-management__type server-management__type--${server.server_type}`}>
                            {server.server_type === 'premium' ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td>
                          <span className={`server-management__status server-management__status--${server.status}`}>
                            {server.status}
                          </span>
                        </td>
                        <td>{server.ip_address}</td>
                        <td>{formatDate(server.created_at)}</td>
                        <td className="server-management__actions">
                          {server.status !== 'active' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'active')}
                              title="Activate Server"
                            >
                              <Power size={16} />
                            </Button>
                          )}
                          {server.status !== 'maintenance' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'maintenance')}
                              title="Set to Maintenance"
                            >
                              <AlertCircle size={16} />
                            </Button>
                          )}
                          {server.status !== 'inactive' && (
                            <Button
                              variant="icon"
                              onClick={() => handleServerStatus(server.id, 'inactive')}
                              title="Deactivate Server"
                            >
                              <Power size={16} />
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
                      variant="outline" 
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
                  disabled={loading}
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
