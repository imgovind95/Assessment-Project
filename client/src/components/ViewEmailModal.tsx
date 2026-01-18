import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import api from '@/lib/api';
import { FaBold, FaItalic, FaUnderline, FaList } from 'react-icons/fa';

interface ViewEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    onUpdate?: () => void; // Callback to refresh list
    email: {
        id: string; // added ID
        recipient: string;
        subject: string;
        body: string;
        status: string;
        scheduledAt: string;
        sentAt?: string;
    } | null;
}

export default function ViewEmailModal({ isOpen, onClose, onDelete, onUpdate, email }: ViewEmailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState('');
    const editBodyRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (prefix: string, suffix: string) => {
        if (!editBodyRef.current) return;
        const { selectionStart, selectionEnd, value } = editBodyRef.current;
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);

        const newText = `${before}${prefix}${selected}${suffix}${after}`;
        setEditBody(newText);

        // Restore focus
        setTimeout(() => {
            if (editBodyRef.current) {
                editBodyRef.current.focus();
                editBodyRef.current.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            }
        }, 0);
    };

    useEffect(() => {
        if (email) {
            setEditBody(email.body);
            setIsEditing(false);
        }
    }, [email, isOpen]);

    if (!isOpen || !email) return null;

    const handleSave = async () => {
        try {
            await api.put(`/scheduled-emails/${email.id}`, { body: editBody });
            setIsEditing(false);
            if (onUpdate) onUpdate(); // Refresh parent list
        } catch (error) {
            alert('Failed to update email');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Email Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">&times;</button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-900">
                        <div>
                            <span className="font-bold text-gray-900">To:</span> {email.recipient}
                        </div>
                        <div>
                            <span className="font-bold text-gray-900">Status:</span>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-bold rounded-full ${email.status === 'SENT' ? "bg-green-100 text-green-900" :
                                email.status === 'FAILED' ? "bg-red-100 text-red-900" :
                                    "bg-yellow-100 text-yellow-900"
                                }`}>
                                {email.status}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-900">Scheduled:</span> {new Date(email.scheduledAt).toLocaleString()}
                        </div>
                        {email.sentAt && (
                            <div>
                                <span className="font-bold text-gray-900">Sent:</span> {new Date(email.sentAt).toLocaleString()}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Subject</h3>
                        <p className="text-gray-900 font-medium p-3 bg-gray-100 rounded border border-gray-200">{email.subject}</p>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">Body</h3>
                            {!isEditing && email.status === 'PENDING' && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                    Edit Message
                                </button>
                            )}
                            {isEditing && (
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
                            )}
                        </div>

                        {isEditing ? (
                            <textarea
                                ref={editBodyRef}
                                className="w-full h-64 p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium text-sm"
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                            />
                        ) : (
                            <div className="w-full h-64 p-3 border border-gray-200 rounded-md bg-gray-100 text-gray-900 overflow-y-auto whitespace-pre-wrap font-medium">
                                {isEditing ? editBody : email.body}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-6 border-t mt-4">
                        <Button variant="danger" onClick={onDelete}>Delete Email</Button>
                        <div className="space-x-3">
                            {isEditing ? (
                                <>
                                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button onClick={handleSave}>Save Changes</Button>
                                </>
                            ) : (
                                <Button variant="secondary" onClick={onClose}>Close</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
