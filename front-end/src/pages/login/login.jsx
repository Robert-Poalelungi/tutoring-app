import React from 'react';
import { authApi } from '../../api';
import '../../css/reset.css';
import '../../css/components/back-button.css';
import '../../css/components/forms.css';
import '../../css/components/chips.css';
import '../../css/components/modal.css';
import './login.css';

function Login() {
  const handleLogin = () => {
    window.location.assign(authApi.googleLoginUrl());
  };

  return (
    <div className="login-body app-background">
      <a
        href="/"
        className="back-button"
        aria-label="Inapoi la pagina principala"
      >
        <span className="back-content">
          <i className="fa-solid fa-arrow-left" />
          <span>Inapoi</span>
        </span>
      </a>
      {/* Login Screen */}
      <div className="login-screen" id="login-screen">
        <div className="login-card">
          <h1 className="login-title">Tutoring App</h1>
          <p className="login-subtitle">
            Platformă de tutoring pentru studenții ASE
          </p>
          <button className="button-google" id="button-google" type="button" onClick={handleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24" width={20} height={20}>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continuă cu Google</span>
          </button>
        </div>
      </div>
      {/* Onboarding */}
      <div className="onboarding-container" id="onboarding-container" hidden>
        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="progress-step active" data-step={1}>
            <div className="progress-circle">1</div>
            <span className="progress-label">Facultate</span>
          </div>
          <div className="progress-line" id="progress-line-1" />
          <div className="progress-step" data-step={2}>
            <div className="progress-circle">2</div>
            <span className="progress-label">Date personale</span>
          </div>
          <div className="progress-line" id="progress-line-2" />
          <div className="progress-step" data-step={3}>
            <div className="progress-circle">3</div>
            <span className="progress-label">Discipline</span>
          </div>
        </div>
        {/* Step 1: Facultate */}
        <div className="onboarding-step" id="step-1">
          <h2 className="onboarding-step-title">Alege facultatea ta</h2>
          <p className="onboarding-step-subtitle">
            Selectează facultatea la care ești înscris
          </p>
          <div className="faculty-grid" id="onboarding-faculty-grid" />
          <div className="onboarding-actions">
            <button className="button-confirm" id="button-step1-next" disabled>
              Continuă
            </button>
          </div>
        </div>
        {/* Step 2: Date Personale */}
        <div className="onboarding-step" id="step-2" hidden>
          <h2 className="onboarding-step-title">Completează datele tale</h2>
          <p className="onboarding-step-subtitle">
            Informațiile pot fi modificate ulterior din profil
          </p>
          <div className="onboarding-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="onb-nume">Nume</label>
                <input type="text" id="onb-nume" placeholder="ex: Popescu" />
              </div>
              <div className="form-group">
                <label htmlFor="onb-prenume">Prenume</label>
                <input type="text" id="onb-prenume" placeholder="ex: Alexandru" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="onb-email">Email universitar</label>
              <input
                type="email"
                id="onb-email"
                placeholder="ex: alexandru.popescu@stud.ase.ro"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="onb-an">An universitar</label>
                <select id="onb-an" defaultValue="">
                  <option value="" disabled>
                    Selectează anul
                  </option>
                  <option value={1}>Anul 1</option>
                  <option value={2}>Anul 2</option>
                  <option value={3}>Anul 3</option>
                  <option value={4}>Anul 4 (Master 1)</option>
                  <option value={5}>Anul 5 (Master 2)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="onb-specializare">Specializare</label>
                <input
                  type="text"
                  id="onb-specializare"
                  placeholder="ex: Informatică Economică"
                />
              </div>
            </div>
          </div>
          <div className="onboarding-actions onboarding-actions-split">
            <button className="button-cancel" id="button-step2-back">
              <i className="fa-solid fa-arrow-left" /> Înapoi
            </button>
            <button className="button-confirm" id="button-step2-next" disabled>
              Continuă
            </button>
          </div>
        </div>
        {/* Step 3: Discipline Suplimentare */}
        <div className="onboarding-step" id="step-3" hidden>
          <h2 className="onboarding-step-title">Adaugă discipline suplimentare</h2>
          <p className="onboarding-step-subtitle">
            Opțional — discipline la care dorești consultații (restanțe,
            reexaminări)
          </p>
          <div className="disciplines-grid" id="onboarding-disciplines-grid" />
          <div className="onboarding-actions onboarding-actions-split">
            <button className="button-cancel" id="button-step3-back">
              <i className="fa-solid fa-arrow-left" /> Înapoi
            </button>
            <button className="button-confirm" id="button-step3-finish">
              Finalizează
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
