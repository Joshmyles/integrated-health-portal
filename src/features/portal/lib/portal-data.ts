import type {
  PortalNavigationResponse,
  PortalPageContent,
  PortalTreeNode
} from "@/src/features/portal/types/portal";
import {
  fetchAllSubcounties,
  fetchDistricts,
  fetchVillages
} from "@/src/features/portal/lib/districts";

const portalTree: PortalTreeNode[] = [
  {
    id: "data-and-statistics",
    label: "Data and Statistics",
    kind: "group",
    children: [
      { id: "service-utilization", label: "Service Utilization", kind: "item" },
      { id: "disease-burden", label: "Disease Burden", kind: "item" },
      { id: "communicable-disease", label: "Communicable Disease", kind: "item" },
      { id: "ncds", label: "NCDs", kind: "item" },
      { id: "ntds", label: "NTDs", kind: "item" },
      { id: "injuries", label: "Injuries", kind: "item" },
      { id: "malnutrition", label: "Malnutrition", kind: "item" }
    ]
  },
  {
    id: "programmes",
    label: "Programmes",
    kind: "group",
    children: [
      {
        id: "hiv-aids-programme",
        label: "HIV/AIDS",
        kind: "group",
        children: [
          { id: "prevention-services", label: "Prevention", kind: "item" },
          {
            id: "care-and-treatment",
            label: "Care and Treatment",
            kind: "group",
            children: [
              { id: "art-clinic", label: "ART Clinic", kind: "item" },
              { id: "viral-load-monitoring", label: "Viral Load Monitoring", kind: "item" }
            ]
          },
          { id: "community-systems", label: "Community Systems", kind: "item" }
        ]
      },
      {
        id: "rmncaah",
        label: "RMNCAH",
        kind: "group",
        children: [
          {
            id: "maternal-health",
            label: "Maternal Health",
            kind: "group",
            children: [
              { id: "antenatal-care", label: "Antenatal Care", kind: "item" },
              { id: "safe-delivery", label: "Safe Delivery", kind: "item" }
            ]
          },
          { id: "child-health", label: "Child Health", kind: "item" },
          { id: "family-planning", label: "Family Planning", kind: "item" }
        ]
      },
      { id: "tb-leprosy", label: "TB and Leprosy", kind: "item" }
    ]
  },
  { id: "lab", label: "Lab", kind: "item" },
  { id: "pharmaceuticals", label: "Pharmaceuticals", kind: "item" },
  { id: "health-security", label: "Health Security", kind: "item" },
  { id: "surveillance-reports", label: "Surveillance", kind: "item" },
  { id: "standard-reports", label: "Standard Reports", kind: "item" },
  { id: "human-resources", label: "Human Resources", kind: "item" },
  {
    id: "user-management",
    label: "User Management",
    kind: "group",
    children: [{ id: "user-management-home", label: "Home", kind: "item" }]
  },
  { id: "system-settings", label: "System Settings", kind: "item" },
  { id: "client-satisfaction", label: "Client Satisfaction", kind: "item" },
  { id: "quality-of-care", label: "Quality of care", kind: "item" },
  { id: "self-service", label: "Self Service", kind: "item" },
  { id: "eservices", label: "eServices", kind: "item" },
  { id: "assessments", label: "Assessments", kind: "item" },
  { id: "case-registers", label: "Case Registers", kind: "item" },
  { id: "surveillance-operations", label: "Surveillance", kind: "item" },
  {
    id: "outbreak-management",
    label: "Outbreak Management",
    kind: "group",
    children: [
      {
        id: "cif",
        label: "CIF",
        kind: "group",
        children: [
          { id: "cif-home", label: "Home", kind: "item" },
          { id: "cif-outbreak", label: "Outbreak", kind: "item" },
          { id: "cif-vhf", label: "VHF", kind: "item" },
          { id: "cif-mpox", label: "MPOX", kind: "item" }
        ]
      },
      { id: "contact-tracing", label: "Contact Tracing", kind: "item" },
      { id: "case-management", label: "Case Management", kind: "item" },
      { id: "deployment", label: "Deployment", kind: "item" },
      { id: "quarantine", label: "Quarantine", kind: "item" }
    ]
  },
  {
    id: "reference-databases",
    label: "Reference Databases",
    kind: "group",
    children: [
      { id: "facilities-registry", label: "Facilities Registry", kind: "item" },
      { id: "district-profiles", label: "District Profiles", kind: "item" },
      { id: "subcounty-profiles", label: "Subcounty Profiles", kind: "item" },
      { id: "village-profiles", label: "Village Profiles", kind: "item" },
      { id: "partner-directory", label: "Partner Directory", kind: "item" }
    ]
  }
];

function createLeafPage(input: {
  id: string;
  title: string;
  source: string;
  cadence: string;
  owner: string;
  intro: string;
  actions: string[];
  checks: string[];
  dataTable?: PortalPageContent["dataTable"];
  summaryCards?: PortalPageContent["summaryCards"];
}): PortalPageContent {
  return {
    dataTable: input.dataTable,
    id: input.id,
    title: input.title,
    intro: input.intro,
    records: [
      { label: "Primary source", value: input.source },
      { label: "Refresh cadence", value: input.cadence },
      { label: "Responsible unit", value: input.owner }
    ],
    sections: [
      { title: "Expected actions", items: input.actions },
      { title: "Validation checklist", items: input.checks }
    ],
    summaryCards: input.summaryCards
  };
}

function createGroupPage(input: {
  id: string;
  title: string;
  intro: string;
  owner: string;
  modules: string[];
  process: string[];
}): PortalPageContent {
  return {
    id: input.id,
    title: input.title,
    intro: input.intro,
    records: [
      { label: "Workspace type", value: "Parent menu / operational hub" },
      { label: "Primary owner", value: input.owner },
      { label: "Module count", value: `${input.modules.length} active modules` }
    ],
    sections: [
      { title: "Included modules", items: input.modules },
      { title: "Working pattern", items: input.process }
    ]
  };
}

