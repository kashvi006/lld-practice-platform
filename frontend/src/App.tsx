import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProblemDetailPage } from './pages/ProblemDetailPage.js';
import { PracticePage } from './pages/PracticePage.js';
import { EvaluationPage } from './pages/EvaluationPage.js';
import { AttemptHistoryPage } from './pages/AttemptHistoryPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/20 selection:text-sky-300">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
            <Route path="/problems/:slug/attempts" element={<AttemptHistoryPage />} />
            <Route path="/attempts/:id/practice" element={<PracticePage />} />
            <Route path="/attempts/:id/evaluation" element={<EvaluationPage />} />
            <Route path="/attempts/:id" element={<EvaluationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-medium text-slate-400">
              LLD Practice & Explainable Evaluation Platform • CipherSchools Assignment
            </p>
            <p>
              Designed with Domain-Driven Separation, Extensible Strategy Pattern & Rubric-Grounded Feedback.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;