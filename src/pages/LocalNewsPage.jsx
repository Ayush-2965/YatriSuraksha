import React, { useState } from 'react';
import './LocalNewsPage.css';

const LocalNewsPage = ({ initialNewsData = [] }) => {
  const [newsData, setNewsData] = useState(initialNewsData.length > 0 ? initialNewsData : [
    {
      id: '1',
      title: 'Beware: Thief stole a purse near Paltan Bazaar yesterday',
      shortDescription: 'Tourists are advised to be cautious and secure their belongings, especially in crowded market areas. Stay vigilant.',
      fullContent: 'A concerning incident occurred yesterday evening near Paltan Bazaar when a tourist had their purse stolen in broad daylight. Local authorities are investigating the matter and have increased patrol in the area. Tourists and locals are advised to remain vigilant, especially in crowded market areas. Keep your belongings secure and avoid displaying valuable items openly. If you witness any suspicious activity, please contact local authorities immediately. The police have set up additional checkpoints and are working with local vendors to improve security measures in the bazaar area.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
      category: 'Theft',
      timestamp: '4h ago',
    },
    {
      id: '2',
      title: 'Heavy Rainfall Expected: Plan Trips and Routes Accordingly.',
      shortDescription: 'Monsoon showers anticipated throughout the day. Check updates and updated road conditions before travel.',
      fullContent: 'The meteorological department has issued a heavy rainfall warning for the next 24 hours. Monsoon showers are expected to continue throughout the day with intermittent heavy downpours. Travelers are advised to plan their routes carefully and check road conditions before embarking on journeys. Some low-lying areas may experience waterlogging. Keep emergency contacts handy and avoid unnecessary travel during peak rainfall hours. Public transportation may face delays, and flights could be affected. Stay indoors when possible and ensure you have adequate supplies.',
      imageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=300&h=200&fit=crop',
      category: 'Weather',
      timestamp: '6h ago',
    },
    {
      id: '3',
      title: 'Road Closure: Due Maintenance Near Temple',
      shortDescription: 'Access to the ancient temple via main road is restricted tomorrow. Use alternative routes.',
      fullContent: 'The main road leading to the ancient temple will be closed tomorrow from 6 AM to 6 PM for scheduled maintenance work. The local authorities are conducting repairs to improve road conditions for better accessibility. Visitors planning to visit the temple are advised to use alternative routes via the eastern bypass road. Local guides will be available at key junction points to assist tourists. The maintenance includes road resurfacing, drainage improvements, and installation of better street lighting for enhanced safety.',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop',
      category: 'Road',
      timestamp: '8h ago',
    },
    {
      id: '4',
      title: 'Free guided city tour available this weekend',
      shortDescription: 'Sign up at the tourism office. Perfect for safe sightseeing with verified guides.',
      fullContent: 'The local tourism board is organizing free guided city tours this weekend for both locals and tourists. Professional and verified guides will showcase historical landmarks, cultural sites, and hidden gems of our beautiful city. Tours start at 9 AM and 2 PM daily, meeting at the central tourism office. Registration is mandatory due to limited spots. The tours include visits to museums, ancient architecture, local markets, and traditional food tastings. All safety protocols are followed, and tours are conducted in small groups for a personalized experience.',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop',
      category: 'General',
      timestamp: '10h ago',
    },
    {
      id: '5',
      title: 'Fog expected on highways early morning',
      shortDescription: 'Reduced visibility expected between 5-8 AM. Drive carefully and use fog lights.',
      fullContent: 'Weather authorities have issued a fog advisory for early morning hours tomorrow. Dense fog is expected on major highways and rural roads between 5 AM and 8 AM, significantly reducing visibility to less than 50 meters. Drivers are strongly advised to use fog lights, maintain safe distances, and drive at reduced speeds. Consider delaying non-essential travel during these hours. Public transportation schedules may be affected. Emergency services are on standby, and traffic police will be stationed at critical points to assist travelers.',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      category: 'Weather',
      timestamp: '12h ago',
    },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    shortDescription: '',
    fullContent: '',
    imageUrl: '',
  });

  const filters = ['All', 'Theft', 'Weather', 'General', 'Road'];
  
  const getCategoryColor = (category) => {
    const colors = {
      'Theft': '#dc2626', // red
      'Weather': '#2563eb', // blue
      'Road': '#f59e0b', // yellow
      'General': '#16a34a', // green
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'Theft': 'Theft Alert',
      'Weather': 'Weather Update',
      'Road': 'Road Alert',
      'General': 'General Advisory',
    };
    return labels[category] || category;
  };

  const filteredNews = selectedFilter === 'All' 
    ? newsData 
    : newsData.filter(item => item.category === selectedFilter);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newArticle = {
      id: Date.now().toString(),
      ...formData,
      timestamp: 'Just now',
      imageUrl: formData.imageUrl || `https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=300&h=200&fit=crop`,
    };
    setNewsData([newArticle, ...newsData]);
    setFormData({
      title: '',
      category: 'General',
      shortDescription: '',
      fullContent: '',
      imageUrl: '',
    });
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (selectedArticle) {
    return (
      <div className="news-detail">
        <div className="news-detail-header">
          <button 
            className="back-button"
            onClick={() => setSelectedArticle(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className="news-detail-content">
          <div className="news-detail-category" style={{ backgroundColor: getCategoryColor(selectedArticle.category) }}>
            {getCategoryLabel(selectedArticle.category)}
          </div>
          <h1 className="news-detail-title">{selectedArticle.title}</h1>
          <div className="news-detail-meta">{selectedArticle.timestamp}</div>
          <img 
            src={selectedArticle.imageUrl} 
            alt={selectedArticle.title}
            className="news-detail-image"
          />
          <div className="news-detail-text">
            {selectedArticle.fullContent}
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="add-news-form">
        <div className="form-header">
          <button 
            className="back-button"
            onClick={() => setShowForm(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h2>Add News</h2>
        </div>
        <form onSubmit={handleFormSubmit} className="news-form">
          <div className="form-group">
            <label htmlFor="title">News Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter news title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="General">General</option>
              <option value="Theft">Theft</option>
              <option value="Weather">Weather</option>
              <option value="Road">Road</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="shortDescription">Short Description *</label>
            <textarea
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              required
              placeholder="Brief description for the news feed"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fullContent">Full Content *</label>
            <textarea
              id="fullContent"
              name="fullContent"
              value={formData.fullContent}
              onChange={handleInputChange}
              required
              placeholder="Complete news article content"
              rows="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <button type="submit" className="submit-button">
            Publish News
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="local-news-page">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>Stay Informed!</h1>
          <div className="alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="filter-container">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`filter-pill ${selectedFilter === filter ? 'active' : ''}`}
            onClick={() => setSelectedFilter(filter)}
            style={{
              backgroundColor: selectedFilter === filter 
                ? filter === 'All' ? '#6b7280' : getCategoryColor(filter)
                : 'transparent'
            }}
          >
            {filter}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>

      {/* News Feed */}
      <div className="news-feed">
        {filteredNews.map((article) => (
          <div key={article.id} className="news-card">
            <div className="news-content">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="news-image"
              />
              <div className="news-info">
                <div className="news-meta">
                  <span 
                    className="category-label" 
                    style={{ backgroundColor: getCategoryColor(article.category) }}
                  >
                    {getCategoryLabel(article.category)}
                  </span>
                  <span className="timestamp">{article.timestamp}</span>
                </div>
                <h3 className="news-title">{article.title}</h3>
                <p className="news-description">{article.shortDescription}</p>
                <button 
                  className="read-more-button"
                  onClick={() => setSelectedArticle(article)}
                >
                  Read News
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button 
        className="floating-add-button"
        onClick={() => setShowForm(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="nav-item active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59512 1.99522 8.06621 2.16708 8.43418 2.48353C8.80215 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LocalNewsPage;