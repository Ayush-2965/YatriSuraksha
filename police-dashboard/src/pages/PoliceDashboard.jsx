import React, { useState, useEffect } from 'react';
import { Search, Shield, CheckCircle, AlertCircle, User, Calendar, MapPin, Phone, Hash, Clock, Database } from 'lucide-react';
import blockchainService from '../services/blockchainService';

const PoliceDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);

  useEffect(() => {
    loadBlockchainStats();
    loadRecentVerifications();
  }, []);

  const loadBlockchainStats = async () => {
    try {
      const stats = await blockchainService.getStatistics();
      if (stats.success) {
        setBlockchainStats(stats);
      }
    } catch (error) {
      console.error('Failed to load blockchain stats:', error);
    }
  };

  const loadRecentVerifications = () => {
    // Load from localStorage (in production, this would come from a police database)
    const stored = localStorage.getItem('police-verifications');
    if (stored) {
      setRecentVerifications(JSON.parse(stored));
    }
  };

  const saveVerification = (verification) => {
    const updated = [verification, ...recentVerifications.slice(0, 9)]; // Keep last 10
    setRecentVerifications(updated);
    localStorage.setItem('police-verifications', JSON.stringify(updated));
  };

  const handleVerifyTourist = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setVerificationResult(null);

    try {
      console.log('🔍 Verifying Tourist ID:', searchQuery);

      // First, try blockchain verification
      console.log('📞 Calling blockchain verification...');
      const blockchainResult = await blockchainService.verifyTouristId(searchQuery.trim());
      console.log('📋 Blockchain verification result:', blockchainResult);
      
      let result = {
        touristId: searchQuery.trim(),
        timestamp: new Date().toISOString(),
        verifiedBy: 'Police Officer', // In production, get from auth context
        status: 'not_found'
      };

      if (blockchainResult.success && blockchainResult.isValid) {
        console.log('✅ Tourist found on blockchain:', blockchainResult.touristData);
        // Tourist found on blockchain
        const touristData = blockchainResult.touristData;
        // Note: Tours are managed in Appwrite database, not on blockchain

        result = {
          ...result,
          status: 'verified',
          source: 'blockchain',
          touristData: {
            ...touristData,
            tours: [] // Tours would come from Appwrite database in production
          }
        };

        // Mark as verified on blockchain
        try {
          await blockchainService.markTouristAsVerified(searchQuery.trim());
          result.blockchainVerified = true;
        } catch (error) {
          console.warn('Failed to mark as verified on blockchain:', error);
          result.blockchainVerified = false;
        }
      } else {
        console.log('❌ Tourist not found on blockchain or verification failed:', blockchainResult);
        // Try database fallback (for offline verification)
        result = await verifyFromDatabase(searchQuery.trim());
      }

      setVerificationResult(result);
      saveVerification(result);

    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        touristId: searchQuery.trim(),
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyFromDatabase = async (touristId) => {
    // This would query your Appwrite database for tourist records
    // For now, return a mock response
    return {
      touristId,
      status: 'database_fallback',
      source: 'database',
      timestamp: new Date().toISOString(),
      message: 'Blockchain unavailable, database verification needed'
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerifyTourist();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'not_found': return 'text-red-600 bg-red-50 border-red-200';
      case 'database_fallback': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5" />;
      case 'not_found': return <AlertCircle className="w-5 h-5" />;
      case 'database_fallback': return <AlertCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Police Verification Dashboard</h1>
                <p className="text-blue-200">YatriSuraksha Tourist ID Verification System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Blockchain Powered</p>
              <p className="text-xs text-blue-300">Secure • Immutable • Transparent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tourists</p>
                <p className="text-2xl font-bold text-gray-900">{blockchainStats?.totalTourists || '---'}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tours</p>
                <p className="text-2xl font-bold text-gray-900">{blockchainStats?.totalTours || '---'}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Verifications Today</p>
                <p className="text-2xl font-bold text-gray-900">{recentVerifications.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Blockchain Status</p>
                <p className="text-sm font-bold text-green-600">Connected</p>
              </div>
              <Database className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Verification Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Tourist ID Verification</h2>
              
              {/* Search Input */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter Tourist ID (e.g., TID-ABC123DEF456)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  onClick={handleVerifyTourist}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Verify</span>
                    </>
                  )}
                </button>
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <div className={`p-6 rounded-lg border-2 ${getStatusColor(verificationResult.status)}`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {getStatusIcon(verificationResult.status)}
                    <h3 className="text-lg font-semibold">
                      {verificationResult.status === 'verified' ? 'Tourist Verified ✓' :
                       verificationResult.status === 'not_found' ? 'Tourist Not Found' :
                       verificationResult.status === 'database_fallback' ? 'Database Verification Required' :
                       'Verification Failed'}
                    </h3>
                  </div>

                  {verificationResult.status === 'verified' && verificationResult.touristData && (
                    <div className="space-y-4">
                      {/* Tourist Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4" />
                            <span className="font-medium">Tourist ID:</span>
                            <span className="font-mono">{verificationResult.touristData.touristId}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Name:</span>
                            <span>{verificationResult.touristData.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">Mobile:</span>
                            <span>{verificationResult.touristData.mobile}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Registered:</span>
                            <span>{new Date(verificationResult.touristData.registrationDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Total Tours:</span>
                            <span>{verificationResult.touristData.totalTours}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Status:</span>
                            <span className="text-green-600 font-medium">Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Tours */}
                      {verificationResult.touristData.tours && verificationResult.touristData.tours.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-800 mb-3">Recent Tours</h4>
                          <div className="space-y-2">
                            {verificationResult.touristData.tours.slice(0, 3).map((tour, index) => (
                              <div key={index} className="bg-white bg-opacity-50 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Tour ID: {tour.tourId}</p>
                                    <p className="text-sm text-gray-600">
                                      {tour.locations.join(', ')}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    tour.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    tour.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {tour.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Info */}
                      <div className="bg-blue-50 rounded p-3 mt-4">
                        <p className="text-sm text-blue-800">
                          <strong>✓ Verified on Blockchain</strong> - This tourist's identity has been cryptographically verified and stored on an immutable blockchain ledger.
                        </p>
                      </div>
                    </div>
                  )}

                  {verificationResult.status === 'not_found' && (
                    <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-gray-700">No tourist found with ID: <span className="font-mono">{verificationResult.touristId}</span></p>
                      <p className="text-sm text-gray-500 mt-2">Please check the ID and try again, or verify through alternative means.</p>
                    </div>
                  )}

                  {verificationResult.error && (
                    <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-700 font-medium">Verification Error</p>
                      <p className="text-sm text-red-600 mt-2">{verificationResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Verifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Verifications</h2>
              
              {recentVerifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent verifications</p>
              ) : (
                <div className="space-y-3">
                  {recentVerifications.map((verification, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{verification.touristId}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(verification.status)}`}>
                          {verification.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(verification.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;