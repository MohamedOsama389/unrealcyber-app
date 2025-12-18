import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Terminal, Monitor, Server, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const VMRental = () => {
    const { user } = useAuth();
    const [vms, setVms] = useState([]);
    const [newVM, setNewVM] = useState({ name: '', ip: '', type: 'Linux', username: '', password: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVMs();
    }, []);

    const fetchVMs = async () => {
        try {
            const res = await axios.get(`/api/vms?t=${Date.now()}`);
            setVms(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddVM = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`/api/vms/${editingId}`, newVM);
                setEditingId(null);
            } else {
                await axios.post('/api/vms', newVM);
            }
            setNewVM({ name: '', ip: '', type: 'Linux', username: '', password: '' });
            fetchVMs();
        } catch (err) {
            console.error("Failed to save VM");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this Virtual Machine instance?")) return;
        try {
            await axios.delete(`/api/vms/${id}`);
            fetchVMs();
        } catch (err) {
            console.error("Failed to delete VM");
        }
    };

    const startEdit = (vm) => {
        setNewVM(vm);
        setEditingId(vm.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleStatus = async (vm) => {
        try {
            const currentStatus = vm.status || 'offline';
            const newStatus = currentStatus === 'online' ? 'offline' : 'online';
            console.log(`Toggling VM ${vm.id} from ${currentStatus} to ${newStatus}`);
            await axios.post('/api/vms/status', { id: vm.id, status: newStatus });
            setTimeout(fetchVMs, 500);
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading Cyber Instances...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold mb-8 flex items-center space-x-3 text-white"
            >
                <Terminal className="text-cyan-400" />
                <span>Virtual Machine Access</span>
            </motion.h1>

            {user?.role === 'admin' && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">{editingId ? 'Update Instance Configuration' : 'Deploy New Instance'}</h3>
                        {editingId && (
                            <button onClick={() => { setEditingId(null); setNewVM({ name: '', ip: '', type: 'Linux', username: '', password: '' }); }} className="text-xs text-slate-400 hover:text-white">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAddVM} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Machine Name" value={newVM.name} onChange={e => setNewVM({ ...newVM, name: e.target.value })} className="input-field" required />
                        <input type="text" placeholder="IP Address" value={newVM.ip} onChange={e => setNewVM({ ...newVM, ip: e.target.value })} className="input-field" required />
                        <select value={newVM.type} onChange={e => setNewVM({ ...newVM, type: e.target.value })} className="input-field" required>
                            <option>Linux</option>
                            <option>Windows</option>
                        </select>
                        <input type="text" placeholder="Username" value={newVM.username} onChange={e => setNewVM({ ...newVM, username: e.target.value })} className="input-field" required />
                        <input type="text" placeholder="Password" value={newVM.password} onChange={e => setNewVM({ ...newVM, password: e.target.value })} className="input-field" required />
                        <div className="md:col-span-1">
                            <button type="submit" className="w-full btn-primary h-full">
                                {editingId ? 'Update VM' : 'Deploy VM'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vms.map((vm, idx) => (
                    <motion.div
                        key={vm.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`glass-panel p-6 relative overflow-hidden border-l-4 transition-all hover:scale-[1.01] ${vm.status === 'online' ? 'border-l-green-500' : 'border-l-red-500'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Server size={100} />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vm.type === 'Windows' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                    <Monitor className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{vm.name}</h3>
                                    <p className="text-xs text-slate-400 uppercase">{vm.type} Instance</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${vm.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {vm.status || 'OFFLINE'}
                            </div>
                        </div>

                        <div className="space-y-3 font-mono text-sm mb-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center group cursor-pointer" title="Click to copy">
                                <span className="text-slate-500">IP:</span>
                                <span className="text-cyan-400">{vm.ip}</span>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-slate-500">User:</span>
                                <span className="text-green-400">{vm.username}</span>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-slate-500">Pass:</span>
                                <span className="text-pink-400">{vm.password}</span>
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="flex justify-end items-center space-x-2 mt-4 pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => startEdit(vm)}
                                    className="p-2 hover:bg-slate-700 rounded text-cyan-400"
                                    title="Edit Config"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(vm.id)}
                                    className="p-2 hover:bg-slate-700 rounded text-red-400"
                                    title="Terminate Instance"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="h-4 w-px bg-slate-700 mx-2" />
                                <span className={`text-xs font-bold uppercase ${vm.status === 'online' ? 'text-green-400' : 'text-slate-500'}`}>
                                    {vm.status === 'online' ? 'Active' : 'Offline'}
                                </span>
                                <button
                                    onClick={() => toggleStatus(vm)}
                                    className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${vm.status === 'online' ? 'bg-green-500' : 'bg-slate-700'}`}
                                    title={`Toggle ${vm.status === 'online' ? 'Offline' : 'Online'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${vm.status === 'online' ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {vms.length === 0 && !loading && (
                <div className="text-center text-slate-500 mt-12">No virtual machines currently active.</div>
            )}
        </div>
    );
};

export default VMRental;
