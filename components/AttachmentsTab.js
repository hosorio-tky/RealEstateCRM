'use client';
import { useState, useEffect } from 'react';
import { Upload, Button, Card, message, Modal } from 'antd';
import { InboxOutlined, FileOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { FileService } from '../services/FileService';

const { Dragger } = Upload;

export default function AttachmentsTab({ entityType, entityId }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, [entityId]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const data = await FileService.getFiles(entityType, entityId);
            setFiles(data || []);
        } catch (error) {
            console.error(error);
            message.error('Error fetching files');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        try {
            await FileService.uploadFile(file, entityType, entityId);
            message.success(`${file.name} uploaded successfully`);
            onSuccess("ok");
            fetchFiles();
        } catch (error) {
            console.error(error);
            message.error(`${file.name} upload failed.`);
            onError(error);
        }
    };

    const handleDelete = async (file) => {
        Modal.confirm({
            title: 'Are you sure?',
            content: 'Do you want to delete this file?',
            onOk: async () => {
                try {
                    await FileService.deleteFile(file.id, file.file_path);
                    message.success('File deleted');
                    fetchFiles();
                } catch (error) {
                    message.error('Failed to delete file');
                }
            }
        })
    };

    const handleDownload = (path) => {
        const url = FileService.getDownloadUrl(path);
        window.open(url, '_blank');
    }

    const uploadProps = {
        customRequest: handleUpload,
        multiple: true,
        showUploadList: false,
    };

    return (
        <div style={{ marginTop: 20 }}>
            <Dragger {...uploadProps} style={{ marginBottom: 20, padding: 20 }}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Haz clic o arrastra archivos aquí para subir</p>
                <p className="ant-upload-hint">Soporta carga individual o masiva.</p>
            </Dragger>

            {loading ? <div style={{ textAlign: 'center' }}>Loading...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {files.map(item => (
                        <Card
                            key={item.id}
                            actions={[
                                <DownloadOutlined key="download" onClick={() => handleDownload(item.file_path)} />,
                                <DeleteOutlined key="delete" onClick={() => handleDelete(item)} style={{ color: 'red' }} />
                            ]}
                        >
                            <Card.Meta
                                avatar={<FileOutlined style={{ fontSize: 24 }} />}
                                title={<span title={item.file_name} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file_name}</span>}
                                description={(item.file_size / 1024).toFixed(2) + ' KB'}
                            />
                        </Card>
                    ))}
                    {files.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#999', textAlign: 'center' }}>No files found</div>}
                </div>
            )}
        </div>
    );
}
