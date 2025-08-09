// Mock Umami Analytics Script for Testing
(function() {
  'use strict';
  
  // Mock umami object
  window.umami = {
    track: function(eventName, eventData) {
      console.log('[MOCK UMAMI] Tracking event:', eventName, eventData);
      
      // Simulate network request
      fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          data: eventData,
          timestamp: Date.now(),
          url: window.location.href,
          referrer: document.referrer
        })
      }).catch(function(error) {
        console.log('[MOCK UMAMI] Tracking error (expected in tests):', error);
      });
      
      return Promise.resolve({ success: true });
    },
    
    identify: function(userId, userData) {
      console.log('[MOCK UMAMI] Identifying user:', userId, userData);
      return Promise.resolve({ success: true });
    }
  };
  
  // Mock page view tracking
  function trackPageView() {
    if (window.umami && window.umami.track) {
      window.umami.track('pageview', {
        url: window.location.pathname,
        title: document.title,
        timestamp: Date.now()
      });
    }
  }
  
  // Track initial page view
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
  
  // Track navigation changes (for SPA)
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(function() {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      setTimeout(trackPageView, 100); // Delay to ensure title is updated
    }
  });
  
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['title']
  });
  
  // Listen for history changes
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(trackPageView, 100);
  };
  
  window.addEventListener('popstate', function() {
    setTimeout(trackPageView, 100);
  });
  
  console.log('[MOCK UMAMI] Analytics mock initialized');
})();