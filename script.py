import re

with open('d:/NGO Website/frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_render = r"  return \(\n    <div className=\{min-h-screen bg-brand-gray text-brand-navy selection:bg-brand-navy selection:text-brand-white \npb-\[72px\] md:pb-0 \$\{isUrdu \? 'font-urduBody' : 'font-sans'\}} dir=\{isUrdu \? 'rtl' : 'ltr'\}>\n      <ToastContainer />\n      <ScrollToTop />\n      <Navbar isUrdu=\{isUrdu\} setIsUrdu=\{setIsUrdu\} onDonateClick=\{.*?\} />"

new_render = r"""  const isPublicRoute = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/user/login') && !location.pathname.startsWith('/login');
  const isMaintenanceActive = settings.maintenance_mode === 'true';

  if (isMaintenanceActive && isPublicRoute && !isAdmin) {
    if (authLoading || settingsLoading) {
      return <PageLoader />;
    }
    return <MaintenanceScreen isUrdu={isUrdu} />;
  }

  return (
    <div className={min-h-screen bg-brand-gray text-brand-navy selection:bg-brand-navy selection:text-brand-white \npb-[72px] md:pb-0 } dir={isUrdu ? 'rtl' : 'ltr'}>
      <ToastContainer />
      <ScrollToTop />
      
      {isMaintenanceActive && isAdmin && isPublicRoute && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-bold shadow-md relative z-50">
          MAINTENANCE MODE IS ACTIVE. Public visitors cannot see the site.
        </div>
      )}

      <Navbar isUrdu={isUrdu} setIsUrdu={setIsUrdu} onDonateClick={() => handleDonateClick(null)} />"""

code = re.sub(old_render, new_render, code, count=1)

with open('d:/NGO Website/frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
