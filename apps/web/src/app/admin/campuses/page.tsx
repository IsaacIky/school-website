import EntityPage from '@/components/EntityPage';

export default function CampusesPage() {
  return (
    <EntityPage
      title="Campuses"
      endpoint="campuses"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true },
        { key: 'address', label: 'Address' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email', type: 'email' },
      ]}
      displayColumns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'isActive', label: 'Status' },
      ]}
    />
  );
}
