export const TAG_COLOR_GROUPS = [
  {
    name: 'Red',
    shades: [
      { name: 'Light', value: '#fca5a5' },
      { name: 'Medium', value: '#ef4444' },
      { name: 'Dark', value: '#991b1b' }
    ]
  },
  {
    name: 'Orange',
    shades: [
      { name: 'Light', value: '#fdba74' },
      { name: 'Medium', value: '#f97316' },
      { name: 'Dark', value: '#9a3412' }
    ]
  },
  {
    name: 'Amber',
    shades: [
      { name: 'Light', value: '#fcd34d' },
      { name: 'Medium', value: '#f59e0b' },
      { name: 'Dark', value: '#92400e' }
    ]
  },
  {
    name: 'Yellow',
    shades: [
      { name: 'Light', value: '#fde047' },
      { name: 'Medium', value: '#eab308' },
      { name: 'Dark', value: '#854d0e' }
    ]
  },
  {
    name: 'Green',
    shades: [
      { name: 'Light', value: '#86efac' },
      { name: 'Medium', value: '#10b981' },
      { name: 'Dark', value: '#065f46' }
    ]
  },
  {
    name: 'Teal',
    shades: [
      { name: 'Light', value: '#5eead4' },
      { name: 'Medium', value: '#14b8a6' },
      { name: 'Dark', value: '#115e59' }
    ]
  },
  {
    name: 'Cyan',
    shades: [
      { name: 'Light', value: '#67e8f9' },
      { name: 'Medium', value: '#06b6d4' },
      { name: 'Dark', value: '#164e63' }
    ]
  },
  {
    name: 'Blue',
    shades: [
      { name: 'Light', value: '#93c5fd' },
      { name: 'Medium', value: '#3b82f6' },
      { name: 'Dark', value: '#1e3a8a' }
    ]
  },
  {
    name: 'Purple',
    shades: [
      { name: 'Light', value: '#c4b5fd' },
      { name: 'Medium', value: '#8b5cf6' },
      { name: 'Dark', value: '#581c87' }
    ]
  },
  {
    name: 'Pink',
    shades: [
      { name: 'Light', value: '#f9a8d4' },
      { name: 'Medium', value: '#ec4899' },
      { name: 'Dark', value: '#831843' }
    ]
  },
  {
    name: 'Grey',
    shades: [
      { name: 'Light', value: '#9ca3af' },
      { name: 'Medium', value: '#6b7280' },
      { name: 'Dark', value: '#374151' }
    ]
  }
];

const colorLookup = new Map(
  TAG_COLOR_GROUPS.flatMap((group) =>
    group.shades.map((shade) => [
      shade.value.toLowerCase(),
      {
        group: group.name,
        shade: shade.name,
        label: `${group.name} ${shade.name}`
      }
    ])
  )
);

export const getTagColorMeta = (value) => {
  const hex = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!hex) {
    return {
      hex: '',
      group: 'Custom',
      shade: '',
      label: 'Custom Color'
    };
  }

  const match = colorLookup.get(hex);
  if (match) {
    return {
      hex,
      ...match
    };
  }

  return {
    hex,
    group: 'Custom',
    shade: '',
    label: 'Custom Color'
  };
};
