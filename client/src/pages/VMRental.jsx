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
                <Terminal className="text-neon-cyan drop-shadow-neon" />
                <span>Virtual Machine Access</span>
            </motion.h1>

            {user?.role === 'admin' && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-neon-purple relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-lg font-bold text-white">{editingId ? 'Update Instance Configuration' : 'Deploy New Instance'}</h3>
                        {editingId && (
                            <button onClick={() => { setEditingId(null); setNewVM({ name: '', ip: '', type: 'Linux', username: '', password: '' }); }} className="text-xs text-white/50 hover:text-white uppercase tracking-wider font-bold">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAddVM} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <input type="text" placeholder="Machine Name" value={newVM.name} onChange={e => setNewVM({ ...newVM, name: e.target.value })} className="input-field" required />
                        <input type="text" placeholder="IP Address" value={newVM.ip} onChange={e => setNewVM({ ...newVM, ip: e.target.value })} className="input-field" required />
                        <select value={newVM.type} onChange={e => setNewVM({ ...newVM, type: e.target.value })} className="input-field appearance-none" required>
                            <option>Linux</option>
                            <option>Windows</option>
                        </select>
                        <input type="text" placeholder="Username" value={newVM.username} onChange={e => setNewVM({ ...newVM, username: e.target.value })} className="input-field" required />
                        <input type="text" placeholder="Password" value={newVM.password} onChange={e => setNewVM({ ...newVM, password: e.target.value })} className="input-field" required />
                        <div className="md:col-span-1">
                            <button type="submit" className="w-full btn-primary h-full shadow-neon bg-gradient-to-r from-neon-purple to-neon-blue">
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
                        className={`glass-panel p-6 relative overflow-hidden border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${vm.status === 'online' ? 'border-l-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-l-red-500'}`}
                    >
                        <div className={`absolute -right-4 -top-4 opacity-10 blur-sm transform rotate-12 transition-colors ${vm.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                            <Server size={120} />
                        </div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${vm.type === 'Windows' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                    <Monitor className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight">{vm.name}</h3>
                                    <p className="text-[10px] text-white/50 uppercase font-mono tracking-widest">{vm.type} Instance</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${vm.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-neon-green' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {vm.status || 'OFFLINE'}
                            </div>
                        </div>

                        <div className="space-y-3 font-mono text-xs mb-6 relative z-10">
                            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center group cursor-pointer border border-white/5 hover:border-neon-cyan/30 transition-colors" title="Click to copy">
                                <span className="text-white/40 font-bold">IP_ADDR</span>
                                <span className="text-neon-cyan">{vm.ip}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                                <span className="text-white/40 font-bold">USER_ID</span>
                                <span className="text-neon-green">{vm.username}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                                <span className="text-white/40 font-bold">PASS_KEY</span>
                                <span className="text-neon-pink">{vm.password}</span>
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="flex justify-end items-center space-x-2 mt-4 pt-4 border-t border-white/10 relative z-10">
                                <button
                                    onClick={() => startEdit(vm)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-neon-cyan transition-colors"
                                    title="Edit Config"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(vm.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                                    title="Terminate Instance"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="h-4 w-px bg-white/10 mx-2" />
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${vm.status === 'online' ? 'text-green-400' : 'text-white/30'}`}>
                                    {vm.status === 'online' ? 'Active' : 'Offline'}
                                </span>
                                <button
                                    onClick={() => toggleStatus(vm)}
                                    className={`relative w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out border border-white/10 ${vm.status === 'online' ? 'bg-green-500 shadow-neon-green' : 'bg-black/40'}`}
                                    title={`Toggle ${vm.status === 'online' ? 'Offline' : 'Online'}`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${vm.status === 'online' ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {vms.length === 0 && !loading && (
                <div className="text-center text-white/30 mt-12 py-12 glass-panel border-dashed border-2 border-white/10">
                    No virtual machines currently active in the grid.
                </div>
            )}
        </div>
    );
};

export default VMRental;
