import React, { useState, useCallback } from 'react'
import { useEasterEgg } from './EasterEggProvider'
import { Achievement } from '../interfaces/BackgroundSystemV3'

/**
 * Easter Egg Discovery Dashboard
 * 
 * A sophisticated dashboard component that displays easter egg discovery progress,
 * achievements, statistics, and provides configuration options for the discovery system.
 */

interface EasterEggDashboardProps {
  className?: string
  compact?: boolean
  showConfig?: boolean
}

const EasterEggDashboard: React.FC<EasterEggDashboardProps> = ({
  className = '',
  compact = false,
  showConfig = true
}) => {
  const {
    discoveredEasterEggs,
    activeProgress,
    totalEasterEggs,
    discoveryRate,
    isEnabled,
    recognitionConfig,
    enableDiscovery,
    updateConfig,
    setAccessibilityMode,
    getKeyboardAlternatives,
    getShareableUrl,
    exportProgress,
    importProgress,
    resetProgress
  } = useEasterEgg()
  
  const [showKeyboardAlternatives, setShowKeyboardAlternatives] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [importData, setImportData] = useState('')
  
  // Group achievements by rarity
  const achievementsByRarity = discoveredEasterEggs.reduce((acc, achievement) => {
    const rarity = achievement.rarity || 'common'
    if (!acc[rarity]) acc[rarity] = []
    acc[rarity].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)
  
  // Calculate statistics
  const stats = {
    common: achievementsByRarity.common?.length || 0,
    rare: achievementsByRarity.rare?.length || 0,
    legendary: achievementsByRarity.legendary?.length || 0,
    totalDiscovered: discoveredEasterEggs.length,
    progressCount: activeProgress.size,
    discoveryRate: Math.round(discoveryRate)
  }
  
  const handleConfigChange = useCallback((key: string, value: any) => {
    updateConfig({ [key]: value })
  }, [updateConfig])
  
  const handleExport = useCallback(() => {
    const data = exportProgress()
    navigator.clipboard.writeText(data).then(() => {
      alert('Progress exported to clipboard!')
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = data
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Progress exported to clipboard!')
    })
  }, [exportProgress])
  
  const handleImport = useCallback(() => {
    if (importData.trim()) {
      const success = importProgress(importData.trim())
      if (success) {
        alert('Progress imported successfully!')
        setImportData('')
        setShowExportImport(false)
      } else {
        alert('Failed to import progress. Please check the data format.')
      }
    }
  }, [importData, importProgress])
  
  const handleShare = useCallback(() => {
    const url = getShareableUrl()
    navigator.clipboard.writeText(url).then(() => {
      alert('Shareable URL copied to clipboard!')
    }).catch(() => {
      console.log('Share URL:', url)
      alert('Share URL logged to console')
    })
  }, [getShareableUrl])
  
  if (compact) {
    return (
      <div className={`easter-egg-dashboard compact ${className}`}>
        <div className="dashboard-header">
          <h3>Easter Eggs</h3>
          <div className="discovery-stats">
            <span className="discovery-rate">{stats.discoveryRate}%</span>
            <span className="discovery-count">{stats.totalDiscovered}/{totalEasterEggs}</span>
          </div>
        </div>
        
        {stats.totalDiscovered > 0 && (
          <div className="recent-achievements">
            {discoveredEasterEggs.slice(-3).map((achievement) => (
              <div key={achievement.id} className={`achievement-item ${achievement.rarity}`}>
                <span className="achievement-icon">{achievement.icon}</span>
                <span className="achievement-name">{achievement.name}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="dashboard-controls">
          <button
            className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'}`}
            onClick={() => enableDiscovery(!isEnabled)}
            aria-label={isEnabled ? 'Disable easter egg discovery' : 'Enable easter egg discovery'}
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`easter-egg-dashboard ${className}`}>
      <div className="dashboard-header">
        <h2>Easter Egg Discovery System</h2>
        <div className="system-status">
          <span className={`status-indicator ${isEnabled ? 'active' : 'inactive'}`}>
            {isEnabled ? 'Active' : 'Inactive'}
          </span>
          <button
            className="toggle-system"
            onClick={() => enableDiscovery(!isEnabled)}
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
      
      <div className="progress-overview">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${stats.discoveryRate}%` }}
            aria-label={`Discovery progress: ${stats.discoveryRate}%`}
          />
        </div>
        <div className="progress-stats">
          <span>{stats.totalDiscovered} of {totalEasterEggs} discovered</span>
          <span>{stats.discoveryRate}% complete</span>
        </div>
      </div>
      
      <div className="achievement-gallery">
        <h3>Achievements</h3>
        {Object.entries(achievementsByRarity).map(([rarity, achievements]) => (
          <div key={rarity} className={`rarity-group ${rarity}`}>
            <h4 className="rarity-title">
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)} 
              <span className="count">({achievements.length})</span>
            </h4>
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h5>{achievement.name}</h5>
                    <p>{achievement.description}</p>
                    <time dateTime={new Date(achievement.timestamp).toISOString()}>
                      {new Date(achievement.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {stats.totalDiscovered === 0 && (
          <div className="no-achievements">
            <p>No easter eggs discovered yet. Start exploring to find hidden surprises!</p>
          </div>
        )}
      </div>
      
      <div className="active-progress">
        <h3>Active Progress</h3>
        {activeProgress.size > 0 ? (
          <div className="progress-list">
            {Array.from(activeProgress.entries()).map(([eggId, progress]) => (
              <div key={eggId} className="progress-item">
                <div className="progress-info">
                  <span className="egg-id">{eggId}</span>
                  <span className="confidence">Confidence: {Math.round(progress.confidence * 100)}%</span>
                </div>
                <div className="progress-bar-small">
                  <div 
                    className="progress-fill-small"
                    style={{ width: `${progress.progress * 100}%` }}
                  />
                </div>
                <button
                  className="reset-button"
                  onClick={() => resetProgress(eggId)}
                  aria-label={`Reset progress for ${eggId}`}
                >
                  Reset
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No active discovery attempts.</p>
        )}
      </div>
      
      <div className="accessibility-section">
        <h3>Accessibility</h3>
        <div className="accessibility-controls">
          <label>
            <input
              type="checkbox"
              checked={recognitionConfig.accessibilityMode}
              onChange={(e) => setAccessibilityMode(e.target.checked)}
            />
            Enable accessibility mode
          </label>
          <button
            className="show-alternatives"
            onClick={() => setShowKeyboardAlternatives(!showKeyboardAlternatives)}
          >
            {showKeyboardAlternatives ? 'Hide' : 'Show'} Keyboard Alternatives
          </button>
        </div>
        
        {showKeyboardAlternatives && (
          <div className="keyboard-alternatives">
            <h4>Keyboard-Accessible Easter Eggs</h4>
            <ul>
              {getKeyboardAlternatives().map((alternative, index) => (
                <li key={index}>{alternative}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {showConfig && (
        <div className="configuration-section">
          <h3>Configuration</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>Sensitivity:</label>
              <select
                value={recognitionConfig.sensitivity}
                onChange={(e) => handleConfigChange('sensitivity', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="config-item">
              <label>Performance Mode:</label>
              <select
                value={recognitionConfig.performanceMode}
                onChange={(e) => handleConfigChange('performanceMode', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={recognitionConfig.adaptiveLearning}
                  onChange={(e) => handleConfigChange('adaptiveLearning', e.target.checked)}
                />
                Adaptive Learning
              </label>
            </div>
            
            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={recognitionConfig.falsePositiveReduction}
                  onChange={(e) => handleConfigChange('falsePositiveReduction', e.target.checked)}
                />
                Reduce False Positives
              </label>
            </div>
          </div>
        </div>
      )}
      
      <div className="sharing-section">
        <h3>Share & Export</h3>
        <div className="sharing-controls">
          <button className="share-button" onClick={handleShare}>
            Share Discovered Eggs
          </button>
          <button 
            className="export-button" 
            onClick={() => setShowExportImport(!showExportImport)}
          >
            Export/Import Progress
          </button>
        </div>
        
        {showExportImport && (
          <div className="export-import-panel">
            <div className="export-section">
              <h4>Export Progress</h4>
              <button onClick={handleExport}>Copy to Clipboard</button>
            </div>
            
            <div className="import-section">
              <h4>Import Progress</h4>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported data here..."
                rows={3}
              />
              <button onClick={handleImport} disabled={!importData.trim()}>
                Import
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="debug-actions">
        <button 
          className="reset-all" 
          onClick={() => {
            if (confirm('Reset all easter egg progress? This cannot be undone.')) {
              resetProgress()
            }
          }}
        >
          Reset All Progress
        </button>
      </div>
    </div>
  )
}

export default EasterEggDashboard
