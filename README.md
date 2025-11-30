# PrintStack

A comprehensive 3D printing inventory management system to track filaments, models, and print history. Built with React 18+, Vite, and modern web technologies.

![Logo](images/printstack_logo.png) ![PrintStack Interface](screenshot.png)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Modern web browser (Chrome/Edge 90+, Firefox 88+, Safari 14+)

### Installation

1. **Clone this repository:**

```bash
git clone https://github.com/falcnor/PrintStack.git
cd PrintStack
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development server:**

```bash
npm run dev
```

4. **Open your browser:**

Navigate to `http://localhost:5173`

That's it! The development server will hot-reload automatically as you make changes.

### Production Deployment

```bash
# Build for production
npm run build:prod

# Or run full deployment pipeline
npm run deploy:build
```

The built files will be available in the `deploy/` directory.

## 📦 Features

### Enhanced Filament Library

- **Comprehensive tracking**: Brand, material type, hex colors, diameter, temperature ranges
- **Purchase management**: Date, price, storage location tracking
- **Smart inventory**: Automatic usage calculation and stock management
- **Multi-diameter support**: 1.75mm and 2.85mm filaments

### Advanced Models Management

- **Usage requirements**: Expected filament consumption with tolerance settings
- **Printability indicators**: Real-time status based on available inventory (✓✗⚠)
- **Print settings**: Layer height, infill, supports, time estimates
- **Organization**: Categories, tags, and smart search functionality

### Detailed Print History

- **Actual usage tracking**: Real filament consumption vs. estimates
- **Quality ratings**: Poor/Fair/Good/Excellent print quality tracking
- **Automatic inventory updates**: Real-time deduction from filament stocks
- **Cost analysis**: Material costs per print and cumulative spending

### Analytics & Statistics

- **Comprehensive reports**: Usage by brand, material type, and color
- **Efficiency metrics**: Accuracy of usage estimates vs. actual consumption
- **Consumption trends**: Filament usage patterns over time
- **Printability dashboard**: Real-time status of all models

## 🛠️ Development Commands

```bash
# Development
npm run dev                 # Start development server with hot reload
npm dev                     # Alternative command

# Building
npm run build               # Development build
npm run build:prod          # Production build with optimizations
npm run build:analyze       # Build with bundle analysis
npm run build:report        # BundlePhobia-style report

# Preview
npm run preview             # Preview production build
npm run preview:prod        # Preview production build

# Testing
npm test                    # Run test suite
npm run test:ui             # Test with UI
npm run test:coverage       # Test with coverage report

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Fix linting issues
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting
npm run type-check          # TypeScript type checking

# Deployment
npm run deploy:build        # Full deployment pipeline
npm run deploy:check        # Build with analysis
npm run clean:build         # Clean build directories

# Optimization
npm run optimize:images     # Optimize images
npm run performance:audit   # Performance audit
```

## 🏗️ Project Structure

```
printstack/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── common/         # Shared components
│   │   ├── filament/       # Filament management
│   │   ├── models/         # Model management
│   │   ├── prints/         # Print history
│   │   ├── statistics/     # Analytics
│   │   ├── navigation/     # Navigation components
│   │   └── theme/          # Theme system
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── App.jsx             # Main application component
│   └── main.jsx            # Application entry point
├── scripts/                # Build and deployment scripts
│   ├── deploy.js           # Deployment pipeline
│   ├── sync-deploy.js      # Folder synchronization
│   ├── analyze-bundle.js   # Bundle analysis
│   └── bundlephobia-check.js # Bundle size analysis
├── package.json            # Dependencies and scripts
├── vite.config.js          # Development configuration
├── vite.prod.config.js     # Production configuration
└── README.md               # This file
```

## ⚙️ Configuration

### Vite Development Config

- **Fast HMR**: Instant hot module replacement
- **Modern ES**: Full ES2020+ support
- **Optimized deps**: Fast startup times
- **React plugins**: JSX and React Fast Refresh

### Production Optimizations

- **Code splitting**: Feature-based chunk optimization
- **Tree shaking**: Dead code elimination
- **Minification**: ESBuild for fast, efficient minification
- **Compression**: Gzip and Brotli asset compression
- **Bundle analysis**: Detailed size and dependency analysis

## 🚀 Deployment

### Automated Deployment Pipeline

```bash
# Full production deployment
node scripts/deploy.js

# With options
node scripts/deploy.js --skip-tests --env production --sw
```

**Features:**
- Automated testing and linting
- Production build optimization
- Bundle analysis and reporting
- Deployment manifest generation
- Error handling and recovery

### File Synchronization

```bash
# Sync to deployment target
node scripts/sync-deploy.js --target /var/www/html

# Watch for changes
node scripts/sync-deploy.js --watch

# Dry run preview
node scripts/sync-deploy.js --dry-run
```

**Features:**
- Bidirectional file synchronization
- Backup creation and rollback
- Real-time watching capabilities
- Exclusion patterns and filters
- Integrity verification with checksums

## ♿ Accessibility & Performance

### WCAG AA Compliance

- **Color contrast**: Accessible color combinations with validation
- **Keyboard navigation**: Complete keyboard accessibility
- **Screen reader support**: ARIA labels and announcements
- **Focus management**: Logical tab order and visible indicators
- **Text scaling**: Supports 200% zoom without functionality loss

