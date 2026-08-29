import { useEffect, useState } from "react";
import { Icon, icons } from "../components/Icon";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type Template,
  type CreateTemplatePayload,
} from "../api/templates";

const CAMPAIGN_TYPES = [
  "awareness",
  "emergency",
  "educational",
  "announcement",
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "Telugu" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
];

type TemplatesProps = {
  canCreateTemplates: boolean;
  canManageTemplates: boolean;
};

type TemplateFormProps = {
  template?: Template | null;
  onSaved: () => void;
  onClose: () => void;
};

function TemplateForm({
  template,
  onSaved,
  onClose,
}: TemplateFormProps) {
  const isEditing = Boolean(template);

  const [name, setName] = useState(
    template?.name ?? ""
  );

  const [campaignType, setCampaignType] = useState(
    template?.campaign_type ?? CAMPAIGN_TYPES[0]
  );

  const [language, setLanguage] = useState(
    template?.language ?? "en"
  );

  const [body, setBody] = useState(
    template?.body ?? ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanBody = body.trim();

    if (!cleanName) {
      setError("Please enter a template name.");
      return;
    }

    if (!cleanBody) {
      setError("Please enter the template message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const data: CreateTemplatePayload = {
      name: cleanName,
      campaign_type: campaignType,
      body: cleanBody,
      language,
    };

    try {
      if (template) {
        await updateTemplate(template.id, data);
      } else {
        await createTemplate(data);
      }

      onSaved();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item: any) => item?.msg ?? String(item))
            .join("; ")
        );
      } else {
        setError(
          isEditing
            ? "Failed to update template."
            : "Failed to create template."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[16px] font-semibold text-slate-900">
              {isEditing
                ? "Edit Template"
                : "New Template"}
            </p>

            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {isEditing
                ? "Update your reusable message template."
                : "Create a reusable message template."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          {/* Template Name */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-600">
              Template Name
            </label>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Alert"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-800 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />
          </div>

          {/* Campaign Type + Language */}
          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Campaign Type
              </label>

              <select
                value={campaignType}
                onChange={(e) =>
                  setCampaignType(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-800 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              >
                {CAMPAIGN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() +
                      type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-600">
                Language
              </label>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-800 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
              >
                {LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                  >
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-600">
              Message
            </label>

            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write the reusable campaign message..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-800 outline-none transition focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
            />

            <p className="mt-1 text-right text-[10.5px] text-slate-400">
              {body.length} characters
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
              <p className="text-[12px] text-rose-600">
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#6C5CE7]/20 transition hover:brightness-105 disabled:opacity-60"
            >
              {submitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Template"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default function Templates({
  canCreateTemplates,
  canManageTemplates,
}: TemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [editingTemplate, setEditingTemplate] =
    useState<Template | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Could not load templates."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleNewTemplate() {
    setEditingTemplate(null);
    setShowForm(true);
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplate(template);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingTemplate(null);
    void load();
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingTemplate(null);
  }

  async function handleDeleteTemplate(
    template: Template
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(template.id);
    setError(null);

    try {
      await deleteTemplate(template.id);

      setTemplates((current) =>
        current.filter(
          (item) => item.id !== template.id
        )
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Failed to delete template."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">

      {/* ================================================== */}
      {/* Page Header                                        */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <h1 className="text-[22px] font-bold text-slate-900">
              Templates
            </h1>

            <span className="rounded-full bg-[#EDE9FE] px-2.5 py-1 text-[10.5px] font-semibold text-[#5A3FD6]">
              {templates.length}
            </span>

          </div>

          <p className="mt-1 text-[13px] text-slate-500">
            Reusable message templates for your campaigns.
          </p>
        </div>

        {/* New Template - Admin + Campaign Manager */}
        {canCreateTemplates && (
          <button
            type="button"
            onClick={handleNewTemplate}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C6CF0] to-[#5A3FD6] px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#6C5CE7]/20 transition hover:brightness-105"
          >
            <Icon
              path={icons.layout}
              className="h-4 w-4"
            />

            New Template
          </button>
        )}

      </div>

      {/* ================================================== */}
      {/* Error                                               */}
      {/* ================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-[12.5px] text-rose-600">
            {error}
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* Loading                                             */}
      {/* ================================================== */}

      {loading && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-[13px] text-slate-500">
            Loading templates...
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* Empty State                                         */}
      {/* ================================================== */}

      {!loading && templates.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE9FE]">
            <Icon
              path={icons.layout}
              className="h-6 w-6 text-[#5A3FD6]"
            />
          </div>

          <p className="mt-4 text-[15px] font-semibold text-slate-900">
            No templates yet
          </p>

          <p className="mt-1 text-[12.5px] text-slate-500">
            Create your first reusable campaign template.
          </p>

          {canCreateTemplates && (
            <button
              type="button"
              onClick={handleNewTemplate}
              className="mt-4 rounded-xl bg-[#5A3FD6] px-4 py-2.5 text-[12.5px] font-semibold text-white hover:brightness-105"
            >
              New Template
            </button>
          )}

        </div>
      )}

      {/* ================================================== */}
      {/* Template Cards                                      */}
      {/* ================================================== */}

      {!loading && templates.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              {/* Template Header */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="truncate text-[14px] font-semibold text-slate-900">
                    {template.name}
                  </p>

                  <p className="mt-1 text-[11.5px] capitalize text-slate-500">
                    {template.campaign_type}
                  </p>

                </div>

                <span className="flex-shrink-0 rounded-full bg-[#EDE9FE] px-2.5 py-1 text-[10.5px] font-semibold uppercase text-[#5A3FD6]">
                  {template.language}
                </span>

              </div>

              {/* Template Body */}
              <div className="mt-3 rounded-xl bg-slate-50 p-3">

                <p className="line-clamp-5 text-[12.5px] leading-5 text-slate-600">
                  {template.body}
                </p>

              </div>

              {/* Template Footer / Admin Actions */}
              <div className="mt-4 border-t border-slate-100 pt-3">

                {canManageTemplates ? (
                  <div className="flex items-center justify-between gap-2">

                    <p className="text-[11px] text-slate-400">
                      Admin controls
                    </p>

                    <div className="flex items-center gap-2">

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          handleEditTemplate(template)
                        }
                        disabled={
                          deletingId === template.id
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] font-medium text-slate-600 transition hover:border-[#6C5CE7] hover:bg-[#F5F3FF] hover:text-[#5A3FD6] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteTemplate(
                            template
                          )
                        }
                        disabled={
                          deletingId === template.id
                        }
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-[11.5px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === template.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Reusable campaign template
                  </p>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

      {/* ================================================== */}
      {/* Create / Edit Template Modal                        */}
      {/* ================================================== */}

      {showForm && canCreateTemplates && (
        <TemplateForm
          template={editingTemplate}
          onClose={handleCloseForm}
          onSaved={handleSaved}
        />
      )}

    </div>
  );
}