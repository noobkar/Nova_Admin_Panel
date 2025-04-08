import React, { useState, useEffect } from 'react';
import { Users, Server, Activity, FileText } from 'react-feather';
import { apiService, extractApiData } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import './Dashboard.scss';

export const Dashboard = () => {
  // State for dashboard data
  const [stats, setStats] = useState({
    user_count: 0,
    servers_count: 0,
    active_assignments: 0,
    pending_requests: 0
  });
  
  const [graphData, setGraphData] = useState(null);
  const [graphPeriod, setGraphPeriod] = useState('weekly');
  const [serverData, setServerData] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    stats: true,
    graph: true,
    servers: true
  });
  
  const [error, setError] = useState({
    stats: null,
    graph: null,
    servers: null
  });

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(prev => ({ ...prev, stats: true }));
      setError(prev => ({ ...prev, stats: null }));
      
      try {
        const response = await apiService.getDashboardStats();
        const data = extractApiData(response);
        
        setStats({
          user_count: data.user_count || 0,
          servers_count: data.servers_count || 0,
          active_assignments: data.active_assignments || 0,
          pending_requests: data.pending_requests || 0
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(prev => ({
          ...prev,
          stats: 'Unable to load dashboard statistics. Please try again later.'
        }));
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchStats();
  }, []);

  // Fetch graph data when period changes
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(prev => ({ ...prev, graph: true }));
      setError(prev => ({ ...prev, graph: null }));
      
      try {
        const response = await apiService.getDashboardGraphData(graphPeriod);
        const data = extractApiData(response);
        
        setGraphData(data);
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
        setError(prev => ({
          ...prev,
          graph: 'Unable to load graph data. Please try again later.'
        }));
      } finally {
        setLoading(prev => ({ ...prev, graph: false }));
      }
    };

    fetchGraphData();
  }, [graphPeriod]);

  // Fetch server status
  useEffect(() => {
    const fetchServers = async () => {
      setLoading(prev => ({ ...prev, servers: true }));
      setError(prev => ({ ...prev, servers: null }));
      
      try {
        const response = await apiService.getServers(1, 4);
        const data = extractApiData(response);
        
        if (data && data.data && Array.isArray(data.data)) {
          // Format server data for display
          const formattedServers = data.data.map(server => ({
            id: server.id,
            name: server.attributes.name,
            status: server.attributes.status,
            ip_address: server.attributes.ip_address,
            health_info: server.attributes.health_info || {},
            uptime: server.attributes.health_info?.uptime_percentage + '%' || 'N/A',
            load: server.attributes.health_info?.uptime_percentage || 0
          }));
          
          setServerData(formattedServers);
        } else {
          setServerData([]);
        }
      } catch (err) {
        console.error('Failed to fetch servers:', err);
        setError(prev => ({
          ...prev,
          servers: 'Unable to load server data. Please try again later.'
        }));
      } finally {
        setLoading(prev => ({ ...prev, servers: false }));
      }
    };

    fetchServers();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      
      <div className="dashboard__stats">
        <Card className="dashboard__stat">
          <Users className="dashboard__stat-icon dashboard__stat-icon--users" />
          <div className="dashboard__stat-content">
            {loading.stats ? (
              <h3 className="dashboard__stat-value">Loading...</h3>
            ) : (
              <h3 className="dashboard__stat-value">{stats.user_count}</h3>
            )}
            <p className="dashboard__stat-label">Total Users</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <Server className="dashboard__stat-icon dashboard__stat-icon--servers" />
          <div className="dashboard__stat-content">
            {loading.stats ? (
              <h3 className="dashboard__stat-value">Loading...</h3>
            ) : (
              <h3 className="dashboard__stat-value">{stats.servers_count}</h3>
            )}
            <p className="dashboard__stat-label">Servers</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <Activity className="dashboard__stat-icon dashboard__stat-icon--assignments" />
          <div className="dashboard__stat-content">
            {loading.stats ? (
              <h3 className="dashboard__stat-value">Loading...</h3>
            ) : (
              <h3 className="dashboard__stat-value">{stats.active_assignments}</h3>
            )}
            <p className="dashboard__stat-label">Active Assignments</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <FileText className="dashboard__stat-icon dashboard__stat-icon--requests" />
          <div className="dashboard__stat-content">
            {loading.stats ? (
              <h3 className="dashboard__stat-value">Loading...</h3>
            ) : (
              <h3 className="dashboard__stat-value">{stats.pending_requests}</h3>
            )}
            <p className="dashboard__stat-label">Pending Requests</p>
          </div>
        </Card>
      </div>
      
      <div className="dashboard__main">
        <Card title="Connection Analytics" className="dashboard__graph">
          <div className="dashboard__graph-controls">
            <Button 
              variant={graphPeriod === 'daily' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setGraphPeriod('daily')}
            >
              Daily
            </Button>
            <Button 
              variant={graphPeriod === 'weekly' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setGraphPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button 
              variant={graphPeriod === 'monthly' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setGraphPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>
          
          <div className="dashboard__graph-content">
            {loading.graph ? (
              <div className="dashboard__loading">Loading graph data...</div>
            ) : error.graph ? (
              <div className="dashboard__error">{error.graph}</div>
            ) : !graphData || !graphData.datasets || graphData.datasets.length === 0 ? (
              <div className="dashboard__empty">No graph data available</div>
            ) : (
              <div className="dashboard__graph-placeholder">
                {/* In a real app, you'd render the graph with Chart.js or a similar library */}
                <div className="dashboard__graph-mock">
                  <div className="dashboard__graph-mock-bars">
                    {graphData.labels.map((label, index) => (
                      <div key={index} className="dashboard__graph-mock-bar-group">
                        <div 
                          className="dashboard__graph-mock-bar dashboard__graph-mock-bar--primary"
                          style={{ height: `${(graphData.datasets[0].data[index] || 0) * 2}px` }}
                        ></div>
                        {graphData.datasets.length > 1 && (
                          <div 
                            className="dashboard__graph-mock-bar dashboard__graph-mock-bar--secondary"
                            style={{ height: `${(graphData.datasets[1].data[index] || 0) * 2}px` }}
                          ></div>
                        )}
                        <span className="dashboard__graph-mock-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        <Card title="Server Status" className="dashboard__servers">
          {loading.servers ? (
            <div className="dashboard__loading">Loading server data...</div>
          ) : error.servers ? (
            <div className="dashboard__error">{error.servers}</div>
          ) : serverData.length === 0 ? (
            <div className="dashboard__empty">No server data available</div>
          ) : (
            <div className="dashboard__servers-list">
              {serverData.map((server) => (
                <div key={server.id} className="dashboard__server">
                  <div className="dashboard__server-header">
                    <div className="dashboard__server-info">
                      <h4 className="dashboard__server-name">{server.name}</h4>
                      <p className="dashboard__server-uptime">Uptime: {server.uptime}</p>
                    </div>
                    <div className={`dashboard__server-status dashboard__server-status--${server.status}`}>
                      <span className="dashboard__server-status-indicator"></span>
                      <span>{server.status}</span>
                    </div>
                  </div>
                  
                  <div className="dashboard__server-load-container">
                    <div className="dashboard__server-load-bar">
                      <div 
                        className="dashboard__server-load-progress"
                        style={{ width: `${server.load}%` }}
                      ></div>
                    </div>
                    <span className="dashboard__server-load-text">{server.load}% Load</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;