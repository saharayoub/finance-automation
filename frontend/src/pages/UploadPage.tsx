import { useState, useRef } from 'react';
import { Layout } from '../components/Common/Layout';
import { ThinLine } from '../components/Common/ThinLine';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';

export const UploadPage: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'ca' | 'engagement' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setFile(f);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.name.endsWith('.csv')) setFile(f);
  };
  const handleUpload = async () => {
    if (!file || !fileType) return;
    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsUploading(false);
    setFile(null);
    setFileType(null);
  };

  return (
    <Layout>
      <div className="split-screen" style={{ display: 'flex', minHeight: 'calc(100vh - 88px)', width: '100%' }}>
        {/* Left column — content */}
        <div className="split-left" style={{
          flex: '0 0 50%',
          background: 'var(--bg-primary)',
          padding: '4rem 4rem 4rem 8%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            IMPORT DE DONNÉES
          </p>

          <ThinLine />

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: 'var(--earth-dark)',
          }}>
            Importez vos données.
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: 'var(--text-secondary)',
            marginTop: '0.75rem',
            maxWidth: '24rem',
          }}>
            Sélectionnez le type de fichier puis déposez votre CSV.
          </p>

          <div style={{ height: '2.5rem' }} />

          {/* Type selector cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '22rem' }}>
            {[
              { value: 'ca' as const, title: "Chiffre d'Affaire", description: 'Ventes locales et export mensuels' },
              { value: 'engagement' as const, title: 'Engagement', description: 'Engagements par banque' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setFileType(t.value)}
                style={{
                  display: 'block',
                  textAlign: 'left',
                  padding: '1.2rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  border: fileType === t.value
                    ? '2px solid var(--earth-dark)'
                    : '1px solid var(--earth-pale)',
                  background: fileType === t.value ? 'var(--bg-secondary)' : 'white',
                  boxShadow: fileType === t.value
                    ? '0 4px 16px rgba(92,74,58,0.12)'
                    : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    color: 'var(--earth-dark)',
                    margin: 0,
                  }}>
                    {t.title}
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: '0.15rem 0 0',
                  }}>
                    {t.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div style={{ height: '2rem' }} />

          <button
            onClick={handleUpload}
            disabled={!file || !fileType || isUploading}
            style={{
              maxWidth: '22rem',
              width: '100%',
              padding: '0.9rem 2rem',
              background: file && fileType ? 'var(--earth-dark)' : 'var(--earth-pale)',
              color: file && fileType ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: '0.95rem',
              cursor: file && fileType ? 'pointer' : 'not-allowed',
              letterSpacing: '0.03em',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (file && fileType && !isUploading) {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = file && fileType ? 'var(--earth-dark)' : 'var(--earth-pale)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isUploading ? 'Upload en cours...' : 'Uploader et analyser'}
          </button>
        </div>

        {/* Right column — drop zone */}
        <div className="split-right" style={{
          flex: '0 0 50%',
          background: 'var(--bg-secondary)',
          padding: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <BlobMain />
          <BlobSecond />
          <DotsGrid style={{ top: '8%', right: '8%', bottom: 'auto' }} />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              width: '85%',
              maxWidth: '360px',
              aspectRatio: '3 / 4',
              background: 'white',
              border: isDragging
                ? '2px dashed var(--accent)'
                : '2px dashed var(--earth-light)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
              transition: 'all 0.3s ease',
            }}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />

            {file ? (
              <>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <span style={{ fontSize: '1.5rem', color: 'var(--earth-mid)' }}>✓</span>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 400,
                  fontSize: '1.1rem',
                  color: 'var(--earth-dark)',
                  textAlign: 'center',
                }}>
                  {file.name}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                }}>
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.75rem',
                    textDecoration: 'underline',
                  }}
                >
                  Supprimer
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--earth-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 400,
                  fontSize: '1.2rem',
                  color: 'var(--earth-dark)',
                }}>
                  Glissez votre fichier ici
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                }}>
                  ou cliquez pour parcourir
                </p>
                <div style={{
                  marginTop: '1.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '20px',
                  padding: '0.4rem 1rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}>
                  CSV uniquement &bull; Max 10MB
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
