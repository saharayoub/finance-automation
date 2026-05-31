import { useState, useRef } from 'react';
import { Layout } from '../components/Common/Layout';
import { ThinLine } from '../components/Common/ThinLine';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';

const typeLabels: Record<string, string> = { ca: "Chiffre d'Affaire", engagement: 'Engagement' };

export const UploadPage: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'ca' | 'engagement' | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCSV = (f: File) => /\.(csv|xlsx|xls)$/i.test(f.name);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!isCSV(f)) {
      setCsvError('Format invalide. Seuls les fichiers .csv, .xlsx et .xls sont acceptés.');
      return;
    }
    setCsvError(null);
    setFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isCSV(f)) {
      setCsvError('Format invalide. Seuls les fichiers .csv, .xlsx et .xls sont acceptés.');
      return;
    }
    setCsvError(null);
    setFile(f);
  };

  const resetFile = (resetType: boolean = false) => {
    setFile(null);
    setCsvError(null);
    setUploadError(null);
    setUploadStatus('idle');
    if (resetType) setFileType(null);
  };

  const handleUpload = async () => {
    if (!file || !fileType) return;
    setUploadStatus('uploading');
    setCsvError(null);
    setUploadError(null);
    await new Promise((r) => setTimeout(r, 2000));
    setUploadStatus('success');
  };

  return (
    <Layout>
      <style>{`
        @keyframes upload-spin { to { transform: rotate(360deg); } }
        @keyframes upload-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
      `}</style>
      <div className="split-screen" style={{ display: 'flex', minHeight: 'calc(100vh - 88px)', width: '100%' }}>
        {/* ─── LEFT COLUMN ─── */}
        <div className="split-left" style={{
          flex: '0 0 50%', background: 'var(--bg-primary)',
          padding: '4rem 4rem 4rem 8%', display: 'flex',
          flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            IMPORT DE DONNÉES
          </p>
          <ThinLine />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700, lineHeight: 1.1, color: 'var(--earth-dark)',
          }}>
            Importez vos données.
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--text-secondary)',
            marginTop: '0.75rem', maxWidth: '24rem',
          }}>
            Sélectionnez le type de fichier puis déposez votre CSV.
          </p>
          <div style={{ height: '2.5rem' }} />

          {/* Type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '22rem' }}>
            {[
              { value: 'ca' as const, title: "Chiffre d'Affaire", description: 'Ventes locales et export mensuels' },
              { value: 'engagement' as const, title: 'Engagement', description: 'Engagements par banque' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setFileType(t.value)}
                style={{
                  display: 'block', textAlign: 'left', padding: '1.2rem 1.5rem',
                  borderRadius: '10px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  border: fileType === t.value ? '2px solid var(--earth-dark)' : '1px solid var(--earth-pale)',
                  background: fileType === t.value ? 'var(--bg-secondary)' : 'white',
                  boxShadow: fileType === t.value ? '0 4px 16px rgba(92,74,58,0.12)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: 'var(--earth-dark)', margin: 0 }}>{t.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{t.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ height: '2rem' }} />

          {/* Button / Upload progress */}
          {uploadStatus === 'uploading' ? (
            <div style={{
              maxWidth: '22rem', width: '100%', padding: '2rem',
              background: 'white', borderRadius: '12px',
              border: '1px solid var(--earth-pale)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{
                width: '40px', height: '40px', border: '3px solid var(--earth-pale)',
                borderTopColor: 'var(--earth-dark)', borderRadius: '50%',
                animation: 'upload-spin 0.8s linear infinite',
              }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.9rem', color: 'var(--earth-dark)', margin: 0 }}>
                Upload en cours...
              </p>
              <div style={{
                width: '100%', height: '4px', background: 'var(--earth-pale)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  width: '25%', height: '100%', background: 'var(--earth-dark)', borderRadius: '2px',
                  animation: 'upload-bar 1.2s ease-in-out infinite',
                }} />
              </div>
            </div>
          ) : uploadStatus === 'idle' ? (
            <button
              onClick={handleUpload}
              disabled={!file || !fileType}
              style={{
                maxWidth: '22rem', width: '100%', padding: '0.9rem 2rem',
                background: file && fileType ? 'var(--earth-dark)' : 'var(--earth-pale)',
                color: file && fileType ? 'white' : 'var(--text-muted)',
                border: 'none', borderRadius: '6px',
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.95rem',
                cursor: file && fileType ? 'pointer' : 'not-allowed',
                letterSpacing: '0.03em', transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (file && fileType) {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = file && fileType ? 'var(--earth-dark)' : 'var(--earth-pale)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Uploader et analyser
            </button>
          ) : null}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="split-right" style={{
          flex: '0 0 50%', background: 'var(--bg-secondary)',
          padding: '4rem', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <BlobMain />
          <BlobSecond />
          <DotsGrid style={{ top: '8%', right: '8%', bottom: 'auto' }} />

          {/* SUCCESS CARD */}
          {uploadStatus === 'success' ? (
            <div style={{
              width: '85%', maxWidth: '360px', background: 'white',
              borderRadius: '16px', padding: '3rem 2rem',
              position: 'relative', zIndex: 2,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 8px 30px rgba(92,74,58,0.1)',
              border: '1px solid var(--earth-pale)',
            }}>
              <button
                onClick={() => resetFile(true)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '1.2rem',
                  color: 'var(--text-muted)', lineHeight: 1, padding: '0.25rem',
                }}
              >
                ✕
              </button>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: '#F0F4F0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '1.2rem',
              }}>
                <span style={{ fontSize: '1.6rem', color: '#5A7A5C' }}>✓</span>
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                fontSize: '1rem', color: 'var(--earth-dark)', margin: 0,
              }}>
                Fichier uploadé avec succès.
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                fontSize: '0.82rem', color: 'var(--text-muted)',
                margin: '0.5rem 0 0',
              }}>
                {file?.name} &middot; {fileType ? typeLabels[fileType] : ''}
              </p>
              <button
                onClick={() => resetFile(true)}
                style={{
                  marginTop: '1.5rem', padding: '0.7rem 1.5rem',
                  background: 'transparent', border: '1px solid var(--earth-dark)',
                  borderRadius: '6px', fontFamily: "'Inter', sans-serif",
                  fontWeight: 500, fontSize: '0.85rem', color: 'var(--earth-dark)',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--earth-dark)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--earth-dark)'; }}
              >
                Uploader un autre fichier
              </button>
            </div>
          ) : (
            /* DROP ZONE or FILE INFO or ERROR */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && uploadStatus !== 'error' && inputRef.current?.click()}
              style={{
                width: '85%', maxWidth: '360px', aspectRatio: '3 / 4',
                background: 'white',
                border: uploadStatus === 'error'
                  ? '2px solid #C4826A'
                  : isDragging
                    ? '2px dashed var(--accent)'
                    : '2px dashed var(--earth-light)',
                borderRadius: '16px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '3rem 2rem', cursor: file ? 'default' : 'pointer',
                position: 'relative', zIndex: 2, transition: 'all 0.3s ease',
              }}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleFileSelect} />

              {uploadStatus === 'error' ? (
                /* Situation 3 — Error after upload */
                <>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.9rem', color: 'var(--earth-dark)',
                    textAlign: 'center', margin: 0, maxWidth: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {file?.name}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetFile(false); }}
                    style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif", fontSize: '1.2rem',
                      color: 'var(--text-muted)', lineHeight: 1, padding: '0.25rem',
                    }}
                  >
                    ✕
                  </button>
                  {uploadError && (
                    <p style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 300,
                      fontSize: '0.8rem', color: '#8B5A52', textAlign: 'center',
                      marginTop: '0.75rem', maxWidth: '18rem',
                    }}>
                      {uploadError}
                    </p>
                  )}
                </>
              ) : file ? (
                /* Situation 1 — File selected (idle or uploading) */
                <>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'var(--bg-secondary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                  }}>
                    {uploadStatus === 'uploading' ? (
                      <div style={{
                        width: '24px', height: '24px', border: '3px solid var(--earth-pale)',
                        borderTopColor: 'var(--earth-dark)', borderRadius: '50%',
                        animation: 'upload-spin 0.8s linear infinite',
                      }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem', color: 'var(--earth-mid)' }}>✓</span>
                    )}
                  </div>
                  <p style={{
                    fontFamily: "'Playfair Display', serif", fontWeight: 400,
                    fontSize: '1.1rem', color: 'var(--earth-dark)',
                    textAlign: 'center', margin: 0, maxWidth: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.8rem', color: 'var(--text-muted)',
                    marginTop: '0.5rem', margin: '0.5rem 0 0',
                  }}>
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                  {uploadStatus !== 'uploading' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetFile(false); }}
                      style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif", fontSize: '1.2rem',
                        color: 'var(--text-muted)', lineHeight: 1, padding: '0.25rem',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : (
                /* Empty drop zone */
                <>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'var(--bg-secondary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--earth-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p style={{
                    fontFamily: "'Playfair Display', serif", fontWeight: 400,
                    fontSize: '1.2rem', color: 'var(--earth-dark)', margin: 0,
                  }}>
                    Glissez votre fichier ici
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem',
                  }}>
                    ou cliquez pour parcourir
                  </p>
                  <div style={{
                    marginTop: '1.5rem', background: 'var(--bg-secondary)',
                    borderRadius: '20px', padding: '0.4rem 1rem',
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                  }}>
                    CSV ou Excel uniquement
                  </div>
                  {csvError && (
                    <p style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 300,
                      fontSize: '0.8rem', color: '#8B5A52', textAlign: 'center',
                      marginTop: '0.75rem', maxWidth: '18rem',
                    }}>
                      {csvError}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
