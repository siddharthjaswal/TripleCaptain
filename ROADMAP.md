# 🏴‍☠️ TRIPLE CAPTAIN - COMPLETE OVERHAUL ROADMAP

**Project:** Triple Captain FPL Manager  
**Status:** Needs Complete Refactor & Polish  
**FPL Entry ID:** 478397  
**Last Update:** 2026-02-10

---

## 🎯 MISSION

Transform Triple Captain from a functional prototype into a **production-grade, premium FPL analytics platform** with:
- ✅ Every component working flawlessly
- ✅ Professional, cohesive color scheme
- ✅ Consistent design language
- ✅ Excellent UX/UI
- ✅ Production-ready code quality

---

## 🔴 CRITICAL ISSUES (Must Fix First)

### 1. **Color Scheme Chaos**
**Problem:** Inconsistent use of green theme across components. Some use CSS variables, some hardcode colors, some still use old purple.

**Current State:**
- `globals.css` defines Premier League green theme (light: `#38ef7d`, dark: `#00ff85`)
- Components use mix of:
  - CSS variables (`var(--accent)`) ✅
  - Hardcoded hex colors ❌
  - Old purple/blue colors ❌
  - Tailwind utility classes without theming ❌

**Fix Plan:**
- [ ] Audit every component for color usage
- [ ] Replace ALL hardcoded colors with CSS variables
- [ ] Update Tailwind config to use CSS variables
- [ ] Create unified color tokens in `globals.css`
- [ ] Document color usage patterns

---

### 2. **Broken/Non-Functional Components**

**Components to audit and fix:**

#### Dashboard Widgets:
- [ ] **DeadlineCountdown** - Test real-time updates
- [ ] **PointsPace** - Verify calculation accuracy
- [ ] **ChipStatus** - Connect to real chip data
- [ ] **RankChangeIndicator** - Test with live data

#### Analytics Tools:
- [ ] **CaptainPicker** - Currently shows mock data
  - Need xPoints algorithm
  - Real fixture difficulty ratings
  - Ownership percentages from API
- [ ] **FixtureDifficultyMatrix** - Needs FDR data wiring
  - Map team fixtures
  - Calculate difficulty scores
  - Sort by easiest runs
- [ ] **PriceChangeTracker** - No live data
  - Need price prediction API
  - Real transfer stats
  - Accurate rise/fall probabilities
- [ ] **DifferentialFinder** - Mock data only
  - Ownership filtering
  - Differential score calculation
  - Form + FDR analysis
- [ ] **MiniLeagueInsights** - Not connected
  - Pull league standings
  - Calculate averages
  - Show comparisons
- [ ] **TeamValueTracker** - Static display
  - Historical value tracking
  - ITB calculations
  - Value change over time

#### Other Components:
- [ ] **GameweekPitchCard** - Test with different formations
- [ ] **DifferentialScout** - Verify algorithms
- [ ] **LeagueTable** - Data binding
- [ ] **PredictedXICard** - Prediction accuracy
- [ ] **PlayerDetailsModal** - Complete data display
- [ ] **FixturesCard** - Live fixture updates

---

### 3. **Design Consistency**

**Problems:**
- Inconsistent card styles (some use `.tc-card`, some custom classes)
- Button styling varies across pages
- Typography hierarchy unclear
- Spacing not standardized
- Mobile responsiveness patchy

**Fix Plan:**
- [ ] Define strict component hierarchy in `globals.css`
- [ ] Create reusable UI primitives (already exists in `components/ui/`)
- [ ] Standardize spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- [ ] Mobile-first breakpoints
- [ ] Touch target sizes (min 44px)

---

## 📋 PHASE 1: FOUNDATION (Week 1)

### 1.1 Color System Unification
**Time:** 1-2 days

**Tasks:**
1. **Audit existing colors**
   ```bash
   # Find all color usages
   grep -r "bg-\[#" components/
   grep -r "text-\[#" components/
   grep -r "#[0-9a-fA-F]\{6\}" components/
   ```

