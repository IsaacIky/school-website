import EntityPage from '@/components/EntityPage';

export default function DepartmentsPage() {
  return (
    <EntityPage
      title="Departments"
      endpoint="departments"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true },
        { key: 'description', label: 'Description' },
        { key: 'facultyId', label: 'Faculty ID', required: true },
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