const portalContentById: Record<string, PortalPageContent> = {
  "system-settings": {
    id: "system-settings",
    title: "System Settings",
    intro: "Manage RBAC roles, permissions, and user access controls for this platform.",
    records: [],
    sections: []
  },
  home: {
    id: "home",
    title: "Home",
    intro: "The portal opens into a deliberately minimal workspace so users can move directly into a reporting or response module without extra noise.",
    message: "This is the landing zone .....!",
    records: [
      { label: "Portal mode", value: "Legacy command surface" },
      { label: "Interaction model", value: "Tree navigation with cached detail panes" },
      { label: "Implementation", value: "Next.js App Router + TanStack Query" }
    ],
    sections: [
      {
        title: "Priority workspaces",
        items: [
          "Data and Statistics for routine service reporting and burden summaries.",
          "Outbreak Management for operational field actions and coordination.",
          "Reference Databases for facilities, district, and partner master data."
        ]
      },
      {
        title: "Design principles",
        items: [
          "SOLID: responsibilities are split across data, hooks, and presentation components.",
          "KISS: only navigation, content retrieval, and legacy shell behavior are implemented.",
          "YAGNI: the shell stays focused on core navigation and reporting even with lightweight access control in place."
        ]
      }
    ]
  },
  "data-and-statistics": createGroupPage({
    id: "data-and-statistics",
    title: "Data and Statistics",
    intro: "A consolidated entry point for operational metrics, disease trend summaries, and routine service performance reviews.",
    owner: "Health Information and Analytics",
    modules: [
      "Service Utilization",
      "Disease Burden",
      "Communicable Disease",
      "NCDs",
      "NTDs",
      "Injuries",
      "Malnutrition"
    ],
    process: [
      "Start with routine utilization checks before reviewing burden and surveillance trends.",
      "Use the same menu path for quick operator recall across district and national users.",
      "Keep results readable in a plain content pane for older field devices and shared desktops."
    ]
  }),
  "user-management": createGroupPage({
    id: "user-management",
    title: "User Management",
    intro:
      "User Management is now organized as a folder so administrators can enter the workspace from a stable parent node and expand into concrete files as the module grows.",
    owner: "System Administration",
    modules: ["Home"],
    process: [
      "Open Home to load the live user administration workspace.",
      "Keep the parent folder stable so additional admin files can be added later without changing the tree pattern.",
      "Use the same legacy shell for user review, permissions, and update workflows."
    ]
  }),
  "user-management-home": {
    id: "user-management-home",
    title: "Home",
    intro:
      "Review accounts, inspect effective permissions, and send controlled update payloads to the live administration API without leaving the legacy portal shell.",
    records: [
      { label: "Primary source", value: "Response platform user administration API" },
      { label: "Refresh cadence", value: "Live on-demand query" },
      { label: "Responsible unit", value: "System Administration" }
    ],
    sections: []
  },
  "service-utilization": createLeafPage({
    id: "service-utilization",
    title: "Service Utilization",
    source: "Facility monthly returns",
    cadence: "Daily cache / monthly reporting cycle",
    owner: "Routine M&E",
    intro: "Review outpatient, inpatient, and program service usage without leaving the main operational shell.",
    actions: [
      "Check volume shifts by district and service category.",
      "Identify facilities with missing or delayed reporting.",
      "Prepare quick utilization summaries for management review."
    ],
    checks: [
      "Confirm reporting period selection.",
      "Verify incomplete facility submissions are flagged.",
      "Match high-level totals with the latest routine extracts."
    ]
  }),
  "disease-burden": createLeafPage({
    id: "disease-burden",
    title: "Disease Burden",
    source: "National disease surveillance and aggregate reports",
    cadence: "Weekly review",
    owner: "Epidemiology Unit",
    intro: "Track burden indicators in a compact summary view that supports routine monitoring and escalation.",
    actions: [
      "Compare burden indicators against recent baselines.",
      "Review abnormal spikes before circulating summary notes.",
      "Flag districts that need rapid follow-up."
    ],
    checks: [
      "Confirm denominator updates are current.",
      "Reconcile burden summaries with outbreak notifications.",
      "Retain a stable layout for rapid operator scanning."
    ]
  }),
  "communicable-disease": createLeafPage({
    id: "communicable-disease",
    title: "Communicable Disease",
    source: "Case-based reporting and routine surveillance",
    cadence: "Near-real-time operational review",
    owner: "Public Health Surveillance",
    intro: "Monitor communicable disease signals inside the same portal frame used for response and deployment workflows.",
    actions: [
      "Review fresh case notifications and trend movement.",
      "Coordinate rapid escalation with outbreak teams.",
      "Check whether transmission clusters need deeper field attention."
    ],
    checks: [
      "Validate case definitions and source completeness.",
      "Confirm duplicate notifications are resolved.",
      "Keep district naming aligned with the master reference set."
    ]
  }),
  ncds: createLeafPage({
    id: "ncds",
    title: "NCDs",
    source: "Program and facility aggregate reporting",
    cadence: "Monthly review",
    owner: "NCD Programme",
    intro: "Provide a simple summary surface for chronic disease indicators that does not overwhelm legacy users.",
    actions: [
      "Track hypertension and diabetes service patterns.",
      "Compare districts with sustained reporting gaps.",
      "Prepare management-ready summaries without exporting first."
    ],
    checks: [
      "Validate indicator mappings to the current reporting tools.",
      "Check that zero values are true zeroes, not missing data.",
      "Verify all facilities inherit the latest district structure."
    ]
  }),
  ntds: createLeafPage({
    id: "ntds",
    title: "NTDs",
    source: "NTD programme operational returns",
    cadence: "Campaign and monthly review",
    owner: "NTD Programme",
    intro: "Keep neglected tropical disease activity visible inside the shared national portal instead of a separate silo.",
    actions: [
      "Review endemic district activity and intervention coverage.",
      "Track campaign readiness and completion snapshots.",
      "Surface gaps requiring partner coordination."
    ],
    checks: [
      "Verify intervention periods match the reporting window.",
      "Confirm partner-supported districts are tagged correctly.",
      "Check campaign completion notes before sharing status."
    ]
  }),
  injuries: createLeafPage({
    id: "injuries",
    title: "Injuries",
    source: "Emergency and facility incident returns",
    cadence: "Weekly review",
    owner: "Emergency Services",
    intro: "Expose injury trends through the same spare interface pattern used across the portal for consistency.",
    actions: [
      "Watch incident categories and affected locations.",
      "Review facility load during peak incident periods.",
      "Highlight districts needing prevention follow-up."
    ],
    checks: [
      "Verify emergency units submitted the latest summaries.",
      "Check classification consistency across reporting sources.",
      "Confirm high-volume anomalies have a known explanation."
    ]
  }),
  malnutrition: createLeafPage({
    id: "malnutrition",
    title: "Malnutrition",
    source: "Nutrition programme and facility reporting",
    cadence: "Weekly programme review",
    owner: "Nutrition Division",
    intro: "Provide a direct operational window into nutrition trends while preserving the portal's low-friction legacy feel.",
    actions: [
      "Review admissions and recovery metrics.",
      "Track hotspot districts for rapid support.",
      "Share a clear operational summary with programme leads."
    ],
    checks: [
      "Validate programme site reporting completeness.",
      "Confirm severe and moderate case classifications remain separated.",
      "Review stock-related notes before escalating results."
    ]
  }),
  programmes: createGroupPage({
    id: "programmes",
    title: "Programmes",
    intro: "A parent workspace that shows how programme areas can expand into deeper folders while keeping the old-school portal structure intact.",
    owner: "Programme Coordination",
    modules: ["HIV/AIDS", "RMNCAH", "TB and Leprosy"],
    process: [
      "Open a programme folder first, then drill into service areas and operational pages.",
      "Keep nested folders visible so users understand where each page belongs.",
      "Use the plus and minus boxes to demonstrate how deeper hierarchy can still stay manageable."
    ]
  }),
  "hiv-aids-programme": createGroupPage({
    id: "hiv-aids-programme",
    title: "HIV/AIDS",
    intro: "A nested programme branch for prevention, treatment, and community support workflows.",
    owner: "HIV Programme Management",
    modules: ["Prevention", "Care and Treatment", "Community Systems"],
    process: [
      "Start in the programme branch before moving to service or clinic-level pages.",
      "Keep treatment and prevention work separated so teams can collapse what they do not need.",
      "Use the tree depth to mirror how programme teams already think about their work."
    ]
  }),
  "prevention-services": createLeafPage({
    id: "prevention-services",
    title: "Prevention",
    source: "Prevention activity summaries",
    cadence: "Weekly operational review",
    owner: "HIV Prevention Desk",
    intro: "Track core prevention activities from a simple page nested under the wider HIV programme branch.",
    actions: [
      "Review outreach, testing, and prevention service updates.",
      "Spot districts that need additional prevention support.",
      "Prepare concise programme notes for coordination meetings."
    ],
    checks: [
      "Confirm reporting periods line up with outreach schedules.",
      "Validate district totals before sharing trend summaries.",
      "Check that action owners are named for each flagged issue."
    ]
  }),
  "care-and-treatment": createGroupPage({
    id: "care-and-treatment",
    title: "Care and Treatment",
    intro: "A deeper nested folder showing how treatment sub-areas can sit under a major programme branch.",
    owner: "Clinical HIV Services",
    modules: ["ART Clinic", "Viral Load Monitoring"],
    process: [
      "Collapse the parent programme branch when teams only need treatment pages.",
      "Use the subfolder to keep clinic and monitoring pages grouped together.",
      "Keep labels short so the deeper tree still scans quickly."
    ]
  }),
  "art-clinic": createLeafPage({
    id: "art-clinic",
    title: "ART Clinic",
    source: "ART clinic service records",
    cadence: "Daily clinic review",
    owner: "ART Service Coordination",
    intro: "Review treatment clinic operations from a page nested two levels beneath Programmes.",
    actions: [
      "Check clinic attendance and refill completion.",
      "Review pending follow-up actions for active clients.",
      "Escalate service bottlenecks affecting continuity of treatment."
    ],
    checks: [
      "Confirm clinic dates and facility names are current.",
      "Verify defaulter and return-to-care notes are complete.",
      "Review unusual attendance drops before publishing summaries."
    ]
  }),
  "viral-load-monitoring": createLeafPage({
    id: "viral-load-monitoring",
    title: "Viral Load Monitoring",
    source: "Laboratory and programme monitoring extracts",
    cadence: "Daily cache / weekly programme review",
    owner: "HIV Monitoring Team",
    intro: "Keep viral load follow-up visible inside the treatment branch without leaving the legacy shell.",
    actions: [
      "Review pending viral load results and overdue follow-ups.",
      "Identify facilities with monitoring backlogs.",
      "Prepare a short list of clients or sites needing action."
    ],
    checks: [
      "Confirm sample dates and reporting periods match.",
      "Validate suppressed and unsuppressed counts before sharing.",
      "Check that escalation notes are attached to delayed results."
    ]
  }),
  "community-systems": createLeafPage({
    id: "community-systems",
    title: "Community Systems",
    source: "Community support activity logs",
    cadence: "Weekly review",
    owner: "Community Linkages Team",
    intro: "Surface community follow-up and linkage activities from within the HIV/AIDS programme structure.",
    actions: [
      "Review support group, linkage, and adherence activities.",
      "Track community teams needing additional supervision.",
      "Share field coordination notes with programme managers."
    ],
    checks: [
      "Confirm location and implementing partner details are complete.",
      "Validate activity counts before closing the reporting period.",
      "Review unresolved community referrals."
    ]
  }),
  rmncaah: createGroupPage({
    id: "rmncaah",
    title: "RMNCAH",
    intro: "A second nested programme branch to demonstrate multiple expandable folders under Programmes.",
    owner: "RMNCAH Programme Coordination",
    modules: ["Maternal Health", "Child Health", "Family Planning"],
    process: [
      "Use grouped folders to keep maternal and child services easy to locate.",
      "Collapse sections that are not part of the current review session.",
      "Mirror the real reporting hierarchy so the demo feels believable."
    ]
  }),
  "maternal-health": createGroupPage({
    id: "maternal-health",
    title: "Maternal Health",
    intro: "A third-level example that shows a child folder can also contain its own children and still get an expander box.",
    owner: "Maternal Health Desk",
    modules: ["Antenatal Care", "Safe Delivery"],
    process: [
      "Keep maternal workflows grouped below the RMNCAH branch.",
      "Use deeper nesting to separate broad areas from direct action pages.",
      "Rely on the expand boxes to keep the sidebar compact."
    ]
  }),
  "antenatal-care": createLeafPage({
    id: "antenatal-care",
    title: "Antenatal Care",
    source: "ANC clinic and outreach records",
    cadence: "Daily cache / monthly review",
    owner: "ANC Services",
    intro: "Review maternal service activity from a deeply nested page to prove the hierarchy remains usable.",
    actions: [
      "Track ANC attendance and early booking trends.",
      "Identify facilities with missing maternal reports.",
      "Prepare quick follow-up actions for supportive supervision."
    ],
    checks: [
      "Confirm period totals reconcile with submitted returns.",
      "Validate high-risk referral notes.",
      "Review any missing facility submissions before close."
    ]
  }),
  "safe-delivery": createLeafPage({
    id: "safe-delivery",
    title: "Safe Delivery",
    source: "Maternity service summaries",
    cadence: "Daily operational review",
    owner: "Maternity Services",
    intro: "Track delivery-related service performance inside the maternal health folder.",
    actions: [
      "Review facility delivery volumes and referral concerns.",
      "Spot service gaps that need urgent support.",
      "Coordinate follow-up with district maternal health teams."
    ],
    checks: [
      "Confirm delivery totals match current maternity returns.",
      "Validate complication notes and emergency referral status.",
      "Review missing high-volume facility updates."
    ]
  }),
  "child-health": createLeafPage({
    id: "child-health",
    title: "Child Health",
    source: "Child service delivery summaries",
    cadence: "Weekly operational review",
    owner: "Child Health Desk",
    intro: "Keep child service pages one level below RMNCAH for quick access during supervision reviews.",
    actions: [
      "Review child service trends and coverage issues.",
      "Track facilities needing follow-up support.",
      "Prepare child health talking points for management."
    ],
    checks: [
      "Confirm the reporting period is correct.",
      "Validate district rollups before sharing.",
      "Review facilities with sudden reporting changes."
    ]
  }),
  "family-planning": createLeafPage({
    id: "family-planning",
    title: "Family Planning",
    source: "Family planning service summaries",
    cadence: "Weekly operational review",
    owner: "Family Planning Programme",
    intro: "Provide a direct family planning page under the RMNCAH branch without adding unnecessary extra nesting.",
    actions: [
      "Review method uptake and stock-related service issues.",
      "Track sites with declining reporting completeness.",
      "Summarize priority follow-up actions for programme leads."
    ],
    checks: [
      "Confirm service totals align with source submissions.",
      "Review any stock-out notes before escalation.",
      "Validate district and facility labels."
    ]
  }),
  "tb-leprosy": createLeafPage({
    id: "tb-leprosy",
    title: "TB and Leprosy",
    source: "TB and leprosy programme reports",
    cadence: "Weekly review",
    owner: "TB and Leprosy Control Programme",
    intro: "A flat child page kept alongside nested folders to show mixed tree depths can coexist cleanly.",
    actions: [
      "Review case finding, treatment, and support updates.",
      "Track facilities or districts needing follow-up.",
      "Prepare short programme coordination notes."
    ],
    checks: [
      "Confirm reporting timelines are current.",
      "Validate programme totals before sharing them upward.",
      "Review unresolved facility issues before close of review."
    ]
  }),
  lab: createLeafPage({
    id: "lab",
    title: "Lab",
    source: "Laboratory reporting channels",
    cadence: "Daily review",
    owner: "National Laboratory Services",
    intro: "Surface laboratory operations in a plain panel that supports older screens and high-pace review sessions.",
    actions: [
      "Track sample throughput and pending results.",
      "Review lab turnaround concerns flagged by districts.",
      "Coordinate escalations when diagnostics capacity is constrained."
    ],
    checks: [
      "Verify specimen counts against the latest submissions.",
      "Confirm priority tests retain current routing information.",
      "Review delayed-result exceptions before close of day."
    ]
  }),
  pharmaceuticals: createLeafPage({
    id: "pharmaceuticals",
    title: "Pharmaceuticals",
    source: "Logistics and stock management summaries",
    cadence: "Daily operational refresh",
    owner: "Pharmaceutical Services",
    intro: "Keep stock, supply, and availability signals accessible from the same legacy shell used elsewhere in the portal.",
    actions: [
      "Review essential medicine stock pressure areas.",
      "Track facilities at risk of stock-out.",
      "Share simple replenishment priorities with operations staff."
    ],
    checks: [
      "Confirm facility-level submissions landed for the current period.",
      "Validate medicine naming against the reference catalog.",
      "Investigate negative balance or impossible consumption values."
    ]
  }),
  "health-security": createLeafPage({
    id: "health-security",
    title: "Health Security",
    source: "Preparedness and threat monitoring inputs",
    cadence: "Continuous monitoring",
    owner: "Health Security Department",
    intro: "Support preparedness and national visibility without changing the familiar government-portal interaction pattern.",
    actions: [
      "Track active preparedness concerns and response status.",
      "Review inter-agency action points.",
      "Maintain a visible operational summary for leadership."
    ],
    checks: [
      "Verify the latest threat notes are attached to the correct area.",
      "Confirm responsible teams are current.",
      "Keep major actions understandable at a glance."
    ]
  }),
  "surveillance-reports": createLeafPage({
    id: "surveillance-reports",
    title: "Surveillance",
    source: "Routine surveillance reports",
    cadence: "Daily and weekly review",
    owner: "Surveillance Team",
    intro: "A reporting-focused surveillance surface that complements outbreak-specific operations below.",
    actions: [
      "Review signal summaries and reporting completeness.",
      "Identify districts needing immediate clarification.",
      "Maintain a stable operational view for rapid scanning."
    ],
    checks: [
      "Confirm report periods are correct.",
      "Validate district rollups before distribution.",
      "Review all newly opened alerts against existing cases."
    ]
  }),
  "standard-reports": createLeafPage({
    id: "standard-reports",
    title: "Standard Reports",
    source: "Saved report definitions",
    cadence: "On demand",
    owner: "Analytics Support",
    intro: "A central place for commonly reused reports, kept intentionally plain to match legacy expectations.",
    actions: [
      "Open common national and district report packs.",
      "Reduce duplicate ad hoc report requests.",
      "Provide users with a stable report lookup pattern."
    ],
    checks: [
      "Verify report definitions reflect current indicator names.",
      "Check period defaults before distribution.",
      "Keep high-use reports near the top of the workflow."
    ]
  }),
  "human-resources": createLeafPage({
    id: "human-resources",
    title: "Human Resources",
    source: "Staffing and deployment records",
    cadence: "Daily operational review",
    owner: "HR Directorate",
    intro: "Use the same portal shell to review staffing readiness, field assignments, and human resource actions.",
    actions: [
      "Review staffing gaps by location.",
      "Track active assignments and redeployments.",
      "Support quick workforce decisions during response periods."
    ],
    checks: [
      "Confirm assignment dates are current.",
      "Validate staff records against the master directory.",
      "Review incomplete profiles before escalation."
    ]
  }),
  "client-satisfaction": createLeafPage({
    id: "client-satisfaction",
    title: "Client Satisfaction",
    source: "Patient and citizen feedback summaries",
    cadence: "Monthly review",
    owner: "Quality Improvement",
    intro: "Expose feedback summaries in a familiar layout so programme staff can review them without retraining.",
    actions: [
      "Review satisfaction trends across facilities.",
      "Highlight priority service pain points.",
      "Prepare concise notes for facility follow-up."
    ],
    checks: [
      "Confirm survey periods match the visible summaries.",
      "Validate location mappings for all responses.",
      "Keep response categories consistent across periods."
    ]
  }),
  "quality-of-care": createLeafPage({
    id: "quality-of-care",
    title: "Quality of care",
    source: "Facility quality assessments and supervision notes",
    cadence: "Monthly review",
    owner: "Quality Assurance",
    intro: "A straightforward quality-of-care workspace built for quick review sessions inside a legacy shell.",
    actions: [
      "Review supervision and assessment outcomes.",
      "Track open quality improvement actions.",
      "Flag facilities requiring direct support."
    ],
    checks: [
      "Confirm assessment tools are the latest approved versions.",
      "Validate facilities against the current registry.",
      "Check that all open actions have an owner."
    ]
  }),
  "self-service": createLeafPage({
    id: "self-service",
    title: "Self Service",
    source: "Portal utility functions",
    cadence: "On demand",
    owner: "Portal Administration",
    intro: "Keep routine user utilities reachable without moving away from the main operational frame.",
    actions: [
      "Open common user-request tasks.",
      "Reduce help-desk dependency for simple actions.",
      "Preserve the same navigation pattern used across the portal."
    ],
    checks: [
      "Confirm utility names are clear and task-oriented.",
      "Avoid mixing admin-only and end-user functions.",
      "Keep the menu lean to match legacy expectations."
    ]
  }),
  eservices: createLeafPage({
    id: "eservices",
    title: "eServices",
    source: "Integrated service entry points",
    cadence: "On demand",
    owner: "Digital Health Services",
    intro: "Expose linked digital service actions through a plain enterprise shell that still feels familiar to long-time users.",
    actions: [
      "Access linked transactional services.",
      "Keep service access visible from the same portal home.",
      "Limit context switching for frontline users."
    ],
    checks: [
      "Confirm service links map to active modules.",
      "Review naming for plain-language clarity.",
      "Keep navigation order stable between releases."
    ]
  }),
  assessments: createLeafPage({
    id: "assessments",
    title: "Assessments",
    source: "Assessment workflows and submitted tools",
    cadence: "By exercise or visit",
    owner: "Assessment Coordination",
    intro: "Provide a single operational place for structured assessments without redesigning the whole portal experience.",
    actions: [
      "Track assessment schedules and submissions.",
      "Review open findings and follow-up requirements.",
      "Prepare concise summaries for oversight teams."
    ],
    checks: [
      "Confirm current templates are in use.",
      "Validate site and district assignments.",
      "Check incomplete submissions before sign-off."
    ]
  }),
  "case-registers": createLeafPage({
    id: "case-registers",
    title: "Case Registers",
    source: "Programme and case-based registers",
    cadence: "Continuous review",
    owner: "Programme Operations",
    intro: "Keep register access in the main portal so users do not need to learn a separate navigation model.",
    actions: [
      "Open active case lists and register views.",
      "Review missing or late follow-up entries.",
      "Support fast operational case tracking."
    ],
    checks: [
      "Confirm person and event identifiers remain unique.",
      "Validate district and facility relationships.",
      "Review open records for missing mandatory data."
    ]
  }),
  "surveillance-operations": createLeafPage({
    id: "surveillance-operations",
    title: "Surveillance",
    source: "Operational surveillance actions",
    cadence: "Continuous monitoring",
    owner: "Field Surveillance Operations",
    intro: "A second surveillance entry point focused on action-oriented operations rather than reporting summaries.",
    actions: [
      "Track active surveillance tasks and escalations.",
      "Coordinate district follow-up when alerts arrive.",
      "Keep response teams aligned on current signals."
    ],
    checks: [
      "Confirm assigned actions still have owners.",
      "Verify alert status is current before escalation.",
      "Keep notes concise for shift handover."
    ]
  }),
  "outbreak-management": createGroupPage({
    id: "outbreak-management",
    title: "Outbreak Management",
    intro: "A dedicated operational hub for investigations, deployments, contact tracing, and quarantine workflows.",
    owner: "Public Health Emergency Operations",
    modules: ["CIF", "Contact Tracing", "Case Management", "Deployment", "Quarantine"],
    process: [
      "Keep related emergency tasks grouped so field teams can move quickly.",
      "Use one navigation tree to reduce operator hesitation during response work.",
      "Cache page data with TanStack Query for snappier repeat access."
    ]
  }),
  cif: createGroupPage({
    id: "cif",
    title: "CIF",
    intro: "CIF is now organized as a folder with four files so teams can move between the initial landing screen and disease-specific investigation views without leaving the response tree.",
    owner: "Incident Investigation Team",
    modules: ["Home", "Outbreak", "VHF", "MPOX"],
    process: [
      "Open Home first for the initial CIF landing screen and quick operational orientation.",
      "Move into Outbreak, VHF, or MPOX when the review needs disease-specific case investigation views.",
      "Keep the folder structure stable so operators can find the same four files every time."
    ]
  }),
  "cif-home": createLeafPage({
    id: "cif-home",
    title: "Home",
    source: "Case investigation forms",
    cadence: "Near-real-time review",
    owner: "Incident Investigation Team",
    intro: "The initial CIF screen provides a quick operational view of case investigation activity before teams drill into outbreak-specific workflows.",
    summaryCards: [
      { label: "Open CIFs", value: "128", note: "All active investigations in the current queue" },
      { label: "Pending Review", value: "19", note: "Forms still waiting for district verification" },
      { label: "High Priority", value: "7", note: "Flagged for same-day epidemiology follow-up" },
      { label: "Closed Today", value: "24", note: "Investigations completed in the last 24 hours" }
    ],
    dataTable: {
      title: "Recent Case Investigation Forms",
      caption: "Dummy data for the CIF workspace preview",
      columns: ["CIF ID", "Patient", "District", "Condition", "Status", "Assigned to", "Updated"],
      rows: [
        {
          id: "cif-001",
          cells: ["CIF-2026-001", "Sarah A.", "Kampala", "Cholera", "Pending Review", "Dr. Namusoke", "18 Mar 2026, 09:14"]
        },
        {
          id: "cif-002",
          cells: ["CIF-2026-002", "Peter K.", "Wakiso", "Measles", "Under Investigation", "M. Otema", "18 Mar 2026, 08:42"]
        },
        {
          id: "cif-003",
          cells: ["CIF-2026-003", "Amina N.", "Gulu", "Viral Hemorrhagic Fever", "High Priority", "Rapid Response Team", "18 Mar 2026, 08:05"]
        },
        {
          id: "cif-004",
          cells: ["CIF-2026-004", "Joseph B.", "Mbale", "Anthrax", "Field Verification", "L. Chebet", "17 Mar 2026, 16:31"]
        },
        {
          id: "cif-005",
          cells: ["CIF-2026-005", "Esther T.", "Mbarara", "Typhoid", "Closed", "D. Twinomugisha", "17 Mar 2026, 15:08"]
        }
      ]
    },
    actions: [
      "Open newly created investigation forms.",
      "Check completeness before advancing cases.",
      "Coordinate with tracing and case management teams."
    ],
    checks: [
      "Confirm identifiers and dates are complete.",
      "Check exposure details for missing core fields.",
      "Resolve duplicates before downstream action."
    ]
  }),
  "cif-outbreak": createLeafPage({
    id: "cif-outbreak",
    title: "Outbreak",
    source: "Outbreak-linked case investigation forms",
    cadence: "Continuous response review",
    owner: "Outbreak Investigation Desk",
    intro: "Focus on outbreak-linked investigation records with a straightforward grid that keeps triage and escalation visible.",
    summaryCards: [
      { label: "Open outbreaks", value: "14", note: "Investigations currently tied to active outbreak events" },
      { label: "Escalations", value: "5", note: "Outbreak CIFs needing same-day epidemiology review" },
      { label: "District review", value: "11", note: "Records waiting for district outbreak confirmation" },
      { label: "Closed this week", value: "38", note: "Outbreak investigations completed in the current reporting week" }
    ],
    dataTable: {
      title: "Outbreak CIF Queue",
      caption: "Representative outbreak-oriented CIF records for the folder preview",
      columns: ["Outbreak", "CIF ID", "District", "Stage", "Priority", "Assigned", "Updated"],
      rows: [
        {
          id: "cif-outbreak-001",
          cells: ["Cholera Cluster 04", "CIF-OB-001", "Kampala", "Verification", "High", "Dr. Namusoke", "23 Mar 2026, 09:18"]
        },
        {
          id: "cif-outbreak-002",
          cells: ["Measles Alert 09", "CIF-OB-002", "Arua", "Field Follow-up", "Medium", "A. Draru", "23 Mar 2026, 08:47"]
        },
        {
          id: "cif-outbreak-003",
          cells: ["Anthrax Alert 02", "CIF-OB-003", "Mbale", "Desk Review", "Medium", "L. Chebet", "22 Mar 2026, 17:03"]
        }
      ]
    },
    actions: [
      "Prioritize outbreak-linked CIFs with active escalations.",
      "Track which districts still need to complete verification.",
      "Coordinate case review with the emergency desk and surveillance leads."
    ],
    checks: [
      "Confirm every outbreak CIF is attached to the correct event.",
      "Review priority flags before assigning next actions.",
      "Ensure district status reflects the latest field update."
    ]
  }),
  "cif-vhf": createLeafPage({
    id: "cif-vhf",
    title: "VHF",
    source: "Viral hemorrhagic fever investigation forms",
    cadence: "High-alert operational review",
    owner: "VHF Response Desk",
    intro:
      "Review the live VHF patient registry in a focused CIF screen built for rapid triage, field follow-up, and laboratory coordination.",
    summaryCards: [
      { label: "Active VHF CIFs", value: "9", note: "Open VHF investigations in the current monitoring window" },
      { label: "Lab pending", value: "4", note: "Waiting for sample confirmation or result posting" },
      { label: "Field follow-up", value: "3", note: "Records requiring immediate district follow-up" },
      { label: "Closed 72h", value: "6", note: "VHF investigations closed in the last three days" }
    ],
    dataTable: {
      title: "VHF Investigation Queue",
      caption: "Representative VHF CIF records in the current workflow",
      columns: ["CIF ID", "Patient", "District", "Specimen", "Status", "Assigned team", "Updated"],
      rows: [
        {
          id: "cif-vhf-001",
          cells: ["CIF-VHF-001", "Amina N.", "Gulu", "Collected", "Lab Pending", "Rapid Response Team", "23 Mar 2026, 08:12"]
        },
        {
          id: "cif-vhf-002",
          cells: ["CIF-VHF-002", "John O.", "Kasese", "In Transit", "Field Follow-up", "VHF Desk", "22 Mar 2026, 16:29"]
        },
        {
          id: "cif-vhf-003",
          cells: ["CIF-VHF-003", "Grace T.", "Masaka", "Received", "Review", "Lab Liaison", "22 Mar 2026, 14:55"]
        }
      ]
    },
    actions: [
      "Review specimen movement and laboratory status for each active VHF CIF.",
      "Escalate high-risk investigations to the rapid response desk immediately.",
      "Keep field and lab teams aligned on the same record state."
    ],
    checks: [
      "Validate symptom onset and exposure timelines.",
      "Confirm specimen chain-of-custody details are complete.",
      "Ensure VHF priority cases have current assignment ownership."
    ]
  }),
  "cif-mpox": createLeafPage({
    id: "cif-mpox",
    title: "MPOX",
    source: "MPOX case investigation forms",
    cadence: "Daily response review",
    owner: "MPOX Incident Team",
    intro: "Use the MPOX file to review case investigations, cluster context, and operational follow-up in a disease-specific screen.",
    summaryCards: [
      { label: "Open MPOX CIFs", value: "21", note: "Current investigations linked to MPOX notifications" },
      { label: "Cluster linked", value: "8", note: "Cases already mapped to known transmission clusters" },
      { label: "Needs interview", value: "6", note: "Cases waiting for complete interview capture" },
      { label: "Closed today", value: "5", note: "MPOX investigation forms resolved in the last day" }
    ],
    dataTable: {
      title: "MPOX Investigation Queue",
      caption: "Representative MPOX CIF records for the folder preview",
      columns: ["CIF ID", "District", "Cluster", "Interview", "Status", "Owner", "Updated"],
      rows: [
        {
          id: "cif-mpox-001",
          cells: ["CIF-MPX-001", "Wakiso", "Cluster A", "Complete", "Review", "N. Kyomuhendo", "23 Mar 2026, 09:01"]
        },
        {
          id: "cif-mpox-002",
          cells: ["CIF-MPX-002", "Kampala", "Unlinked", "Pending", "Needs Interview", "C. Lule", "22 Mar 2026, 18:26"]
        },
        {
          id: "cif-mpox-003",
          cells: ["CIF-MPX-003", "Mukono", "Cluster B", "Complete", "Closed", "MPOX Desk", "22 Mar 2026, 13:40"]
        }
      ]
    },
    actions: [
      "Track interview completion and cluster linkage for active MPOX CIFs.",
      "Separate unlinked cases quickly for epidemiology review.",
      "Prepare concise operational notes for the incident management team."
    ],
    checks: [
      "Confirm cluster assignment is current.",
      "Validate rash onset and interview completeness.",
      "Review open records for missing exposure or contact details."
    ]
  }),
  "contact-tracing": createLeafPage({
    id: "contact-tracing",
    title: "Contact Tracing",
    source: "Tracing operations register",
    cadence: "Continuous field update",
    owner: "Tracing Operations",
    intro: "A direct operational surface for tracing teams that keeps the interface simple and familiar during busy response periods.",
    actions: [
      "Track active contacts and follow-up status.",
      "Review unassigned or overdue tracing actions.",
      "Coordinate field team workload by district."
    ],
    checks: [
      "Confirm every contact links to an active case.",
      "Review overdue follow-up visits.",
      "Keep phone and location data current for field use."
    ]
  }),
  "case-management": createLeafPage({
    id: "case-management",
    title: "Case Management",
    source: "Clinical and response case workflows",
    cadence: "Continuous operational update",
    owner: "Clinical Response Coordination",
    intro: "Provide case operations teams with a plain, stable workspace for reviewing current management actions.",
    actions: [
      "Review active cases and current clinical status.",
      "Coordinate handoffs between facilities and teams.",
      "Track pending actions that affect response flow."
    ],
    checks: [
      "Confirm case status transitions are complete.",
      "Validate facility assignment and responsible clinician details.",
      "Review unresolved escalations before shift change."
    ]
  }),
  deployment: createLeafPage({
    id: "deployment",
    title: "Deployment",
    source: "Emergency field deployment records",
    cadence: "Live operational update",
    owner: "Emergency Operations Center",
    intro: "Manage team movement, field assignments, and logistics in a lean interface that feels close to the original portal.",
    actions: [
      "Review active deployments and staffing coverage.",
      "Track district requests against available teams.",
      "Prepare handover notes for incoming operations staff."
    ],
    checks: [
      "Confirm assignment dates and destinations are current.",
      "Validate each deployment has a named lead and support roster.",
      "Review transport or accommodation blockers before dispatch."
    ]
  }),
  quarantine: createLeafPage({
    id: "quarantine",
    title: "Quarantine",
    source: "Quarantine monitoring records",
    cadence: "Daily response review",
    owner: "Quarantine Operations",
    intro: "Track quarantine-related actions using the same low-friction shell as the rest of the emergency workspace.",
    actions: [
      "Review quarantine locations and occupancy status.",
      "Track follow-up issues requiring escalation.",
      "Coordinate releases and compliance notes."
    ],
    checks: [
      "Confirm location and case links are still valid.",
      "Review outstanding welfare or logistics issues.",
      "Validate release dates before closure."
    ]
  }),
  "reference-databases": createGroupPage({
    id: "reference-databases",
    title: "Reference Databases",
    intro: "Manage stable lookup data that powers menus, rollups, and operational joins across the portal.",
    owner: "Master Data Administration",
    modules: ["Facilities Registry", "District Profiles", "Partner Directory"],
    process: [
      "Use reference records to keep reporting and operations consistent.",
      "Update master data carefully because many modules depend on it.",
      "Keep pages plain and easy to inspect on older office machines."
    ]
  }),
  "facilities-registry": createLeafPage({
    id: "facilities-registry",
    title: "Facilities Registry",
    source: "Master facilities reference data",
    cadence: "As changes are approved",
    owner: "Facility Registry Administration",
    intro: "Maintain a single source of truth for facilities used by reporting, outbreaks, and programme workflows.",
    actions: [
      "Review facility additions and updates.",
      "Check ownership, district, and service attributes.",
      "Support cross-module consistency for location data."
    ],
    checks: [
      "Confirm facility identifiers remain unique.",
      "Validate district and ownership mappings.",
      "Review deactivated facilities before hiding them downstream."
    ]
  }),
  "district-profiles": createLeafPage({
    id: "district-profiles",
    title: "District Profiles",
    source: "Master district reference data",
    cadence: "As administrative updates occur",
    owner: "Administrative Data Management",
    intro: "Keep district hierarchies and naming stable so reporting and operations align cleanly.",
    actions: [
      "Review district names, codes, and hierarchy changes.",
      "Track new administrative units.",
      "Coordinate updates before dependent modules refresh."
    ],
    checks: [
      "Confirm district codes remain canonical.",
      "Validate region and parent hierarchy fields.",
      "Review downstream impact before publishing changes."
    ]
  }),
  "subcounty-profiles": createLeafPage({
    id: "subcounty-profiles",
    title: "Subcounty Profiles",
    source: "Master subcounty reference data",
    cadence: "As administrative updates occur",
    owner: "Administrative Data Management",
    intro: "Keep subcounty records aligned with their district so downstream reporting and field operations stay consistent.",
    actions: [
      "Review subcounty names and code changes.",
      "Track new administrative units within the selected district.",
      "Coordinate updates before dependent modules refresh."
    ],
    checks: [
      "Confirm subcounty names remain canonical.",
      "Validate district linkage before publishing changes.",
      "Review downstream impact before sharing updates."
    ]
  }),
  "village-profiles": createLeafPage({
    id: "village-profiles",
    title: "Village Profiles",
    source: "Master village reference data",
    cadence: "As administrative updates occur",
    owner: "Administrative Data Management",
    intro: "Keep village records aligned with district, subcounty, and parish identifiers so reporting and field follow-up stay consistent.",
    actions: [
      "Review village names and code changes.",
      "Track updates to village, parish, and subcounty mappings.",
      "Coordinate changes before dependent modules refresh."
    ],
    checks: [
      "Confirm village names remain canonical.",
      "Validate district, subcounty, and parish linkage fields.",
      "Review downstream impact before sharing updates."
    ]
  }),
  "partner-directory": createLeafPage({
    id: "partner-directory",
    title: "Partner Directory",
    source: "Partner organization records",
    cadence: "As partnership information changes",
    owner: "Partnerships Desk",
    intro: "A concise directory surface for partner organizations that supports programme and outbreak coordination.",
    actions: [
      "Review partner contacts and coverage areas.",
      "Track supported districts and priority domains.",
      "Improve coordination during routine and emergency work."
    ],
    checks: [
      "Confirm organization names match signed records.",
      "Validate coverage areas against district references.",
      "Review stale contacts before they appear in workflows."
    ]
  })
};

