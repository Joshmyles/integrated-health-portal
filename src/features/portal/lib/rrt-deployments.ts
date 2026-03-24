import "server-only";

import { requestResponseHealth } from "@/src/features/users/lib/users-server";
import type {
  PortalDataTable,
  PortalRrtDeploymentEntry,
  PortalSummaryCard
} from "@/src/features/portal/types/portal";

interface NullableString {
  String: string;
  Valid: boolean;
}

interface NullableTime {
  Time: string;
  Valid: boolean;
}

interface NullableInt64 {
  Int64: number;
  Valid: boolean;
}

interface UpstreamDeploymentTeam {
  id: number;
  team_name: string;
}

interface UpstreamDeploymentOutbreak {
  id: number;
  name: NullableString;
}

interface UpstreamRrtDeployment {
  actual_return_date: NullableTime;
  assigned_driver: NullableString;
  assigned_vehicle: NullableString;
  created_at: string;
  created_by: NullableInt64;
  deployment_date: string;
  deployment_notes: NullableString;
  deployment_purpose: NullableString;
  deployment_status: string;
  expected_return_date: NullableTime;
  id: number;
  outbreak?: UpstreamDeploymentOutbreak;
  outbreak_id: number;
  team?: UpstreamDeploymentTeam;
  team_id: number;
  updated_at: string;
}

interface UpstreamRrtDeploymentsResponse {
  deployment?: UpstreamRrtDeployment;
  deployments?: UpstreamRrtDeployment[];
  message?: string;
}

interface RrtDeploymentRecord extends PortalRrtDeploymentEntry {}

function normalizeText(value: string | undefined, fallback = "Not set") {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : fallback;
}

function formatNullableString(value: NullableString | undefined) {
  if (!value?.Valid || !value.String.trim()) {
    return "Not set";
  }

  return value.String.trim();
}

function formatNullableTime(value: NullableTime | undefined) {
  if (!value?.Valid || !value.Time.trim()) {
    return "Not set";
  }

  return value.Time;
}

function formatNullableInt64(value: NullableInt64 | undefined) {
  if (!value?.Valid) {
    return "Not set";
  }

  return `${value.Int64}`;
}

function extractDeployments(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as UpstreamRrtDeploymentsResponse;

  if (candidate.deployment) {
    return [candidate.deployment];
  }

  return Array.isArray(candidate.deployments) ? candidate.deployments : [];
}

function toRecord(deployment: UpstreamRrtDeployment): RrtDeploymentRecord {
  return {
    actualReturnDate: formatNullableTime(deployment.actual_return_date),
    assignedDriver: formatNullableString(deployment.assigned_driver),
    assignedVehicle: formatNullableString(deployment.assigned_vehicle),
    createdBy: formatNullableInt64(deployment.created_by),
    deploymentDate: normalizeText(deployment.deployment_date),
    expectedReturnDate: formatNullableTime(deployment.expected_return_date),
    id: deployment.id,
    notes: formatNullableString(deployment.deployment_notes),
    outbreakId: deployment.outbreak_id,
    outbreakName: formatNullableString(deployment.outbreak?.name),
    purpose: formatNullableString(deployment.deployment_purpose),
    status: normalizeText(deployment.deployment_status),
    teamId: deployment.team_id,
    teamName: normalizeText(deployment.team?.team_name, `Team ${deployment.team_id}`),
    updatedAt: normalizeText(deployment.updated_at)
  };
}

export async function fetchRrtDeploymentsPageData(): Promise<{
  dataTable: PortalDataTable;
  deployments: PortalRrtDeploymentEntry[];
  summaryCards: PortalSummaryCard[];
}> {
  const payload = await requestResponseHealth<unknown>("/api/resource-management/rrt-deployments");
  const deployments = extractDeployments(payload).map(toRecord);

  if (!deployments.length) {
    return {
      dataTable: {
        title: "RRT Deployment Register",
        caption: "No deployment records were returned by the upstream RRT deployments endpoint.",
        columns: ["Message"],
        rows: [{ id: "rrt-deployments-empty", cells: ["No deployments available"] }]
      },
      deployments: [],
      summaryCards: [
        { label: "Deployments Returned", value: "0", note: "Rows available from the upstream service" }
      ]
    };
  }

  const activeDeployments = deployments.filter(
    (deployment) => deployment.status.toLowerCase() === "deployed"
  ).length;
  const deploymentsWithVehicles = deployments.filter(
    (deployment) => deployment.assignedVehicle !== "Not set"
  ).length;
  const deploymentsWithReturnDate = deployments.filter(
    (deployment) => deployment.expectedReturnDate !== "Not set"
  ).length;

  return {
    dataTable: {
      title: "RRT Deployment Register",
      caption: "Live RRT deployment records returned by the upstream resource-management service.",
      columns: [
        "Deployment ID",
        "Team",
        "Team ID",
        "Outbreak",
        "Outbreak ID",
        "Deployment Date",
        "Expected Return",
        "Actual Return",
        "Status",
        "Purpose",
        "Vehicle",
        "Driver",
        "Notes",
        "Created By",
        "Updated"
      ],
      rows: deployments.map((deployment) => ({
        id: `${deployment.id}`,
        cells: [
          `${deployment.id}`,
          deployment.teamName,
          `${deployment.teamId}`,
          deployment.outbreakName,
          `${deployment.outbreakId}`,
          deployment.deploymentDate,
          deployment.expectedReturnDate,
          deployment.actualReturnDate,
          deployment.status,
          deployment.purpose,
          deployment.assignedVehicle,
          deployment.assignedDriver,
          deployment.notes,
          deployment.createdBy,
          deployment.updatedAt
        ]
      }))
    },
    deployments,
    summaryCards: [
      {
        label: "Deployments Returned",
        value: `${deployments.length}`,
        note: "Rows available from the upstream service"
      },
      {
        label: "Currently Deployed",
        value: `${activeDeployments}`,
        note: "Deployments marked with status deployed"
      },
      {
        label: "Vehicles Assigned",
        value: `${deploymentsWithVehicles}`,
        note: "Deployments with a linked vehicle"
      },
      {
        label: "Return Dates Set",
        value: `${deploymentsWithReturnDate}`,
        note: "Deployments with an expected return date"
      }
    ]
  };
}
