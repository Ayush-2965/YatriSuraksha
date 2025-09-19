import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaMapMarkerAlt, FaCalendarAlt, FaInfo, FaMap, FaTimes } from 'react-icons/fa';

const TourCard = ({ tour, onStartTour, onCancelTour }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'upcoming':
        return {
          className: 'bg-purple-100 text-purple-800 border border-purple-200',
          indicator: 'bg-purple-500',
          label: 'Upcoming'
        };
      case 'ongoing':
        return {
          className: 'bg-green-100 text-green-800 border border-green-200',
          indicator: 'bg-green-500 animate-pulse',
          label: 'Active'
        };
      case 'completed':
        return {
          className: 'bg-gray-100 text-gray-700 border border-gray-200',
          indicator: 'bg-gray-400',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          className: 'bg-red-100 text-red-700 border border-red-200',
          indicator: 'bg-red-400',
          label: 'Cancelled'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-700 border border-gray-200',
          indicator: 'bg-gray-400',
          label: 'Unknown'
        };
    }
  };

  const canStartTour = tour.status === 'upcoming';
  const canViewMap = tour.status === 'ongoing';
  const statusInfo = getStatusInfo(tour.status);

  const handleViewMap = () => {
    navigate('/tour-view', { state: { tour } });
  };

  const handleCancelTour = () => {
    if (window.confirm('Are you sure you want to cancel this tour? This action cannot be undone.')) {
      onCancelTour(tour);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-2 duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {tour.locations && tour.locations.length > 0
                ? tour.locations[0].name
                : "Unnamed Tour"}
            </h3>
            <p className="text-gray-500">
              {tour.locations ? `${tour.locations.length} locations` : ""}
            </p>
          </div>
          <span
            className={`px-4 py-1 text-sm font-semibold rounded-full ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center">
            <FaCalendarAlt className="text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-semibold text-gray-800">
                {formatDate(tour.startDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-semibold text-gray-800">
                {formatDate(tour.endDate)}
              </p>
            </div>
          </div>
        </div>

        {tour.touristId && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Tourist ID</p>
            <p className="font-mono text-sm text-gray-800 break-all">
              {tour.touristId}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-end items-center space-y-3 md:space-y-0 md:space-x-4">
        {canStartTour && (
          <button
            onClick={() => onStartTour(tour)}
            className="w-full md:w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors duration-300 flex items-center justify-center"
          >
            <FaPlay className="mr-2" />
            Start Tour
          </button>
        )}
        {canViewMap && (
          <>
            <button
              onClick={handleViewMap}
              className="w-full md:w-auto bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors duration-300 flex items-center justify-center"
            >
              <FaMap className="mr-2" />
              View Map
            </button>
            <button
              onClick={handleCancelTour}
              className="w-full md:w-auto bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300 flex items-center justify-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TourCard;