2. **Update `globals.css`** with complete token system:
   ```css
   :root {
     /* Core Brand */
     --brand-primary: #37003c;      /* PL Purple */
     --brand-secondary: #00ff85;    /* PL Green */
     
     /* Surfaces */
     --surface-root: ...;
     --surface-elevated: ...;
     --surface-glass: ...;
     
     /* Text */
     --text-primary: ...;
     --text-secondary: ...;
     
     /* Semantic */
     --success: #10b981;
     --warning: #f59e0b;
     --error: #ef4444;
     --info: #3b82f6;
   }
   ```

3. **Create Tailwind plugin** to use CSS variables:
   ```js
   // tailwind.config.ts
   theme: {
     extend: {
       colors: {
         'brand-primary': 'var(--brand-primary)',
         'brand-secondary': 'var(--brand-secondary)',
         // ... map all CSS variables
       }
     }
   }
   ```

4. **Component migration**:
   - Replace hardcoded colors component by component
   - Test in both light/dark themes
   - Document patterns

**Deliverables:**
- ✅ Single source of truth for colors
- ✅ All components use CSS variables
- ✅ Tailwind config synced
- ✅ Both themes working perfectly

---

### 1.2 Design System Documentation
**Time:** 1 day

**Tasks:**
1. Create `DESIGN_SYSTEM.md`:
   - Color palette with usage guidelines
   - Typography scale
   - Spacing system
   - Component patterns
   - Animation timings

2. Add Storybook or component playground (optional but recommended)

3. Document all utility classes in `globals.css`

**Deliverables:**
- ✅ Complete design system docs
- ✅ Developer reference guide

---

### 1.3 Component Library Cleanup
**Time:** 2 days

**Tasks:**
1. **Audit `components/ui/`**:
   - Button variants
   - Typography components
   - Card wrappers
   - Form inputs
   - Badges & chips

2. **Create missing primitives**:
   - `Skeleton` (loading states)
   - `Tooltip`
   - `Modal` (generic)
   - `Tabs`
   - `Toggle`

3. **Standardize props**:
   - Consistent naming (`variant`, `size`, `disabled`, etc.)
   - TypeScript types for all
   - Default values

**Deliverables:**
- ✅ Complete primitive component library
- ✅ Consistent API across components
- ✅ Full TypeScript coverage

---

## 📋 PHASE 2: COMPONENT FIXES (Week 2-3)

### 2.1 Dashboard Widgets (Priority 1)
**Time:** 3 days

#### DeadlineCountdown
- [x] Already working (verify)
- [ ] Test edge cases (deadline passed, <1 hour)
- [ ] Add timezone support
- [ ] Optimize re-render performance

#### PointsPace
- [ ] Verify calculation formulas
- [ ] Add animated progress bar
- [ ] Show milestone badges (1800, 2000, 2200)
- [ ] Compare to historical averages

#### ChipStatus
- [ ] Connect to real chip usage data
- [ ] Add "Best GW to use" recommendations
- [ ] Show historical chip impact stats
- [ ] Animate chip state changes

#### RankChangeIndicator
- [ ] Test with various rank deltas
- [ ] Add color coding (green/red gradients)
- [ ] Arrow animations
- [ ] Compact vs full variants

**Testing:**
- Unit tests for calculations
- Visual regression tests
- Mobile responsiveness

---

### 2.2 Analytics Tools (Priority 2)
**Time:** 5 days

#### CaptainPicker
**Current Issues:**
- Mock data
- No real xPoints calculation
- Missing fixture context

**Fixes:**
- [ ] Build xPoints algorithm:
  ```ts
  xPoints = (
    basePoints * formMultiplier * fixtureMultiplier
  ) + bonusExpectation
  ```
- [ ] Integrate FPL fixture difficulty ratings
- [ ] Pull real ownership data from bootstrap-static
- [ ] Add home/away strength modifiers
- [ ] Show injury/suspension warnings
- [ ] Expand to show "Captain EO" (effective ownership)

#### FixtureDifficultyMatrix
- [ ] Map team fixtures from FPL API
- [ ] Calculate FDR (1-5 scale) using:
  - Opponent defensive strength
  - Home/away factor
  - Recent form
