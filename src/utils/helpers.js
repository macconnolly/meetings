
// ID Generation Functions
function generateDecisionId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `DCN-${project}-${date}-${sequence}`;
}

function generateActionId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `ACT-${project}-${date}-${sequence}`;
}

function generateDeliverableId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `DEL-${project}-${date}-${sequence}`;
}

function generateRelationshipId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `REL-${project}-${date}-${sequence}`;
}

function generateRiskId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `RSK-${project}-${date}-${sequence}`;
}

function generateStakeholderId(stakeholderName) {
  const slug = slugify(stakeholderName);
  const hash = simpleHash(stakeholderName);
  return `STK-${slug}-${hash}`;
}

// Text Processing Functions
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 6);
}

function extractProjectCode(meetingId) {
  // Extract project code from meeting ID format: PROJECT-WORKSTREAM-YYYYMMDD-TYPE
  const parts = meetingId.split('-');
  return parts.length >= 2 ? parts[0] : 'UNKNOWN';
}

function countParticipants(participantString) {
  if (!participantString) return 0;
  return participantString.split(',').filter(p => p.trim().length > 0).length;
}

// Priority and Scoring Functions
function calculatePriority(urgency, importance) {
  const urgencyScores = {
    routine: 1,
    important: 2,
    urgent: 3,
    critical: 4
  };
  
  const importanceScores = {
    operational: 1,
    tactical: 2,
    strategic: 3,
    transformational: 4
  };
  
  const urgencyScore = urgencyScores[urgency] || 1;
  const importanceScore = importanceScores[importance] || 1;
  
  return Math.min(5, Math.max(1, urgencyScore + importanceScore - 1));
}

module.exports = {
    generateDecisionId,
    generateActionId,
    generateDeliverableId,
    generateRelationshipId,
    generateRiskId,
    generateStakeholderId,
    slugify,
    simpleHash,
    extractProjectCode,
    countParticipants,
    calculatePriority
}
