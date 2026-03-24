"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useCreatePillar } from "@/src/features/resource-management/hooks/use-create-pillar";
import { useDeletePillar } from "@/src/features/resource-management/hooks/use-delete-pillar";
import { useLegacyPillars } from "@/src/features/resource-management/hooks/use-legacy-pillars";
import { usePillars } from "@/src/features/resource-management/hooks/use-pillars";
import { useUpdatePillar } from "@/src/features/resource-management/hooks/use-update-pillar";
import { ResourceManagementRequestError } from "@/src/features/resource-management/lib/resource-management-client";
import type {
  NullableInt64Value,
  NullableStringValue,
  PillarRecord,
  PillarWritePayload
} from "@/src/features/resource-management/types/resource-management";
import styles from "./pillars-workspace.module.css";

interface PillarFormState {
  description: string;
  isActive: boolean;
  name: string;
  pillarHeadEmail: string;
  pillarHeadId: string;
  pillarHeadName: string;
  pillarHeadPhone: string;
}

const INITIAL_FORM_STATE: PillarFormState = {
  description: "",
  isActive: true,
  name: "",
  pillarHeadEmail: "",
  pillarHeadId: "",
  pillarHeadName: "",
  pillarHeadPhone: ""
};

function readNullableString(value: NullableStringValue | undefined) {
  if (!value?.Valid) {
    return "";
  }

  return value.String.trim();
}

function readNullableInt(value: NullableInt64Value | undefined) {
  if (!value?.Valid) {
    return "";
  }

  return `${value.Int64}`;
}

