import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'introduction',
        'why-native',
        'quick-start',
        'adoption-guide',
      ],
    },
    {
      type: 'category',
      label: 'Core API',
      items: [
        'repositories',
        'transactions',
        'api-reference',
      ],
    },
    'testing',
    {
      type: 'category',
      label: 'Production',
      items: [
        'production-patterns',
        'deployment',
        'migration-operations',
      ],
    },
    {
      type: 'category',
      label: 'Samples',
      items: [
        'samples/index',
        'samples/catalog',
        'samples/architecture',
        'samples/superpowers',
        'samples/zod-openapi-bridge',
        'samples/zod-helper-evaluation',
        'samples/zod-migration-guide',
        'samples/zod-large-codebase-checklist',
        'samples/zod-diff-examples',
        'samples/how-to-review',
      ],
    },
    {
      type: 'category',
      label: 'Project Reference',
      items: [
        'support-policy',
        'quality-and-ci',
        'release',
        'contributing',
        'roadmap',
      ],
    },
  ],
};

export default sidebars;
