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

export interface PortalPageContent {
  dataTable?: PortalDataTable;
  employeeDirectory?: PortalEmployeeDirectoryEntry[];
  id: string;
  title: string;
  intro: string;
  message?: string;
  records: PortalRecord[];
  sections: PortalSection[];
  summaryCards?: PortalSummaryCard[];
}
