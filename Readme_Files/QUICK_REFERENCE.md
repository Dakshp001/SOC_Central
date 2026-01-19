# SOC Central - Quick Reference Card

## 🚀 Common Tasks

### Show Loading State
```tsx
import { DashboardSkeleton } from '@/components/common/SkeletonLoader';

{isLoading ? <DashboardSkeleton /> : <Content />}
```

### Prefetch Data
```tsx
import { usePrefetchData } from '@/hooks/usePrefetchData';

function Dashboard() {
  usePrefetchData(); // Prefetch in background
  return <div>...</div>;
}
```

### Debounce Search
```tsx
import { useDebounce } from '@/hooks/useDebounce';

const debouncedSearch = useDebounce(searchTerm, 300);
```

### Send Email Async
```python
from authentication.tasks import send_otp_email_async

send_otp_email_async(email, otp_code, first_name)
return Response({'success': True})  # Instant response
```

### Optimistic Update
```tsx
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';

const mutation = useOptimisticUpdate({
  queryKey: ['data'],
  mutationFn: api.update,
  updateFn: (old, new) => ({ ...old, ...new }),
});
```

### Virtual Scrolling
```tsx
import { VirtualizedList } from '@/components/common/VirtualizedList';

<VirtualizedList
  items={data}
  itemHeight={60}
  height={600}
  renderItem={(item) => <Row item={item} />}
/>
```

---

## 📊 Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| API Response | < 200ms | Network tab |
| Page Load | < 1.5s | Lighthouse |
| Bundle Size | < 500KB | `npm run build` |
| Cache Hit Rate | > 80% | Django logs |

---

## 🛠️ Build Commands

```bash
# Development
npm run dev

# Production build
npm run build:production

# Analyze bundle
npm run build:analyze

# Check size
npm run size-check
```

---

## 🐛 Quick Fixes

### Login slow?
- Check async email is enabled
- Verify cache table exists
- Monitor API response time

### Tools not instant?
- Check prefetching enabled
- Verify React Query cache
- Check Network tab for requests

### Blank screens?
- Add Suspense boundary
- Use skeleton loaders
- Check loading states

---

## 📁 Key Files

### Frontend:
- `vite.config.ts` - Build config
- `App.tsx` - React Query config
- `index.html` - Resource hints

### Backend:
- `core/settings.py` - Cache, middleware
- `authentication/tasks.py` - Async emails

### Components:
- `SkeletonLoader.tsx` - Loading states
- `OptimizedChart.tsx` - Memoized charts
- `VirtualizedList.tsx` - Virtual scrolling

### Hooks:
- `useDebounce.ts` - Debounce/throttle
- `usePrefetchData.ts` - Prefetching
- `useOptimisticUpdate.ts` - Optimistic UI

---

## 📞 Support

Issues? Check:
1. `OPTIMIZATION_SUMMARY.md` - Overview
2. `LOADING_OPTIMIZATIONS.md` - Loading fixes
3. `PERFORMANCE_OPTIMIZATIONS.md` - Build optimizations
4. Component documentation in files
