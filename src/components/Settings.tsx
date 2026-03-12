import { motion } from 'framer-motion';
import { User, Monitor, Database, Bell, Shield, Keyboard } from 'lucide-react';

interface SettingsProps {
    onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
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

            <div className="flex-1 overflow-y-auto px-8 pb-12 w-full max-w-3xl mx-auto flex">
                {/* Settings Sidebar */}
                <div className="w-48 shrink-0 pr-8 py-6">
                    <nav className="space-y-1">
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 bg-black/5 rounded-lg text-gray-900 font-medium text-[13px]">
                            <User size={16} className="text-gray-600" />
                            <span>My Account</span>
                        </button>
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-black/5 rounded-lg text-gray-600 font-medium text-[13px] transition-colors">
                            <Monitor size={16} />
                            <span>Appearance</span>
                        </button>
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-black/5 rounded-lg text-gray-600 font-medium text-[13px] transition-colors">
                            <Bell size={16} />
                            <span>Notifications</span>
                        </button>
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-black/5 rounded-lg text-gray-600 font-medium text-[13px] transition-colors">
                            <Keyboard size={16} />
                            <span>Shortcuts</span>
                        </button>
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-black/5 rounded-lg text-gray-600 font-medium text-[13px] transition-colors">
                            <Database size={16} />
                            <span>Data & Export</span>
                        </button>
                        <button className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-black/5 rounded-lg text-gray-600 font-medium text-[13px] transition-colors">
                            <Shield size={16} />
                            <span>Privacy</span>
                        </button>
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="flex-1 py-6 pl-8 border-l border-gray-200">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-xl"
                    >
                        <h2 className="text-xl font-semibold mb-6">My Account</h2>

                        <div className="space-y-6">
                            {/* Profile Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-5">
                                <div className="flex items-center space-x-4 mb-5">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-medium shadow-sm">
                                        MN
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Manuel Nobauer</h3>
                                        <p className="text-sm text-gray-500">manuel@example.com</p>
                                    </div>
                                </div>

                                <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 transition-colors">
                                    Change Avatar
                                </button>
                            </div>

                            {/* Preferences */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden text-[13px]">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-0.5">Preferred Name</h4>
                                        <p className="text-gray-500 text-xs">Used for your workspace profile.</p>
                                    </div>
                                    <input type="text" defaultValue="Manuel Nobauer" className="w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                </div>
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-0.5">Email Address</h4>
                                        <p className="text-gray-500 text-xs">Primary email for notifications.</p>
                                    </div>
                                    <span className="text-gray-500 px-3">manuel@example.com</span>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-red-600 mb-0.5">Delete Account</h4>
                                        <p className="text-gray-500 text-xs">Permanently remove your account and data.</p>
                                    </div>
                                    <button className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
