"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useCreateResource } from "@/src/features/resource-management/hooks/use-create-resource";
import { useDeleteResource } from "@/src/features/resource-management/hooks/use-delete-resource";
import { useResources } from "@/src/features/resource-management/hooks/use-resources";
import { useUpdateResource } from "@/src/features/resource-management/hooks/use-update-resource";
import { ResourceManagementRequestError } from "@/src/features/resource-management/lib/resource-management-client";
import type {
  NullableInt64Value,
  NullableStringValue,
  ResourceRecord,
  ResourceWritePayload
} from "@/src/features/resource-management/types/resource-management";
import styles from "./resources-workspace.module.css";

interface ResourceFormState {
  categoryId: string;
  description: string;
  hasExpiry: boolean;
  isActive: boolean;
  isConsumable: boolean;
  isCritical: boolean;
  name: string;
  resourceCode: string;
  shelfLifeDays: string;
  unitOfMeasure: string;
}

const INITIAL_FORM_STATE: ResourceFormState = {
  categoryId: "",
  description: "",
  hasExpiry: false,
  isActive: true,
  isConsumable: false,
  isCritical: false,
  name: "",
  resourceCode: "",
  shelfLifeDays: "",
  unitOfMeasure: ""
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

function createFormState(resource: ResourceRecord): ResourceFormState {
  return {
    categoryId: `${resource.category_id}`,
    description: readNullableString(resource.description),
    hasExpiry: resource.has_expiry,
    isActive: resource.is_active,
    isConsumable: resource.is_consumable,
    isCritical: resource.is_critical,
    name: resource.name,
    resourceCode: readNullableString(resource.resource_code),
    shelfLifeDays: readNullableInt(resource.shelf_life_days),
    unitOfMeasure: resource.unit_of_measure
  };
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ResourceManagementRequestError) {
    return error.message;
  }

  return fallback;
}

function buildPayload(formState: ResourceFormState): ResourceWritePayload {
  const parsedCategoryId = Number(formState.categoryId.trim());
  const parsedShelfLife = Number(formState.shelfLifeDays.trim());

  return {
    category_id: Number.isFinite(parsedCategoryId) ? parsedCategoryId : 0,
    description: formState.description.trim(),
    has_expiry: formState.hasExpiry,
    is_active: formState.isActive,
    is_consumable: formState.isConsumable,
    is_critical: formState.isCritical,
    name: formState.name.trim(),
    resource_code: formState.resourceCode.trim(),
    shelf_life_days: Number.isFinite(parsedShelfLife) ? parsedShelfLife : 0,
    unit_of_measure: formState.unitOfMeasure.trim()
  };
}

