import { useCallback, useEffect, useMemo, useState } from 'react';
import adminService from '../services/adminService';
import { REGION_LIST } from '../constants/regions';

const STATUS_FILTERS = ['Pending', 'Approved', 'Rejected'];
const STATUS_FROM_ENUM = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected'
};

const toStatusString = (value) => {
  if (typeof value === 'number') {
    return STATUS_FROM_ENUM[value] ?? 'Pending';
  }
  return value || 'Pending';
};

const normalizeSummary = (payload) => ({
  PendingApplications: payload?.PendingApplications ?? payload?.pendingApplications ?? 0,
  ApprovedApplications: payload?.ApprovedApplications ?? payload?.approvedApplications ?? 0,
  RejectedApplications: payload?.RejectedApplications ?? payload?.rejectedApplications ?? 0,
  PendingSuggestions: payload?.PendingSuggestions ?? payload?.pendingSuggestions ?? 0,
  ApprovedSuggestions: payload?.ApprovedSuggestions ?? payload?.approvedSuggestions ?? 0,
  RejectedSuggestions: payload?.RejectedSuggestions ?? payload?.rejectedSuggestions ?? 0,
  ApprovedThisWeek: payload?.ApprovedThisWeek ?? payload?.approvedThisWeek ?? 0,
});

const ATTRACTION_TYPES = [
  { value: 1, label: 'Naturală' },
  { value: 2, label: 'Culturală' },
  { value: 3, label: 'Istorică' },
  { value: 4, label: 'Distracție' },
  { value: 5, label: 'Religioasă' }
];

const DIFFICULTY_OPTIONS = [
  { value: 1, label: 'Ușor' },
  { value: 2, label: 'Mediu' },
  { value: 3, label: 'Dificil' }
];

const createBlankAnswer = (isCorrect = false) => ({
  text: '',
  isCorrect
});

const createBlankQuestion = () => ({
  text: '',
  pointsValue: 10,
  answers: [createBlankAnswer(true), createBlankAnswer(false)]
});

const createQuizInitialState = (attractionId = '') => ({
  attractionId,
  title: '',
  description: '',
  difficultyLevel: 1,
  timeLimit: 120,
  questions: [createBlankQuestion()]
});

const createAttractionInitialState = () => ({
  name: '',
  description: '',
  region: '',
  imageUrl: '',
  type: ATTRACTION_TYPES[0].value,
  latitude: '',
  longitude: '',
  rating: 5
});

const Card = ({ title, value, accent }) => (
  <div style={{
    borderRadius: 18,
    padding: 20,
    border: '1px solid var(--border)',
    background: 'var(--card-bg)'
  }}>
    <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{title}</p>
    <p style={{ margin: '6px 0 0 0', fontSize: 28, fontWeight: 700, color: accent }}>{value}</p>
  </div>
);

