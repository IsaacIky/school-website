'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { api } from '@/lib/api';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface EntityPageProps<T extends Record<string, unknown>> {
  title: string;
  endpoint: string;
  fields: Field[];
  displayColumns: { key: string; label: string }[];
}

export default function EntityPage<T extends Record<string, unknown>>({
  title,
  endpoint,
  fields,
  displayColumns,
}: EntityPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<T[]>(`/${endpoint}`);
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [endpoint]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post(`/${endpoint}`, formData);
      setShowForm(false);
      setFormData({});
      await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create {title.slice(0, -1)}</h2>
          {formError && (
            <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {fields.map((f) => (
              <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 500 }}>
                  {f.label}
                  {f.required && <span style={{ color: '#ef4444' }}> *</span>}
                </span>
                {f.type === 'select' ? (
                  <select
                    value={formData[f.key] ?? ''}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    required={f.required}
                    style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type ?? 'text'}
                    value={formData[f.key] ?? ''}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    required={f.required}
                    style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  />
                )}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {submitting ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color: '#dc2626' }}>{error}</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No {title.toLowerCase()} found. Create one above.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                {displayColumns.map((col) => (
                  <th key={col.key} style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col.label}
                  </th>
                ))}
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={String(item.id ?? i)} style={{ borderTop: '1px solid #e2e8f0' }}>
                  {displayColumns.map((col) => (
                    <td key={col.key} style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1f2937' }}>
                      {col.key === 'isActive'
                        ? item[col.key]
                          ? '✅ Active'
                          : '❌ Inactive'
                        : String(item[col.key] ?? '')}
                    </td>
                  ))}
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => handleDelete(String(item.id))}
                      style={{
                        padding: '0.3rem 0.75rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
