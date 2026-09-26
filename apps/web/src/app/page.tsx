import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* ── Navigation ── */}
      <nav className="bg-[#4B2E83] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight">🎓</span>
              <span className="text-xl font-bold">{siteConfig.shortName}</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#programmes" className="hover:text-[#F2C200] transition-colors">
                Programmes
              </a>
              <a href="#news" className="hover:text-[#F2C200] transition-colors">
                News
              </a>
              <a href="#contact" className="hover:text-[#F2C200] transition-colors">
                Contact
              </a>
              <Link
                href="/login"
                className="bg-[#F2C200] text-[#0B1020] px-4 py-2 rounded-lg font-semibold hover:bg-[#d4a900] transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#4B2E83] via-[#3a2268] to-[#0B1020] text-white py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#F2C200] font-semibold text-sm uppercase tracking-widest mb-4">
            Welcome to {siteConfig.name}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            {siteConfig.tagline}
          </h1>
          <p className="text-purple-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            {siteConfig.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-[#F2C200] text-[#0B1020] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#d4a900] transition-colors shadow-lg"
            >
              Access Your Portal →
            </Link>
            <a
              href="#programmes"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#4B2E83] transition-colors"
            >
              Explore Programmes
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {siteConfig.stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold text-[#4B2E83]">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Programmes ── */}
      <section id="programmes" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1020] mb-4">
              Academic Programmes
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Discover our wide range of undergraduate and postgraduate programmes designed for
              the modern world.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {siteConfig.programmes.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#4B2E83]/20 transition-all group"
              >
                <div className="text-4xl mb-4">{prog.icon}</div>
                <h3 className="text-lg font-bold text-[#0B1020] mb-2 group-hover:text-[#4B2E83] transition-colors">
                  {prog.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{prog.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News ── */}
      <section id="news" className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1020] mb-4">
              Latest News
            </h2>
            <p className="text-gray-500 text-lg">
              Stay up to date with the latest happenings at the university.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteConfig.news.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-r from-[#4B2E83] to-[#6b4aad] h-2" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-[#4B2E83]/10 text-[#4B2E83] text-xs font-semibold px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-gray-400 text-xs">{item.date}</span>
                  </div>
                  <h3 className="font-bold text-[#0B1020] mb-2 leading-snug">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal quick-access ── */}
      <section className="bg-[#4B2E83] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Access Your Portal
          </h2>
          <p className="text-purple-200 mb-8">
            Students, staff, and administrators — sign in to access your personalised portal.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#F2C200] text-[#0B1020] px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#d4a900] transition-colors shadow-xl"
          >
            Sign In Now →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-[#0B1020] text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="text-white font-bold text-lg">{siteConfig.shortName}</span>
            </div>
            <p className="text-sm leading-relaxed">{siteConfig.description}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 {siteConfig.contact.address}</li>
              <li>📞 {siteConfig.contact.phone}</li>
              <li>✉️ {siteConfig.contact.email}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#programmes" className="hover:text-white transition-colors">
                  Programmes
                </a>
              </li>
              <li>
                <a href="#news" className="hover:text-white transition-colors">
                  News & Events
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Staff / Student Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
