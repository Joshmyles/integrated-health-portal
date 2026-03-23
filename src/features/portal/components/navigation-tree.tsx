import type { PortalTreeNode } from "@/src/features/portal/types/portal";
import styles from "./portal-shell.module.css";
import { TreeExpandBoxIcon, TreeFileIcon, TreeFolderIcon } from "./tree-icons";

interface NavigationTreeProps {
  tree: PortalTreeNode[];
  expandedIds: string[];
  selectedId: string;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
}

interface TreeNodeProps {
  ancestorHasNext: boolean[];
  depth: number;
  expandedIds: string[];
  isLast: boolean;
  node: PortalTreeNode;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
  selectedId: string;
}

function TreeNode({
  ancestorHasNext,
  node,
  depth,
  expandedIds,
  isLast,
  selectedId,
  onSelect,
  onToggle
}: TreeNodeProps) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = selectedId === node.id;
  const icon = depth === 0 || hasChildren ? <TreeFolderIcon /> : <TreeFileIcon />;
  const children = node.children ?? [];

  return (
    <div role="none">
      <div className={styles.treeRow}>
        <div aria-hidden="true" className={styles.treeGuides}>
          {ancestorHasNext.map((hasNext, index) => (
            <span className={styles.guideColumn} key={`${node.id}-ancestor-${index}`}>
              {hasNext ? <span className={styles.guideVertical} /> : null}
            </span>
          ))}

          <span className={styles.branchColumn}>
            {!isLast ? <span className={styles.branchVertical} /> : null}
            <span className={styles.branchHorizontal} />

            {hasChildren ? (
              <button
                aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
                className={styles.expander}
                onClick={() => onToggle(node.id)}
                type="button"
              >
                <TreeExpandBoxIcon expanded={isExpanded} />
              </button>
            ) : (
              <span className={styles.branchSpacer} />
            )}
          </span>
        </div>

        <button
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          className={[styles.treeNodeButton, isSelected ? styles.treeNodeButtonSelected : ""].filter(Boolean).join(" ")}
          onClick={() => {
            onSelect(node.id);

            if (hasChildren && !isExpanded) {
              onToggle(node.id);
            }
          }}
          type="button"
        >
          <span className={styles.treeIconSlot}>{icon}</span>
          <span className={styles.treeLabel}>{node.label}</span>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <div role="group">
          {children.map((child, index) => (
            <TreeNode
              ancestorHasNext={[...ancestorHasNext, !isLast]}
              depth={depth + 1}
              expandedIds={expandedIds}
              isLast={index === children.length - 1}
              key={child.id}
              node={child}
              onSelect={onSelect}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function NavigationTree(props: NavigationTreeProps) {
  return (
    <div aria-label="Function Menu" className={styles.tree} role="tree">
      {props.tree.map((node, index) => (
        <TreeNode
          ancestorHasNext={[]}
          depth={0}
          isLast={index === props.tree.length - 1}
          key={node.id}
          node={node}
          {...props}
        />
      ))}
    </div>
  );
}
