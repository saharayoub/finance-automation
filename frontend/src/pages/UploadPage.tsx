import { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Common/Layout';
import { ThinLine } from '../components/Common/ThinLine';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';
import api from '../services/api';

const typeLabels: Record<string, string> = { ca: "Chiffre d'Affaire", engagement: 'Engagement', versement: 'Versement' };

export const UploadPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'ca' | 'engagement' | 'versement' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  interface UploadHistoryEntry {
    id: number;
    filename: string;
    type: string;
    date: string;
    size: string;
    fileData?: string;
  }

  const loadHistory = (): UploadHistoryEntry[] => {
    try {
      const raw = localStorage.getItem('upload_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveHistory = (entries: UploadHistoryEntry[]) => {
    localStorage.setItem('upload_history', JSON.stringify(entries));
  };

  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>(loadHistory);
  const historyIdRef = useRef(uploadHistory.reduce((max, e) => Math.max(max, e.id), 0));

  useEffect(() => {
    saveHistory(uploadHistory);
  }, [uploadHistory]);

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
    if (resetType) setSelectedType(null);
  };

  const goBack = () => {
    setSelectedType(null);
    setFile(null);
    setCsvError(null);
    setUploadError(null);
    setUploadStatus('idle');
  };

  interface ValidationReport {
    valid: boolean;
    total_rows: number;
    valid_rows: number;
    error_count: number;
    warning_count: number;
    errors: { line: number; field: string; message: string }[];
    warnings: { line: number; field: string; message: string }[];
  }

  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  const handleUpload = async () => {
    if (!file || !selectedType) return;
    setUploadStatus('uploading');
    setCsvError(null);
    setUploadError(null);

    const fileTypeMap: Record<string, string> = { ca: 'CA', engagement: 'Engagement', versement: 'Versement' };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileTypeMap[selectedType]);

    const fileDataPromise = file.size <= 3_000_000
      ? new Promise<string | undefined>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(file);
        })
      : Promise.resolve(undefined);

    try {
      const res = await api.post('/api/upload', formData);
      const fileData = await fileDataPromise;

      setValidationReport(res.data.validation);
      setUploadStatus('success');
      const now = new Date();
      const entry: UploadHistoryEntry = {
        id: ++historyIdRef.current,
        filename: file.name,
        type: selectedType,
        date: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        size: (file.size / 1024).toFixed(1) + ' Ko',
        fileData,
      };
      setUploadHistory((prev) => [entry, ...prev]);
    } catch (err: any) {
      console.error('Upload error:', err?.response?.data || err?.message || err);
      const detail = err?.response?.data?.detail;
      const message = detail?.message || (typeof detail === 'string' ? detail : null) || err?.message || 'Erreur inconnue lors de l\'upload.';
      setUploadError(message);
      setUploadStatus('error');
    }
  };

  const removeHistoryEntry = (id: number) => {
    setUploadHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const badgeColors: Record<string, { bg: string; color: string }> = {
    ca: { bg: '#EFE6DC', color: 'var(--earth-dark)' },
    engagement: { bg: '#F0EBE1', color: 'var(--earth-mid)' },
    versement: { bg: '#F0ECE6', color: 'var(--earth-light)' },
  };

  const types = [
    { value: 'ca' as const, title: "Chiffre d'Affaire", description: 'Ventes locales et export mensuels' },
    { value: 'engagement' as const, title: 'Engagement', description: 'Engagements par banque' },
    { value: 'versement' as const, title: 'Versement', description: 'Versements et transactions bancaires' },
  ];

  // ─── ÉTAPE 1 : Sélection du type ───
  if (selectedType === null) {
    return (
      <Layout>
        <div style={{
          padding: '4rem 4rem 4rem 8%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', minHeight: 'calc(100vh - 88px)',
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
            Choisissez le type de fichier.
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--text-secondary)',
            marginTop: '0.75rem', maxWidth: '24rem',
          }}>
            Sélectionnez la catégorie correspondant à vos données.
          </p>
          <div style={{ height: '2.5rem' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '700px', width: '100%', alignSelf: 'center' }}>
            {types.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                style={{
                  display: 'block', textAlign: 'left', padding: '2.5rem',
                  borderRadius: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  border: '1px solid var(--earth-pale)',
                  background: 'white',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--earth-dark)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(92,74,58,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--earth-pale)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '1.2rem', color: 'var(--earth-dark)', margin: 0 }}>{t.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: '1rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // ─── ÉTAPE 2 : Upload ───
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
          <button
            onClick={goBack}
            style={{
              alignSelf: 'flex-start', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              fontWeight: 500, fontSize: '0.82rem', color: 'var(--earth-mid)',
              padding: '0.5rem 0', transition: 'color 0.2s', marginBottom: '0.5rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--earth-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--earth-mid)'}
          >
            ← Retour
          </button>
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
            {typeLabels[selectedType]} &mdash; déposez votre fichier ci-contre.
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)',
            marginTop: '0.25rem', fontStyle: 'italic',
          }}>
            {typeLabels[selectedType]}
          </p>
          <div style={{ height: '2.5rem' }} />

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
              disabled={!file || !selectedType}
              style={{
                maxWidth: '22rem', width: '100%', padding: '0.9rem 2rem',
                background: file && selectedType ? 'var(--earth-dark)' : 'var(--earth-pale)',
                color: file && selectedType ? 'white' : 'var(--text-muted)',
                border: 'none', borderRadius: '6px',
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.95rem',
                cursor: file && selectedType ? 'pointer' : 'not-allowed',
                letterSpacing: '0.03em', transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (file && selectedType) {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = file && selectedType ? 'var(--earth-dark)' : 'var(--earth-pale)';
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
              width: '85%', maxWidth: '460px', background: 'white',
              borderRadius: '16px', padding: '2.5rem 2rem',
              position: 'relative', zIndex: 2,
              boxShadow: '0 8px 30px rgba(92,74,58,0.1)',
              border: '1px solid var(--earth-pale)',
            }}>
              <button
                onClick={goBack}
                style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '1.2rem',
                  color: 'var(--text-muted)', lineHeight: 1, padding: '0.25rem',
                }}
              >
                ✕
              </button>

              {/* Icon & filename */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#F0F4F0', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1.2rem', color: '#5A7A5C' }}>✓</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.95rem', color: 'var(--earth-dark)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {file?.name}
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0',
                  }}>
                    {selectedType ? typeLabels[selectedType] : ''}
                  </p>
                </div>
              </div>

              {/* Zone 1 — Summary cards */}
              <div style={{
                display: 'flex', gap: '0.6rem', marginBottom: '1.25rem',
              }}>
                {[
                  { label: 'Lignes analysées', value: validationReport?.total_rows ?? 0, bg: '#EFE6DC', color: 'var(--earth-dark)' },
                  { label: 'Erreurs', value: validationReport?.error_count ?? 0, bg: '#F0E0DA', color: '#A05A4A' },
                  { label: 'Avertissements', value: validationReport?.warning_count ?? 0, bg: '#F0EBE1', color: '#8B7A5C' },
                ].map((card) => (
                  <div key={card.label} style={{
                    flex: 1, borderRadius: '10px', background: card.bg,
                    padding: '0.75rem 0.5rem', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 700,
                      fontSize: '1.4rem', color: card.color, lineHeight: 1.1,
                    }}>
                      {card.value}
                    </span>
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 400,
                      fontSize: '0.62rem', color: card.color, marginTop: '0.2rem',
                      letterSpacing: '0.02em', opacity: 0.85,
                    }}>
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Zone 2 — Errors */}
              {validationReport && validationReport.error_count > 0 && (
                <div style={{
                  background: '#FDF6F4', borderRadius: '10px',
                  border: '1px solid #D4A090', padding: '0.75rem 1rem',
                  marginBottom: validationReport.warning_count > 0 ? '0.75rem' : '1.25rem',
                }}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    fontSize: '0.65rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#A05A4A', margin: '0 0 0.5rem',
                  }}>
                    ERREURS
                  </p>
                  <div style={{
                    maxHeight: validationReport.errors.length > 5 ? '140px' : 'none',
                    overflowY: validationReport.errors.length > 5 ? 'auto' : 'visible',
                  }}>
                    {validationReport.errors.map((err, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '0.5rem',
                        padding: '0.3rem 0',
                        borderBottom: i < validationReport.errors.length - 1 ? '1px solid rgba(212,160,144,0.3)' : 'none',
                      }}>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: 700,
                          fontSize: '0.75rem', color: '#A05A4A', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          L{err.line}
                        </span>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: 300,
                          fontSize: '0.75rem', color: 'var(--earth-dark)', lineHeight: 1.4,
                        }}>
                          {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zone 3 — Warnings */}
              {validationReport && validationReport.warning_count > 0 && (
                <div style={{
                  background: '#FBF8F0', borderRadius: '10px',
                  border: '1px solid #D6C9AE', padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                }}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    fontSize: '0.65rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#8B7A5C', margin: '0 0 0.5rem',
                  }}>
                    AVERTISSEMENTS
                  </p>
                  <div style={{
                    maxHeight: validationReport.warnings.length > 5 ? '140px' : 'none',
                    overflowY: validationReport.warnings.length > 5 ? 'auto' : 'visible',
                  }}>
                    {validationReport.warnings.map((w, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '0.5rem',
                        padding: '0.3rem 0',
                        borderBottom: i < validationReport.warnings.length - 1 ? '1px solid rgba(214,201,174,0.3)' : 'none',
                      }}>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: 700,
                          fontSize: '0.75rem', color: '#8B7A5C', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          L{w.line}
                        </span>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: 300,
                          fontSize: '0.75rem', color: 'var(--earth-dark)', lineHeight: 1.4,
                        }}>
                          {w.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All clear */}
              {validationReport && validationReport.error_count === 0 && validationReport.warning_count === 0 && (
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 400,
                  fontSize: '0.85rem', color: '#5A7A5C', textAlign: 'center',
                  margin: '0 0 1.25rem',
                }}>
                  Données valides. Prêt pour l'analyse IA.
                </p>
              )}

              <button
                onClick={() => resetFile(false)}
                style={{
                  width: '100%', padding: '0.7rem 1.5rem',
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
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} multiple={false} {...{ 'webkitdirectory': false } as any} />

              {uploadStatus === 'error' ? (
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

      {/* ─── SESSION HISTORY ─── */}
      {uploadHistory.length > 0 && (
        <div style={{
          padding: '2.5rem 8% 4rem', maxWidth: '48rem',
        }}>
          <div style={{
            width: '100%', height: '1px', background: 'var(--earth-pale)', marginBottom: '1.5rem',
          }} />
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            HISTORIQUE DE SESSION ({uploadHistory.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {uploadHistory.map((entry) => {
              const badge = badgeColors[entry.type] || badgeColors.ca;
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px',
                      background: badge.bg, color: badge.color,
                      fontFamily: "'Inter', sans-serif", fontWeight: 500,
                      fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      {typeLabels[entry.type] || entry.type}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.filename}
                      </p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 300,
                        fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0',
                      }}>
                        {entry.size} &middot; {entry.date}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {entry.fileData ? (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = entry.fileData!;
                        link.download = entry.filename;
                        link.click();
                      }}
                      style={{
                        padding: '0.3rem 0.7rem', background: 'transparent',
                        border: '1px solid var(--earth-pale)', borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.75rem', color: 'var(--earth-mid)',
                        cursor: 'pointer', display: 'inline-flex',
                        alignItems: 'center', gap: '0.3rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--earth-dark)';
                        e.currentTarget.style.color = 'var(--earth-dark)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--earth-pale)';
                        e.currentTarget.style.color = 'var(--earth-mid)';
                      }}
                    >
                      ↓ Télécharger
                    </button>                    ) : (
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 300,
                      fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic',
                    }}>
                      Aperçu non disponible
                    </span>
                    )}
                    <button
                    onClick={() => removeHistoryEntry(entry.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif", fontSize: '1rem',
                      color: 'var(--text-muted)', lineHeight: 1, padding: '0.25rem',
                      flexShrink: 0, transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--earth-dark)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    ✕
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
};
