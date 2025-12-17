'use client';
import { useState, useEffect } from 'react';
import { Input, Button, Card, message, Avatar } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { NoteService } from '../services/NoteService';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;

export default function NotesTab({ entityType, entityId }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const [editingNote, setEditingNote] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchNotes();
    }, [entityId]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data = await NoteService.getNotes(entityType, entityId);
            setNotes(data || []);
        } catch (error) {
            console.error(error);
            message.error('Error fetching notes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote || !newNote.trim()) return;

        try {
            await NoteService.createNote(newNote, entityType, entityId);
            message.success('Note added');
            setNewNote('');
            fetchNotes();
        } catch (error) {
            console.error(error);
            message.error('Failed to add note');
        }
    };

    const handleDelete = async (id) => {
        try {
            await NoteService.deleteNote(id);
            message.success('Note deleted');
            fetchNotes();
        } catch (error) {
            message.error('Failed to delete');
        }
    };

    const startEdit = (note) => {
        setEditingNote(note.id);
        setEditContent(note.content);
    };

    const cancelEdit = () => {
        setEditingNote(null);
        setEditContent('');
    };

    const saveEdit = async (id) => {
        try {
            await NoteService.updateNote(id, editContent);
            message.success('Note updated');
            setEditingNote(null);
            fetchNotes();
        } catch (error) {
            message.error('Failed to update');
        }
    };

    return (
        <div style={{ marginTop: 20 }}>
            {/* Replaced deprecated bordered={false} with style */}
            <Card title="Notas" style={{ border: 'none' }}>
                <div style={{ marginBottom: 20 }}>
                    <TextArea
                        rows={4}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Escribe una nota..."
                        style={{ marginBottom: 10 }}
                    />
                    <Button type="primary" onClick={handleAddNote}>
                        Agregar Nota
                    </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {notes.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                            <Avatar icon={<UserOutlined />} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div>
                                        <span style={{ fontWeight: 500, marginRight: 8 }}>{item.author?.name || item.author?.email || 'Unknown User'}</span>
                                        <span style={{ fontSize: '0.8em', color: '#888' }}>
                                            {new Date(item.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        {/* Simple permission check: if created_by matches matches user id, assuming we had user id from context but currently we are permissive in UI and let RLS handle it */}
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit(item)} />
                                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                                    </div>
                                </div>

                                {editingNote === item.id ? (
                                    <div style={{ marginTop: 5 }}>
                                        <TextArea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            autoSize={{ minRows: 2, maxRows: 6 }}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <div style={{ gap: 8, display: 'flex' }}>
                                            <Button size="small" type="primary" onClick={() => saveEdit(item.id)}>Save</Button>
                                            <Button size="small" onClick={cancelEdit}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{ background: '#f5f5f5', padding: 10, borderRadius: 5, marginTop: 5, whiteSpace: 'pre-wrap' }}
                                    >
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && !loading && <div style={{ color: '#999', textAlign: 'center' }}>No notes yet</div>}
                </div>
            </Card>
        </div>
    );
}