export function getPortalNavigation(): PortalNavigationResponse {
  return {
    applicationTitle: "MoH Uganda: National Health Portal - Main",
    defaultNodeId: "home",
    tree: portalTree
  };
}

async function getDistrictProfilesPage(): Promise<PortalPageContent> {
  try {
    const districts = await fetchDistricts();
    const districtsWithCodes = districts.filter((district) => district.code !== "Not set");

    return createLeafPage({
      id: "district-profiles",
      title: "District Profiles",
      source: "response.health.go.ug/api/locations/districts",
      cadence: "Live on request",
      owner: "Administrative Data Management",
      intro: "Live district reference data from the Ministry endpoint, normalized for cleaner downstream review.",
      actions: [
        "Review district names and codes coming from the upstream service.",
        "Track administrative records that need cleanup before downstream use.",
        "Coordinate reference data changes with dependent modules."
      ],
      checks: [
        "Confirm district names remain canonical after normalization.",
        "Review districts still missing codes.",
        "Validate upstream updates before sharing exports with other teams."
      ],
      summaryCards: [
        {
          label: "Districts Available",
          value: `${districts.length}`,
          note: "Unique district names after normalization and duplicate cleanup"
        },
        {
          label: "Codes Present",
          value: `${districtsWithCodes.length}`,
          note: "Districts with a usable upstream code"
        },
        {
          label: "Codes Missing",
          value: `${districts.length - districtsWithCodes.length}`,
          note: "Districts that still need a canonical code assigned"
        }
      ],
      dataTable: {
        title: "District Directory",
        caption: "Latest district records returned by the upstream locations service.",
        columns: ["District", "Code", "Updated", "Created"],
        rows: districts.map((district) => ({
          id: `${district.id}`,
          cells: [district.name, district.code, district.updatedAt, district.createdAt]
        }))
      }
    });
  } catch {
    return {
      ...createLeafPage({
        id: "district-profiles",
        title: "District Profiles",
        source: "response.health.go.ug/api/locations/districts",
        cadence: "Live on request",
        owner: "Administrative Data Management",
        intro: "Live district reference data from the Ministry endpoint, normalized for cleaner downstream review.",
        actions: [
          "Retry the upstream request when the locations service becomes available.",
          "Use the most recent verified export if an urgent lookup is needed.",
          "Coordinate with the data team before publishing manual corrections."
        ],
        checks: [
          "Confirm the endpoint is reachable.",
          "Review whether authentication or network policy changed.",
          "Validate any fallback district list before distribution."
        ]
      }),
      message: "District data is temporarily unavailable from the upstream locations service."
    };
  }
}

