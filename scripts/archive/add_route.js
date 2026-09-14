const fs = require('fs');
const file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not exists
if (!content.includes('ProjectDetails')) {
  content = content.replace(
    /const Projects = lazy\(\(\) => import\('\.\/pages\/Projects'\)\);/,
    const Projects = lazy(() => import('./pages/Projects'));\nconst ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
  );
}

// Add route
if (!content.includes('path="/projects/:id"')) {
  content = content.replace(
    /<Route path="\/projects" element=\{<Projects isUrdu=\{isUrdu\} \/>\} \/>/,
    <Route path="/projects" element={<Projects isUrdu={isUrdu} />} />\n              <Route path="/projects/:id" element={<ProjectDetails isUrdu={isUrdu} />} />
  );
}

fs.writeFileSync(file, content);
