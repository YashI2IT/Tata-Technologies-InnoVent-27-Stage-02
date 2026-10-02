import os
import re

directories_to_scan = [
    'd:/Tata Innovent/Tata_Innovent-main/frontend/src/pages',
    'd:/Tata Innovent/Tata_Innovent-main/frontend/src/components'
]

replacements = [
    # Backgrounds
    (r'bg-white', r'bg-surface'),
    (r'bg-\[#F7F9FC\]', r'bg-background'),
    (r'bg-\[#F8F9FC\]', r'bg-background'),
    (r'bg-\[#F4F6F8\]', r'bg-background'),
    (r'bg-gray-50', r'bg-surface-secondary'),
    
    # Borders
    (r'border-gray-100', r'border-border-subtle'),
    (r'border-gray-200', r'border-border-subtle'),
    (r'border-gray-300', r'border-border-strong'),
    
    # Text
    (r'text-gray-950', r'text-text-primary'),
    (r'text-gray-900', r'text-text-primary'),
    (r'text-gray-800', r'text-text-primary'),
    (r'text-gray-700', r'text-text-secondary'),
    (r'text-gray-600', r'text-text-secondary'),
    (r'text-gray-500', r'text-text-muted'),
    (r'text-gray-400', r'text-text-disabled'),
    
    # Shadows
    (r'shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]', r'shadow-card'),
    (r'shadow-\[0_8px_30px_rgb\(0,0,0,0\.08\)\]', r'shadow-card-hover'),
    (r'shadow-\[0_2px_10px_-4px_rgba\(0,0,0,0\.05\)\]', r'shadow-sm'),
    
    # Brand Colors
    (r'text-\[#0000B3\]', r'text-brand'),
    (r'bg-\[#0000B3\]', r'bg-brand'),
    (r'hover:text-\[#0000B3\]', r'hover:text-brand'),
    (r'hover:bg-\[#0000B3\]', r'hover:bg-brand'),
    (r'border-\[#0000B3\]', r'border-brand'),
    (r'focus:ring-\[#0000B3\]', r'focus:ring-brand'),
    
    # Teal
    (r'text-\[#12C6B3\]', r'text-teal'),
    (r'bg-\[#12C6B3\]', r'bg-teal'),
    
    # Removes border-none that was overriding the standard card border
    (r'border-none rounded-\[2rem\]', r'rounded-xl'),
    (r'border-none', r''),
    (r'rounded-\[2rem\]', r'rounded-xl'),
]

for directory in directories_to_scan:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, replacement in replacements:
                    content = re.sub(pattern, replacement, content)
                
                # Cleanup double spaces from removed classes
                content = re.sub(r' +', ' ', content)
                # Cleanup class=" "
                content = re.sub(r'class(Name)?=" "', r'class\1=""', content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

print("Done.")
