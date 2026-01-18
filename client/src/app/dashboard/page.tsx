'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { FaPaperPlane, FaClock } from 'react-icons/fa';
import ComposeModal from '@/components/ComposeModal';
import clsx from 'clsx';

import ViewEmailModal from '@/components/ViewEmailModal';

interface EmailJob {
    id: string;
    recipient: string;
    subject: string;
    body: string; // Added body
    scheduledAt: string;
    sentAt?: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
}

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
    const [emails, setEmails] = useState<EmailJob[]>([]);
    const [loading, setLoading] = useState(false);

    // Compose Modal State
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // View Modal State
    const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchEmails = async () => {
        // Don't set loading true for every poll to avoid flicker, only if we have no data yet?
        // For simplicity, keeping existing loading logic but removing selection clear.
        if (emails.length === 0) setLoading(true);
        try {
            const endpoint = activeTab === 'scheduled' ? '/scheduled-emails' : '/sent-emails';
            const res = await api.get(endpoint);
            setEmails(res.data);
            // REMOVED: setSelectedIds(new Set()); 
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSelectedIds(new Set()); // Reset selection ONLY on tab switch
        fetchEmails();
        const interval = setInterval(fetchEmails, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, [activeTab]);

    const handleRowClick = (email: EmailJob) => {
        // Only open modal if we didn't click checkbox (handled by separate click listener on checkbox usually, 
        // but here we might need to stop propagation on checkbox)
        setSelectedEmail(email);
        setIsViewOpen(true);
    };

    const toggleSelection = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation(); // Stop propagation if possible, though onClick on parent TD handles the crucial part
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(emails.map(e => e.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} emails?`)) return;
        try {
            await api.post('/delete-emails', { ids: Array.from(selectedIds) });
            fetchEmails();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleSingleDelete = async () => {
        if (!selectedEmail || !confirm('Delete this email?')) return;
        try {
            await api.post('/delete-emails', { ids: [selectedEmail.id] });
            setIsViewOpen(false);
            fetchEmails();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex space-x-4 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                            activeTab === 'scheduled' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <span className="flex items-center space-x-2">
                            <FaClock /> <span>Scheduled</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                            activeTab === 'sent' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <span className="flex items-center space-x-2">
                            <FaPaperPlane /> <span>Sent</span>
                        </span>
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    {selectedIds.size > 0 && (
                        <Button variant="danger" onClick={handleBulkDelete}>
                            Delete Selected ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={() => setIsComposeOpen(true)}>Compose New Email</Button>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    onChange={toggleAll}
                                    checked={emails.length > 0 && selectedIds.size === emails.length}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{activeTab === 'scheduled' ? 'Scheduled For' : 'Sent At'}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && emails.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                        ) : emails.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No emails found.</td></tr>
                        ) : (
                            emails.map((email) => (
                                <tr
                                    key={email.id}
                                    onClick={() => handleRowClick(email)}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(email.id)}
                                            onChange={(e) => toggleSelection(email.id, e as any)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{email.recipient}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.subject}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(activeTab === 'scheduled' ? email.scheduledAt : email.sentAt || '').toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            email.status === 'SENT' ? "bg-green-100 text-green-800" :
                                                email.status === 'FAILED' ? "bg-red-100 text-red-800" :
                                                    "bg-yellow-100 text-yellow-800"
                                        )}>
                                            {email.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSuccess={fetchEmails}
            />

            <ViewEmailModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                email={selectedEmail}
                onDelete={handleSingleDelete}
                onUpdate={fetchEmails}
            />
        </div>
    );
}
