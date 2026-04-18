import EntityPage from '@/components/EntityPage';

export default function FacultiesPage() {
  return (
    <EntityPage
      title="Faculties"
      endpoint="faculties"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true },
        { key: 'description', label: 'Description' },
        { key: 'campusId', label: 'Campus ID', required: true },
      ]}
      displayColumns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
        { key: 'isActive', label: 'Status' },
      ]}
    />
  );
}