### Performance Targets

- **Bundle size**: <200KB raw, <50KB gzipped
- **Interaction response**: <100ms for all UI interactions
- **First Contentful Paint**: <1.5s on 3G connections
- **Accessibility compliance**: WCAG AA standards
- **Cross-browser compatibility**: Modern browser support

### Responsive Design Testing

Built-in responsive testing framework supports 20+ device viewports:

- Mobile: iPhone SE, iPhone 12, Galaxy S20, Pixel 5
- Tablet: iPad, iPad Pro, Surface Pro, Galaxy Tab
- Desktop: Various breakpoints from 1280px to 2560px

## 🧪 Testing & Quality Assurance

### Built-in Testing Tools

```bash
# Run responsive design tests
npm run test:responsive

# Performance monitoring
npm run test:performance

# Accessibility audit
npm run test:accessibility
```

### Progressive Enhancement

- **No-JavaScript fallback**: Core functionality works without JavaScript
- **Semantic HTML**: Meaningful structure for screen readers
- **Graceful degradation**: Features enhance rather than replace
- **Offline capability**: Service worker support for cached usage

## 📊 Bundle Analysis & Optimization

### Automated Analysis Tools

1. **Bundle Size Analysis**: Detailed breakdown of file sizes and compression ratios
2. **BundlePhobia Report**: Page load impact analysis across network conditions
3. **Performance Monitoring**: Real-time Web Vitals collection
4. **Optimization Suggestions**: Automated recommendations for improvement

### Production Metrics

- **Chunk optimization**: Feature-based code splitting
- **Vendor separation**: React, router, and utility isolation
- **Asset organization**: Optimized file naming and caching
- **Source maps**: Minimal maps for production debugging

## 🛠️ Technology Stack

### Core Technologies

- **React 18+**: Modern hooks-based component architecture
- **Vite 4+**: Fast build tool with optimized development experience
- **JavaScript ES2020+**: Modern JavaScript features and syntax
- **CSS Modules**: Scoped styling with theme support

### Development Tools

- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Vitest**: Fast unit testing framework
- **TypeScript**: Optional type checking support

### Build & Deployment

- **ESBuild**: Fast minification and tree shaking
- **Rollup**: Advanced bundling and code splitting
- **Compression**: Gzip and Brotli optimization
- **Visualizer**: Interactive bundle analysis

## 🔧 Advanced Configuration

### Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=https://api.printstack.com
VITE_DEBUG_MODE=true
VITE_THEME_SYSTEM=auto
```

### Custom Build Configuration

Modify `vite.prod.config.js` for custom production settings:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: yourCustomChunkingFunction
      }
    }
  }
});
```

## 📈 Performance Monitoring

### Real-time Metrics

- **Web Vitals**: LCP, FID, CLS tracking
- **Bundle analysis**: Size and compression monitoring
- **Network performance**: Resource loading optimization
- **User interactions**: Response time measurement

### Monitoring Tools

```bash
# Performance audit
npm run performance:audit

# Bundle analysis
npm run build:analyze

# Continuous monitoring
npm run dev:monitor
```

## 🔄 Migration from Previous Version

If you're migrating from the vanilla JavaScript version:

1. **Data Migration**: Existing localStorage data is automatically migrated
2. **Feature Enhancements**: All previous features enhanced with new capabilities
3. **API Compatibility**: Legacy data structure support maintained
4. **Upgrade Path**: Seamless transition with zero data loss

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PrintStack.git`
3. Navigate to the project: `cd PrintStack`
4. Install dependencies: `npm install`
5. Create your feature branch: `git checkout -b feature/AmazingFeature`
6. Start development: `npm run dev`
7. Commit your changes: `git commit -m 'Add some AmazingFeature'`
8. Push to the branch: `git push origin feature/AmazingFeature`
9. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Maintain WCAG AA accessibility
- Keep bundle size impact in mind

## 🗺️ Roadmap

- [ ] PWA (Progressive Web App) support
- [ ] Offline-first architecture
- [ ] Cloud sync integration
- [ ] Multi-user support
- [ ] Advanced analytics dashboard
- [ ] 3D visualization for models
- [ ] Mobile app deployment
- [ ] Integration with 3D printers

## 📄 License

This project is licensed under the MIT License - see the
[LICENSE](https://github.com/falcnor/PrintStack/LICENSE) file for details.
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🙏 Acknowledgments

- Inspired by the 3D printing community's need for better inventory management
- Built with modern web technologies for optimal performance
- Accessibility-first design for inclusive user experience
- Performance-driven approach for fast, responsive interactions

## 📞 Support

If you encounter any issues or have suggestions, please
[open an issue](https://github.com/falcnor/PrintStack/issues).

### Performance Issues

For performance-related issues, please include:

- Browser and version
- Device specifications
- Network connection speed
- Console errors (if any)
- Bundle size analysis output

### Bug Reports

When reporting bugs, please provide:

- Steps to reproduce
- Expected vs. actual behavior
- Browser and device information
- Screenshots if applicable

---

**Made with ❤️ and React for the 3D printing community**