- [ ] Add sorting (easiest run first)
- [ ] Highlight DGW/BGW gameweeks
- [ ] Mobile horizontal scroll polish

#### PriceChangeTracker
- [ ] Integrate price prediction service:
  - Option 1: fplstatistics.co.uk (scrape)
  - Option 2: fantasyfootballfix.com API
  - Option 3: Build own algorithm from transfers
- [ ] Real-time net transfer tracking
- [ ] Probability bars (0-100%)
- [ ] Filter by position/team
- [ ] "Watch list" feature

#### DifferentialFinder
- [ ] Real ownership data (bootstrap-static)
- [ ] Differential score algorithm:
  ```ts
  score = (
    (100 - ownershipPct) * 0.4 +
    formScore * 0.3 +
    fixtureScore * 0.2 +
    valueScore * 0.1
  ) * 100
  ```
- [ ] Configurable ownership threshold (default <10%)
- [ ] Sort by differential score
- [ ] Filter by budget (£X.Xm or less)
- [ ] "Why pick" reasoning bullets

#### MiniLeagueInsights
- [ ] API integration:
  ```
  GET https://fantasy.premierleague.com/api/leagues-classic/{league_id}/standings/
  ```
- [ ] Show top 3 + current user
- [ ] Calculate league averages
- [ ] Points behind leader
- [ ] Gameweek rank history chart
- [ ] Medal animations for top 3

#### TeamValueTracker
- [ ] Store historical squad value
- [ ] Calculate total value = squad + bank
- [ ] Track season-long change (+/- £X.Xm)
- [ ] Sparkline chart (Recharts)
- [ ] Compare to top 10k average
- [ ] Value growth rate %

**Testing:**
- API mocking for tests
- Error handling (API failures)
- Loading states
- Empty states

---

### 2.3 Mobile Experience Polish
**Time:** 2 days

**Focus Areas:**
1. **Bottom Navigation**:
   - [ ] Apple-style glassmorphism perfected
   - [ ] Active state animations smooth
   - [ ] Safe area insets correct
   - [ ] Touch feedback instant

2. **Touch Interactions**:
   - [ ] All buttons min 44px tap target
   - [ ] Swipe gestures (optional)
   - [ ] Pull-to-refresh (optional)
   - [ ] Haptic feedback (PWA)

3. **Responsive Grids**:
   - [ ] Dashboard cards stack properly
   - [ ] Pitch formation scales
   - [ ] Tables horizontal scroll
   - [ ] Modals full-screen on mobile

4. **Performance**:
   - [ ] Lazy load images
   - [ ] Virtual scrolling for long lists
   - [ ] Debounce real-time updates
   - [ ] Optimize re-renders

---

## 📋 PHASE 3: FEATURES & POLISH (Week 4)

### 3.1 Advanced Features
**Time:** 3 days

#### Multi-GW Transfer Planner
- [ ] Already exists - test thoroughly
- [ ] BGW/DGW detection working?
- [ ] Optimal transfer paths
- [ ] Bank management
- [ ] Chip integration (WC, FH planning)

#### AI Analysis (Pro Feature)
- [ ] "The Gaffer" persona prompts
- [ ] AI-powered captain picks
- [ ] Transfer recommendations
- [ ] Chip timing advice
- [ ] Weekly team summary
- [ ] Credit system working

#### Team Comparison
- [ ] Compare with friends/rivals
- [ ] Head-to-head stats
- [ ] Differential highlights
- [ ] Transfer differences

#### Price Alert System
- [ ] Set price targets for players
- [ ] Notification when reached
- [ ] Auto-update watch list

---

### 3.2 Performance Optimization
**Time:** 2 days

**Tasks:**
1. **Bundle Analysis**:
   ```bash
   npm run build
   npx @next/bundle-analyzer
   ```

2. **Optimizations**:
   - [ ] Code splitting
   - [ ] Dynamic imports for heavy components
   - [ ] Image optimization (next/image)
   - [ ] Font optimization
   - [ ] Remove unused dependencies

