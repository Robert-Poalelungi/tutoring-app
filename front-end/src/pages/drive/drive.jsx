import React from 'react';
import AppFooter from '../../components/AppFooter';
import { AppNavbar } from '../../components/AppNavbar';
import '../../css/reset.css';
import '../../css/components/navbar.css';
import '../dashboard/dashboard.css';

function Drive() {
  return (
    <div className="has-navbar app-background">
      <AppNavbar active="drive" />
      <main className="drive-container">
        <section className="drive-card">
          <h1 className="drive-title">Google Drive</h1>
          <p className="drive-subtitle">
            Acceseaza rapid fisierele de curs si materialele de tutoring.
          </p>
          <a
            className="button-sync-calendar"
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-brands fa-google-drive" />
            <span>Deschide Google Drive</span>
          </a>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

export default Drive;
