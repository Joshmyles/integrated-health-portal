import { CifVhfWorkspace } from "@/src/features/cif/components/cif-vhf-workspace";
import { UserManagementWorkspace } from "@/src/features/users/components/user-management-workspace";
import { DeploymentRequisitionsWorkspace } from "@/src/features/resource-management/components/deployment-requisitions-workspace";
import styles from "./portal-shell.module.css";
import type { PortalPageContent } from '@/src/features/portal/types/portal';
import { OutbreakWorkspace } from '@/src/features/outbreak/components/outbreak-workspace';
import { CifMpoxWorkspace } from '@/src/features/cif/components/cif-mpox-workspace';
import { DepartmentsManagementWorkspace } from '@/src/features/portal/components/departments-management-workspace';
import { SettingsWorkspace } from '@/src/features/settings/components/settings-workspace';
import { EmployeeManagementWorkspace } from '@/src/features/portal/components/employee-management-workspace';
import { PillarsWorkspace } from '@/src/features/resource-management/components/pillars-workspace';
import { ResourcesWorkspace } from '@/src/features/resource-management/components/resources-workspace';
import { ActivityLogsWorkspace } from '@/src/features/resource-management/components/activity-logs-workspace';
import { RrtDeploymentsManagementWorkspace } from '@/src/features/portal/components/rrt-deployments-management-workspace';
import { RrtTeamsManagementWorkspace } from '@/src/features/portal/components/rrt-teams-management-workspace';


interface ContentPanelProps {
  content?: PortalPageContent;
  isError: boolean;
  isLoading: boolean;
}

