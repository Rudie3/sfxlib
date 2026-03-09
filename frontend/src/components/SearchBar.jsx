export default function SearchBar({ value, onChange, mode, onModeChange, onClear }) {
  return (
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
  );
}
