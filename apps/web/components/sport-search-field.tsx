'use client';

export function SportSearchField({
  value,
  onChange,
  placeholder = 'Cerca squadra o competizione',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field sport-search">
      <span>Cerca</span>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        aria-label="Cerca squadra o competizione"
      />
    </label>
  );
}
