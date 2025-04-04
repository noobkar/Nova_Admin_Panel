import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Server, 
  Activity,
  FileText,
  Shield
} from 'react-feather';
import { useApi } from '../../hooks/useApi';
import { getApiData, mockApi } from '../../services/api';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import './Dashboard.scss';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    user_count: 0,
    servers_count: 0,
    active_assignments: 0,
    pending_requests: 0
  });
  
  const [graphData, setGraphData] = useState(null);
  const [graphPeriod, setGraphPeriod] = useState('weekly');
  const [serverStatus, setServerStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    graph: true,
    servers: true,
    activity: true
  });
  const [error, setError] = useState({
    stats: null,
    graph: null,
    servers: null,
    activity: null
  });

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(prev => ({ ...prev, stats: true }));
      try {
        const data = await getApiData('/admin/dashboard/stats', mockApi.getDashboardStats);
        console.log("Dashboard stats data:", data);
        
        // Validate and transform the data if needed
        const validatedStats = {
          user_count: data?.user_count || data?.users_count || 0,
          servers_count: data?.servers_count || 0,
          active_assignments: data?.active_assignments || 0,
          pending_requests: data?.pending_requests || 0
        };
        
        setStats(validatedStats);
        setError(prev => ({ ...prev, stats: null }));
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(prev => ({ ...prev, stats: 'Failed to load dashboard statistics' }));
        
        // Fallback to mock data
        setStats(mockApi.getDashboardStats());
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchStats();
  }, []);

  // Fetch graph data
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(prev => ({ ...prev, graph: true }));
      try {
        const data = await getApiData('/admin/dashboard/graph-data', 
          () => mockApi.getDashboardGraphData(graphPeriod),
          { period: graphPeriod }
        );
        console.log("Graph data:", data);
        
        // Validate and transform graph data if needed
        const transformedData = transformGraphData(data);
        setGraphData(transformedData);
        setError(prev => ({ ...prev, graph: null }));
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
        setError(prev => ({ ...prev, graph: 'Failed to load graph data' }));
        
        // Fallback to mock data
        setGraphData(mockApi.getDashboardGraphData(graphPeriod));
      } finally {
        setLoading(prev => ({ ...prev, graph: false }));
      }
    };

    fetchGraphData();
  }, [graphPeriod]);

  // Helper function to transform graph data to expected format
  const transformGraphData = (data) => {
    console.log("Transforming graph data:", data);
    
    // If the data is already in the expected format, return it
    if (data && data.datasets && Array.isArray(data.datasets) && data.datasets.length > 0) {
      return data;
    }
    
    // Create default structure if missing or incomplete
    const defaultData = {
      labels: [],
      datasets: [
        {
          label: 'Connections',
          data: []
        },
        {
          label: 'Active Users',
          data: []
        }
      ]
    };
    
    // If data is not in expected format, try to extract and adapt it
    if (data) {
      // Check if data has direct properties we can use
      if (data.labels && Array.isArray(data.labels)) {
        defaultData.labels = data.labels;
      }
      
      // Check for connections data
      if (data.connections && Array.isArray(data.connections)) {
        defaultData.datasets[0].data = data.connections;
      } else if (data.data && Array.isArray(data.data.connections)) {
        defaultData.datasets[0].data = data.data.connections;
      }
      
      // Check for users data
      if (data.active_users && Array.isArray(data.active_users)) {
        defaultData.datasets[1].data = data.active_users;
      } else if (data.data && Array.isArray(data.data.active_users)) {
        defaultData.datasets[1].data = data.data.active_users;
      }
      
      // Ensure labels exist if we have data
      if (defaultData.datasets[0].data.length > 0 && defaultData.labels.length === 0) {
        defaultData.labels = defaultData.datasets[0].data.map((_, i) => `Day ${i+1}`);
      }
    }
    
    return defaultData;
  };

  // Fetch server status
  useEffect(() => {
    const fetchServerStatus = async () => {
      setLoading(prev => ({ ...prev, servers: true }));
      try {
        let data;
        try {
          data = await getApiData('/admin/servers', null, {
            page: 1,
            per_page: 4,
            status: 'all'
          });
          console.log("Server status data:", data);
        } catch (apiErr) {
          console.error('API error fetching server status:', apiErr);
          // If the real API fails, fallback to mock data
          data = mockApi.getServerStatus();
        }
        
        // Transform the data to match our component's needs
        let transformedData;
        if (Array.isArray(data)) {
          // If it's already in the format we need
          transformedData = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          // If it's in the API response format
          transformedData = data.data.map(server => ({
            id: server.id,
            name: server.attributes.name,
            status: server.attributes.status,
            load: server.attributes.health_info?.uptime_percentage || 0,
            uptime: `${server.attributes.health_info?.uptime_percentage || 0}%`
          }));
        } else {
          // Fallback to mock data if structure is unexpected
          transformedData = mockApi.getServerStatus();
        }
        
        setServerStatus(transformedData);
        setError(prev => ({ ...prev, servers: null }));
      } catch (err) {
        console.error('Failed to fetch server status:', err);
        setError(prev => ({ ...prev, servers: 'Failed to load server status' }));
        
        // Fallback to mock data
        setServerStatus(mockApi.getServerStatus());
      } finally {
        setLoading(prev => ({ ...prev, servers: false }));
      }
    };

    fetchServerStatus();
  }, []);

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      setLoading(prev => ({ ...prev, activity: true }));
      try {
        let data;
        try {
          data = await getApiData('/admin/recent-activity', null);
          console.log("Recent activity data:", data);
        } catch (apiErr) {
          console.error('API error fetching recent activity:', apiErr);
          // If the real API fails (404 error), fallback to mock data
          data = mockApi.getRecentActivity();
        }
        
        // Ensure we have an array of activities
        const validatedData = Array.isArray(data) ? data : 
          (data && Array.isArray(data.data)) ? data.data : 
          mockApi.getRecentActivity();
          
        setRecentActivity(validatedData);
        setError(prev => ({ ...prev, activity: null }));
      } catch (err) {
        console.error('Failed to fetch recent activity:', err);
        setError(prev => ({ ...prev, activity: 'Failed to load recent activity' }));
        
        // Fallback to mock data
        setRecentActivity(mockApi.getRecentActivity());
      } finally {
        setLoading(prev => ({ ...prev, activity: false }));
      }
    };

    fetchRecentActivity();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      
      <div className="dashboard__stats">
        <Card className="dashboard__stat">
          <Users className="dashboard__stat-icon" />
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{loading.stats ? '...' : stats.user_count}</h3>
            <p className="dashboard__stat-label">Total Users</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <Server className="dashboard__stat-icon" />
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{loading.stats ? '...' : stats.servers_count}</h3>
            <p className="dashboard__stat-label">Servers</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <Activity className="dashboard__stat-icon" />
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{loading.stats ? '...' : stats.active_assignments}</h3>
            <p className="dashboard__stat-label">Active Assignments</p>
          </div>
        </Card>
        
        <Card className="dashboard__stat">
          <FileText className="dashboard__stat-icon" />
          <div className="dashboard__stat-content">
            <h3 className="dashboard__stat-value">{loading.stats ? '...' : stats.pending_requests}</h3>
            <p className="dashboard__stat-label">Pending Requests</p>
          </div>
        </Card>
      </div>
      
      <div className="dashboard__content">
        <Card title="Connection Analytics" className="dashboard__graph">
          <div className="dashboard__graph-header">
            <div className="dashboard__graph-period">
              <Button 
                type={graphPeriod === 'daily' ? 'primary' : 'default'}
                size="small"
                onClick={() => setGraphPeriod('daily')}
              >
                Daily
              </Button>
              <Button 
                type={graphPeriod === 'weekly' ? 'primary' : 'default'}
                size="small"
                onClick={() => setGraphPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                type={graphPeriod === 'monthly' ? 'primary' : 'default'}
                size="small"
                onClick={() => setGraphPeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
          
          <div className="dashboard__graph-body">
            {loading.graph ? (
              <div className="dashboard__loading">Loading graph data...</div>
            ) : error.graph ? (
              <div className="dashboard__error">{error.graph}</div>
            ) : (
              <div className="dashboard__graph-container">
                {graphData && graphData.datasets && graphData.datasets.length > 0 && graphData.datasets[0].data ? (
                  <div className="dashboard__graph-visualization">
                    <div className="dashboard__graph-mock">
                      {/* This is a mock visualization - in a real app you'd use Chart.js */}
                      <div className="dashboard__graph-mock-bars">
                        {graphData.datasets[0].data.map((value, index) => (
                          <div key={index} className="dashboard__graph-mock-bar-group">
                            <div 
                              className="dashboard__graph-mock-bar dashboard__graph-mock-bar--primary"
                              style={{ height: `${value / 20}px` }}
                              title={`${graphData.datasets[0].label}: ${value}`}
                            ></div>
                            {graphData.datasets.length > 1 && graphData.datasets[1].data && (
                              <div 
                                className="dashboard__graph-mock-bar dashboard__graph-mock-bar--secondary"
                                style={{ height: `${(graphData.datasets[1].data[index] || 0) / 20}px` }}
                                title={`${graphData.datasets[1].label}: ${graphData.datasets[1].data[index] || 0}`}
                              ></div>
                            )}
                            <span className="dashboard__graph-mock-label">
                              {graphData.labels && graphData.labels[index] ? graphData.labels[index] : `Day ${index+1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No graph data available</p>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <div className="dashboard__side">
          <Card title="Server Status" className="dashboard__servers">
            {loading.servers ? (
              <div className="dashboard__loading">Loading server status...</div>
            ) : error.servers ? (
              <div className="dashboard__error">{error.servers}</div>
            ) : (
              <div className="dashboard__servers-list">
                {serverStatus && serverStatus.length > 0 ? (
                  serverStatus.map((server, index) => (
                    <div key={index} className="dashboard__server">
                      <div className="dashboard__server-header">
                        <div className="dashboard__server-info">
                          <h4 className="dashboard__server-name">{server.name}</h4>
                          <p className="dashboard__server-uptime">Uptime: {server.uptime}</p>
                        </div>
                        <div className={`dashboard__server-status dashboard__server-status--${(server.status || '').toLowerCase()}`}>
                          <span className="dashboard__server-status-indicator"></span>
                          <span>{server.status || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="dashboard__server-load-container">
                        <div className="dashboard__server-load-bar">
                          <div 
                            className="dashboard__server-load-progress"
                            style={{ width: `${server.load || 0}%` }}
                          ></div>
                        </div>
                        <span className="dashboard__server-load-text">{server.load || 0}% Load</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No server status data available</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Recent Activity" className="dashboard__activity">
            {loading.activity ? (
              <div className="dashboard__loading">Loading recent activity...</div>
            ) : error.activity ? (
              <div className="dashboard__error">{error.activity}</div>
            ) : (
              <ul className="dashboard__activity-list">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <li key={index} className="dashboard__activity-item">
                      <div className={`dashboard__activity-icon dashboard__activity-icon--${activity.type || 'info'}`}>
                        {(activity.type === 'warning' || !activity.type) && <Shield size={16} />}
                        {activity.type === 'success' && <Shield size={16} />}
                        {activity.type === 'info' && <Server size={16} />}
                        {activity.type === 'error' && <Shield size={16} />}
                      </div>
                      <div className="dashboard__activity-content">
                        <p className="dashboard__activity-message">{activity.message || 'No details available'}</p>
                        <span className="dashboard__activity-time">{activity.time || 'Unknown time'}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <p>No recent activity available</p>
                )}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
