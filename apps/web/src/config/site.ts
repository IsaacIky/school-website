/**
 * Centralized site configuration.
 * Brand colors, name, and portal/role mapping are all defined here.
 * In future this can be made DB-driven via API.
 */

export const siteConfig = {
  name: 'University Platform',
  shortName: 'UniPortal',
  tagline: 'Empowering Education Through Innovation',
  description:
    'A modern, configurable university management platform serving students, staff, and administrators.',
  brand: {
    purple: '#4B2E83',
    purpleDark: '#3a2268',
    purpleLight: '#6b4aad',
    yellow: '#F2C200',
    yellowDark: '#d4a900',
    dark: '#0B1020',
  },
  social: {
    facebook: '#',
    twitter: '#',
    linkedin: '#',
    instagram: '#',
  },
  contact: {
    address: '123 University Drive, Main Campus',
    phone: '+263 000 000 000',
    email: 'info@university.ac.zw',
  },
  stats: [
    { label: 'Students Enrolled', value: '8,500+' },
    { label: 'Academic Programmes', value: '120+' },
    { label: 'Faculties', value: '12' },
    { label: 'Years of Excellence', value: '30+' },
  ],
  programmes: [
    {
      id: 'engineering',
      title: 'Engineering & Technology',
      description:
        'Cutting-edge programmes in civil, mechanical, electrical and software engineering.',
      icon: '⚙️',
    },
    {
      id: 'business',
      title: 'Business & Commerce',
      description: 'Develop strategic thinking and entrepreneurial skills for the modern economy.',
      icon: '💼',
    },
    {
      id: 'science',
      title: 'Natural Sciences',
      description:
        'Explore biology, chemistry, physics and environmental science in modern labs.',
      icon: '🔬',
    },
    {
      id: 'ict',
      title: 'Information Technology',
      description:
        'Prepare for a digital-first world with programmes in CS, networking and AI.',
      icon: '💻',
    },
    {
      id: 'agriculture',
      title: 'Agriculture & Innovation',
      description:
        'Transforming agriculture through research, innovation, and industrialisation.',
      icon: '🌱',
    },
    {
      id: 'arts',
      title: 'Humanities & Social Sciences',
      description:
        'Critical thinking, communication, and cultural studies for a complex world.',
      icon: '📚',
    },
  ],
  news: [
    {
      id: 1,
      category: 'Admissions',
      date: '15 Apr 2026',
      title: 'Applications Open for 2026 Intake',
      excerpt:
        'The university is now accepting applications for undergraduate and postgraduate programmes for the 2026 academic year.',
    },
    {
      id: 2,
      category: 'Research',
      date: '10 Apr 2026',
      title: 'Research Innovation Hub Launches New Projects',
      excerpt:
        'The Agro-Innovation Hub has partnered with leading organisations to launch three new industrial research initiatives.',
    },
    {
      id: 3,
      category: 'Events',
      date: '5 Apr 2026',
      title: 'Annual Graduation Ceremony Announced',
      excerpt:
        'The university will host its annual graduation ceremony on 30 May 2026. All graduating students are encouraged to register.',
    },
  ],
} as const;
