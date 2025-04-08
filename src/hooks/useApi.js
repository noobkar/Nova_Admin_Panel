import { useState, useCallback } from 'react';
import { apiService, extractApiData } from '../services/api';
import { refreshToken, clearAuthData } from '../services/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for making API calls with built-in loading, error states and token refresh
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Make an API call with loading, error handling, and token refresh
   * @param {Function} apiFunction - The API function to call
   * @param {Array} params - Parameters to pass to the API function
   * @returns {Promise} - The API response data
   */
  const callApi = useCallback(async (apiFunction, ...params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(...params);
      const data = extractApiData(response);
      setLoading(false);
      return data;
    } catch (err) {
      // If the error is due to an expired token (401), try to refresh the token
      if (err.response?.status === 401) {
        try {
          await refreshToken();
          
          // Retry the original request
          const response = await apiFunction(...params);
          const data = extractApiData(response);
          setLoading(false);
          return data;
        } catch (refreshErr) {
          // If refresh fails, log out
          console.error('Token refresh failed:', refreshErr);
          clearAuthData();
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          navigate('/login');
          throw refreshErr;
        }
      }
      
      // Handle other errors
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [navigate]);

  // Create wrapper functions for common API methods
  const fetchDashboardStats = useCallback(() => 
    callApi(apiService.getDashboardStats), [callApi]);
    
  const fetchDashboardGraphData = useCallback((period) => 
    callApi(apiService.getDashboardGraphData, period), [callApi]);
    
  const fetchUsers = useCallback((page, perPage, search, status) => 
    callApi(apiService.getUsers, page, perPage, search, status), [callApi]);
    
  const fetchUserDetails = useCallback((userId) => 
    callApi(apiService.getUserDetails, userId), [callApi]);
    
  const createUser = useCallback((userData) => 
    callApi(apiService.createUser, userData), [callApi]);
    
  const updateUser = useCallback((userId, userData) => 
    callApi(apiService.updateUser, userId, userData), [callApi]);
    
  const deleteUser = useCallback((userId) => 
    callApi(apiService.deleteUser, userId), [callApi]);
    
  const updateUserPassword = useCallback((userId, password) => 
    callApi(apiService.updateUserPassword, userId, password), [callApi]);
    
  const fetchUserDevices = useCallback((userId) => 
    callApi(apiService.getUserDevices, userId), [callApi]);
    
  const removeUserDevice = useCallback((userId, deviceId) => 
    callApi(apiService.removeUserDevice, userId, deviceId), [callApi]);
    
  const fetchServers = useCallback((page, perPage, status, type) => 
    callApi(apiService.getServers, page, perPage, status, type), [callApi]);
    
  const fetchServerDetails = useCallback((serverId) => 
    callApi(apiService.getServerDetails, serverId), [callApi]);
    
  const createServer = useCallback((serverData) => 
    callApi(apiService.createServer, serverData), [callApi]);
    
  const updateServer = useCallback((serverId, serverData) => 
    callApi(apiService.updateServer, serverId, serverData), [callApi]);
    
  const deleteServer = useCallback((serverId) => 
    callApi(apiService.deleteServer, serverId), [callApi]);
    
  const fetchServerAssignments = useCallback((page, perPage, status, isPremium, serverId, userId) => 
    callApi(apiService.getServerAssignments, page, perPage, status, isPremium, serverId, userId), [callApi]);

  const fetchServerAssignment = useCallback((assignmentId) => 
    callApi(apiService.getServerAssignment, assignmentId), [callApi]);
    
  const fetchPendingRequests = useCallback((page, perPage) => 
    callApi(apiService.getPendingRequests, page, perPage), [callApi]);
    
  const createServerAssignment = useCallback((assignmentData) => 
    callApi(apiService.createServerAssignment, assignmentData), [callApi]);
    
  const updateServerAssignment = useCallback((assignmentId, assignmentData) => 
    callApi(apiService.updateServerAssignment, assignmentId, assignmentData), [callApi]);
    
  const deleteServerAssignment = useCallback((assignmentId) => 
    callApi(apiService.deleteServerAssignment, assignmentId), [callApi]);
    
  const approveRequest = useCallback((requestId, expiresAt) => 
    callApi(apiService.approveRequest, requestId, expiresAt), [callApi]);
    
  const rejectRequest = useCallback((requestId) => 
    callApi(apiService.rejectRequest, requestId), [callApi]);
    
  const fetchCommissions = useCallback((page, perPage, status, affiliateId, startDate, endDate) => 
    callApi(apiService.getCommissions, page, perPage, status, affiliateId, startDate, endDate), [callApi]);
    
  const fetchCommission = useCallback((id) => 
    callApi(apiService.getCommission, id), [callApi]);
    
  const approveCommission = useCallback((id) => 
    callApi(apiService.approveCommission, id), [callApi]);
    
  const rejectCommission = useCallback((id, reason) => 
    callApi(apiService.rejectCommission, id, reason), [callApi]);
    
  const fetchWithdrawalRequests = useCallback((page, perPage, status, affiliateId) => 
    callApi(apiService.getWithdrawalRequests, page, perPage, status, affiliateId), [callApi]);
    
  const fetchWithdrawalRequest = useCallback((id) => 
    callApi(apiService.getWithdrawalRequest, id), [callApi]);
    
  const approveWithdrawalRequest = useCallback((id) => 
    callApi(apiService.approveWithdrawalRequest, id), [callApi]);
    
  const rejectWithdrawalRequest = useCallback((id, reason) => 
    callApi(apiService.rejectWithdrawalRequest, id, reason), [callApi]);
    
  const completeWithdrawalRequest = useCallback((id, data) => 
    callApi(apiService.completeWithdrawalRequest, id, data), [callApi]);
    
  const fetchReports = useCallback((page, perPage, status, affiliateId, startDate, endDate) => 
    callApi(apiService.getReports, page, perPage, status, affiliateId, startDate, endDate), [callApi]);
    
  const fetchReport = useCallback((id) => 
    callApi(apiService.getReport, id), [callApi]);

  // Report endpoints
  const fetchTopAffiliatesReport = useCallback((period, limit) => 
    callApi(apiService.getTopAffiliatesReport, period, limit), [callApi]);
    
  const fetchAffiliateNetworkReport = useCallback((period) => 
    callApi(apiService.getAffiliateNetworkReport, period), [callApi]);
    
  const fetchCommissionPerformanceReport = useCallback((period) => 
    callApi(apiService.getCommissionPerformanceReport, period), [callApi]);
    
  const fetchReferralConversionsReport = useCallback((period) => 
    callApi(apiService.getReferralConversionsReport, period), [callApi]);
    
  const fetchReferralTreeReport = useCallback((affiliateId) => 
    callApi(apiService.getReferralTreeReport, affiliateId), [callApi]);

  const fetchAdminRoles = useCallback(() => 
    callApi(apiService.getAdminRoles), [callApi]);

  const createAdminRole = useCallback((roleData) => 
    callApi(apiService.createAdminRole, roleData), [callApi]);

  const updateAdminRole = useCallback((roleId, roleData) => 
    callApi(apiService.updateAdminRole, roleId, roleData), [callApi]);

  const deleteAdminRole = useCallback((roleId) => 
    callApi(apiService.deleteAdminRole, roleId), [callApi]);

  return {
    loading,
    error,
    callApi,
    fetchDashboardStats,
    fetchDashboardGraphData,
    fetchUsers,
    fetchUserDetails,
    createUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    fetchUserDevices,
    removeUserDevice,
    fetchServers,
    fetchServerDetails,
    createServer,
    updateServer,
    deleteServer,
    fetchServerAssignments,
    fetchServerAssignment,
    fetchPendingRequests,
    createServerAssignment,
    updateServerAssignment,
    deleteServerAssignment,
    approveRequest,
    rejectRequest,
    fetchCommissions,
    fetchCommission,
    approveCommission,
    rejectCommission,
    fetchWithdrawalRequests,
    fetchWithdrawalRequest,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    completeWithdrawalRequest,
    fetchReports,
    fetchReport,
    fetchTopAffiliatesReport,
    fetchAffiliateNetworkReport,
    fetchCommissionPerformanceReport,
    fetchReferralConversionsReport,
    fetchReferralTreeReport,
    fetchAdminRoles,
    createAdminRole,
    updateAdminRole,
    deleteAdminRole
  };
};

export default useApi;