import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Landing = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-800 to-slate-900 text-white p-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        {t('landing.studentTitle', 'Start Adventure!')}
      </h1>
      <p className="text-lg md:text-xl mb-8 text-center max-w-2xl">
        {t('landing.studentSubtitle', 'Start your missions and earn stars today!')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Student Card */}
        <div className="bg-indigo-700 rounded-lg shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">{t('auth.roles.student', 'Student')}</h2>
          <p className="mb-4 text-center">{t('landing.studentSubtitle')}</p>
          <Link
            to="/auth?mode=login"
            className="mt-auto bg-white text-indigo-800 font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            {t('auth.login', 'Login')}
          </Link>
        </div>
        {/* Parent Card */}
        <div className="bg-indigo-700 rounded-lg shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">{t('auth.roles.parent', 'Parent')}</h2>
          <p className="mb-4 text-center">{t('landing.studentSubtitle')}</p>
          <Link
            to="/auth?mode=register"
            className="mt-auto bg-white text-indigo-800 font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            {t('auth.register', 'Register')}
          </Link>
        </div>
        {/* Teacher Card */}
        <div className="bg-indigo-700 rounded-lg shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">{t('auth.roles.teacher', 'Teacher')}</h2>
          <p className="mb-4 text-center">{t('landing.studentSubtitle')}</p>
          <Link
            to="/auth?mode=register"
            className="mt-auto bg-white text-indigo-800 font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            {t('auth.register', 'Register')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
