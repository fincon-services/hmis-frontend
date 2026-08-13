import { useState } from 'react';
import type { ReactNode } from 'react';
import { Upload, Progress, Button } from 'antd';
import type { UploadProps } from 'antd';
import { UploadCloud, X, ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  accept?: string;
  buttonLabel?: string;
  /** Concise requirement bullets shown next to the control (format, size limit, etc). */
  hint?: ReactNode;
  /** Existing file/photo URL to preview before a replacement is chosen. */
  previewUrl?: string | null;
  /** `square`/`circle` render a compact fixed-size photo preview + Upload/Replace button instead of the default dragger strip. */
  shape?: 'square' | 'circle';
}

/** Reusable multipart upload with progress. Compact by default; pass `shape` for a photo-style preview (e.g. employee picture). */
export function FileUpload({ onUpload, accept, buttonLabel = 'Upload', hint, previewUrl, shape }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const isPhoto = shape !== undefined;

  const uploadProps: UploadProps = {
    accept,
    multiple: false,
    showUploadList: false,
    beforeUpload: (f) => {
      setFile(f);
      if (isPhoto) setLocalPreview(URL.createObjectURL(f));
      return false;
    },
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file, setProgress);
      clearSelection();
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setProgress(0);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
  };

  if (isPhoto) {
    const displayUrl = localPreview ?? previewUrl;
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: shape === 'circle' ? '50%' : 8,
            border: '1px dashed #c3cbd2',
            background: '#f7f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {displayUrl ? <img src={displayUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} color="#9aa5ad" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hint && <div style={{ fontSize: 11.5, color: '#4d5c6b', lineHeight: 1.6, marginBottom: 8 }}>{hint}</div>}
          <Upload {...uploadProps}>
            <Button size="small" icon={<UploadCloud size={13} />}>
              {displayUrl ? 'Replace' : buttonLabel}
            </Button>
          </Upload>
          {file && (
            <div style={{ marginTop: 8, maxWidth: 200 }}>
              {uploading ? (
                <Progress percent={progress} size="small" />
              ) : (
                <Button size="small" type="primary" onClick={handleUpload}>
                  {buttonLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {!file ? (
        <Upload.Dragger {...uploadProps} style={{ padding: '6px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <UploadCloud size={16} color="#4d5c6b" />
            <span style={{ fontSize: 12.5, color: '#4d5c6b' }}>Drag & drop, or click to select</span>
          </div>
        </Upload.Dragger>
      ) : (
        <div style={{ border: '1px solid #d7dde3', borderRadius: 6, padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: uploading ? 8 : 0 }}>
            <span style={{ fontSize: 12.5 }}>{file.name}</span>
            {!uploading && <Button type="text" size="small" icon={<X size={14} />} onClick={clearSelection} aria-label="Remove selected file" />}
          </div>
          {uploading && <Progress percent={progress} size="small" />}
        </div>
      )}

      {hint && <div style={{ fontSize: 11.5, color: '#4d5c6b', marginTop: 6 }}>{hint}</div>}

      {file && (
        <Button type="primary" size="small" onClick={handleUpload} loading={uploading} style={{ marginTop: 8 }}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
