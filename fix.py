import re

with open('backend/impact-stories/[...path].ts', 'r') as f:
    content = f.read()

# Restore select().single() for impact_stories admin insert
# We look for "from('impact_stories')\n        .insert({\n            title_en" 
# and add .select().single() before if (error)

pattern = r"(\s+image_url: [^\n]+\n\s+\})\n\n\s+if \(error\) throw new Error"
replacement = r"\1\n        .select()\n        .single()\n\n      if (error) throw new Error"

content = re.sub(pattern, replacement, content)

with open('backend/impact-stories/[...path].ts', 'w') as f:
    f.write(content)

