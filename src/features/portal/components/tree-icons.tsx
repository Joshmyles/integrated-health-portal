interface TreeExpandBoxIconProps {
  expanded: boolean;
}

export function TreeExpandBoxIcon({ expanded }: TreeExpandBoxIconProps) {
  return (
    <svg
      aria-hidden="true"
      height="11"
      viewBox="0 0 11 11"
      width="11"
    >
      <rect fill="#fbfbfb" height="10" stroke="#8f8f8f" width="10" x="0.5" y="0.5" />
      <path d="M3 5.5h5" shapeRendering="crispEdges" stroke="#505050" />
      {!expanded ? <path d="M5.5 3v5" shapeRendering="crispEdges" stroke="#505050" /> : null}
    </svg>
  );
}

export function TreeFolderIcon() {
  return (
    <svg
      aria-hidden="true"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path
        d="M1.5 4.5h4.2l1.1 1.3H14.5v1.2H1.5z"
        fill="#eef5ff"
        stroke="#99aabb"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 6.2h13v7.3h-13z"
        fill="#dbe8f8"
        stroke="#8ca0b5"
        strokeLinejoin="round"
      />
      <path
        d="M2.2 7.1h11.6v5.4H2.2z"
        fill="#bfd3ec"
      />
      <path d="M2 7.2h11.8" shapeRendering="crispEdges" stroke="#ffffff" />
      <path d="M1.5 13.5h13" shapeRendering="crispEdges" stroke="#a0b1c1" />
    </svg>
  );
}

export function TreeFileIcon() {
  return (
    <svg
      aria-hidden="true"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path
        d="M3 1.5h6.6L13 4.9v9.6H3z"
        fill="#ffffff"
        stroke="#99a6b5"
        strokeLinejoin="round"
      />
      <path d="M9.6 1.5v3.4H13" fill="#dce7f3" stroke="#99a6b5" strokeLinejoin="round" />
      <rect fill="#9fc2e7" height="2.4" width="6.2" x="4.2" y="4.6" />
      <path d="M4.2 8.5h6.2" shapeRendering="crispEdges" stroke="#c5d0dc" />
      <path d="M4.2 10.2h5.4" shapeRendering="crispEdges" stroke="#c5d0dc" />
      <path d="M4.2 11.9h6.2" shapeRendering="crispEdges" stroke="#c5d0dc" />
    </svg>
  );
}
