import React, { useEffect, useRef, useState } from 'react';

function GlobalApiFeedback() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const hideErrorTimerRef = useRef(null);

  useEffect(() => {
    const onRequestStart = () => {
      setActiveRequests((current) => current + 1);
    };

    const onRequestEnd = () => {
      setActiveRequests((current) => (current > 0 ? current - 1 : 0));
    };

    const onRequestError = (event) => {
      const message = event.detail?.message || 'A apărut o eroare de rețea.';
      setErrorMessage(message);
      if (hideErrorTimerRef.current) {
        window.clearTimeout(hideErrorTimerRef.current);
      }
      hideErrorTimerRef.current = window.setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    };

    window.addEventListener('api:request-start', onRequestStart);
    window.addEventListener('api:request-end', onRequestEnd);
    window.addEventListener('api:request-error', onRequestError);

    return () => {
      window.removeEventListener('api:request-start', onRequestStart);
      window.removeEventListener('api:request-end', onRequestEnd);
      window.removeEventListener('api:request-error', onRequestError);
      if (hideErrorTimerRef.current) {
        window.clearTimeout(hideErrorTimerRef.current);
      }
    };
  }, []);

  const showLoading = activeRequests > 0;

  return (
    <>
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: showLoading ? '0' : '-4px',
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #ff9f2f, #1d174b)',
          opacity: showLoading ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 2000,
        }}
      />
      {errorMessage ? (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            maxWidth: '22rem',
            background: '#b42318',
            color: '#fff',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            zIndex: 2100,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </>
  );
}

export default GlobalApiFeedback;
