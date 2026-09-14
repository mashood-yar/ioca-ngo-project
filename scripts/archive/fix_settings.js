const fs = require('fs');
const file = 'frontend/src/pages/admin/AdminSiteSettings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, 'hero_static_image_url'\)\} className="w-full.+?\/>/,
  $$&
                      <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">?? Recommended: 16:9 Landscape (e.g. 1920x1080)</p>
);

content = content.replace(
  /onChange=\{handleSlideUpload\} className="hidden" \/>\s*<\/label>/,
  $$&
                    <p className="text-[11px] text-[#6B7280] mt-1.5">?? Recommended: 16:9 Landscape</p>
);

content = content.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, 'logo_url'\)\} className="text-sm" \/>/,
  $$&
                  <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">?? Recommended: Transparent PNG (e.g. 400x150)</p>
);

content = content.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, 'logo_url_white'\)\} className="text-sm" \/>/,
  $$&
                  <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">?? Recommended: Transparent PNG (e.g. 400x150)</p>
);

content = content.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, 'favicon_url'\)\} className="text-sm" \/>/,
  $$&
                  <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">?? Recommended: 1:1 Square (e.g. 512x512)</p>
);

content = content.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, 'hero_icon_url'\)\} className="text-sm" \/>/,
  $$&
                  <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">?? Recommended: 1:1 Square (e.g. 256x256)</p>
);

fs.writeFileSync(file, content);
