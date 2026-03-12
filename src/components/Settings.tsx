import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Monitor, Cloud, HardDrive, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
    onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
    const { logout, mode, email, localPath } = useAuth();
    const [activeTab, setActiveTab] = useState<'account' | 'workspace' | 'appearance'>('account');

    const handleSignOut = () => {
        logout();
        onClose();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fbfbfd] overflow-hidden absolute inset-0 z-50">
            {/* Title Bar Area for Dragging */}
            <div className="h-12 w-full shrink-0 flex items-center justify-between px-4 drag-region" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="w-16" /> {/* Spacer */}
                <h1 className="text-[13px] font-semibold text-gray-800">Settings</h1>
                <div className="w-16 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-600 no-drag"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        Done
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-12 w-full max-w-4xl mx-auto flex">
                {/* Settings Sidebar */}
                <div className="w-56 shrink-0 pr-8 py-6">
                    <nav className="space-y-1">
                        <button 
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeTab === 'account' ? 'bg-black/5 text-gray-900' : 'text-gray-600 hover:bg-black/5 cursor-pointer'}`}>
                            <User size={16} className={activeTab === 'account' ? 'text-gray-900' : 'text-gray-500'} />
                            <span>My Account</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('workspace')}
                            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeTab === 'workspace' ? 'bg-black/5 text-gray-900' : 'text-gray-600 hover:bg-black/5 cursor-pointer'}`}>
                            {mode === 'cloud' ? <Cloud size={16} className={activeTab === 'workspace' ? 'text-gray-900' : 'text-gray-500'} /> : <HardDrive size={16} className={activeTab === 'workspace' ? 'text-gray-900' : 'text-gray-500'} />}
                            <span>Workspace Setup</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('appearance')}
                            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeTab === 'appearance' ? 'bg-black/5 text-gray-900' : 'text-gray-600 hover:bg-black/5 cursor-pointer'}`}>
                            <Monitor size={16} className={activeTab === 'appearance' ? 'text-gray-900' : 'text-gray-500'} />
                            <span>Appearance</span>
                        </button>
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="flex-1 py-6 pl-8 border-l border-gray-200">
                    <AnimatePresence mode="wait">
                        {activeTab === 'account' && (
                            <motion.div
                                key="account"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-xl"
                            >
                                <h2 className="text-xl font-semibold mb-6">My Account</h2>
                                
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-5">
                                        <div className="flex items-center space-x-4 mb-5">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-medium shadow-sm">
                                                {email ? email[0].toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">Current User</h3>
                                                <p className="text-sm text-gray-500">{email || 'Local User'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden text-[13px]">
                                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-0.5">Workspace Mode</h4>
                                                <p className="text-gray-500 text-xs text-balance">Your active basis state.</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {mode === 'cloud' ? <Cloud size={14}/> : <HardDrive size={14}/>}
                                                {mode === 'cloud' ? 'Cloud Sync' : 'Local Only'}
                                            </span>
                                        </div>
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-red-600 mb-0.5">Sign Out / Reset</h4>
                                                <p className="text-gray-500 text-xs">Return to the welcome screen and exit this mode.</p>
                                            </div>
                                            <button 
                                                onClick={handleSignOut}
                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5">
                                                <LogOut size={14} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'workspace' && (
                            <motion.div
                                key="workspace"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-xl"
                            >
                                <h2 className="text-xl font-semibold mb-6">Workspace Setup</h2>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden text-[13px]">
                                    {mode === 'cloud' ? (
                                        <>
                                            <div className="p-5 border-b border-gray-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <Cloud size={18} />
                                                    </div>
                                                    <h3 className="text-base font-medium text-gray-900">Cloud Sync Active</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 ml-11">Your data is continually backed up and synchronized across your devices securely.</p>
                                            </div>
                                            <div className="p-4 border-b border-gray-100 flex items-center justify-between ml-11">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-0.5">Account Email</h4>
                                                    <p className="text-gray-500 text-xs">Used for sync authentication.</p>
                                                </div>
                                                <span className="text-gray-600 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                                                    {email || 'No email provided'}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-5 border-b border-gray-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                        <HardDrive size={18} />
                                                    </div>
                                                    <h3 className="text-base font-medium text-gray-900">Local Configuration</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 ml-11">Your files are saved purely locally. Features like multi-device sync are disabled.</p>
                                            </div>
                                            <div className="p-4 border-b border-gray-100 flex flex-col gap-3 ml-11">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-0.5">Storage Folder Path</h4>
                                                    <p className="text-gray-500 text-xs mb-3">Where basis is saving your pages and workspaces right now.</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        readOnly 
                                                        type="text" 
                                                        value={localPath || 'Not set'} 
                                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 outline-none" 
                                                    />
                                                    <button className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-colors cursor-pointer">
                                                        Select...
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        
                        {activeTab === 'appearance' && (
                            <motion.div
                                key="appearance"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-xl"
                            >
                                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden text-[13px]">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-0.5">Theme</h4>
                                            <p className="text-gray-500 text-xs">Choose how basis looks to you.</p>
                                        </div>
                                        <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer">
                                            <option>System (Light)</option>
                                            <option>Light</option>
                                            <option disabled>Dark (Coming soon)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}