async function getSubcountyProfilesPage(): Promise<PortalPageContent> {
  try {
    const subcounties = await fetchAllSubcounties();
    const subcountiesWithCodes = subcounties.filter((subcounty) => subcounty.code !== "Not set");
    const coveredDistricts = new Set(subcounties.map((subcounty) => subcounty.districtId)).size;

    return createLeafPage({
      id: "subcounty-profiles",
      title: "Subcounty Profiles",
      source: "response.health.go.ug/api/locations/subcounties/{districtId}",
      cadence: "Live on request",
      owner: "Administrative Data Management",
      intro: "Live subcounty reference data aggregated across all districts from the Ministry locations service.",
      actions: [
        "Review subcounty names and codes coming from the upstream service.",
        "Track administrative records that need cleanup before downstream use.",
        "Coordinate changes with district and facility reference data."
      ],
      checks: [
        "Confirm every subcounty remains linked to the expected district.",
        "Review subcounties still missing codes.",
        "Validate upstream changes before distributing local exports."
      ],
      summaryCards: [
        {
          label: "Subcounties Available",
          value: `${subcounties.length}`,
          note: "Rows aggregated from all district-level upstream endpoints"
        },
        {
          label: "Districts Covered",
          value: `${coveredDistricts}`,
          note: "Districts that currently return subcounty records"
        },
        {
          label: "Codes Present",
          value: `${subcountiesWithCodes.length}`,
          note: "Subcounties with a usable upstream code"
        },
        {
          label: "Codes Missing",
          value: `${subcounties.length - subcountiesWithCodes.length}`,
          note: "Subcounties that still need a canonical code assigned"
        }
      ],
      dataTable: {
        title: "National Subcounty Directory",
        caption: "Latest subcounty records aggregated from the upstream locations service for all districts.",
        columns: ["District", "District ID", "Subcounty", "Code", "Updated", "Created"],
        rows: subcounties.map((subcounty) => ({
          id: `${subcounty.id}`,
          cells: [
            subcounty.districtName ?? "Unknown District",
            `${subcounty.districtId}`,
            subcounty.name,
            subcounty.code,
            subcounty.updatedAt,
            subcounty.createdAt
          ]
        }))
      }
    });
  } catch {
    return {
      ...createLeafPage({
        id: "subcounty-profiles",
        title: "Subcounty Profiles",
        source: "response.health.go.ug/api/locations/subcounties/{districtId}",
        cadence: "Live on request",
        owner: "Administrative Data Management",
        intro: "Live subcounty reference data aggregated across all districts from the Ministry locations service.",
        actions: [
          "Retry the upstream request when the locations service becomes available.",
          "Use the most recent verified export if an urgent lookup is needed.",
          "Coordinate with the data team before publishing manual corrections."
        ],
        checks: [
          "Confirm the endpoint is reachable.",
          "Review whether authentication or network policy changed.",
          "Validate any fallback subcounty list before distribution."
        ]
      }),
      message: "Subcounty data is temporarily unavailable from the upstream locations service."
    };
  }
}

