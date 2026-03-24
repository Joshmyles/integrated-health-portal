import "server-only";

import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";
import type {
  PortalDataTable,
  PortalRrtTeamEntry,
  PortalSummaryCard
} from "@/src/features/portal/types/portal";

interface NullableString {
  String: string;
  Valid: boolean;
}

interface NullableInt64 {
  Int64: number;
  Valid: boolean;
}

interface UpstreamRrtTeam {
  id: number;
  team_name: string;
  team_code: string;
  team_type: string;
  team_lead_name: string;
  team_lead_phone: NullableString;
  team_lead_email: NullableString;
  team_size: number;
  specializations: string[];
  base_location: NullableString;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: NullableInt64;
}

interface UpstreamSingleTeamResponse {
  team: UpstreamRrtTeam;
}

interface UpstreamMultiTeamResponse {
  teams?: UpstreamRrtTeam[];
  data?: UpstreamRrtTeam[];
}

interface RrtTeamRecord extends PortalRrtTeamEntry {
  baseLocation: string;
  code: string;
  createdBy: string;
  id: number;
  isActive: string;
  leadEmail: string;
  leadName: string;
  leadPhone: string;
  name: string;
  size: string;
  specializations: string;
  type: string;
  updatedAt: string;
}

function formatNullableString(value: NullableString | undefined) {
  if (!value || !value.Valid || !value.String.trim()) {
    return "Not set";
  }

  return value.String.trim();
}

function formatNullableInt64(value: NullableInt64 | undefined) {
  if (!value || !value.Valid) {
    return "Not set";
  }

  return `${value.Int64}`;
}

function normalizeText(value: string | undefined, fallback = "Not set") {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : fallback;
}

function toRecord(team: UpstreamRrtTeam): RrtTeamRecord {
  return {
    baseLocation: formatNullableString(team.base_location),
    code: normalizeText(team.team_code),
    createdBy: formatNullableInt64(team.created_by),
    id: team.id,
    isActive: team.is_active ? "Active" : "Inactive",
    leadEmail: formatNullableString(team.team_lead_email),
    leadName: normalizeText(team.team_lead_name),
    leadPhone: formatNullableString(team.team_lead_phone),
    name: normalizeText(team.team_name),
    size: `${team.team_size}`,
    specializations:
      team.specializations.map((item) => item.trim()).filter(Boolean).join(", ") || "Not set",
    type: normalizeText(team.team_type),
    updatedAt: normalizeText(team.updated_at)
  };
}

function extractTeams(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as UpstreamSingleTeamResponse & UpstreamMultiTeamResponse;

  if (candidate.team) {
    return [candidate.team];
  }

  if (Array.isArray(candidate.teams)) {
    return candidate.teams;
  }

  if (Array.isArray(candidate.data)) {
    return candidate.data;
  }

  return [];
}

export async function fetchRrtTeamsPageData(): Promise<{
  dataTable: PortalDataTable;
  teams: PortalRrtTeamEntry[];
  summaryCards: PortalSummaryCard[];
}> {
  const payload = await requestResponseHealth<unknown>("/api/resource-management/rrt-teams/");
  const teams = extractTeams(payload).map(toRecord);

  if (!teams.length) {
    return {
      dataTable: {
        title: "RRT Team Register",
        caption: "No team records were returned by the upstream RRT teams endpoint.",
        columns: ["Message"],
        rows: [{ id: "rrt-teams-empty", cells: ["No teams available"] }]
      },
      teams: [],
      summaryCards: [
        { label: "Teams Returned", value: "0", note: "Rows available from the upstream service" }
      ]
    };
  }

  const activeTeams = teams.filter((team) => team.isActive === "Active").length;
  const teamsWithLeadPhone = teams.filter((team) => team.leadPhone !== "Not set").length;
  const teamsWithBaseLocation = teams.filter((team) => team.baseLocation !== "Not set").length;

  return {
    dataTable: {
      title: "RRT Team Register",
      caption: "Live RRT team records returned by the upstream resource-management service.",
      columns: [
        "Team",
        "Code",
        "Type",
        "Lead",
        "Lead Phone",
        "Lead Email",
        "Members",
        "Specializations",
        "Base Location",
        "Status",
        "Created By",
        "Updated"
      ],
      rows: teams.map((team) => ({
        id: `${team.id}`,
        cells: [
          team.name,
          team.code,
          team.type,
          team.leadName,
          team.leadPhone,
          team.leadEmail,
          team.size,
          team.specializations,
          team.baseLocation,
          team.isActive,
          team.createdBy,
          team.updatedAt
        ]
      }))
    },
    teams,
    summaryCards: [
      {
        label: "Teams Returned",
        value: `${teams.length}`,
        note: "Rows available from the upstream service"
      },
      {
        label: "Active Teams",
        value: `${activeTeams}`,
        note: "Teams currently marked active"
      },
      {
        label: "Lead Phones Present",
        value: `${teamsWithLeadPhone}`,
        note: "Teams with a populated lead phone number"
      },
      {
        label: "Base Locations Present",
        value: `${teamsWithBaseLocation}`,
        note: "Teams with a populated base location"
      }
    ]
  };
}

export { ResponseHealthApiError };
