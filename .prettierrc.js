module.exports = {
  plugins: [require('@trivago/prettier-plugin-sort-imports')],
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@/libraries/(.*)$',
    '^@/components/(.*)$',
    '^@/utils/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true, // Add newlines between import groups
  importOrderSortSpecifiers: true, // Sort individual imports within each group
};