export function ResourcesWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [openMenuResourceId, setOpenMenuResourceId] = useState<number | null>(null);
  const [editingResource, setEditingResource] = useState<ResourceRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResourceRecord | null>(null);
  const [formState, setFormState] = useState<ResourceFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);

  const resourcesQuery = useResources();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();

  const resources = resourcesQuery.data?.resources ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredResources = resources.filter((resource) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      resource.name,
      readNullableString(resource.description),
      readNullableString(resource.resource_code),
      resource.unit_of_measure,
      resource.category?.name ?? ""
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const activeCount = resources.filter((resource) => resource.is_active).length;
  const criticalCount = resources.filter((resource) => resource.is_critical).length;
  const consumableCount = resources.filter((resource) => resource.is_consumable).length;
  const expiringCount = resources.filter((resource) => resource.has_expiry).length;
  const isModalOpen = isCreateOpen || Boolean(editingResource);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeMutationError =
    formError ??
    (createMutation.isError
      ? getMutationErrorMessage(createMutation.error, "The resource could not be created.")
      : updateMutation.isError
        ? getMutationErrorMessage(updateMutation.error, "The resource could not be updated.")
        : null);
  const deleteError = deleteMutation.isError
    ? getMutationErrorMessage(deleteMutation.error, "The resource could not be deleted.")
    : null;

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-actions-menu]")) {
        setOpenMenuResourceId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuResourceId(null);
      setIsCreateOpen(false);
      setEditingResource(null);
      setDeleteTarget(null);
      setFormError(null);
      setFormState(INITIAL_FORM_STATE);
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createMutation, deleteMutation, updateMutation]);

  function openCreateModal() {
    setOpenMenuResourceId(null);
    setEditingResource(null);
    setIsCreateOpen(true);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function openEditModal(resource: ResourceRecord) {
    setOpenMenuResourceId(null);
    setIsCreateOpen(false);
    setEditingResource(resource);
    setFormState(createFormState(resource));
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function closeFormModal() {
    setOpenMenuResourceId(null);
    setIsCreateOpen(false);
    setEditingResource(null);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    createMutation.reset();
    updateMutation.reset();
  }

  function updateFormField<Key extends keyof ResourceFormState>(
    key: Key,
    value: ResourceFormState[Key]
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
      setFormError("Resource name is required.");
      return;
    }

    if (payload.category_id < 1) {
      setFormError("Category ID is required and must be a whole number.");
      return;
    }

    if (!payload.unit_of_measure) {
      setFormError("Unit of measure is required.");
      return;
    }

    if (formState.categoryId.trim() && !/^\d+$/.test(formState.categoryId.trim())) {
      setFormError("Category ID must be a whole number.");
      return;
    }

    if (formState.shelfLifeDays.trim() && !/^\d+$/.test(formState.shelfLifeDays.trim())) {
      setFormError("Shelf life days must be blank or a whole number.");
      return;
    }

    if (editingResource) {
      await updateMutation.mutateAsync({
        payload,
        resourceId: editingResource.id
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
    setOpenMenuResourceId(null);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          name="resource-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search resources, codes, categories, or units"
          value={searchValue}
        />
        <button className={styles.primaryButton} onClick={openCreateModal} type="button">
          New Resource
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Resources</div>
          <div className={styles.summaryValue}>{resources.length}</div>
          <p className={styles.summaryNote}>Live list from `/api/resource-management/resources`.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active</div>
          <div className={styles.summaryValue}>{activeCount}</div>
          <p className={styles.summaryNote}>Resources currently marked available for operations.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Critical</div>
          <div className={styles.summaryValue}>{criticalCount}</div>
          <p className={styles.summaryNote}>Items flagged as response-critical by the upstream API.</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Expiry Tracked</div>
          <div className={styles.summaryValue}>{expiringCount}</div>
          <p className={styles.summaryNote}>Resources that require expiry management or shelf-life review.</p>
        </article>
      </div>

      {resourcesQuery.isError ? (
        <div className={styles.errorBanner}>
          {getMutationErrorMessage(
            resourcesQuery.error,
            "The resources list could not be loaded."
          )}
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Code</th>
              <th scope="col">Category</th>
              <th scope="col">Unit</th>
              <th scope="col">Flags</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resourcesQuery.isLoading ? (
              <tr>
                <td colSpan={8}>Loading resources...</td>
              </tr>
            ) : filteredResources.length ? (
              filteredResources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div>{resource.name}</div>
                    <div>{readNullableString(resource.description) || "-"}</div>
                  </td>
                  <td>{readNullableString(resource.resource_code) || "-"}</td>
                  <td>{resource.category?.name || `Category #${resource.category_id}`}</td>
                  <td>{resource.unit_of_measure || "-"}</td>
                  <td>
                    <div className={styles.flagStack}>
                      {resource.is_consumable ? <span className={styles.flagPill}>Consumable</span> : null}
                      {resource.has_expiry ? <span className={styles.flagPill}>Has expiry</span> : null}
                      {resource.is_critical ? <span className={styles.flagPill}>Critical</span> : null}
                      {resource.shelf_life_days.Valid ? (
                        <span className={styles.flagPill}>
                          Shelf life {resource.shelf_life_days.Int64}d
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        resource.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {resource.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDateTime(resource.updated_at)}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionsMenuWrap} data-actions-menu="">
                      <button
                        aria-expanded={openMenuResourceId === resource.id}
                        aria-haspopup="menu"
                        className={styles.moreButton}
                        onClick={() =>
                          setOpenMenuResourceId((current) =>
                            current === resource.id ? null : resource.id
                          )
                        }
                        type="button"
                      >
                        <span aria-hidden="true" className={styles.moreDots}>
                          <svg fill="currentColor" height="16" viewBox="0 0 20 20" width="16">
                            <circle cx="10" cy="4.2" r="1.4" />
                            <circle cx="10" cy="10" r="1.4" />
                            <circle cx="10" cy="15.8" r="1.4" />
                          </svg>
                        </span>
                      </button>

                      {openMenuResourceId === resource.id ? (
                        <div className={styles.dropdown} role="menu">
                          <button
                            className={styles.dropdownItem}
                            onClick={() => openEditModal(resource)}
                            type="button"
                          >
                            Edit resource
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => {
                              setOpenMenuResourceId(null);
                              setDeleteTarget(resource);
                            }}
                            type="button"
                          >
                            Delete resource
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyState} colSpan={8}>
                  No resources match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="resources-modal-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="resources-modal-title">
                  {editingResource ? "Edit Resource" : "Create Resource"}
                </h2>
                <p className={styles.modalText}>
                  This form sends the full resource payload expected by the resource-management
                  API, including category, stock behavior flags, and shelf-life settings.
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
                    <span>Resource Code</span>
                    <input
                      name="resourceCode"
                      onChange={(event) => updateFormField("resourceCode", event.target.value)}
                      value={formState.resourceCode}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Category ID</span>
                    <input
                      inputMode="numeric"
                      name="categoryId"
                      onChange={(event) => updateFormField("categoryId", event.target.value)}
                      value={formState.categoryId}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Unit of Measure</span>
                    <input
                      name="unitOfMeasure"
                      onChange={(event) => updateFormField("unitOfMeasure", event.target.value)}
                      value={formState.unitOfMeasure}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Shelf Life Days</span>
                    <input
                      inputMode="numeric"
                      name="shelfLifeDays"
                      onChange={(event) => updateFormField("shelfLifeDays", event.target.value)}
                      placeholder="0 or blank"
                      value={formState.shelfLifeDays}
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

                <div className={styles.checkboxGrid}>
                  <label className={styles.checkboxRow}>
                    <input
                      checked={formState.isConsumable}
                      onChange={(event) => updateFormField("isConsumable", event.target.checked)}
                      type="checkbox"
                    />
                    <span>Consumable</span>
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      checked={formState.hasExpiry}
                      onChange={(event) => updateFormField("hasExpiry", event.target.checked)}
                      type="checkbox"
                    />
                    <span>Has expiry</span>
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      checked={formState.isCritical}
                      onChange={(event) => updateFormField("isCritical", event.target.checked)}
                      type="checkbox"
                    />
                    <span>Critical resource</span>
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      checked={formState.isActive}
                      onChange={(event) => updateFormField("isActive", event.target.checked)}
                      type="checkbox"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <p className={styles.helperText}>
                  The create and update requests now match the API contract you shared:
                  category, code, unit, boolean flags, and shelf-life values are all included.
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
                  {isSaving ? "Saving..." : editingResource ? "Save Changes" : "Create Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="resources-delete-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="resources-delete-title">
                  Delete Resource
                </h2>
                <p className={styles.modalText}>
                  Remove <strong>{deleteTarget.name}</strong> from the resource-management list.
                </p>
              </div>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                This action calls `DELETE /api/resource-management/resources/{deleteTarget.id}`.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete Resource"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
