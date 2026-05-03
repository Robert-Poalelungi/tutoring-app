import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { consultationApi, driveApi } from '../../api';
import AppFooter from '../../components/AppFooter';
import { AppBottomNav, AppNavbar } from '../../components/AppNavbar';
import { useAuth } from '../../context/useAuth';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../../css/components/modal.css';
import '../student/student.css';
import './drive.css';

const isFolder = (mimeType) => mimeType === 'application/vnd.google-apps.folder';
const MAX_VISIBLE_PAGINATION_BUTTONS = 7;
const DRIVE_CONTENT_PAGE_SIZE = 5;
const DRIVE_SELECTOR_PAGE_SIZE = 200;
const DRIVE_SEARCH_DEBOUNCE_MS = 400;

const formatSize = (size) => {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getVisiblePaginationItems = (totalPages, activePage) => {
  if (totalPages <= MAX_VISIBLE_PAGINATION_BUTTONS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, activePage]);
  pages.add(Math.max(1, activePage - 1));
  pages.add(Math.min(totalPages, activePage + 1));

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const previous = sorted[i - 1];

    if (previous && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }

    items.push(page);
  }

  return items;
};

function Drive() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isProfessor = user?.role === 'professor';
  const isGuest = !user;
  const facultyAbbreviation = user?.faculty?.abbreviation || '';
  const facultyName = user?.faculty?.name || '';
  const requestedFolderId = String(new URLSearchParams(location.search).get('folderId') || '').trim();
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [rootFolderId, setRootFolderId] = useState('');
  const [facultyFolder, setFacultyFolder] = useState(null);
  const [adminFacultyFolders, setAdminFacultyFolders] = useState([]);
  const [selectedAdminFacultyFolder, setSelectedAdminFacultyFolder] = useState(null);
  const [yearFolders, setYearFolders] = useState([]);
  const [selectedYearFolder, setSelectedYearFolder] = useState(null);
  const [specializationFolders, setSpecializationFolders] = useState([]);
  const [selectedSpecializationFolder, setSelectedSpecializationFolder] = useState(null);
  const [studyYearFolders, setStudyYearFolders] = useState([]);
  const [selectedStudyYearFolder, setSelectedStudyYearFolder] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('');
  const [contentFolderStack, setContentFolderStack] = useState([]);
  const [professorConsultations, setProfessorConsultations] = useState([]);
  const [selectedProfessorConsultation, setSelectedProfessorConsultation] = useState(null);

  const [files, setFiles] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [pageTokens, setPageTokens] = useState([null]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTouched, setSearchTouched] = useState(false);
  const [currentFolderName, setCurrentFolderName] = useState('');
  const [deepLinkedFolderId, setDeepLinkedFolderId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingFolder, setIsDownloadingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [deletingId, setDeletingId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  const professorFolderIds = useMemo(
    () => new Set(professorConsultations.map((c) => c.driveFolderId).filter(Boolean)),
    [professorConsultations],
  );

  const isSelectionComplete = isProfessor
    ? Boolean(selectedProfessorConsultation) || Boolean(deepLinkedFolderId)
    : (isAdmin || isGuest)
      ? Boolean(selectedAdminFacultyFolder && selectedYearFolder && selectedSpecializationFolder && selectedStudyYearFolder) || Boolean(deepLinkedFolderId)
      : Boolean(selectedYearFolder && selectedSpecializationFolder && selectedStudyYearFolder) || Boolean(deepLinkedFolderId);
  const activeFolderId = currentFolderId || selectedStudyYearFolder?.id || deepLinkedFolderId || '';
  const isConsultationFolder = (Boolean(currentFolderId) && contentFolderStack.length === 1)
    || Boolean(deepLinkedFolderId)
    || (isProfessor && Boolean(selectedProfessorConsultation) && contentFolderStack.length === 0);
  const isDirectConsultationView = Boolean(deepLinkedFolderId);
  const facultyBadgeLabel = facultyAbbreviation || 'CSIE';
  const canEditCurrentFolder = isAdmin || (isProfessor && isConsultationFolder && professorFolderIds.has(activeFolderId));

  const normalizeText = (value) => String(value || '').toLowerCase().trim();

  const handleAdminFacultySelect = async (folderId) => {
    const folder = adminFacultyFolders.find((f) => f.id === folderId) || null;
    setSelectedAdminFacultyFolder(folder);
    setSelectedYearFolder(null);
    setSelectedSpecializationFolder(null);
    setSelectedStudyYearFolder(null);
    setCurrentFolderId('');
    setContentFolderStack([]);
    setFiles([]);
    resetPagination();
    setYearFolders([]);
    setSpecializationFolders([]);
    setStudyYearFolders([]);
    if (!folder) return;
    setIsLoading(true);
    setError('');
    try {
      const years = await listFolders(folder.id);
      setYearFolders(years);
    } catch (loadError) {
      setError(loadError.message || 'Nu am putut încărca anii.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectProfessorConsultation = async (consultation) => {
    setSelectedProfessorConsultation(consultation);
    setCurrentFolderId(consultation.driveFolderId);
    setContentFolderStack([]);
    setDeepLinkedFolderId('');
    resetPagination();
    await loadContentFiles({ folderId: consultation.driveFolderId, pageToken: null });
  };

  const backToProfessorConsultations = () => {
    setSelectedProfessorConsultation(null);
    setCurrentFolderId('');
    setContentFolderStack([]);
    setFiles([]);
    setDeepLinkedFolderId('');
    resetPagination();
  };

  const listFolders = async (folderId) => {
    const response = await driveApi.listFiles({ folderId, pageSize: DRIVE_SELECTOR_PAGE_SIZE });
    return (response?.files || [])
      .filter((entry) => isFolder(entry.mimeType))
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  };

  const resetPagination = () => {
    setPageTokens([null]);
    setActivePageIndex(0);
    setTotalPages(1);
    setNextPageToken(null);
    setCurrentFolderName('');
  };

  const loadContentFiles = async ({ folderId, pageToken = null } = {}) => {
    if (!folderId) {
      setFiles([]);
      setNextPageToken(null);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await driveApi.listFiles({
        folderId,
        pageToken: pageToken || undefined,
        pageSize: DRIVE_CONTENT_PAGE_SIZE,
        includeTotal: !pageToken,
        q: search.trim() || undefined,
      });

      const nextFiles = response?.files || [];
      setFiles(nextFiles);
      setNextPageToken(response?.nextPageToken || null);
      setCurrentFolderName(response?.currentFolderName || '');
      if (!pageToken && Number.isFinite(Number(response?.totalPages))) {
        setTotalPages(Math.max(1, Number(response.totalPages)));
      }
    } catch (loadError) {
      setError(loadError.message || 'Nu am putut încărca fișierele.');
      setFiles([]);
      setNextPageToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeHierarchy = async () => {
      if (isProfessor) {
        setIsLoading(true);
        setError('');
        try {
          const data = await consultationApi.getProfessorConsultations();
          if (!isMounted) return;
          const list = Array.isArray(data) ? data : (data?.consultations || []);
          setProfessorConsultations(list.filter((c) => c.driveFolderId));
          if (requestedFolderId) {
            setDeepLinkedFolderId(requestedFolderId);
            setCurrentFolderId(requestedFolderId);
            setContentFolderStack([]);
            await loadContentFiles({ folderId: requestedFolderId, pageToken: null });
          }
        } catch (loadError) {
          if (!isMounted) return;
          setError(loadError.message || 'Nu am putut încărca consultațiile.');
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      if (isAdmin || isGuest) {
        setIsLoading(true);
        setError('');
        try {
          const rootResponse = await driveApi.listFiles({ pageSize: DRIVE_SELECTOR_PAGE_SIZE });
          if (!isMounted) return;
          const rootId = rootResponse?.folderId || '';
          const allFolders = (rootResponse?.files || []).filter((entry) => isFolder(entry.mimeType));
          setRootFolderId(rootId);
          setAdminFacultyFolders(allFolders);

          if (requestedFolderId) {
            setDeepLinkedFolderId(requestedFolderId);
            setCurrentFolderId(requestedFolderId);
            setContentFolderStack([]);
            await loadContentFiles({ folderId: requestedFolderId, pageToken: null });
          }
        } catch (loadError) {
          if (!isMounted) return;
          setError(loadError.message || 'Nu am putut încărca Drive-ul.');
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      if (user?.role !== 'student') {
        if (isMounted) {
          setError('Drive-ul aplicației este disponibil doar pentru studenți.');
          setIsLoading(false);
        }
        return;
      }

      if (!facultyAbbreviation && !facultyName) {
        if (isMounted) {
          setError('Profilul nu are facultatea completată.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const rootResponse = await driveApi.listFiles({ pageSize: DRIVE_SELECTOR_PAGE_SIZE });
        if (!isMounted) return;

        const rootId = rootResponse?.folderId || '';
        const rootFolders = (rootResponse?.files || []).filter((entry) => isFolder(entry.mimeType));

        const targetFacultyFolder = rootFolders.find((entry) => {
          const name = normalizeText(entry.name);
          return name === normalizeText(facultyAbbreviation)
            || name === normalizeText(facultyName);
        });

        if (!targetFacultyFolder) {
          throw new Error(`Nu am găsit folderul facultății (${facultyAbbreviation || facultyName}) în Drive.`);
        }

        const years = await listFolders(targetFacultyFolder.id);
        if (!isMounted) return;

        setRootFolderId(rootId);
        setFacultyFolder(targetFacultyFolder);
        setYearFolders(years);
        setSelectedYearFolder(null);
        setSpecializationFolders([]);
        setSelectedSpecializationFolder(null);
        setStudyYearFolders([]);
        setSelectedStudyYearFolder(null);
        setFiles([]);
        resetPagination();

        if (requestedFolderId) {
          setDeepLinkedFolderId(requestedFolderId);
          setCurrentFolderId(requestedFolderId);
          setContentFolderStack([]);
          await loadContentFiles({ folderId: requestedFolderId, pageToken: null });
        } else {
          setDeepLinkedFolderId('');
        }
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || 'Nu am putut încărca structura Drive-ului.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeHierarchy();

    return () => {
      isMounted = false;
    };
  }, [facultyAbbreviation, facultyName, user?.role, requestedFolderId]);

  const handleSearch = () => {
    setSearchTouched(false);
    resetPagination();
    loadContentFiles({ folderId: currentFolderId || selectedStudyYearFolder?.id, pageToken: null });
  };

  useEffect(() => {
    if (!isSelectionComplete || !searchTouched) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      handleSearch();
    }, DRIVE_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search, searchTouched, isSelectionComplete, currentFolderId, selectedStudyYearFolder?.id]);

  const selectCalendarYear = async (folder) => {
    setDeepLinkedFolderId('');
    setSelectedYearFolder(folder);
    setSelectedSpecializationFolder(null);
    setSelectedStudyYearFolder(null);
    setCurrentFolderId('');
    setContentFolderStack([]);
    setFiles([]);
    resetPagination();
    setIsLoading(true);
    setError('');
    try {
      const specs = await listFolders(folder.id);
      setSpecializationFolders(specs);
      setStudyYearFolders([]);
    } catch (loadError) {
      setError(loadError.message || 'Nu am putut încărca specializările.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSpecialization = async (folder) => {
    setDeepLinkedFolderId('');
    setSelectedSpecializationFolder(folder);
    setSelectedStudyYearFolder(null);
    setCurrentFolderId('');
    setContentFolderStack([]);
    setFiles([]);
    resetPagination();
    setIsLoading(true);
    setError('');
    try {
      const years = await listFolders(folder.id);
      setStudyYearFolders(years);
    } catch (loadError) {
      setError(loadError.message || 'Nu am putut încărca anii de studiu.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectStudyYear = async (folder) => {
    setDeepLinkedFolderId('');
    setSelectedStudyYearFolder(folder);
    setCurrentFolderId(folder.id);
    setContentFolderStack([]);
    resetPagination();
    await loadContentFiles({ folderId: folder.id, pageToken: null });
  };

  const openContentFolder = async (folder) => {
    setDeepLinkedFolderId('');
    const previousId = currentFolderId || selectedStudyYearFolder?.id;
    if (!previousId) return;

    setContentFolderStack((current) => [...current, { id: previousId, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setSearch('');
    setSearchTouched(false);
    resetPagination();
    await loadContentFiles({ folderId: folder.id, pageToken: null });
  };

  const goBackContentFolder = async () => {
    setDeepLinkedFolderId('');
    if (!contentFolderStack.length) return;
    const next = [...contentFolderStack];
    const previous = next.pop();
    setContentFolderStack(next);
    setCurrentFolderId(previous.id);
    setSearch('');
    setSearchTouched(false);
    resetPagination();
    await loadContentFiles({ folderId: previous.id, pageToken: null });
  };

  const goToNextPage = async () => {
    if (!nextPageToken || isLoading) return;

    const folderId = currentFolderId || selectedStudyYearFolder?.id;
    if (!folderId) return;

    const nextIndex = activePageIndex + 1;
    setPageTokens((current) => {
      const copy = [...current];
      copy[nextIndex] = nextPageToken;
      return copy;
    });
    setActivePageIndex(nextIndex);
    await loadContentFiles({ folderId, pageToken: nextPageToken });
  };

  const goToPreviousPage = async () => {
    if (activePageIndex === 0 || isLoading) return;

    const folderId = currentFolderId || selectedStudyYearFolder?.id;
    if (!folderId) return;

    const previousIndex = activePageIndex - 1;
    const previousToken = pageTokens[previousIndex] || null;
    setActivePageIndex(previousIndex);
    await loadContentFiles({ folderId, pageToken: previousToken });
  };

  const goToPage = async (targetPage) => {
    if (isLoading) return;

    const folderId = currentFolderId || selectedStudyYearFolder?.id;
    if (!folderId) return;

    const pageIndex = targetPage - 1;
    if (pageIndex < 0 || pageIndex >= pageTokens.length) return;

    const token = pageTokens[pageIndex] || null;
    setActivePageIndex(pageIndex);
    await loadContentFiles({ folderId, pageToken: token });
  };

  const handleDownloadFolder = async () => {
    if (!activeFolderId || isDownloadingFolder) return;

    setIsDownloadingFolder(true);
    setError('');

    try {
      const { blob, fileName } = await driveApi.downloadFolder(activeFolderId);
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError.message || 'Nu am putut descărca folderul.');
    } finally {
      setIsDownloadingFolder(false);
    }
  };

  const refreshCurrentFolder = () => {
    const folderId = currentFolderId || activeFolderId;
    if (!folderId) return;
    resetPagination();
    loadContentFiles({ folderId, pageToken: null });
  };

  const handleUploadFile = async (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!fileList.length || !currentFolderId) return;

    setIsUploading(true);
    setUploadProgress({ done: 0, total: fileList.length });
    setError('');

    const errors = [];
    for (let i = 0; i < fileList.length; i += 1) {
      try {
        await driveApi.uploadFile(currentFolderId, fileList[i]);
      } catch (uploadError) {
        const detail = uploadError?.payload?.error;
        errors.push(detail ? `${fileList[i].name}: ${detail}` : `${fileList[i].name}: ${uploadError.message || 'eroare necunoscută'}`);
      }
      setUploadProgress({ done: i + 1, total: fileList.length });
    }

    setIsUploading(false);
    setUploadProgress({ done: 0, total: 0 });
    refreshCurrentFolder();

    if (errors.length) {
      setError(`Nu s-au putut încărca ${errors.length} fișier(e):\n${errors.join('\n')}`);
    }
  };

  const handleDeleteItem = (file) => {
    setDeleteConfirm(file);
  };

  const confirmDelete = async () => {
    const file = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(file.id);
    setError('');
    try {
      await driveApi.deleteItem(file.id);
      refreshCurrentFolder();
    } catch (deleteError) {
      const detail = deleteError?.payload?.error;
      setError(detail ? `${deleteError.message}: ${detail}` : (deleteError.message || 'Nu am putut șterge elementul.'));
    } finally {
      setDeletingId('');
    }
  };

  const handleCreateFolder = async () => {
    if (!currentFolderId) return;
    const name = window.prompt('Numele noului folder:');
    if (!name || !name.trim()) return;

    setError('');
    try {
      await driveApi.createFolder(currentFolderId, name.trim());
      refreshCurrentFolder();
    } catch (createError) {
      setError(createError.message || 'Nu am putut crea folderul.');
    }
  };

  return (
    <div className="has-navbar app-background">
      <AppNavbar active="drive" />
      <main className="dashboard-container">
        <section className="drive-card">
          <div className="drive-page">
            {!isDirectConsultationView && !isAdmin && !isGuest && !isProfessor ? (
              <p className="drive-faculty-chip">{facultyBadgeLabel}</p>
            ) : null}

            {(isAdmin || isGuest) && !isDirectConsultationView && adminFacultyFolders.length > 0 ? (
              <div className="drive-filter-group">
                <p className="drive-filter-label">Facultate</p>
                <select
                  className="calendar-filter-select"
                  value={selectedAdminFacultyFolder?.id || ''}
                  onChange={(event) => handleAdminFacultySelect(event.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Selectează facultatea</option>
                  {adminFacultyFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {isProfessor && !isDirectConsultationView && !selectedProfessorConsultation && !isLoading ? (
              professorConsultations.length === 0 ? (
                <p className="drive-empty">Nu ai consultații cu materiale Drive asociate.</p>
              ) : (
                <>
                  <p className="drive-filter-label" style={{ marginBottom: '0.6rem' }}>Consultațiile mele</p>
                  <div className="drive-files">
                  {professorConsultations.map((c) => {
                    const dateLabel = c.date ? c.date.split('-').reverse().join('.') : '';
                    const courseName = c.course?.name || 'Consultație';
                    return (
                      <article className="drive-file-row" key={c.id}>
                        <div className="drive-file-name">
                          <i className="fa-solid fa-folder" />
                          <span>{courseName}{dateLabel ? ` — ${dateLabel}` : ''}</span>
                        </div>
                        <div className="drive-meta">{c.time ? c.time.slice(0, 5) : ''}</div>
                        <div className="drive-file-actions">
                          <button
                            className="drive-btn"
                            type="button"
                            onClick={() => selectProfessorConsultation(c)}
                          >
                            Deschide
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                </>
              )
            ) : null}

            <input ref={fileInputRef} type="file" hidden multiple onChange={handleUploadFile} />

            {!isSelectionComplete && !isDirectConsultationView && !isProfessor ? (
              <p className="drive-empty">Selectează anul calendaristic, specializarea și anul de studiu pentru a vedea fișierele.</p>
            ) : null}

            {yearFolders.length > 0 && !isDirectConsultationView ? (
              <div className="drive-filter-group">
                <p className="drive-filter-label">An calendaristic</p>
                <div className="drive-filter-buttons">
                  {yearFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={`drive-btn ${selectedYearFolder?.id === folder.id ? 'drive-btn-active' : ''}`}
                      onClick={() => selectCalendarYear(folder)}
                      disabled={isLoading}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {specializationFolders.length > 0 && !isDirectConsultationView ? (
              <div className="drive-filter-group">
                <p className="drive-filter-label">Specializare</p>
                <div className="drive-filter-buttons">
                  {specializationFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={`drive-btn ${selectedSpecializationFolder?.id === folder.id ? 'drive-btn-active' : ''}`}
                      onClick={() => selectSpecialization(folder)}
                      disabled={isLoading}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {studyYearFolders.length > 0 && !isDirectConsultationView ? (
              <div className="drive-filter-group">
                <p className="drive-filter-label">An studiu</p>
                <div className="drive-filter-buttons">
                  {studyYearFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={`drive-btn ${selectedStudyYearFolder?.id === folder.id ? 'drive-btn-active' : ''}`}
                      onClick={() => selectStudyYear(folder)}
                      disabled={isLoading}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isSelectionComplete && !isDirectConsultationView ? (
              <div className="drive-toolbar">
                <input
                  className="drive-input"
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchTouched(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Caută consultație"
                  disabled={isLoading}
                />
                <div className="drive-toolbar-actions">
                  {canEditCurrentFolder ? (
                    <>
                      <button
                        className="drive-btn"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isUploading || !currentFolderId}
                      >
                        {isUploading
                          ? `Se încarcă${uploadProgress.total > 1 ? ` (${uploadProgress.done}/${uploadProgress.total})` : ''}...`
                          : 'Încarcă fișiere'}
                      </button>
                      {isAdmin ? (
                        <button
                          className="drive-btn"
                          type="button"
                          onClick={handleCreateFolder}
                          disabled={isLoading || !currentFolderId}
                        >
                          Folder nou
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  {isProfessor && contentFolderStack.length === 0 ? (
                    <button
                      className="drive-btn"
                      type="button"
                      onClick={backToProfessorConsultations}
                      disabled={isLoading}
                    >
                      Înapoi
                    </button>
                  ) : (
                    <button
                      className="drive-btn"
                      type="button"
                      onClick={goBackContentFolder}
                      disabled={isLoading || contentFolderStack.length === 0}
                    >
                      Înapoi
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {isProfessor && selectedProfessorConsultation && !isDirectConsultationView ? (
              <p className="drive-path">
                {selectedProfessorConsultation.course?.name || 'Consultație'}
                {selectedProfessorConsultation.date ? ` — ${selectedProfessorConsultation.date.split('-').reverse().join('.')}` : ''}
              </p>
            ) : null}

            {isSelectionComplete && isDirectConsultationView ? (
              <p className="drive-path" title={currentFolderName || ''}>
                {currentFolderName || 'Consultație'}
              </p>
            ) : null}

            {isSelectionComplete && contentFolderStack.length && !isDirectConsultationView ? (
              <p className="drive-path" title={contentFolderStack.map((entry) => entry.name).join(' / ')}>
                {contentFolderStack.map((entry) => entry.name).join(' / ')}
              </p>
            ) : null}

            {error ? <p className="drive-error">{error}</p> : null}
            {isLoading ? <p className="drive-loading">Se încarcă...</p> : null}

            {isSelectionComplete && !isLoading && !error && files.length === 0 ? (
              <p className="drive-empty">
                {isConsultationFolder
                  ? 'Nu au fost încărcate încă materialele acestei consultații'
                  : 'Nu există fișiere în acest folder.'}
              </p>
            ) : null}

            {isSelectionComplete ? (
              <div className="drive-files">
                {files.map((file) => (
                  <article className="drive-file-row" key={file.id}>
                    <div className="drive-file-name">
                      <i className={`fa-solid ${isFolder(file.mimeType) ? 'fa-folder' : 'fa-file'}`} />
                      <span title={file.name}>{file.name}</span>
                    </div>

                    <div className="drive-meta">
                      {isFolder(file.mimeType) ? '' : formatSize(file.size)}
                    </div>

                    <div className="drive-file-actions">
                      {isFolder(file.mimeType) ? (
                        <button className="drive-btn" type="button" onClick={() => openContentFolder(file)} disabled={isLoading}>
                          Deschide
                        </button>
                      ) : (
                        <a
                          className="drive-link"
                          href={file.webViewLink || file.webContentLink || '#'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => {
                            if (!file.webViewLink && !file.webContentLink) event.preventDefault();
                          }}
                        >
                          Vezi
                        </a>
                      )}
                      {canEditCurrentFolder ? (
                        <button
                          className="drive-btn drive-btn-danger"
                          type="button"
                          onClick={() => handleDeleteItem(file)}
                          disabled={isLoading || deletingId === file.id}
                        >
                          {deletingId === file.id ? '...' : 'Șterge'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {isSelectionComplete && isConsultationFolder ? (
              <div className="drive-download-row">
                <button
                  className="drive-btn"
                  type="button"
                  onClick={handleDownloadFolder}
                  disabled={!activeFolderId || isLoading || isDownloadingFolder}
                >
                  {isDownloadingFolder ? 'Se descarcă...' : 'Descarcă folder'}
                </button>
              </div>
            ) : null}

            {isSelectionComplete && !isDirectConsultationView ? (
              <div className="pagination" aria-label="Paginare fisiere drive">
                <button
                  className="button-pagination"
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={isLoading || activePageIndex === 0}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {getVisiblePaginationItems(pageTokens.length, activePageIndex + 1).map((item) => {
                  if (typeof item === 'string') {
                    return <span key={item} className="pagination-ellipsis">...</span>;
                  }

                  const page = item;
                  return (
                    <button
                      key={page}
                      className={`button-pagination ${activePageIndex + 1 === page ? 'active' : ''}`}
                      type="button"
                      onClick={() => goToPage(page)}
                      disabled={isLoading}
                    >
                      {page}
                    </button>
                  );
                })}

                <span className="pagination-total">din {totalPages}</span>

                <button
                  className="button-pagination"
                  type="button"
                  onClick={goToNextPage}
                  disabled={isLoading || !nextPageToken}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <AppFooter />
      <AppBottomNav active="drive" />

      <div
        className="modal-overlay"
        hidden={!deleteConfirm}
        onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
      >
        <div className="modal-card">
          <div className="modal-header">
            <h3>Șterge fișier</h3>
            <button className="modal-close" type="button" onClick={() => setDeleteConfirm(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="modal-hint">
            Ștergi <strong>"{deleteConfirm?.name}"</strong>? Această acțiune este ireversibilă.
          </p>
          <div className="modal-actions">
            <button className="button-cancel" type="button" onClick={() => setDeleteConfirm(null)}>
              Anulează
            </button>
            <button className="button-delete" type="button" onClick={confirmDelete}>
              Șterge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Drive;
