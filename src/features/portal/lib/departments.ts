import "server-only";

import { requestResponseHealth } from "@/src/features/users/lib/users-server";
import type {
  PortalDataTable,
  PortalDepartmentEntry,
  PortalSummaryCard
} from "@/src/features/portal/types/portal";

type JsonRecord = Record<string, unknown>;

interface NullableString {
  String: string;
  Valid: boolean;
}

interface NullableInt64 {
  Int64: number;
  Valid: boolean;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: string | undefined, fallback = "Not set") {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : fallback;
}

function readNullableString(value: unknown, fallback = "Not set") {
  if (isRecord(value) && typeof value.String === "string" && value.Valid === true) {
    return normalizeText(value.String, fallback);
  }

  if (typeof value === "string") {
    return normalizeText(value, fallback);
  }

  return fallback;
}

function readNullableInt(value: unknown, fallback = "Not set") {
  if (isRecord(value) && typeof value.Int64 === "number" && value.Valid === true) {
    return `${value.Int64}`;
  }

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return `${value}`;
  }

  return fallback;
}

function readBooleanStatus(record: JsonRecord) {
  const value = record.is_active ?? record.active;

  if (typeof value === "boolean") {
    return value ? "Active" : "Inactive";
  }

  return "Not set";
}

function readNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
  }

  return null;
}

function readString(record: JsonRecord, keys: string[], fallback = "Not set") {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    const nestedValue = readNullableString(value, "");

    if (nestedValue) {
      return nestedValue;
    }
  }

  return fallback;
}

function toDepartmentRecord(record: JsonRecord): PortalDepartmentEntry | null {
  const id = readNumber(record, ["id", "department_id"]);

  if (!id) {
    return null;
  }

  return {
    code: readString(record, ["code", "department_code"]),
    createdAt: readString(record, ["created_at"]),
    description: readString(record, ["description", "department_description"]),
    headId: readNullableInt(record.department_head_id ?? record.head_id),
    id,
    isActive: readBooleanStatus(record),
    name: readString(record, ["name", "department_name"], `Department ${id}`),
    updatedAt: readString(record, ["updated_at"])
  };
}

function extractDepartments(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.departments)) {
    return payload.departments.filter(isRecord);
  }

  if (isRecord(payload.department)) {
    return [payload.department];
  }

  if (Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }

  return [];
}

export async function fetchDepartmentsPageData(): Promise<{
  dataTable: PortalDataTable;
  departments: PortalDepartmentEntry[];
  summaryCards: PortalSummaryCard[];
}> {
  const payload = await requestResponseHealth<unknown>("/api/departments");
  const departments = extractDepartments(payload)
    .map(toDepartmentRecord)
    .filter((department): department is PortalDepartmentEntry => Boolean(department));

  if (!departments.length) {
    return {
      dataTable: {
        title: "Department Register",
        caption: "No department records were returned by the upstream departments endpoint.",
        columns: ["Message"],
        rows: [{ id: "departments-empty", cells: ["No departments available"] }]
      },
      departments: [],
      summaryCards: [
        { label: "Departments Returned", value: "0", note: "Rows available from the upstream service" }
      ]
    };
  }

  const activeDepartments = departments.filter((department) => department.isActive === "Active").length;
  const codedDepartments = departments.filter((department) => department.code !== "Not set").length;
  const headedDepartments = departments.filter((department) => department.headId !== "Not set").length;

  return {
    dataTable: {
      title: "Department Register",
      caption: "Live department records returned by the upstream HR service.",
      columns: ["Department", "Code", "Description", "Head ID", "Status", "Created", "Updated"],
      rows: departments.map((department) => ({
        id: `${department.id}`,
        cells: [
          department.name,
          department.code,
          department.description,
          department.headId,
          department.isActive,
          department.createdAt,
          department.updatedAt
        ]
      }))
    },
    departments,
    summaryCards: [
      { label: "Departments Returned", value: `${departments.length}`, note: "Rows available from the upstream service" },
      { label: "Active Departments", value: `${activeDepartments}`, note: "Departments currently marked active" },
      { label: "Codes Present", value: `${codedDepartments}`, note: "Departments with a populated code" },
      { label: "Head IDs Present", value: `${headedDepartments}`, note: "Departments with a populated head ID" }
    ]
  };
}
