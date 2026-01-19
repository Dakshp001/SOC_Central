# GSuite Date Filtering Fixes

## Issues Identified

1. **Date Format Inconsistency**: Different GSuite Excel sheets had different date formats:
   - "total number of mail scanned": `Timestamp('2025-07-16 08:44:00')` (already parsed)
   - "Phishing Attempted data": `'Jul 14, 2025, 05:05 PM'` (string format)
   - "Client Coordinated email invest": `Timestamp('2025-01-20 00:00:00')` (already parsed)

2. **Frontend vs Backend Filtering**: GSuite dashboard was using client-side filtering instead of backend API filtering like other dashboards.

3. **Date Parsing Priority**: The date parsing logic wasn't prioritizing GSuite-specific formats.

## Fixes Applied

### 1. Backend GSuite Processor (`backend/tool/gsuite/processor.py`)

**Fixed date parsing for each sheet:**

```python
# Mail scanned sheet - handle already parsed timestamps
if 'Date' in total_mail_df.columns:
    total_mail_df['Date'] = pd.to_datetime(total_mail_df['Date'], errors='coerce')

# Phishing sheet - handle string format "Jul 14, 2025, 05:05 PM"
date_col = None
for col in phishing_df.columns:
    if 'date' in col.lower() and 'report' in col.lower():
        date_col = col
        break

if date_col:
    phishing_df[date_col] = pd.to_datetime(
        phishing_df[date_col], format="%b %d, %Y, %I:%M %p", errors="coerce"
    )
    if date_col != 'Date Reported':
        phishing_df['Date Reported'] = phishing_df[date_col]

# Client investigations - handle already parsed timestamps
date_col = None
for col in client_df.columns:
    if 'date' in col.lower():
        date_col = col
        break

if date_col:
    client_df[date_col] = pd.to_datetime(client_df[date_col], errors='coerce')
    if date_col != 'Date':
        client_df['Date'] = client_df[date_col]
```

### 2. Data Filter Service (`backend/tool/services/data_filter_service.py`)

**Enhanced date field priority for GSuite:**

```python
date_fields = [
    # GSuite-specific date fields (PRIORITY)
    'Date Reported', 'date reported', 'Date', 'date',
    # Other fields...
]
```

**Updated date format parsing priority:**

```python
date_formats = [
    # GSuite specific formats (PRIORITY - most important for this issue)
    '%b %d, %Y, %I:%M %p',          # "Jul 14, 2025, 05:05 PM" - Phishing data
    '%d-%m-%Y %I.%M.%S %p',         # "16-07-2025 8.44.00 AM" - Mail scanned data
    '%d-%m-%Y',                     # "04-02-2025" - Client investigations
    '%Y-%m-%d %H:%M:%S',            # "2025-07-16 08:44:00" - Already parsed timestamps
    # Other formats...
]
```

**Improved normalize_date_to_iso function:**

```python
# Handle pandas Timestamp objects directly
if hasattr(value, 'isoformat'):
    try:
        return value.isoformat()
    except:
        pass

# Handle datetime objects
if isinstance(value, datetime):
    try:
        return value.isoformat()
    except:
        pass
```

### 3. Frontend GSuite Dashboard (`soccentral/src/components/dashboards/GSuiteDashboard.tsx`)

**Switched from client-side to backend API filtering:**

```typescript
// OLD: Client-side filtering
const filteredData = useMemo(() => {
  return filterGSuiteDataByDateRange(data, dateRange.startDate, dateRange.endDate);
}, [data, dateRange]);

// NEW: Backend API filtering
const { loadFilteredData, loadActiveData } = useToolData();
const filteredData = data; // Use data as-is since filtering is handled by backend

// Handle date range changes - Use backend API filtering
const handleDateRangeChange = async (range: DateRange) => {
  setDateRange(range);
  
  if (range.startDate && range.endDate) {
    // Apply date filter via backend API
    await loadFilteredData({
      timeRange: 'custom',
      dateRange: {
        from: range.startDate.toISOString(),
        to: range.endDate.toISOString()
      },
      dataSource: 'gsuite'
    });
  } else if (!range.startDate && !range.endDate) {
    // No filter applied, load raw data
    await loadActiveData();
  }
};
```

