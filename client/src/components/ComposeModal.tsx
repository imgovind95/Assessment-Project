import { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import api from '@/lib/api';
// @ts-ignore
import Papa from 'papaparse';
import axios from 'axios';
import { FaBold, FaItalic, FaUnderline, FaList } from 'react-icons/fa';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);
    const [manualRecipients, setManualRecipients] = useState('');

    const [startTime, setStartTime] = useState('');
    const [delaySeconds, setDelaySeconds] = useState(0);
    const [hourlyLimit, setHourlyLimit] = useState(0);

    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (prefix: string, suffix: string) => {
        if (!bodyRef.current) return;
        const { selectionStart, selectionEnd, value } = bodyRef.current;
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);

        const newText = `${before}${prefix}${selected}${suffix}${after}`;
        setBody(newText);

        // Restore focus
        setTimeout(() => {
            if (bodyRef.current) {
                bodyRef.current.focus();
                bodyRef.current.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            }
        }, 0);
    };

    // Fetch current user on mount to get the correct sender email
    // Reverted to mock for stability
    // useState(() => { ... }); 

    // Helper to parse manual text
    const getManualEmails = () => {
        return manualRecipients
            .split(/[\n,]/) // Split by newline or comma
            .map(s => s.trim())
            .filter(s => s.includes('@'));
    };

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                complete: (results: any) => {
                    // Extract emails from all cells
                    const emails: string[] = [];
                    results.data.forEach((row: any) => {
                        // row is array or object depending on header
                        Object.values(row).forEach((val: any) => {
                            if (typeof val === 'string' && val.includes('@')) {
                                emails.push(val.trim());
                            }
                        });
                    });
                    setRecipients([...new Set(emails)]); // Dedupe
                },
                header: false // Just parse raw
            });
        }
    };

    const handleSubmit = async (isDirectSend = false) => {
        setLoading(true);
        try {
            // Merge file recipients + manual recipients
            const allRecipients = [...new Set([...recipients, ...getManualEmails()])];

            if (allRecipients.length === 0) {
                alert('Please add at least one recipient');
                setLoading(false);
                return;
            }

            await api.post('/schedule', {
                recipients: allRecipients,
                subject,
                body,
                startTime: isDirectSend ? new Date().toISOString() : (startTime || new Date().toISOString()),
                delaySeconds: Number(delaySeconds),
                hourlyLimit: Number(hourlyLimit),
                sender: 'oliver.brown@domain.io', // Mock sender
                priority: isDirectSend ? 'high' : 'normal'
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert('Failed to schedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Compose New Email</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">&times;</button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                    />

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Body</label>
                            <div className="flex space-x-1">
                                <button onClick={() => insertFormat('**', '**')} className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer" title="Bold">
                                    <FaBold size={12} />
                                </button>
                                <button onClick={() => insertFormat('*', '*')} className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer" title="Italic">
                                    <FaItalic size={12} />
                                </button>
                                <button onClick={() => insertFormat('<u>', '</u>')} className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer" title="Underline">
                                    <FaUnderline size={12} />
                                </button>
                                <button onClick={() => insertFormat('\n- ', '')} className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer" title="List">
                                    <FaList size={12} />
                                </button>
                            </div>
                        </div>
                        <textarea
                            ref={bodyRef}
                            className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Enter email content..."
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Recipients</h3>
                        <div className="flex items-center space-x-4 mb-3">
                            <input
                                type="file"
                                accept=".csv,.txt"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <div className="text-sm text-gray-600">
                                {recipients.length} emails from file
                            </div>
                        </div>
                        <textarea
                            className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500 text-sm"
                            value={manualRecipients}
                            onChange={e => setManualRecipients(e.target.value)}
                            placeholder="Or type emails manually (comma or newline separated)..."
                        />
                    </div>

                    <div className="border-t pt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Input
                            label="Start Time"
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                        <Input
                            label="Delay (sec)"
                            type="number"
                            value={delaySeconds}
                            onChange={e => setDelaySeconds(Number(e.target.value))}
                        />
                        <Input
                            label="Hourly Limit"
                            type="number"
                            value={hourlyLimit}
                            onChange={e => setHourlyLimit(Number(e.target.value))}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleSubmit(true)}
                            disabled={loading || (recipients.length === 0 && getManualEmails().length === 0)}
                            className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                        >
                            {loading ? 'Sending...' : 'Send Now'}
                        </Button>
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={loading || (recipients.length === 0 && getManualEmails().length === 0)}
                        >
                            {loading ? 'Scheduling...' : 'Schedule Campaign'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