export function ContentPanel({
  content,
  isError,
  isLoading,
}: ContentPanelProps) {
  const isDeploymentRequisitions = content?.id === "deployment-requisitions";
  const isHome = content?.id === 'home';
  const isUserManagement = content?.id === 'user-management-home';
  const isOutbreakWorkspace = content?.id === 'cif-outbreak';
  const isCifVhf = content?.id === 'cif-vhf';
  const isSettings = content?.id === 'system-settings';
  const isCifMpox = content?.id === 'cif-mpox';
  const isDeploymentPillars = content?.id === 'deployment-pillars';
  const isDeploymentResources = content?.id === 'deployment-resources';
  const isDeploymentActivityLogs = content?.id === 'deployment-activity-logs';
  const isEmployeesPage =
    content?.id === 'employees' || content?.id === 'human-resources';
  const isDepartmentsPage = content?.id === 'departments';
  const isRrtDeploymentsPage = content?.id === 'deployment-rrt-deployments';
  const isRrtTeamsPage = content?.id === 'deployment-rrt-teams';
  const isCustomManagementPage =
    isEmployeesPage || isRrtDeploymentsPage || isRrtTeamsPage || isDeploymentPillars || isDeploymentRequisitions ||isDepartmentsPage;

  return (
    <section className={styles.contentPanel}>
      <h1 className={styles.contentTitle}>{content?.title ?? 'Home'}</h1>

      {isLoading ? (
        <div className={styles.statusMessage}>Loading...</div>
      ) : null}

      {!isLoading && isError ? (
        <div className={styles.statusMessage}>
          <div className={styles.errorMessage}>
            The selected workspace could not be loaded. Please try another menu
            item.
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && content ? (
        <>
          {content.message ? (
            <p className={styles.legacyMessage}>{content.message}</p>
          ) : null}

          {!isHome && !isCustomManagementPage ? (
            <p className={styles.contentIntro}>{content.intro}</p>
          ) : null}

          {!isHome && !isCustomManagementPage && content.records.length ? (
            <dl className={styles.metaList}>
              {content.records.map((record) => (
                <div className={styles.metaRow} key={record.label}>
                  <dt className={styles.metaLabel}>{record.label}:</dt>
                  <dd className={styles.metaValue}>{record.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {!isHome &&
            !isUserManagement &&
            !isCifVhf &&
            !isCifMpox &&
            !isDeploymentPillars &&
            !isDeploymentResources &&
            !isEmployeesPage &&
            !isRrtDeploymentsPage &&
            !isRrtTeamsPage &&
            !isOutbreakWorkspace &&
            !isDeploymentRequisitions &&
            !isSettings &&
            !isDepartmentsPage &&
          content.summaryCards?.length ? (
            <section className={styles.dataSection}>
              <h2 className={styles.plainSectionTitle}>Operational Snapshot</h2>
              <div className={styles.summaryCardGrid}>
                {content.summaryCards.map((card) => (
                  <article className={styles.summaryCard} key={card.label}>
                    <div className={styles.summaryCardLabel}>{card.label}</div>
                    <div className={styles.summaryCardValue}>{card.value}</div>
                    {card.note ? (
                      <p className={styles.summaryCardNote}>{card.note}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {!isHome &&
            !isUserManagement &&
            !isCifVhf &&
            !isCifMpox &&
            !isDeploymentPillars &&
            !isDeploymentResources &&
            !isEmployeesPage &&
            !isRrtDeploymentsPage &&
            !isRrtTeamsPage &&
            !isOutbreakWorkspace &&
            !isDeploymentRequisitions &&
            !isSettings &&
            !isDepartmentsPage &&
          content.dataTable ? (
            <section className={styles.dataSection}>
              <h2 className={styles.plainSectionTitle}>
                {content.dataTable.title}
              </h2>
              {content.dataTable.caption ? (
                <p className={styles.dataTableCaption}>
                  {content.dataTable.caption}
                </p>
              ) : null}

              <div className={styles.dataTableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      {content.dataTable.columns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.dataTable.rows.map((row) => (
                      <tr key={row.id}>
                        {row.cells.map((cell, index) => (
                          <td
                            key={`${row.id}-${content.dataTable?.columns[index] ?? index}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {isUserManagement ? <UserManagementWorkspace /> : null}
          {isOutbreakWorkspace ? <OutbreakWorkspace /> : null}
          {isCifVhf ? <CifVhfWorkspace /> : null}
          {isCifMpox ? <CifMpoxWorkspace /> : null}
          {isDeploymentPillars ? <PillarsWorkspace /> : null}
          {isDeploymentResources ? <ResourcesWorkspace /> : null}
          {isDeploymentActivityLogs ? <ActivityLogsWorkspace /> : null}
          {isEmployeesPage && content.employeeDirectory?.length ? (
            <EmployeeManagementWorkspace
              employees={content.employeeDirectory}
              title={content.dataTable?.title ?? 'Employee Directory'}
            />
          ) : null}
          {isDepartmentsPage && content.departments?.length ? (
            <DepartmentsManagementWorkspace
              departments={content.departments}
              title={content.dataTable?.title ?? 'Department Register'}
            />
          ) : null}
          {isRrtDeploymentsPage && content.rrtDeployments?.length ? (
            <RrtDeploymentsManagementWorkspace
              deployments={content.rrtDeployments}
              title={content.dataTable?.title ?? 'RRT Deployment Register'}
            />
          ) : null}
          {isRrtTeamsPage && content.rrtTeams?.length ? (
            <RrtTeamsManagementWorkspace
              teams={content.rrtTeams}
              title={content.dataTable?.title ?? 'RRT Team Register'}
            />
          ) : null}
          {isSettings ? <SettingsWorkspace /> : null}
          {isDeploymentRequisitions ? <DeploymentRequisitionsWorkspace /> : null}

          {!isHome &&
            !isUserManagement &&
            !isOutbreakWorkspace &&
            !isSettings &&
            !isEmployeesPage &&
            !isRrtDeploymentsPage &&
            !isRrtTeamsPage &&
            !isDeploymentRequisitions &&
            !isDeploymentResources &&
            !isDepartmentsPage &&
            !isDeploymentPillars
            ? content.sections.map((section) => (
              <section className={styles.plainSection} key={section.title}>
                <h2 className={styles.plainSectionTitle}>{section.title}</h2>
                <ul className={styles.plainSectionList}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))
            : null}
        </>
      ) : null}
    </section>
  );
}
