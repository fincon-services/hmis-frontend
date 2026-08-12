import { useState } from 'react';
import { Upload, Progress, Button } from 'antd';
import type { UploadProps } from 'antd';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  accept?: string;
  buttonLabel?: string;
}

/** Reusable multipart upload with progress — see radiology result upload for the reference use. */
export function FileUpload({ onUpload, accept, buttonLabel = 'Upload' }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const props: UploadProps = {
    accept,
    multiple: false,
    showUploadList: false,
    beforeUpload: (f) => {
      setFile(f);
      return false;
    },
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file, setProgress);
      setFile(null);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {!file ? (
        <Upload.Dragger {...props} style={{ padding: 12 }}>
          <p style={{ margin: 0 }}>
            <UploadCloud size={22} style={{ marginBottom: 6 }} />
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>Drag & drop a file, or click to select</p>
        </Upload.Dragger>
      ) : (
        <div style={{ border: '1px solid #d7dde3', borderRadius: 6, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: uploading ? 8 : 0 }}>
            <span style={{ fontSize: 13 }}>{file.name}</span>
            {!uploading && <Button type="text" size="small" icon={<X size={14} />} onClick={() => setFile(null)} aria-label="Remove selected file" />}
          </div>
          {uploading && <Progress percent={progress} size="small" />}
        </div>
      )}

      {file && (
        <Button type="primary" onClick={handleUpload} loading={uploading} style={{ marginTop: 10 }}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
