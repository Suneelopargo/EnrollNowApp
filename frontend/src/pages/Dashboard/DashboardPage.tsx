import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Building2, MapPin, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              EnrollNow Clinical Trials Platform — Step 1 Security &amp; RBAC Foundation
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Roles: {user?.roles?.join(', ') || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-medium">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Organization Context</span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">{user?.organizationName || 'Main Organization'}</div>
            <div className="text-xs text-slate-400 mt-0.5">Multi-tenant Isolation Active</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-medium">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <span>Assigned Clinical Sites</span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">{user?.siteCodes?.length || 0} Sites</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {user?.siteCodes?.join(', ') || 'All sites permitted'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-medium">
            <Activity className="h-5 w-5 text-indigo-600" />
            <span>Security Compliance</span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">Argon2id + JWT HS256</div>
            <div className="text-xs text-slate-400 mt-0.5">HIPAA Audit Trail Active</div>
          </div>
        </div>
      </div>

      {/* Admin Panel Quick Access */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Administrator Management Portal</h2>
              <p className="text-xs text-blue-200 mt-1">
                Access unified user administration, role-based access control matrices, site scopes, and tamper-evident audit logs.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-blue-900 text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition"
            >
              <span>Launch Administrator UI</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
