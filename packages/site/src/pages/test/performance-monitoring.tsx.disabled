import React, { useEffect, useState } from 'react';
import { useBackgroundV3 } from '../../contexts/BackgroundContextV3';
import { TypeSafePerformanceMonitor } from '../../utils/TypeSafePerformanceMonitor';
import PerformanceDashboard from '../../components/PerformanceDashboard';
import { newRelicDiagnostics } from '../../utils/NewRelicDiagnostics';
import Layout from '../../components/layout';
import SEO from '../../components/seo';

const performanceMonitor = new TypeSafePerformanceMonitor();

const PerformanceMonitoringTestPage: React.FC = () => {
  const { deviceCapabilities } = useBackgroundV3();
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  const [newRelicStatus, setNewRelicStatus] = useState<any>(null);

  useEffect(() => {
    performanceMonitor.startMonitoring();
    return () => performanceMonitor.stopMonitoring();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const healthCheck = await newRelicDiagnostics.quickHealthCheck();
        setNewRelicStatus(healthCheck);
        newRelicDiagnostics.logCurrentState();
      } catch (error) {
        console.error('Failed to check New Relic status:', error);
      }
    };
    
    checkStatus();
  }, []);

  const runPerformanceTest = () => {
    console.log('🧪 Running performance stress test...');
    const startTime = performance.now();
    let iterations = 0;
    
    const stressTest = () => {
      for (let i = 0; i < 100000; i++) {
        Math.random() * Math.random();
        iterations++;
      }
      
      if (performance.now() - startTime < 2000) {
        requestAnimationFrame(stressTest);
      } else {
        console.log(`✅ Stress test completed: ${iterations} iterations`);
        
        const newrelic = (window as any).newrelic;
        if (newrelic?.addPageAction) {
          newrelic.addPageAction('performance_stress_test', {
            duration: performance.now() - startTime,
            iterations,
            timestamp: Date.now()
          });
          console.log('📊 Recorded stress test metrics in New Relic');
        }
      }
    };
    
    requestAnimationFrame(stressTest);
  };

  return (
    <Layout>
      <SEO title="Performance Monitoring Test" />
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px' }}>Performance Monitoring Test Page</h1>
        
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>New Relic Status</h2>
          
          {newRelicStatus ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Health Status:</strong> 
                <span style={{ 
                  color: newRelicStatus.healthy ? '#00aa44' : '#ff4444',
                  fontWeight: '600' 
                }}>
                  {newRelicStatus.healthy ? '✅ Healthy' : '❌ Issues Detected'}
                </span>
              </div>
              
              {newRelicStatus.issues.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Issues:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {newRelicStatus.issues.map((issue, index) => (
                      <li key={index} style={{ color: '#ffaa00' }}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Environment: {process.env.NODE_ENV} | 
                New Relic Disabled: {process.env.DISABLE_NEW_RELIC || 'false'}
              </div>
            </div>
          ) : (
            <div>Loading New Relic status...</div>
          )}
        </div>
        
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Test Controls</h2>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={runPerformanceTest}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0088ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Run Performance Test
            </button>
            
            <button
              onClick={() => setIsDashboardVisible(!isDashboardVisible)}
              style={{
                padding: '8px 16px',
                backgroundColor: isDashboardVisible ? '#cc0066' : '#666666',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isDashboardVisible ? 'Hide' : 'Show'} Dashboard
            </button>
          </div>
        </div>
      </div>
      
      <PerformanceDashboard
        performanceMonitor={performanceMonitor}
        deviceCapabilities={deviceCapabilities}
        visible={isDashboardVisible}
        position="top-right"
        initialConfig={{
          displayMode: 'detailed',
          enableNewRelicCorrelation: true,
          showNetworkMetrics: true,
          showGpuMetrics: true
        }}
      />
    </Layout>
  );
};

export default PerformanceMonitoringTestPage;