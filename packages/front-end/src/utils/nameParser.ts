export function parseSpanishName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { nombres: parts[0], ape1: '', ape2: '' };
  if (parts.length === 2) return { nombres: parts[0], ape1: parts[1], ape2: '' };
  if (parts.length === 3) return { nombres: parts[0], ape1: parts[1], ape2: parts[2] };
  return {
    nombres: parts.slice(0, parts.length - 2).join(' '),
    ape1: parts[parts.length - 2],
    ape2: parts[parts.length - 1]
  };
}