3. **Caching Strategy**:
   - [ ] FPL API data (SWR or React Query)
   - [ ] Aggressive stale-while-revalidate
   - [ ] Service worker (PWA)

4. **Lighthouse Audit**:
   - Target: 90+ on all metrics
   - [ ] Performance
   - [ ] Accessibility
   - [ ] Best Practices
   - [ ] SEO

---

### 3.3 Accessibility
**Time:** 1 day

**Tasks:**
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation (tab order)
- [ ] Focus indicators visible
- [ ] Screen reader testing
- [ ] Color contrast ratios (WCAG AA)
- [ ] Reduced motion support
- [ ] Skip to content links

---

### 3.4 Testing Coverage
**Time:** 2 days

**Tasks:**
1. **Unit Tests** (Vitest):
   - [ ] Component logic
   - [ ] Utility functions
   - [ ] Calculations (xPoints, differential scores)
   - [ ] Data transformations

2. **Integration Tests** (Testing Library):
   - [ ] User flows
   - [ ] Form submissions
   - [ ] Navigation
   - [ ] API interactions

3. **E2E Tests** (Playwright):
   - [ ] Login flow
   - [ ] Dashboard loading
   - [ ] Widget interactions
   - [ ] Mobile navigation
   - [ ] Theme switching

**Target:** 80%+ coverage on critical paths

---

## 📋 PHASE 4: PRODUCTION READY (Week 5)

### 4.1 Final Polish
**Time:** 2 days

**Visual:**
- [ ] Animation timing perfect
- [ ] Loading states smooth
- [ ] Error states helpful
- [ ] Empty states engaging
- [ ] Success confirmations satisfying

**Content:**
- [ ] Helpful onboarding
- [ ] Tooltips for complex features
- [ ] Error messages clear
- [ ] Loading messages contextual

**Edge Cases:**
- [ ] No internet connection
- [ ] API rate limits
- [ ] Invalid entry IDs
- [ ] Season not started
- [ ] Gameweek deadline passed

---

### 4.2 Documentation
**Time:** 1 day

**Files to create/update:**
- [ ] `README.md` - Project overview
- [ ] `CONTRIBUTING.md` - Dev setup
- [ ] `DEPLOYMENT.md` - Deploy guide
- [ ] `API_INTEGRATION.md` - FPL API docs
- [ ] `DESIGN_SYSTEM.md` - Component guide
- [ ] `CHANGELOG.md` - Version history

---

### 4.3 Deployment Prep
**Time:** 1 day

**Tasks:**
1. **Environment Setup**:
   - [ ] Production `.env` template
   - [ ] Secrets management
   - [ ] Database migrations

2. **CI/CD Pipeline**:
   - [ ] GitHub Actions
   - [ ] Lint + Test + Build
   - [ ] Preview deployments
   - [ ] Auto-deploy to Vercel/Netlify

3. **Monitoring**:
   - [ ] Error tracking (Sentry)
   - [ ] Analytics (Vercel Analytics)
   - [ ] Performance monitoring

4. **Launch Checklist**:
   - [ ] Domain configured
   - [ ] SSL certificates
   - [ ] OG images
   - [ ] robots.txt
   - [ ] sitemap.xml

---

## 🎨 COLOR SCHEME REFINEMENT

### Current Theme (Premier League Green)

**Light Mode:**
```css
--surface-root: #f5f8f7;          /* Soft mint background */
--accent: #38ef7d;                 /* Vibrant PL green */
--text-primary: #0a1612;           /* Dark green text */
```

**Dark Mode:**
```css
--surface-root: #020817;           /* Deep navy */
--accent: #00ff85;                 /* Electric green */
--text-primary: #f0fdf4;           /* Light text */
```

### Proposed Improvements

**Option 1: Deepen the Theme (More Classy)**
```css
/* Light Mode */
--surface-root: #fafaf9;           /* Warmer off-white */
--accent: #10b981;                 /* Emerald (less neon) */
--surface-elevated: #ffffff;
--surface-border: #e5e7eb;

/* Dark Mode */
--surface-root: #0c0a09;           /* Warm black */
--accent: #34d399;                 /* Softer emerald */
--surface-elevated: #1c1917;
--surface-border: #292524;
```

