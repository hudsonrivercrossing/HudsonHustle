export interface SideTab {
  id: string;
  label: string;
}

interface SideTabRailProps<TTab extends string> {
  tabs: Array<{ id: TTab; label: string }>;
  activeTab: TTab;
  onChange: (tab: TTab) => void;
  ariaLabel: string;
}

export function SideTabRail<TTab extends string>({ tabs, activeTab, onChange, ariaLabel }: SideTabRailProps<TTab>): JSX.Element {
  return (
    <div className="inspector-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`inspector-tabs__tab ${activeTab === tab.id ? "inspector-tabs__tab--active" : ""}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
