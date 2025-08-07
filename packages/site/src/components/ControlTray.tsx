import React, { Fragment, useState } from 'react'
import { Dialog, Transition, Switch, Listbox } from '@headlessui/react'
import { 
  Cog6ToothIcon, 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useBackground } from '../contexts/BackgroundContext'
import { debugBackground } from '../utils/debug'

const ControlTray: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    currentModule, 
    isActive, 
    isPaused, 
    modules,
    setCurrentModule,
    toggleActive,
    togglePause
  } = useBackground()

  debugBackground.controls('Render state:', {
    currentModule,
    isActive,
    isPaused,
    availableModules: Object.keys(modules),
    moduleCount: Object.keys(modules).length
  })

  const moduleOptions = [
    { id: null, name: 'None', description: 'No background animation' },
    ...Object.entries(modules).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      icon: config.icon
    }))
  ]

  const selectedModule = moduleOptions.find(option => option.id === currentModule) || moduleOptions[0]

  const handleModuleChange = (option: typeof moduleOptions[0]) => {
    setCurrentModule(option.id)
  }

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      debugBackground.controls('Key event:', {
        key: event.key,
        shiftKey: event.shiftKey,
        target: event.target?.constructor.name
      })

      // Shift + ~ to cycle through modules
      if (event.shiftKey && event.key === '~') {
        debugBackground.controls('Shift+~ detected! Cycling modules...', {
          currentModule,
          moduleOptions: moduleOptions.map(m => m.id)
        })
        event.preventDefault()
        const currentIndex = moduleOptions.findIndex(option => option.id === currentModule)
        const nextIndex = (currentIndex + 1) % moduleOptions.length
        const nextModule = moduleOptions[nextIndex]
        debugBackground.controls(`Switching from ${currentModule} to ${nextModule.id}`)
        setCurrentModule(nextModule.id)
      }
      
      // Escape to close tray
      if (event.key === 'Escape' && isOpen) {
        debugBackground.controls('Escape pressed, closing tray')
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentModule, isOpen, moduleOptions, setCurrentModule])

  return (
    <>
      {/* Trigger button - corner click area for power users */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-0 right-0 w-8 h-8 opacity-0 hover:opacity-30 transition-opacity duration-300 bg-blue-500 z-50"
        aria-label="Open background controls"
        title="Secret background controls area! (Shift + ~)"
      />

      {/* Main control button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        aria-label="Open background controls"
        style={{ zIndex: 9999 }}
      >
        <Cog6ToothIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Control tray dialog */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center justify-between"
                  >
                    Background Controls
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </Dialog.Title>

                  <div className="mt-6 space-y-6">
                    {/* Module Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Background Module
                      </label>
                      <Listbox value={selectedModule} onChange={handleModuleChange}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 border border-gray-300 dark:border-gray-600">
                            <span className="flex items-center">
                              {selectedModule.icon && (
                                <span className="mr-2">{selectedModule.icon}</span>
                              )}
                              <span className="block truncate text-gray-900 dark:text-gray-100">
                                {selectedModule.name}
                              </span>
                            </span>
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
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              {moduleOptions.map((option) => (
                                <Listbox.Option
                                  key={option.id || 'none'}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                        : 'text-gray-900 dark:text-gray-100'
                                    }`
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <div className="flex items-center">
                                        {option.icon && (
                                          <span className="mr-2">{option.icon}</span>
                                        )}
                                        <div>
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {option.name}
                                          </span>
                                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                                            {option.description}
                                          </span>
                                        </div>
                                      </div>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                          <CheckIcon className="h-5 w-5" />
                                        </span>
                                      ) : null}
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
                    <div className="space-y-4">
                      {/* Active/Inactive Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isActive ? (
                            <EyeIcon className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5 text-gray-400 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Background Active
                          </span>
                        </div>
                        <Switch
                          checked={isActive}
                          onChange={toggleActive}
                          className={`${
                            isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      {/* Play/Pause Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isPaused ? (
                            <PauseIcon className="w-5 h-5 text-yellow-500 mr-2" />
                          ) : (
                            <PlayIcon className="w-5 h-5 text-green-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Animation Paused
                          </span>
                        </div>
                        <Switch
                          checked={isPaused}
                          onChange={togglePause}
                          disabled={!isActive}
                          className={`${
                            isPaused ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-600'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50`}
                        >
                          <span
                            className={`${
                              isPaused ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>

                    {/* Help text */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-4">
                      <p className="mb-1">
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift</kbd> + 
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">~</kbd> to cycle modules
                      </p>
                      <p>Animations respect your reduced motion preferences</p>
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

export default ControlTray