**Option 2: Keep Vibrant, Add Sophistication**
- Keep current green accent
- Add subtle gradients to surfaces
- Use more neutral backgrounds
- Reserve green for interactive elements only

**Recommendation:** Option 1 - More refined, professional feel while keeping Premier League green identity.

---

## 📊 SUCCESS METRICS

### Technical
- [ ] TypeScript strict mode: 0 errors
- [ ] Lighthouse score: 90+ on all metrics
- [ ] Test coverage: 80%+
- [ ] Bundle size: <500KB initial load
- [ ] FCP: <1.5s
- [ ] TTI: <3.5s

### User Experience
- [ ] All widgets showing real data
- [ ] Consistent theme in light/dark
- [ ] Smooth animations (60fps)
- [ ] Mobile-friendly (100% features)
- [ ] Accessible (WCAG AA)

### Code Quality
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: all files formatted
- [ ] No console.log in production
- [ ] Proper error boundaries
- [ ] All TODOs resolved

---

## 🚀 QUICK WINS (Do First!)

These can be done in parallel before the structured phases:

1. **Global Color Fix** (2 hours):
   - Replace ALL hardcoded colors with CSS variables
   - Test in both themes
   - Commit: "refactor: unify color system"

2. **Component Naming** (1 hour):
   - Ensure all use `.tc-*` class prefix
   - Remove one-off custom classes
   - Commit: "refactor: standardize component classes"

3. **Type Safety** (3 hours):
   - Add missing TypeScript interfaces
   - Remove any `any` types
   - Fix prop typing inconsistencies
   - Commit: "fix: improve type safety"

4. **Loading States** (2 hours):
   - Add `<Skeleton>` to all data-dependent components
   - Consistent loading UX
   - Commit: "feat: add loading skeletons"

5. **Error Boundaries** (1 hour):
   - Wrap each page/major component
   - User-friendly error messages
   - Commit: "feat: add error boundaries"

---

## 📝 NOTES

### Things to Keep
- ✅ Apple-style bottom navigation (mobile)
- ✅ Glassmorphism effects
- ✅ Premier League green theme foundation
- ✅ Pitch visualization design
- ✅ Component architecture
- ✅ TypeScript setup

### Things to Improve
- ❌ Color consistency
- ❌ Data integration
- ❌ Component reliability
- ❌ Mobile polish
- ❌ Loading/error states
- ❌ Documentation

### Future Enhancements (Post-Launch)
- Progressive Web App (PWA)
- Push notifications (deadline reminders)
- Social features (share team screenshots)
- Historical season data
- Advanced analytics (xG, xA integration)
- Video highlights integration
- News feed aggregation

---

## 🎯 TIMELINE ESTIMATE

| Phase | Tasks | Time |
|-------|-------|------|
| **Phase 1: Foundation** | Color system, Design docs, Component lib | 4 days |
| **Phase 2: Component Fixes** | Widgets, Analytics, Mobile | 10 days |
| **Phase 3: Features & Polish** | Advanced features, Performance, Testing | 7 days |
| **Phase 4: Production Ready** | Polish, Docs, Deployment | 4 days |
| **TOTAL** | | **~25 days (5 weeks)** |

**With part-time work:** 8-10 weeks  
**With focused full-time:** 3-4 weeks

---

## 🏁 DEFINITION OF DONE

The project is **production-ready** when:

1. ✅ Every component uses real FPL data
2. ✅ Color scheme is 100% consistent
3. ✅ Works perfectly on mobile & desktop
4. ✅ All interactive elements functional
5. ✅ Both themes (light/dark) polished
6. ✅ 80%+ test coverage
7. ✅ Lighthouse score 90+
8. ✅ Zero TypeScript errors
9. ✅ Comprehensive documentation
10. ✅ Deployed and accessible

---

**Next Step:** Start with **Quick Wins**, then proceed to **Phase 1** systematically.

Let's build something incredible! 🏴‍☠️⚽
