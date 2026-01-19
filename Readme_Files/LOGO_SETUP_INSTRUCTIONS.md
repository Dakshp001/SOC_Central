# SOC Central Logo Setup Instructions

## 🎯 Current Status
✅ Logo system is **WORKING** with existing logos as fallback  
✅ Theme switching is **FUNCTIONAL**  
✅ All components are **UPDATED** and ready  

The dashboard is currently using your existing logos and will **automatically switch** to your new logos once you copy them to the correct locations.

## 🚀 Quick Setup

### 1. Copy Your Logo Files
Copy your two PNG logo files to these exact locations:

```
📁 soccentral/public/
├── logo-dark.png   ← Your logo with WHITE/LIGHT elements (for dark backgrounds)
└── logo-light.png  ← Your logo with DARK elements (for light backgrounds)
```

**That's it!** The dashboard will automatically detect and use your new logos.

### 2. File Naming Convention
- **logo-dark.png**: Your logo with white/light elements (shows on dark backgrounds)
- **logo-light.png**: Your logo with dark elements (shows on light backgrounds)

### 3. Recommended Logo Specifications
- **Format**: PNG with transparency
- **Size**: 512x512px or similar square dimensions
- **Quality**: High resolution for crisp display
- **Background**: Transparent for best results

## What's Been Updated

### ✅ Components Updated
1. **HeaderLogo Component** (`soccentral/src/pages/Main_dashboard/HeaderLogo.tsx`)
   - Now uses theme-aware logo switching
   - Added hover effects and animations
   - Improved accessibility

2. **New Logo Component** (`soccentral/src/components/ui/Logo.tsx`)
   - Reusable across the entire application
   - Multiple size options (sm, md, lg, xl)
   - Optional text display
   - Hover effects and variants

3. **AuthPage Component** (`soccentral/src/pages/AuthPage.tsx`)
   - Updated to use new Logo component
   - Maintains existing styling and layout
   - Theme-aware logo switching

### ✅ Features Added
- **Automatic Theme Detection**: Logo switches based on light/dark mode
- **Hover Effects**: Subtle animations and glow effects
- **Responsive Sizing**: Different sizes for different contexts
- **Accessibility**: Proper alt text and semantic markup
- **Performance**: Optimized loading and transitions

## Testing Your Logos

After copying your logo files:

1. **Start the development server**:
   ```bash
   cd soccentral
   npm run dev
   ```

2. **Test theme switching**:
   - Toggle between light and dark modes using the theme button
   - Verify logos switch appropriately
   - Check both header and auth pages

3. **Test responsiveness**:
   - Check on different screen sizes
   - Verify hover effects work properly
   - Ensure logos are crisp and clear

## Usage Examples

The new Logo component can be used anywhere in your app:

```tsx
import { Logo } from "@/components/ui/Logo";

// Basic logo
<Logo size="md" />

// Logo with text
<Logo size="lg" showText={true} />

// Clickable logo with glow effect
<Logo 
  size="xl" 
  variant="with-glow" 
  onClick={() => navigate('/dashboard')}
  showText={true}
/>
```

## Troubleshooting

### Logo Not Showing
- Verify files are in correct locations
- Check file names match exactly: `logo-dark.png` and `logo-light.png`
- Ensure files are valid PNG format

### Logo Too Large/Small
- Adjust the `size` prop: `sm`, `md`, `lg`, or `xl`
- For custom sizing, add className with specific dimensions

### Theme Not Switching
- Clear browser cache
- Check if theme toggle is working
- Verify both logo files exist

## Next Steps

1. Copy your logo files to the specified locations
2. Test the dashboard in both light and dark modes
3. Adjust sizing if needed by modifying the Logo component
4. Consider adding your logo to other pages as needed

The logo system is now fully integrated and ready to use! 🎉