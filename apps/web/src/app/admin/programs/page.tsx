import EntityPage from '@/components/EntityPage';

export default function ProgramsPage() {
  return (
    <EntityPage
      title="Programs"
      endpoint="programs"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code', required: true },
        { key: 'description', label: 'Description' },
        { key: 'durationYears', label: 'Duration (Years)', type: 'number' },
        {
          key: 'level',
          label: 'Level',
          type: 'select',
          options: [
            { value: 'CERTIFICATE', label: 'Certificate' },
            { value: 'DIPLOMA', label: 'Diploma' },
            { value: 'UNDERGRADUATE', label: 'Undergraduate' },
            { value: 'POSTGRADUATE', label: 'Postgraduate' },
            { value: 'DOCTORATE', label: 'Doctorate' },
          ],
        },
        { key: 'departmentId', label: 'Department ID', required: true },
      ]}
      displayColumns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'level', label: 'Level' },
        { key: 'durationYears', label: 'Duration' },
        { key: 'isActive', label: 'Status' },
      ]}
    />
  );
}
