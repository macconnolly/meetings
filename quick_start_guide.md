# Meeting Intelligence System - 5-Minute Quick Start

## 🚀 Setup in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Supermemory API key
- OpenRouter API key (for AI processing)

### Step 1: Clone and Install (1 minute)
```bash
git clone <repository-url>
cd meeting-intelligence-system
npm install
```

### Step 2: Configure Environment (2 minutes)
Create `.env` file:
```bash
# Required API Keys
SUPERMEMORY_API_KEY=your-supermemory-api-key
SUPERMEMORY_USER_ID=your-user-id
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional (defaults shown)
ANTHROPIC_MODEL=claude-3-opus-20240229
LOG_LEVEL=info
```

### Step 3: Test Connection (1 minute)
```bash
# Verify Supermemory connection
node test/manual/test-supermemory-connection.js

# Expected output:
# ✅ Supermemory API connection successful
# ✅ Created test memory with ID: xxx
# ✅ Retrieved test memory successfully
```

### Step 4: Process First Meeting (1 minute)
```bash
# Use sample transcript
node pipe.js --transcript ./test/fixtures/sample-transcript.txt

# Expected output:
# ✅ Processed transcript successfully
# ✅ Created 12 memory objects
# ✅ Pipeline completed in 15.2 seconds
```

---

## 📅 Daily Workflow

### Morning: Process Yesterday's Meetings (10 minutes)
```bash
# 1. Export meeting transcripts from your system
# 2. Place in ./data/transcripts/

# 3. Process all transcripts
for file in ./data/transcripts/*.txt; do
  node pipe.js --transcript "$file"
done

# 4. Check results
cat ./logs/processing-summary.log
```

### Midday: Prepare Deliverable (15 minutes)
```bash
# When ContextAssembler is implemented:
node assemble-context.js \
  --deliverable "Status Report" \
  --type "status_report" \
  --audience "Executive Team" \
  --topic "Q1 Progress"

# Outputs context package with:
# - Relevant decisions
# - Action items
# - Stakeholder preferences
# - Similar deliverables
# - Success patterns
```

### End of Day: Review Metrics (5 minutes)
```bash
# Check daily processing stats
node scripts/daily-metrics.js

# Output:
# Meetings processed: 18/20
# Memories created: 216
# Average processing time: 12.3s
# API success rate: 99.2%
```

---

## 🎯 Common Tasks

### Process a Specific Meeting
```bash
# With meeting metadata
node pipe.js \
  --transcript ./meeting.txt \
  --metadata ./meeting-info.json
```

### Search Memories
```bash
# Find all decisions about budget
node scripts/search-memories.js \
  --query "budget allocation decision" \
  --tags "decision,approved-decisions"
```

### Generate Meeting Report
```bash
# Create summary of all meetings this week
node scripts/weekly-report.js --start-date 2025-01-15
```

### Bulk Process Historical Meetings
```bash
# Process all meetings in a directory
node scripts/bulk-process.js \
  --input-dir ./historical-meetings \
  --output-dir ./processed
```

---

## 💡 Pro Tips

### 1. Optimize Transcript Quality
- **Good**: Speaker labels, timestamps, clear sections
- **Better**: Pre-formatted with agenda items marked
- **Best**: Include participant list and meeting type

### 2. Enhance Meeting Metadata
Create a metadata file alongside transcript:
```json
{
  "meeting_id": "BRV-ISC-20250121-Weekly",
  "meeting_type": "status_update",
  "project": "BRV",
  "department": ["IT", "Finance"],
  "key_stakeholders": ["Jane Smith", "John Doe"]
}
```

### 3. Use Container Tags Effectively
```javascript
// Search by multiple dimensions
const results = await client.searchMemories({
  tags: ["org_main", "BRV", "decision", "approved-decisions"],
  query: "inventory validation"
});
```

### 4. Monitor API Usage
```bash
# Check current rate limit status
node scripts/check-rate-limit.js

# Output:
# Current usage: 23/50 requests per minute
# Requests remaining: 27
# Reset in: 37 seconds
```

### 5. Batch Processing Strategy
```bash
# Process in batches during off-peak hours
0 2 * * * cd /path/to/project && npm run batch-process
```

---

## 🔥 Quick Troubleshooting

### "Module not found" Error
```bash
# Always run from project root
pwd  # Should show project root
node pipe.js  # Not src/pipe.js
```

### API Rate Limit Errors
```bash
# Add delay between requests
RATE_LIMIT_DELAY=2000 node pipe.js
```

### Memory Creation Failing
```bash
# Check required fields
DEBUG=MemoryFactory node pipe.js
```

### Slow Processing
```bash
# Enable performance logging
PERF_LOG=true node pipe.js
```

---

## 📊 Quick Metrics Check

### Dashboard Command
```bash
# One command to check everything
npm run dashboard

# Shows:
# - System health
# - Today's processing stats  
# - API usage
# - Error summary
# - Performance metrics
```

### Health Check
```bash
# Verify all components working
npm run health-check

# ✅ AIProcessor: Operational
# ✅ MemoryFactory: Operational
# ✅ SupermemoryClient: Operational
# ⚠️ ContextAssembler: Not implemented
# ✅ Database: Connected
```

---

## 🎬 Next Steps

### After Basic Setup
1. **Implement ContextAssembler** - Enable <15 min deliverable prep
2. **Enhance Schema** - Add all 60+ properties for rich intelligence
3. **Add Rate Limiting** - Handle 20 meetings/day safely
4. **Set Up Automation** - Schedule daily processing

### Advanced Features
- Custom memory templates
- Department-specific workflows  
- Integration with calendar systems
- Automated report generation
- Slack/email notifications

---

## 🆘 Quick Help

### Essential Commands
```bash
npm start              # Run pipeline with defaults
npm test              # Run test suite
npm run dashboard     # Check system status
npm run help          # Show all commands
```

### Key Files
- Main pipeline: `pipe.js`
- Configuration: `config/production.json`
- Environment: `.env`
- Logs: `logs/app.log`

### Support Resources
- Full docs: `TASK_TRACKER.md`
- Troubleshooting: `system_overview.md`
- API reference: `SUPERMEMORY_TRUTH.md`

---

## 🎉 You're Ready!

You can now:
- ✅ Process meeting transcripts
- ✅ Create intelligent memory objects
- ✅ Search meeting history
- ✅ Track implementation progress

Next milestone: Implement ContextAssembler for instant deliverable preparation!