### 4. Frontend GSuite Utils (`soccentral/src/components/dashboards/GSuite/utils.ts`)

**Enhanced date parsing for actual GSuite formats:**

```typescript
export const parseGSuiteDate = (dateString: string): Date | null => {
  // 1. Try native JS parsing first (handles ISO formats from backend)
  const parsedDate = new Date(cleanedDate);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // 2. Try common GSuite formats with date-fns (for raw Excel data)
  const knownFormats = [
    "MMM dd, yyyy, hh:mm a",  // "Jul 14, 2025, 05:05 PM" - Phishing data
    "dd-MM-yyyy h.mm.ss a",   // "16-07-2025 8.44.00 AM" - Mail scanned data
    "dd-MM-yyyy",             // "04-02-2025" - Client investigations
    "yyyy-MM-dd HH:mm:ss",    // "2025-07-16 08:44:00" - Already parsed timestamps
    "yyyy-MM-dd",             // ISO date format
    "MM/dd/yyyy",             // US format fallback
  ];
};
```

**Updated date field names for filtering:**

```typescript
const dateFields = [
  // Exact field names from the Excel sheets
  'Date',           // "total number of mail scanned" sheet
  'Date Reported',  // "Phishing Attempted data" sheet (standardized)
  'date reported',  // "Phishing Attempted data" sheet (original)
  'date',           // "Client Coordinated email invest" sheet
  // Additional common date fields as fallback
];
```

## Test Results

The fixes were validated with comprehensive testing:

1. **Date Parsing**: All GSuite date formats are now correctly parsed
2. **April 2025 Filtering**: 
   - "total number of mail scanned": 0 items (correctly filtered - no April data)
   - "Phishing Attempted data": 2 items (April 16 and April 24)
   - "Client Coordinated email invest": 1 item (April 10)
   - "whitelisted domains": 3 items (preserved - no date filtering)

### 5. Data Filter Service - Deduplication Fix (`backend/tool/services/data_filter_service.py`)

**Fixed the deduplication logic that was causing duplicate records to be skipped:**

```python
@staticmethod
def _create_record_signature(item: Dict[str, Any]) -> str:
    """Create a unique signature for a record to detect duplicates"""
    # Use key fields to create a unique signature - handle different tool formats
    key_fields = [
        # Generic fields
        'title', 'Date', 'Username', 'Severity', 'Severity_Numeric', 'Alert Type',
        # GSuite specific fields
        'alert type', 'date reported', 'Date Reported', 'severity', 'phishing reported by user',
        'Subject', 'Message ID', 'Owner', 'Sender', 'Recipient',
        'email subject', 'sender', 'requested by',
        # Other tool fields...
    ]
    
    # If no key fields found, use all fields to create signature
    if not signature_parts:
        for field, value in item.items():
            if value is not None:
                signature_parts.append(f"{field}:{str(value)}")
```

## Root Cause Analysis

The main issue was **deduplication logic failure**:

1. **Original signature function** only looked for generic field names like `'Alert Type'`, `'Date'`, `'Severity'`
2. **GSuite data** uses different field names like `'alert type'`, `'date reported'`, `'severity'`
3. **No matching fields** meant both April records generated empty signatures
4. **Empty signatures** were considered identical, causing the second record to be marked as duplicate
5. **Result**: Only 1 April record instead of 2

## Expected Behavior

When you apply an April 2025 date filter in the GSuite dashboard:

1. **Backend API** will receive the filter request
2. **Date parsing** will correctly handle all GSuite date formats
3. **Filtering logic** will only return items with dates in April 2025
4. **Deduplication** will work correctly with GSuite-specific field names
5. **Frontend** will display the filtered results (2 April phishing records)
6. **KPIs** will be recalculated based on filtered data

## Test Results

✅ **April 2025 filtering now works correctly:**
- **"total number of mail scanned"**: 0 items (no April data - correct)
- **"Phishing Attempted data"**: 2 items (April 16 and April 24 - correct)
- **"Client Coordinated email invest"**: 1 item (April 10 - correct)

The filtering now works correctly and shows exactly the data that falls within the selected date range.