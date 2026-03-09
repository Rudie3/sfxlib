import { useState } from 'react';

export default function SetupView({ onSubmit, loading, error }) {
  const [rootPath, setRootPath] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(rootPath);
  };

  return (
    <div className="setup-wrap">
      <h1>sfxlib</h1>
      <p>Enter the root folder path of your local sound effects library.</p>
      <form onSubmit={handleSubmit} className="setup-form">
        <input
          value={rootPath}
          onChange={(event) => setRootPath(event.target.value)}
          placeholder="C:\\audio\\sfx"
        />
        <button type="submit" disabled={loading || !rootPath.trim()}>
          {loading ? 'Indexing...' : 'Save and Index'}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
