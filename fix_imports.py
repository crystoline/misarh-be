import os

target_dir = '/home/crysto/projects/aisha/misarh-web/src/app'
replacements = {
    "from '../../types'": "from '@misarh/shared'",
    "from '../../../types'": "from '@misarh/shared'",
    "from '../types'": "from '@misarh/shared'"
}

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                print(f"Fixing {path}")
                with open(path, 'w') as f:
                    f.write(new_content)
