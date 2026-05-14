import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'quick-start',
    'repositories',
    'transactions',
    'testing',
    {
      type: 'category',
      label: 'Samples',
      items: [
        'samples/index',
        'samples/catalog',
        'samples/architecture',
        'samples/superpowers',
        'samples/zod-openapi-bridge',
        'samples/zod-migration-guide',
        'samples/zod-large-codebase-checklist',
        'samples/zod-diff-examples',
        'samples/how-to-review',
      ],
    },
    {
      type: 'category',
      label: 'Support & Reference',
      items: [
        'support-policy',
        'api-reference',
        'quality-and-ci',
        'release',
        'contributing',
        'roadmap',
      ],
    },
  ],
};

export default sidebars;
