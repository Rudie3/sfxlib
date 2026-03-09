export default function SearchBar({
  value,
  onChange,
  mode,
  onModeChange,
  onClear,
  soundCount,
  tagCounts,
  selectedTagNames,
  onToggleTagFilter,
}) {
  return (
    <div className="search-panel">
      <div className="search-bar">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by file name, parent folder, or tag"
        />
        <select value={mode} onChange={(event) => onModeChange(event.target.value)}>
          <option value="all">All</option>
          <option value="filename">File name</option>
          <option value="folder">Parent folder</option>
          <option value="tag">Tag</option>
        </select>
        <button type="button" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="search-summary">Sounds found: {soundCount}</div>

      <div className="tag-filter-row">
        {tagCounts.length ? (
          tagCounts.map((tag) => {
            const selected = selectedTagNames.includes(tag.name);
            return (
              <button
                key={tag.name}
                type="button"
                className={`tag-filter-button${selected ? ' selected' : ''}`}
                onClick={() => onToggleTagFilter(tag.name)}
              >
                {tag.name} ({tag.count})
              </button>
            );
          })
        ) : (
          <span className="tag-filter-empty">No tags yet</span>
        )}
      </div>
    </div>
  );
}