function formatDateTime(value: string) {
  if (!value || value === "0001-01-01T00:00:00Z") {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function createFormState(pillar: PillarRecord): PillarFormState {
  return {
    description: readNullableString(pillar.description),
    isActive: pillar.is_active,
    name: pillar.name,
    pillarHeadEmail: readNullableString(pillar.pillar_head_email),
    pillarHeadId: readNullableInt(pillar.pillar_head_id),
    pillarHeadName: readNullableString(pillar.pillar_head_name),
    pillarHeadPhone: readNullableString(pillar.pillar_head_phone)
  };
}

function buildPayload(formState: PillarFormState): PillarWritePayload {
  const rawHeadId = formState.pillarHeadId.trim();
  const parsedHeadId = rawHeadId ? Number(rawHeadId) : 0;

  return {
    description: formState.description.trim(),
    is_active: formState.isActive,
    name: formState.name.trim(),
    pillar_head_email: formState.pillarHeadEmail.trim(),
    pillar_head_id: Number.isFinite(parsedHeadId) ? parsedHeadId : 0,
    pillar_head_name: formState.pillarHeadName.trim(),
    pillar_head_phone: formState.pillarHeadPhone.trim()
  };
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ResourceManagementRequestError) {
    return error.message;
  }

  return fallback;
}

function getNormalizedNames(pillars: PillarRecord[]) {
  return pillars
    .map((pillar) => pillar.name.trim().toLowerCase())
    .filter(Boolean);
}

export function PillarsWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [editingPillar, setEditingPillar] = useState<PillarRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PillarRecord | null>(null);
  const [formState, setFormState] = useState<PillarFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);

  const pillarsQuery = usePillars();
  const legacyPillarsQuery = useLegacyPillars();
  const createMutation = useCreatePillar();
  const updateMutation = useUpdatePillar();
  const deleteMutation = useDeletePillar();

  const pillars = pillarsQuery.data?.pillars ?? [];
  const legacyPillars = legacyPillarsQuery.data?.pillars ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredPillars = pillars.filter((pillar) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      pillar.name,
      readNullableString(pillar.description),
      readNullableString(pillar.pillar_head_name),
      readNullableString(pillar.pillar_head_email),
      readNullableString(pillar.pillar_head_phone)
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const duplicateCount = (() => {
    const counts = new Map<string, number>();

    for (const name of getNormalizedNames(pillars)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return Array.from(counts.values()).filter((count) => count > 1).length;
  })();

  const legacyIds = new Set(legacyPillars.map((pillar) => pillar.id));
  const resourceIds = new Set(pillars.map((pillar) => pillar.id));
  const missingFromResource = legacyPillars.filter((pillar) => !resourceIds.has(pillar.id)).length;
  const missingFromLegacy = pillars.filter((pillar) => !legacyIds.has(pillar.id)).length;
  const mismatchCount = missingFromResource + missingFromLegacy;

  const isModalOpen = isCreateOpen || Boolean(editingPillar);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeMutationError =
    formError ??
    (createMutation.isError
      ? getMutationErrorMessage(createMutation.error, "The pillar could not be created.")
      : updateMutation.isError
        ? getMutationErrorMessage(updateMutation.error, "The pillar could not be updated.")
        : null);
  const deleteError = deleteMutation.isError
    ? getMutationErrorMessage(deleteMutation.error, "The pillar could not be deleted.")
    : null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setIsCreateOpen(false);
      setEditingPillar(null);
      setDeleteTarget(null);
      setFormError(null);
      setFormState(INITIAL_FORM_STATE);
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createMutation, deleteMutation, updateMutation]);

  function openCreateModal() {
    setEditingPillar(null);
    setIsCreateOpen(true);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(pillar: PillarRecord) {
    setIsCreateOpen(false);
    setEditingPillar(pillar);
    setFormState(createFormState(pillar));
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setIsCreateOpen(false);
    setEditingPillar(null);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateFormField<Key extends keyof PillarFormState>(
    key: Key,
    value: PillarFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));

    if (formError) {
      setFormError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildPayload(formState);

    if (!payload.name) {
      setFormError("Pillar name is required.");
      return;
    }

    if (formState.pillarHeadId.trim() && !Number.isFinite(Number(formState.pillarHeadId.trim()))) {
      setFormError("Pillar head ID must be a number when provided.");
      return;
    }

    if (editingPillar) {
      await updateMutation.mutateAsync({
        payload,
        pillarId: editingPillar.id
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    closeFormModal();
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          name="pillar-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search pillars, descriptions, or pillar heads"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Pillar
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Resource Mgmt List</div>
          <div className={styles.summaryValue}>{pillars.length}</div>
          <p className={styles.summaryNote}>Records from `/api/resource-management/pillars`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Legacy List</div>
          <div className={styles.summaryValue}>{legacyPillars.length}</div>
          <p className={styles.summaryNote}>Records from `/api/pillars` for cross-checking.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Name Duplicates</div>
          <div className={styles.summaryValue}>{duplicateCount}</div>
          <p className={styles.summaryNote}>Duplicate normalized names in the live resource list.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>List Mismatches</div>
          <div className={styles.summaryValue}>{mismatchCount}</div>
          <p className={styles.summaryNote}>IDs present in one pillars endpoint but not the other.</p>
        </article>
      </div>

      {legacyPillarsQuery.isError || pillarsQuery.isError ? (
        <div className={styles.errorBanner}>
          {pillarsQuery.isError
            ? getMutationErrorMessage(
                pillarsQuery.error,
                "The resource-management pillars list could not be loaded."
              )
            : getMutationErrorMessage(
                legacyPillarsQuery.error,
                "The legacy pillars list could not be loaded."
              )}
        </div>
      ) : null}

      {!pillarsQuery.isError && !legacyPillarsQuery.isError && mismatchCount > 0 ? (
        <div className={styles.statusRow}>
          The two upstream pillars lists are not fully aligned yet. This workspace writes through
          the resource-management API and keeps the legacy list visible for comparison.
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Description</th>
              <th scope="col">Pillar Head</th>
              <th scope="col">Contact</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pillarsQuery.isLoading ? (
              <tr>
                <td colSpan={7}>Loading pillars...</td>
              </tr>
            ) : filteredPillars.length ? (
              filteredPillars.map((pillar) => (
                <tr key={pillar.id}>
                  <td>{pillar.name}</td>
                  <td>{readNullableString(pillar.description) || "-"}</td>
                  <td>
                    {readNullableString(pillar.pillar_head_name) || "-"}
                    {pillar.pillar_head_id.Valid ? ` (#${pillar.pillar_head_id.Int64})` : ""}
                  </td>
                  <td>
                    {readNullableString(pillar.pillar_head_email) || "-"}
                    {readNullableString(pillar.pillar_head_phone)
                      ? ` / ${readNullableString(pillar.pillar_head_phone)}`
                      : ""}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        pillar.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {pillar.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDateTime(pillar.updated_at)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => openEditModal(pillar)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => setDeleteTarget(pillar)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyState} colSpan={7}>
                  No pillars match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="pillars-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="pillars-modal-title">
                  {editingPillar ? "Edit Pillar" : "Create Pillar"}
                </h2>
                <p className={styles.modalText}>
                  The form submits the full write payload expected by the resource-management
                  pillars API, including description, pillar head details, and active status.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input
                      name="name"
                      onChange={(event) => updateFormField("name", event.target.value)}
                      value={formState.name}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Pillar Head ID</span>
                    <input
                      inputMode="numeric"
                      name="pillarHeadId"
                      onChange={(event) => updateFormField("pillarHeadId", event.target.value)}
                      placeholder="Optional numeric user ID"
                      value={formState.pillarHeadId}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Pillar Head Name</span>
                    <input
                      name="pillarHeadName"
                      onChange={(event) => updateFormField("pillarHeadName", event.target.value)}
                      value={formState.pillarHeadName}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Pillar Head Email</span>
                    <input
                      name="pillarHeadEmail"
                      onChange={(event) => updateFormField("pillarHeadEmail", event.target.value)}
                      value={formState.pillarHeadEmail}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Pillar Head Phone</span>
                    <input
                      name="pillarHeadPhone"
                      onChange={(event) => updateFormField("pillarHeadPhone", event.target.value)}
                      value={formState.pillarHeadPhone}
                    />
                  </label>

                  <label className={styles.fieldWide}>
                    <span>Description</span>
                    <textarea
                      name="description"
                      onChange={(event) => updateFormField("description", event.target.value)}
                      value={formState.description}
                    />
                  </label>
                </div>

                <label className={styles.checkboxRow}>
                  <input
                    checked={formState.isActive}
                    name="isActive"
                    onChange={(event) => updateFormField("isActive", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Mark pillar as active</span>
                </label>
                <p className={styles.helperText}>
                  This workspace sends a complete create/update body instead of the minimal
                  <code>{'{"name":"..."}'}</code> payload that left several pillar attributes blank
                  upstream.
                </p>

                {activeMutationError ? (
                  <p className={styles.inlineError}>{activeMutationError}</p>
                ) : null}
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeFormModal}
                  type="button"
                >
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : editingPillar ? "Save Changes" : "Create Pillar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="pillars-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="pillars-delete-title">
                  Delete Pillar
                </h2>
                <p className={styles.modalText}>
                  Remove <strong>{deleteTarget.name}</strong> from the resource-management pillars
                  list.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/resource-management/pillars/{deleteTarget.id}`.
              </p>
              {deleteError ? <p className={styles.inlineError}>{deleteError}</p> : null}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setDeleteTarget(null);
                  deleteMutation.reset();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                disabled={deleteMutation.isPending}
                onClick={confirmDelete}
                type="button"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Pillar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
