import React, { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Switch, Listbox, Tab } from '@headlessui/react'
import { 
  Cog6ToothIcon, 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  CheckIcon,
  ChartBarIcon,
  ShareIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useBackgroundV3 } from '../contexts/BackgroundContextV3'
import { debugBackground } from '../utils/debug'

const ControlTrayV3: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [configurationExpanded, setConfigurationExpanded] = useState(false)
  
  const { 
    currentModule, 
    activeModules,
    isActive, 
    isPaused,
    registeredModules,
    performanceMetrics,
    memoryUsage,
    deviceCapabilities,
    urlParams,
    activateModule,
    deactivateModule,
    setCurrentModule,
    toggleActive,
    togglePause,
    generateShareableUrl,
    updateModuleConfiguration
  } = useBackgroundV3()

  debugBackground.controls('ControlTrayV3 render state:', {
    currentModule,
    activeModuleCount: activeModules.size,
    registeredModuleCount: registeredModules.size,
    isActive,
    isPaused,
    performanceMetrics
  })

  // Module options for dropdown
  const moduleOptions = [
    { id: null, name: 'None', description: 'No background animation', category: 'system' },
    ...Array.from(registeredModules.entries()).map(([id, entry]) => ({
      id,
      name: entry.name,
      description: entry.description,
      category: entry.category,
      thumbnail: entry.thumbnail,
      requiresWebGL: entry.requiresWebGL,
      memoryBudget: entry.memoryBudget,
      cpuIntensity: entry.cpuIntensity
    }))
  ]

  const selectedModule = moduleOptions.find(option => option.id === currentModule) || moduleOptions[0]
  const activeModulesList = Array.from(activeModules.keys())

  // Generate shareable URL
  const handleGenerateShareUrl = () => {
    const url = generateShareableUrl()
    setShareUrl(url)
    setShowShareDialog(true)
  }

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  // Module activation/deactivation
  const handleModuleChange = async (option: typeof moduleOptions[0]) => {
    try {
      if (option.id === null) {
        // Deactivate current module
        if (currentModule) {
          await deactivateModule(currentModule)
        }
        setCurrentModule(null)
      } else {
        // Activate new module
        if (!activeModules.has(option.id)) {
          await activateModule(option.id)
        } else {
          setCurrentModule(option.id)
        }
      }
    } catch (error) {
      console.error('Failed to change module:', error)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Shift + ~ to cycle through modules
      if (event.shiftKey && event.key === '~') {
        event.preventDefault()
        const currentIndex = moduleOptions.findIndex(option => option.id === currentModule)
        const nextIndex = (currentIndex + 1) % moduleOptions.length
        const nextModule = moduleOptions[nextIndex]
        handleModuleChange(nextModule)
      }
      
      // Escape to close tray
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
      
      // Ctrl/Cmd + Shift + B to open controls
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentModule, isOpen, moduleOptions])

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (performanceMetrics.fps < 20) return { status: 'poor', color: 'text-red-500', message: 'Poor performance' }
    if (performanceMetrics.fps < 45) return { status: 'fair', color: 'text-yellow-500', message: 'Fair performance' }
    return { status: 'good', color: 'text-green-500', message: 'Good performance' }
  }

  const performanceStatus = getPerformanceStatus()

  // Tab content
  const tabs = [
    { name: 'Modules', icon: SparklesIcon },
    { name: 'Performance', icon: ChartBarIcon },
    { name: 'Settings', icon: Cog6ToothIcon }
  ]

  return (
    <>
      {/* Secret trigger button - corner click area */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-0 right-0 w-8 h-8 opacity-0 hover:opacity-30 transition-opacity duration-300 bg-blue-500 z-[9999]"
        aria-label="Open background controls (secret area)"
        title="Background controls - Shift + ~ to cycle, Ctrl+Shift+B to open"
      />

      {/* Main control button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-3 shadow-lg hover:shadow-xl hover:bg-white/95 dark:hover:bg-gray-900/95 transition-all duration-300 z-[9999] group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Open background controls. Current: ${selectedModule.name}. Status: ${isActive ? (isPaused ? 'Paused' : 'Active') : 'Inactive'}.`}
        aria-expanded={isOpen}
      >
        <div className="relative">
          <Cog6ToothIcon className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:rotate-90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300" />
          {/* Performance indicator dot */}
          {isActive && (
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${performanceStatus.status === 'good' ? 'bg-green-400' : performanceStatus.status === 'fair' ? 'bg-yellow-400' : 'bg-red-400'}`}>
              <div className={`w-3 h-3 rounded-full animate-ping ${performanceStatus.status === 'good' ? 'bg-green-400' : performanceStatus.status === 'fair' ? 'bg-yellow-400' : 'bg-red-400'}`} />
            </div>
          )}
        </div>
      </button>

      {/* Main control dialog */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-[10000]" 
          onClose={setIsOpen}
          aria-labelledby="dialog-title"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title
                      id="dialog-title"
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center"
                    >
                      <SparklesIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Background Controls V3
                    </Dialog.Title>
                    <div className="flex items-center space-x-2">
                      {/* Performance indicator */}
                      <div className={`flex items-center space-x-1 text-sm ${performanceStatus.color}`}>
                        <div className={`w-2 h-2 rounded-full ${performanceStatus.status === 'good' ? 'bg-green-400' : performanceStatus.status === 'fair' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <span>{Math.round(performanceMetrics.fps)} FPS</span>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Close background controls dialog"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1 m-6 mb-0">
                      {tabs.map((tab, index) => (
                        <Tab key={tab.name} className={({ selected }) => `
                          w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                          focus:outline-none focus:ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-700
                          ${selected 
                            ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-gray-900 dark:hover:text-gray-100'
                          }
                        `}>
                          <div className="flex items-center justify-center space-x-2">
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                          </div>
                        </Tab>
                      ))}
                    </Tab.List>

                    <Tab.Panels className="p-6">
                      {/* Modules Tab */}
                      <Tab.Panel className="space-y-6">
                        {/* Module Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Active Background Module
                          </label>
                          <Listbox value={selectedModule} onChange={handleModuleChange}>
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-3 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 border border-gray-300 dark:border-gray-600">
                                <div className="flex items-center">
                                  {selectedModule.thumbnail && (
                                    <span className="mr-3 text-lg">{selectedModule.thumbnail}</span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate text-gray-900 dark:text-gray-100 font-medium">
                                      {selectedModule.name}
                                    </span>
                                    <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
                                      {selectedModule.description}
                                    </span>
                                  </div>
                                  {selectedModule.requiresWebGL && !deviceCapabilities.webgl && (
                                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2" title="Requires WebGL" />
                                  )}
                                </div>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                              </Listbox.Button>
                              
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  {moduleOptions.map((option) => (
                                    <Listbox.Option
                                      key={option.id || 'none'}
                                      className={({ active }) => `
                                        relative cursor-default select-none py-2 pl-10 pr-4 transition-colors
                                        ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}
                                        ${(!deviceCapabilities.webgl && option.requiresWebGL) ? 'opacity-50' : ''}
                                      `}
                                      value={option}
                                      disabled={!deviceCapabilities.webgl && option.requiresWebGL}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <div className="flex items-center">
                                            {option.thumbnail && (
                                              <span className="mr-3 text-lg">{option.thumbnail}</span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {option.name}
                                              </span>
                                              <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {option.description}
                                              </span>
                                              {option.id && (
                                                <div className="flex items-center mt-1 space-x-2 text-xs text-gray-400 dark:text-gray-500">
                                                  <span>{option.memoryBudget}MB</span>
                                                  <span>•</span>
                                                  <span className={`capitalize ${
                                                    option.cpuIntensity === 'high' ? 'text-red-500' : 
                                                    option.cpuIntensity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                                                  }`}>
                                                    {option.cpuIntensity} CPU
                                                  </span>
                                                  {option.requiresWebGL && (
                                                    <>
                                                      <span>•</span>
                                                      <span>WebGL</span>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            {(!deviceCapabilities.webgl && option.requiresWebGL) && (
                                              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" title="WebGL not supported" />
                                            )}
                                          </div>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                              <CheckIcon className="h-5 w-5" />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Control Switches */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Active/Inactive Toggle */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                              {isActive ? (
                                <EyeIcon className="w-5 h-5 text-green-500 mr-2" />
                              ) : (
                                <EyeSlashIcon className="w-5 h-5 text-gray-400 mr-2" />
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Active
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Enable background
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={isActive}
                              onChange={toggleActive}
                              className={`${isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                          </div>

                          {/* Play/Pause Toggle */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                              {isPaused ? (
                                <PauseIcon className="w-5 h-5 text-yellow-500 mr-2" />
                              ) : (
                                <PlayIcon className="w-5 h-5 text-green-500 mr-2" />
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Paused
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Pause animation
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={isPaused}
                              onChange={togglePause}
                              disabled={!isActive}
                              className={`${isPaused ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50`}
                            >
                              <span className={`${isPaused ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                          </div>
                        </div>

                        {/* Active Modules List */}
                        {activeModulesList.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Active Modules ({activeModulesList.length})
                            </h4>
                            <div className="space-y-2">
                              {activeModulesList.map(moduleId => {
                                const moduleInfo = registeredModules.get(moduleId)
                                if (!moduleInfo) return null
                                
                                return (
                                  <div key={moduleId} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center">
                                      {moduleInfo.thumbnail && (
                                        <span className="mr-2 text-sm">{moduleInfo.thumbnail}</span>
                                      )}
                                      <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {moduleInfo.name}
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {moduleInfo.memoryBudget}MB • {moduleInfo.cpuIntensity} CPU
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deactivateModule(moduleId)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      aria-label={`Deactivate ${moduleInfo.name}`}
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* Performance Tab */}
                      <Tab.Panel className="space-y-6">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FPS</span>
                              <span className={`text-lg font-bold ${performanceStatus.color}`}>
                                {Math.round(performanceMetrics.fps)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {performanceStatus.message}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {memoryUsage.used}MB
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Peak: {memoryUsage.peak}MB
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frame Time</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {Math.round(performanceMetrics.frameTime)}ms
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Target: 16.67ms (60fps)
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Render Time</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {Math.round(performanceMetrics.renderTime)}ms
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              GPU render time
                            </div>
                          </div>
                        </div>

                        {/* Device Capabilities */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Device Capabilities</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">WebGL</span>
                              <span className={deviceCapabilities.webgl ? 'text-green-500' : 'text-red-500'}>
                                {deviceCapabilities.webgl ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">WebGL2</span>
                              <span className={deviceCapabilities.webgl2 ? 'text-green-500' : 'text-red-500'}>
                                {deviceCapabilities.webgl2 ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Memory</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {deviceCapabilities.deviceMemory}GB
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">CPU Cores</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {deviceCapabilities.hardwareConcurrency}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Mobile</span>
                              <span className={deviceCapabilities.isMobile ? 'text-blue-500' : 'text-gray-500'}>
                                {deviceCapabilities.isMobile ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Low-end</span>
                              <span className={deviceCapabilities.isLowEnd ? 'text-yellow-500' : 'text-green-500'}>
                                {deviceCapabilities.isLowEnd ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* Settings Tab */}
                      <Tab.Panel className="space-y-6">
                        {/* Share Configuration */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Share Configuration</h4>
                          <button
                            onClick={handleGenerateShareUrl}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <ShareIcon className="w-4 h-4" />
                            <span>Generate Shareable URL</span>
                          </button>
                        </div>

                        {/* URL Parameters Info */}
                        {Object.keys(urlParams).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current URL Parameters</h4>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 font-mono text-xs space-y-1">
                              {Object.entries(urlParams).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="text-blue-600 dark:text-blue-400 w-20">{key}:</span>
                                  <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Help */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="flex items-start">
                            <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Keyboard Shortcuts</h4>
                              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                <p><kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">~</kbd> - Cycle modules</p>
                                <p><kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">B</kbd> - Open controls</p>
                                <p><kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Esc</kbd> - Close controls</p>
                              </div>
                              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                Animations respect your reduced motion preferences and device capabilities.
                              </p>
                            </div>
                          </div>
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Share URL Dialog */}
      <Transition appear show={showShareDialog} as={Fragment}>
        <Dialog as="div" className="relative z-[10001]" onClose={setShowShareDialog}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                    Share Configuration
                  </Dialog.Title>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Copy this URL to share your current background configuration:
                    </p>
                    
                    <div className="flex">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md text-sm font-mono"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowShareDialog(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ControlTrayV3
