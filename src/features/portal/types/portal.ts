export type PortalNodeKind = "group" | "item";

export interface PortalTreeNode {
  id: string;
  label: string;
  kind: PortalNodeKind;
  children?: PortalTreeNode[];
}

export interface PortalNavigationResponse {
  applicationTitle: string;
  defaultNodeId: string;
  tree: PortalTreeNode[];
}

export interface PortalRecord {
  label: string;
  value: string;
}

export interface PortalSection {
  title: string;
  items: string[];
}

export interface PortalSummaryCard {
  label: string;
  note?: string;
  value: string;
}

export interface PortalDataTableRow {
  cells: string[];
  id: string;
}

export interface PortalDataTable {
  caption?: string;
  columns: string[];
  rows: PortalDataTableRow[];
  title: string;
}

export interface PortalEmployeeDirectoryEntry {
  cadre: string;
  email: string;
  facilityId: number;
  facilityName: string;
  firstName: string;
  fullName: string;
  id: number;
  lastName: string;
  phone: string;
  sex: string;
}

export interface PortalDepartmentEntry {
  code: string;
  createdAt: string;
  description: string;
  headId: string;
  id: number;
  isActive: string;
  name: string;
  updatedAt: string;
}

export interface PortalRrtTeamEntry {
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

export interface PortalRrtDeploymentEntry {
  actualReturnDate: string;
  assignedDriver: string;
  assignedVehicle: string;
  createdBy: string;
  deploymentDate: string;
  id: number;
  notes: string;
  outbreakId: number;
  outbreakName: string;
  purpose: string;
  status: string;
  teamId: number;
  teamName: string;
  updatedAt: string;
  expectedReturnDate: string;
}

export interface PortalPageContent {
  dataTable?: PortalDataTable;
  departments?: PortalDepartmentEntry[];
  employeeDirectory?: PortalEmployeeDirectoryEntry[];
  id: string;
  title: string;
  intro: string;
  message?: string;
  records: PortalRecord[];
  rrtDeployments?: PortalRrtDeploymentEntry[];
  rrtTeams?: PortalRrtTeamEntry[];
  sections: PortalSection[];
  summaryCards?: PortalSummaryCard[];
}
