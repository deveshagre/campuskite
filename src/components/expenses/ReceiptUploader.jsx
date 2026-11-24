import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '../common/Toast';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * ReceiptUploader Component
 *
 * @param {Object} props
 * @param {Object|File|null} props.value - Current receipt value
 * @param {Function} props.onChange - Called with { file, fileName, fileType, fileSize, data, dataUrl }
 * @param {Function} props.onRemove - Called when receipt is cleared
 */
export default function ReceiptUploader({ value, onChange, onRemove }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generate preview URL whenever `value` changes
  useEffect(() => {
    let objectUrl = null;

    if (!value) {
      setPreviewUrl('');
      return;
    }

    if (typeof value === 'string') {
      setPreviewUrl(value);
      return;
    }

    if (value.dataUrl) {
      setPreviewUrl(value.dataUrl);
      return;
    }

    if (value.url) {
      setPreviewUrl(value.url);
      return;
    }

    const blobCandidate = value.file instanceof Blob ? value.file : value instanceof Blob ? value : null;
    if (blobCandidate) {
      objectUrl = URL.createObjectURL(blobCandidate);
      setPreviewUrl(objectUrl);
    } else if (value.data instanceof ArrayBuffer) {
      const blob = new Blob([value.data], { type: value.fileType || 'image/jpeg' });
      objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  const validateAndProcessFile = (file) => {
    setErrorMsg('');

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      const err = 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const err = 'Receipt file size must be under 2MB.';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    // Read both as DataURL (for preview) and ArrayBuffer (as requested by spec)
    const arrayBufferReader = new FileReader();
    const dataUrlReader = new FileReader();

    arrayBufferReader.onload = (e) => {
      const arrayBuffer = e.target.result;

      dataUrlReader.onload = (duEvent) => {
        const dataUrl = duEvent.target.result;
        onChange?.({
          file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: arrayBuffer,
          dataUrl,
        });
      };
      dataUrlReader.readAsDataURL(file);
    };

    arrayBufferReader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // reset input so the same file can be re-selected if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileName = value?.fileName || value?.name || (value?.file && value.file.name) || 'Receipt Image';
  const fileSize = value?.fileSize || value?.size || (value?.file && value.file.size);

  return (
    <div className="input-group">
      <label className="input-label">Attach Receipt</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {!value ? (
        <div
          className={`receipt-uploader ${isDragging ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="receipt-uploader-icon">
            <Upload size={36} color="var(--text)" />
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-base)',
            }}
          >
            Drop a receipt image here or click to browse
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            PNG, JPEG, WebP up to 2MB
          </p>
        </div>
      ) : (
        <div
          style={{
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt preview"
                style={{
                  width: 54,
                  height: 54,
                  objectFit: 'cover',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#F5F0E8',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 54,
                  height: 54,
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ImageIcon size={24} />
              </div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-sm)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fileName}
              </p>
              {fileSize ? (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  {formatFileSize(fileSize)}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRemove}
            style={{ padding: '6px 10px', flexShrink: 0 }}
            title="Remove receipt"
          >
            <X size={16} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <span className="input-error-msg" style={{ marginTop: 4 }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