async function getVillageProfilesPage(): Promise<PortalPageContent> {
  try {
    const villages = await fetchVillages();
    const villagesWithCodes = villages.filter((village) => village.code !== "Not set");
    const coveredDistricts = new Set(villages.map((village) => village.districtId)).size;
    const coveredParishes = new Set(villages.map((village) => village.parishId)).size;

    return createLeafPage({
      id: "village-profiles",
      title: "Village Profiles",
      source: "response.health.go.ug/api/locations/villages/",
      cadence: "Live on request",
      owner: "Administrative Data Management",
      intro: "Live village reference data aggregated from the Ministry locations service.",
      actions: [
        "Review village names and codes coming from the upstream service.",
        "Track administrative records that need cleanup before downstream use.",
        "Coordinate village, parish, and subcounty reference changes together."
      ],
      checks: [
        "Confirm every village remains linked to the expected district.",
        "Review villages still missing codes.",
        "Validate upstream changes before distributing local exports."
      ],
      summaryCards: [
        {
          label: "Villages Available",
          value: `${villages.length}`,
          note: "Rows returned by the national villages endpoint"
        },
        {
          label: "Districts Covered",
          value: `${coveredDistricts}`,
          note: "Districts represented in the village dataset"
        },
        {
          label: "Parishes Covered",
          value: `${coveredParishes}`,
          note: "Unique parishes represented in the village dataset"
        },
        {
          label: "Codes Present",
          value: `${villagesWithCodes.length}`,
          note: "Villages with a usable upstream code"
        }
      ],
      dataTable: {
        title: "National Village Directory",
        caption: "Latest village records returned by the upstream locations service.",
        columns: [
          "District",
          "District ID",
          "Subcounty ID",
          "Parish ID",
          "Village",
          "Code",
          "Updated",
          "Created"
        ],
        rows: villages.map((village) => ({
          id: `${village.id}`,
          cells: [
            village.districtName ?? "Unknown District",
            `${village.districtId}`,
            `${village.subcountyId}`,
            `${village.parishId}`,
            village.name,
            village.code,
            village.updatedAt,
            village.createdAt
          ]
        }))
      }
    });
  } catch {
    return {
      ...createLeafPage({
        id: "village-profiles",
        title: "Village Profiles",
        source: "response.health.go.ug/api/locations/villages/",
        cadence: "Live on request",
        owner: "Administrative Data Management",
        intro: "Live village reference data aggregated from the Ministry locations service.",
        actions: [
          "Retry the upstream request when the locations service becomes available.",
          "Use the most recent verified export if an urgent lookup is needed.",
          "Coordinate with the data team before publishing manual corrections."
        ],
        checks: [
          "Confirm the endpoint is reachable.",
          "Review whether authentication or network policy changed.",
          "Validate any fallback village list before distribution."
        ]
      }),
      message: "Village data is temporarily unavailable from the upstream locations service."
    };
  }
}

export async function getPortalContent(nodeId: string) {
  if (nodeId === "district-profiles") {
    return getDistrictProfilesPage();
  }

  if (nodeId === "subcounty-profiles") {
    return getSubcountyProfilesPage();
  }

  if (nodeId === "village-profiles") {
    return getVillageProfilesPage();
  }

  return portalContentById[nodeId];
}