function AdminPanel() {
  const [summary, setSummary] = useState(null);
  const [applicationFilter, setApplicationFilter] = useState('Pending');
  const [applications, setApplications] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState('Pending');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [attractionsLoading, setAttractionsLoading] = useState(false);
  const [editingAttractionId, setEditingAttractionId] = useState(null);
  const [attractionForm, setAttractionForm] = useState(createAttractionInitialState());
  const [attractionSaving, setAttractionSaving] = useState(false);
  const [managedAttractionId, setManagedAttractionId] = useState('');
  const [managedQuizzes, setManagedQuizzes] = useState([]);
  const [managedQuizzesLoading, setManagedQuizzesLoading] = useState(false);
  const [adminQuizForm, setAdminQuizForm] = useState(createQuizInitialState());
  const [adminQuizSaving, setAdminQuizSaving] = useState(false);
  const [adminEditingQuizId, setAdminEditingQuizId] = useState(null);
  const [adminQuizFormLoading, setAdminQuizFormLoading] = useState(false);

  const refreshSummary = useCallback(() => {
    adminService
      .getDashboard()
      .then((data) => setSummary(normalizeSummary(data)))
      .catch(() => setSummary(null));
  }, []);

  const normalizeCollection = (items = []) =>
    items.map((item) => ({
      ...item,
      status: toStatusString(item?.status)
    }));

  const refreshApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const data = await adminService.getApplications();
      setApplications(normalizeCollection(data));
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca aplicațiile.');
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  const refreshSuggestions = useCallback(async (filter) => {
    setLoadingSuggestions(true);
    try {
      const data = await adminService.getSuggestions(filter);
      setSuggestions(normalizeCollection(data));
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca sugestiile.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  useEffect(() => {
    refreshSuggestions(suggestionFilter);
  }, [refreshSuggestions, suggestionFilter]);

  const loadAttractions = useCallback(async () => {
    setAttractionsLoading(true);
    try {
      const data = await adminService.getAttractions();
      const list = Array.isArray(data) ? data : [];
      setAttractions(list);
      if (list.length > 0) {
        const firstId = String(list[0].id);
        setManagedAttractionId((prev) => prev || firstId);
        setAdminQuizForm((prev) => ({ ...prev, attractionId: prev.attractionId || firstId }));
      } else {
        setManagedAttractionId('');
        setAdminQuizForm(createQuizInitialState());
      }
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca atracțiile.');
    } finally {
      setAttractionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

  const refreshManagedQuizzes = useCallback(async (attractionId) => {
    if (!attractionId) {
      setManagedQuizzes([]);
      setManagedQuizzesLoading(false);
      return;
    }
    setManagedQuizzesLoading(true);
    try {
      const data = await adminService.getQuizzesForAttraction(attractionId);
      setManagedQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca quiz-urile pentru această atracție.');
    } finally {
      setManagedQuizzesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!managedAttractionId) return;
    refreshManagedQuizzes(managedAttractionId);
  }, [managedAttractionId, refreshManagedQuizzes]);

  useEffect(() => {
    if (!managedAttractionId) return;
    setAdminQuizForm((prev) => ({ ...prev, attractionId: managedAttractionId }));
  }, [managedAttractionId]);

  const handleDecision = async (type, id, action) => {
    const notes = window.prompt('Note pentru utilizator (opțional)', '') || '';
    try {
      if (type === 'application') {
        await adminService.decideApplication(id, action, notes);
        await refreshApplications();
      } else {
        await adminService.decideSuggestion(id, action, notes);
        await refreshSuggestions(suggestionFilter);
      }
      refreshSummary();
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Acțiunea nu a putut fi finalizată.');
    }
  };

  const handleAttractionFieldChange = (field, value) => {
    setAttractionForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAttractionForm = () => {
    setEditingAttractionId(null);
    setAttractionForm(createAttractionInitialState());
  };

  const handleEditAttraction = (attraction) => {
    if (!attraction) return;
    setEditingAttractionId(attraction.id);
    setAttractionForm({
      name: attraction.name || '',
      description: attraction.description || '',
      region: attraction.region || '',
      imageUrl: attraction.imageUrl || '',
      type: Number(attraction.type ?? attraction.typeId ?? ATTRACTION_TYPES[0].value),
      latitude: attraction.latitude != null ? String(attraction.latitude) : '',
      longitude: attraction.longitude != null ? String(attraction.longitude) : '',
      rating: attraction.rating != null ? Number(attraction.rating) : 5
    });
  };

  const handleAttractionSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: attractionForm.name.trim(),
      description: attractionForm.description,
      region: attractionForm.region,
      imageUrl: attractionForm.imageUrl,
      type: Number(attractionForm.type),
      latitude: Number(attractionForm.latitude),
      longitude: Number(attractionForm.longitude),
      rating: Number(attractionForm.rating)
    };

    if (!payload.name || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      setError('Completează toate câmpurile și poziția geografică.');
      return;
    }

    setAttractionSaving(true);
    try {
      if (editingAttractionId) {
        await adminService.updateAttraction(editingAttractionId, payload);
      } else {
        await adminService.createAttraction(payload);
      }
      setError(null);
      resetAttractionForm();
      await loadAttractions();
    } catch (err) {
      console.error(err);
      setError('Nu am putut salva atracția.');
    } finally {
      setAttractionSaving(false);
    }
  };

  const handleDeleteAttraction = async (id) => {
    if (!window.confirm('Ștergi această atracție din catalog?')) return;
    try {
      await adminService.deleteAttraction(id);
      setError(null);
      if (editingAttractionId === id) {
        resetAttractionForm();
      }
      await loadAttractions();
    } catch (err) {
      console.error(err);
      setError('Nu am putut șterge atracția.');
    }
  };

  const handleSelectManagedAttraction = (value) => {
    setManagedAttractionId(value);
    setAdminQuizForm((prev) => ({ ...prev, attractionId: value }));
    if (adminEditingQuizId && value !== adminQuizForm.attractionId) {
      setAdminEditingQuizId(null);
    }
  };

  const handleAdminQuizFieldChange = (field, value) => {
    setAdminQuizForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdminQuestionChange = (questionIndex, field, value) => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) =>
        idx === questionIndex ? { ...question, [field]: value } : question
      )
    }));
  };

  const handleAdminAnswerChange = (questionIndex, answerIndex, field, value) => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, aIdx) =>
            aIdx === answerIndex ? { ...answer, [field]: value } : answer
          )
        };
      })
    }));
  };

  const handleAdminMarkAnswerCorrect = (questionIndex, answerIndex) => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, aIdx) => ({
            ...answer,
            isCorrect: aIdx === answerIndex
          }))
        };
      })
    }));
  };

  const handleAdminAddQuestion = () => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createBlankQuestion()]
    }));
  };

  const handleAdminRemoveQuestion = (index) => {
    setAdminQuizForm((prev) => {
      if (prev.questions.length === 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, idx) => idx !== index)
      };
    });
  };

  const handleAdminAddAnswer = (questionIndex) => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        if (question.answers.length >= 6) return question;
        return {
          ...question,
          answers: [...question.answers, createBlankAnswer(false)]
        };
      })
    }));
  };

  const handleAdminRemoveAnswer = (questionIndex, answerIndex) => {
    setAdminQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        if (question.answers.length <= 2) return question;
        return {
          ...question,
          answers: question.answers.filter((_, aIdx) => aIdx !== answerIndex)
        };
      })
    }));
  };

  const resetAdminQuizForm = (attractionId) => {
    setAdminEditingQuizId(null);
    setAdminQuizForm(createQuizInitialState(attractionId || managedAttractionId));
  };

  const handleAdminQuizSubmit = async (event) => {
    event.preventDefault();
    if (!adminQuizForm.attractionId) {
      setError('Selectează o atracție înainte de a crea un quiz.');
      return;
    }

    const hasInvalidQuestion = adminQuizForm.questions.some(
      (question) => !question.answers.some((answer) => answer.isCorrect)
    );
    if (hasInvalidQuestion) {
      setError('Fiecare întrebare trebuie să aibă un răspuns corect.');
      return;
    }

    const payload = {
      attractionId: Number(adminQuizForm.attractionId),
      title: adminQuizForm.title,
      description: adminQuizForm.description,
      difficultyLevel: Number(adminQuizForm.difficultyLevel),
      timeLimit: Number(adminQuizForm.timeLimit),
      questions: adminQuizForm.questions.map((question, qIdx) => ({
        text: question.text,
        pointsValue: Number(question.pointsValue),
        order: qIdx + 1,
        answers: question.answers.map((answer, aIdx) => ({
          text: answer.text,
          isCorrect: answer.isCorrect,
          order: aIdx + 1
        }))
      }))
    };

    setAdminQuizSaving(true);
    try {
      if (adminEditingQuizId) {
        await adminService.updateQuiz(adminEditingQuizId, payload);
      } else {
        await adminService.createQuiz(payload);
      }
      setError(null);
      resetAdminQuizForm(adminQuizForm.attractionId);
      await refreshManagedQuizzes(adminQuizForm.attractionId);
    } catch (err) {
      console.error(err);
      setError('Nu am putut salva quiz-ul.');
    } finally {
      setAdminQuizSaving(false);
    }
  };

  const handleAdminDeleteQuiz = async (quizId) => {
    if (!window.confirm('Ștergi acest quiz?')) return;
    try {
      await adminService.deleteQuiz(quizId);
      setError(null);
      if (adminEditingQuizId === quizId) {
        resetAdminQuizForm();
      }
      await refreshManagedQuizzes(managedAttractionId);
    } catch (err) {
      console.error(err);
      setError('Nu am putut șterge quiz-ul.');
    }
  };

  const handleAdminEditQuiz = async (quizId) => {
    setAdminQuizFormLoading(true);
    try {
      const quizDetails = await adminService.getQuizDetails(quizId);
      if (!quizDetails) {
        setError('Nu am găsit detalii pentru acest quiz.');
        return;
      }

      const ensureAnswers = (answersList) => {
        let normalized = (answersList || [])
          .slice()
          .sort((a, b) => (a?.order || 0) - (b?.order || 0))
          .map((answer) => ({
            text: answer?.text || '',
            isCorrect: Boolean(answer?.isCorrect)
          }));
        while (normalized.length < 2) {
          normalized = [...normalized, createBlankAnswer(false)];
        }
        if (!normalized.some((answer) => answer.isCorrect)) {
          normalized = normalized.map((answer, idx) => ({ ...answer, isCorrect: idx === 0 }));
        }
        return normalized;
      };

      const questions = (quizDetails.questions || [])
        .slice()
        .sort((a, b) => (a?.order || 0) - (b?.order || 0))
        .map((question) => ({
          text: question?.text || '',
          pointsValue: question?.pointsValue || 10,
          answers: ensureAnswers(question?.answers)
        }));

      const formQuestions = questions.length > 0 ? questions : [createBlankQuestion()];
      const attractionId = String(quizDetails.attractionId);

      setAdminEditingQuizId(quizId);
      setManagedAttractionId(attractionId);
      setAdminQuizForm({
        attractionId,
        title: quizDetails.title || '',
        description: quizDetails.description || '',
        difficultyLevel: Number(quizDetails.difficultyLevel) || 1,
        timeLimit: Number(quizDetails.timeLimit) || 120,
        questions: formQuestions
      });
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca quiz-ul selectat.');
    } finally {
      setAdminQuizFormLoading(false);
    }
  };

  const handleAdminCancelQuizEdit = () => {
    resetAdminQuizForm();
  };

  const visibleApplications = useMemo(() => {
    if (!applicationFilter) return applications;
    return applications.filter((app) => app.status === applicationFilter);
  }, [applications, applicationFilter]);

  const managedAttraction = useMemo(() => (
    attractions.find((item) => String(item.id) === String(managedAttractionId))
  ), [attractions, managedAttractionId]);

  return (
    <div style={{ padding: '32px 48px', fontFamily: 'RoviaUI, Inter, system-ui' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Panou administrativ</p>
        <h1 style={{ fontSize: 34, margin: 0, color: 'var(--text)' }}>Control Center</h1>
        <p style={{ maxWidth: 640, color: 'var(--muted)', marginTop: 12 }}>
          Monitorizează aplicațiile promotorilor, aprobă sau respinge propuneri și sincronizează oferta turistică a platformei.
        </p>
      </header>

      {error && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #fecaca',
          background: 'rgba(248,113,113,0.12)',
          color: '#b91c1c'
        }}>
          {error}
        </div>
      )}

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 36
      }}>
        <Card title="Aplicații în așteptare" value={summary?.PendingApplications ?? 0} accent="#facc15" />
        <Card title="Aplicații aprobate" value={summary?.ApprovedApplications ?? 0} accent="#22c55e" />
        <Card title="Aplicații respinse" value={summary?.RejectedApplications ?? 0} accent="#ef4444" />
        <Card title="Sugestii în așteptare" value={summary?.PendingSuggestions ?? 0} accent="#fb7185" />
        <Card title="Aprobate săptămâna aceasta" value={summary?.ApprovedThisWeek ?? 0} accent="#0ea5e9" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
        <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Aplicații Promotori</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setApplicationFilter(status)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: applicationFilter === status ? 'var(--accent)' : 'transparent',
                    color: applicationFilter === status ? '#fff' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {loadingApplications && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
            {!loadingApplications && visibleApplications.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nu există aplicații pentru filtrul curent.</p>
            )}
            {!loadingApplications && visibleApplications.map((app) => (
              <div key={app.id} style={{
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 16,
                marginBottom: 12,
                background: 'var(--topbar-bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{app.companyName}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{app.contactEmail}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(app.submittedAt).toLocaleDateString('ro-RO')}</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{app.motivation}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDecision('application', app.id, 'approve')}
                    disabled={app.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: app.status === 'Pending' ? '#22c55e' : '#9ca3af',
                      color: '#fff',
                      cursor: app.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Aprobă
                  </button>
                  <button
                    onClick={() => handleDecision('application', app.id, 'reject')}
                    disabled={app.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: app.status === 'Pending' ? '#ef4444' : '#9ca3af',
                      color: '#fff',
                      cursor: app.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Sugestii atracții</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setSuggestionFilter(status)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: suggestionFilter === status ? 'var(--accent)' : 'transparent',
                    color: suggestionFilter === status ? '#fff' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {loadingSuggestions && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
            {!loadingSuggestions && suggestions.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nu există sugestii pentru filtrul curent.</p>
            )}
            {!loadingSuggestions && suggestions.map((suggestion) => (
              <div key={suggestion.id} style={{
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 16,
                marginBottom: 12,
                background: 'var(--topbar-bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{suggestion.title}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Propus de {suggestion.promoterName || 'anonim'}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(suggestion.submittedAt).toLocaleDateString('ro-RO')}</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{suggestion.details}</p>
                {suggestion.createsNewAttraction ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Atracție nouă: {suggestion.proposedName}</p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Actualizare pentru ID #{suggestion.attractionId}</p>
                )}
                {suggestion.adminResponse && (
                  <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Notă precedentă: {suggestion.adminResponse}</p>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDecision('suggestion', suggestion.id, 'approve')}
                    disabled={suggestion.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: suggestion.status === 'Pending' ? '#2563eb' : '#9ca3af',
                      color: '#fff',
                      cursor: suggestion.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Aprobare rapidă
                  </button>
                  <button
                    onClick={() => handleDecision('suggestion', suggestion.id, 'reject')}
                    disabled={suggestion.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: suggestion.status === 'Pending' ? '#ef4444' : '#9ca3af',
                      color: '#fff',
                      cursor: suggestion.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 3, fontSize: 12, color: 'var(--muted)' }}>Catalog & Experiențe</p>
            <h2 style={{ margin: '6px 0 0 0', fontSize: 28 }}>Gestionează atracțiile și quiz-urile oficiale</h2>
            <p style={{ maxWidth: 620, color: 'var(--muted)', marginTop: 10 }}>
              Actualizează rapid inventarul RoVia și lansează provocări interactive pentru fiecare locație. Orice schimbare devine activă imediat pentru utilizatori.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) minmax(360px, 1fr)', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0 }}>Atracții aprobate</h3>
              <button
                type="button"
                onClick={loadAttractions}
                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
              >
                Reîncarcă
              </button>
            </div>
            <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>Total: {attractions.length}</p>

            {attractionsLoading && <p style={{ color: 'var(--muted)' }}>Se încarcă lista atracțiilor...</p>}
            {!attractionsLoading && attractions.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nu există încă atracții în baza curentă.</p>
            )}

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 6 }}>
              {attractions.map((attr) => {
                const typeLabel = ATTRACTION_TYPES.find((option) => Number(option.value) === Number(attr.type ?? attr.typeId))?.label || '—';
                return (
                  <div key={attr.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 14, background: 'var(--topbar-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{attr.name}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>{attr.region || 'Fără regiune'} · {typeLabel}</p>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>#{attr.id}</span>
                    </div>
                    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>{attr.description?.slice(0, 120) || 'Fără descriere'}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleEditAttraction(attr)}
                        style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '8px 0', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttraction(attr.id)}
                        style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px 0', background: 'rgba(239,68,68,0.15)', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{editingAttractionId ? 'Editează atracția' : 'Adaugă atracție nouă'}</h3>
                <p style={{ margin: '6px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
                  Completează coordonatele și tipologia pentru a publica instant în catalog.
                </p>
              </div>
              {editingAttractionId && (
                <button
                  type="button"
                  onClick={resetAttractionForm}
                  style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Renunță la editare
                </button>
              )}
            </div>

            <form onSubmit={handleAttractionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Nume</label>
                  <input
                    type="text"
                    value={attractionForm.name}
                    onChange={(e) => handleAttractionFieldChange('name', e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Regiune</label>
                  <select
                    value={attractionForm.region}
                    onChange={(e) => handleAttractionFieldChange('region', e.target.value)}
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  >
                    <option value="">Selectează regiunea</option>
                    {REGION_LIST.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Imagine (URL)</label>
                <input
                  type="text"
                  value={attractionForm.imageUrl}
                  onChange={(e) => handleAttractionFieldChange('imageUrl', e.target.value)}
                  style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Descriere</label>
                <textarea
                  rows={3}
                  value={attractionForm.description}
                  onChange={(e) => handleAttractionFieldChange('description', e.target.value)}
                  style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Tip</label>
                  <select
                    value={attractionForm.type}
                    onChange={(e) => handleAttractionFieldChange('type', Number(e.target.value))}
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  >
                    {ATTRACTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Rating</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={attractionForm.rating}
                    onChange={(e) => handleAttractionFieldChange('rating', Number(e.target.value))}
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Latitudine</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={attractionForm.latitude}
                    onChange={(e) => handleAttractionFieldChange('latitude', e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Longitudine</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={attractionForm.longitude}
                    onChange={(e) => handleAttractionFieldChange('longitude', e.target.value)}
                    required
                    style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={attractionSaving}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: attractionSaving ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff'
                }}
              >
                {attractionSaving ? 'Se salvează...' : editingAttractionId ? 'Actualizează atracția' : 'Publică atracția'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ marginTop: 40, borderRadius: 28, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)', boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 3, fontSize: 12 }}>Quiz Builder (Admin)</p>
              <h3 style={{ margin: '6px 0 0 0', fontSize: 24 }}>Experiențe oficiale pentru fiecare atracție</h3>
              <p style={{ marginTop: 8, color: 'var(--muted)', maxWidth: 540 }}>Selectează o atracție, revizuiește quiz-urile existente și publică variante noi cu niveluri de dificultate diferite.</p>
            </div>
            <div style={{ minWidth: 260 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Atracție selectată</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <select
                  value={managedAttractionId}
                  onChange={(e) => handleSelectManagedAttraction(e.target.value)}
                  disabled={attractionsLoading || attractions.length === 0}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                >
                  {attractions.length === 0 && <option value="">Nu există atracții</option>}
                  {attractions.map((attr) => (
                    <option key={attr.id} value={attr.id}>{attr.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadAttractions}
                  style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', background: 'var(--topbar-bg)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reîncarcare
                </button>
              </div>
              {managedAttraction && (
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
                  {managedAttraction.region || 'Fără regiune'} · {managedAttraction.typeName || '—'}
                </p>
              )}
            </div>
          </div>

          {attractions.length === 0 ? (
            <div style={{ marginTop: 20, padding: 24, borderRadius: 20, border: '1px dashed var(--border)', background: 'rgba(15,118,110,0.06)' }}>
              <p style={{ margin: 0, color: 'var(--text)' }}>Adaugă cel puțin o atracție pentru a construi quiz-uri.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(320px, 1fr)', gap: 28, marginTop: 28 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 22, padding: 20, background: 'var(--topbar-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Quiz-uri publicate</p>
                    <h4 style={{ margin: '4px 0 0 0' }}>{managedQuizzes.length}</h4>
                  </div>
                  {managedQuizzesLoading && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Actualizăm...</span>}
                </div>

                {managedQuizzesLoading && managedQuizzes.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>
                )}

                {!managedQuizzesLoading && managedQuizzes.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>Nu există încă quiz-uri pentru această atracție.</p>
                )}

                {!managedQuizzesLoading && managedQuizzes.map((quiz) => {
                  const questionTotal = quiz.questions?.length ?? quiz.questionCount ?? 0;
                  const difficultyLabel = DIFFICULTY_OPTIONS.find((opt) => Number(opt.value) === Number(quiz.difficultyLevel))?.label || '—';
                  return (
                    <div key={quiz.id} style={{ borderRadius: 18, border: '1px solid var(--border)', padding: 14, marginTop: 12, background: 'var(--card-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <h5 style={{ margin: 0 }}>{quiz.title}</h5>
                          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>{quiz.description || 'Fără descriere'}</p>
                        </div>
                        <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontWeight: 600 }}>{difficultyLabel}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                        <span>{questionTotal} întrebări</span>
                        <span>•</span>
                        <span>{quiz.timeLimit || 0} sec</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleAdminEditQuiz(quiz.id)}
                          style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '8px 0', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Editează
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteQuiz(quiz.id)}
                          style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px 0', background: 'rgba(239,68,68,0.15)', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderRadius: 24, border: '1px solid var(--border)', padding: 24, background: 'var(--topbar-bg)', position: 'relative' }}>
                {adminQuizFormLoading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 24, backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                    Se încarcă detaliile quiz-ului...
                  </div>
                )}
                <form onSubmit={handleAdminQuizSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{adminEditingQuizId ? 'Editează quiz-ul' : 'Publică un quiz nou'}</h4>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      Minim două întrebări, fiecare cu un răspuns corect.
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Titlu</label>
                    <input
                      type="text"
                      value={adminQuizForm.title}
                      onChange={(e) => handleAdminQuizFieldChange('title', e.target.value)}
                      required
                      style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Descriere</label>
                    <textarea
                      value={adminQuizForm.description}
                      onChange={(e) => handleAdminQuizFieldChange('description', e.target.value)}
                      rows={2}
                      style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Dificultate</label>
                      <select
                        value={adminQuizForm.difficultyLevel}
                        onChange={(e) => handleAdminQuizFieldChange('difficultyLevel', Number(e.target.value))}
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                      >
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Limită timp (secunde)</label>
                      <input
                        type="number"
                        min={30}
                        max={600}
                        value={adminQuizForm.timeLimit}
                        onChange={(e) => handleAdminQuizFieldChange('timeLimit', Number(e.target.value))}
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>

                  {adminQuizForm.questions.map((question, qIdx) => (
                    <div key={`admin-question-${qIdx}`} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--card-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <h5 style={{ margin: 0 }}>Întrebarea #{qIdx + 1}</h5>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="number"
                            min={5}
                            max={50}
                            value={question.pointsValue}
                            onChange={(e) => handleAdminQuestionChange(qIdx, 'pointsValue', Number(e.target.value))}
                            style={{ width: 72, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAdminRemoveQuestion(qIdx)}
                            disabled={adminQuizForm.questions.length === 1}
                            style={{ border: 'none', background: 'rgba(248,113,113,0.12)', color: '#b91c1c', borderRadius: 10, padding: '6px 10px', fontWeight: 600, cursor: adminQuizForm.questions.length === 1 ? 'not-allowed' : 'pointer' }}
                          >
                            Elimină
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={question.text}
                        onChange={(e) => handleAdminQuestionChange(qIdx, 'text', e.target.value)}
                        rows={2}
                        style={{ width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                        placeholder="Introduce întrebarea aici"
                      />

                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {question.answers.map((answer, aIdx) => (
                          <div key={`admin-answer-${qIdx}-${aIdx}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) => handleAdminAnswerChange(qIdx, aIdx, 'text', e.target.value)}
                              placeholder={`Răspuns #${aIdx + 1}`}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAdminMarkAnswerCorrect(qIdx, aIdx)}
                              style={{
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: 999,
                                background: answer.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.3)',
                                color: answer.isCorrect ? '#15803d' : '#475569',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {answer.isCorrect ? 'Corectă' : 'Marchează'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminRemoveAnswer(qIdx, aIdx)}
                              disabled={question.answers.length <= 2}
                              style={{
                                border: 'none',
                                padding: '8px 10px',
                                borderRadius: 10,
                                background: 'transparent',
                                color: question.answers.length <= 2 ? '#94a3b8' : '#b91c1c',
                                fontWeight: 600,
                                cursor: question.answers.length <= 2 ? 'not-allowed' : 'pointer'
                              }}
                            >
                              −
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAdminAddAnswer(qIdx)}
                          style={{ alignSelf: 'flex-start', border: '1px dashed var(--border)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
                        >
                          + Răspuns
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAdminAddQuestion}
                    style={{ border: '1px dashed var(--border)', borderRadius: 16, padding: '10px 14px', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Adaugă o întrebare
                  </button>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {adminEditingQuizId && (
                      <button
                        type="button"
                        onClick={handleAdminCancelQuizEdit}
                        style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '10px 18px', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Renunță la editare
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={adminQuizSaving || adminQuizFormLoading}
                      style={{
                        border: 'none',
                        borderRadius: 14,
                        padding: '12px 18px',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: adminQuizSaving ? 'wait' : 'pointer',
                        background: 'linear-gradient(135deg, #16a34a, #22d3ee)',
                        color: '#fff',
                        minWidth: 200
                      }}
                    >
                      {adminQuizSaving ? 'Se salvează...' : adminEditingQuizId ? 'Actualizează quiz-ul' : 'Publică quiz-ul'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
